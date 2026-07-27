import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "../API/axios";
import { getStoredToken, getStoredUser } from "../utils/auth";
import {
    listenForForegroundMessages,
    requestFcmToken,
} from "./firebase";
import {
    canReceiveNotification,
    resolveNotificationUrl,
} from "./notificationRouting";

const FCM_TOKEN_STORAGE_KEY = "big4:fcm-token";
const FCM_USER_STORAGE_KEY = "big4:fcm-user-id";
const BACKEND_NOTIFICATION_POLL_INTERVAL_MS = 3000;

let registrationPromise = null;
let backendNotificationsPollerStarted = false;

const getList = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.notifications)) return data.notifications;
    if (Array.isArray(data?.data?.notifications)) return data.data.notifications;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data?.items)) return data.data.items;

    return [];
};

const getNotificationId = (notification) =>
    notification?.id ??
    notification?.notification_id ??
    notification?.uuid ??
    [
        notification?.title,
        notification?.body || notification?.message,
        notification?.created_at || notification?.createdAt || notification?.time,
    ]
        .filter(Boolean)
        .join(":");

const getNotificationTitle = (notification) =>
    notification?.title ||
    notification?.data?.title ||
    notification?.notification?.title ||
    notification?.type ||
    "Big-4";

const getNotificationBody = (notification) =>
    notification?.body ||
    notification?.message ||
    notification?.data?.body ||
    notification?.data?.message ||
    notification?.notification?.body ||
    "You have a new notification.";

const getNotificationUrl = (notification) =>
    notification?.url || notification?.data?.url || notification?.link || window.location.pathname;

const isUnreadNotification = (notification) => {
    if (notification?.read_at || notification?.readAt) return false;
    if (typeof notification?.is_read === "boolean") return !notification.is_read;
    if (typeof notification?.read === "boolean") return !notification.read;

    return true;
};

function getDeviceName() {
    const userAgent = navigator.userAgent;

    if (userAgent.includes("Edg/")) return "Edge";
    if (userAgent.includes("Firefox/")) return "Firefox";
    if (userAgent.includes("Chrome/")) return "Chrome";
    if (userAgent.includes("Safari/")) return "Safari";

    return "Web browser";
}

function showForegroundNotification(payload) {
    if (document.hidden || Notification.permission !== "granted") return;
    if (!canReceiveNotification(payload)) return;

    const notification = payload.notification || {};
    const data = payload.data || {};
    const title = notification.title || data.title || "Big-4";
    const targetUrl = resolveNotificationUrl(data.url, payload);

    const browserNotification = new Notification(title, {
        body: notification.body || data.body || "You have a new notification.",
        icon: "/favicon.svg",
        data: { ...data, url: targetUrl },
    });

    browserNotification.onclick = () => {
        window.focus();
        window.location.assign(targetUrl);
        browserNotification.close();
    };
}

async function markNotificationAsRead(notificationId) {
    if (!notificationId) return;

    try {
        await api.post(`/notifications/mark-as-read/${notificationId}`);
        window.dispatchEvent(new CustomEvent("big4:notifications-updated"));
    } catch {
        // Keep click navigation responsive even if read-state syncing fails.
    }
}

async function showBrowserNotification(
    title,
    body,
    url = window.location.pathname,
    notificationId = ""
) {
    if (!("Notification" in window)) return;

    const permission =
        Notification.permission === "granted"
            ? "granted"
            : await Notification.requestPermission();

    if (permission !== "granted") return;
    if (!canReceiveNotification({ title, body, url })) return;

    const targetUrl = resolveNotificationUrl(url, { title, body, url });
    const options = {
        body,
        icon: "/favicon.svg",
        data: { url: targetUrl },
    };

    const notification = new Notification(title, options);

    notification.onclick = async () => {
        await markNotificationAsRead(notificationId);
        window.focus();
        window.location.assign(targetUrl);
        notification.close();
    };
}

async function sendTokenToBackend(token, userId) {
    const previousToken = localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
    const previousUserId = localStorage.getItem(FCM_USER_STORAGE_KEY);

    if (previousToken === token && previousUserId === String(userId)) return;

    const formData = new FormData();

    formData.append("token", token);
    formData.append("platform", "web");
    formData.append("device_name", getDeviceName());

    await api.post("/fcm-tokens", formData);
    localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
    localStorage.setItem(FCM_USER_STORAGE_KEY, String(userId));
}

async function registerNotifications() {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

    const user = getStoredUser();
    const authToken = getStoredToken();

    if (!authToken || !user?.id) return;
    if (Notification.permission === "denied") return;

    const permission =
        Notification.permission === "granted"
            ? "granted"
            : await Notification.requestPermission();

    if (permission !== "granted") return;

    const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
    );
    const token = await requestFcmToken(registration);

    if (!token) return;

    await sendTokenToBackend(token, user.id);
}

async function fetchBackendNotifications() {
    const response = await api.get("/notifications");

    return getList(response.data);
}

function startBackendNotificationsPoller() {
    if (backendNotificationsPollerStarted) return () => {};

    backendNotificationsPollerStarted = true;

    let isStopped = false;
    let initialized = false;
    let seenNotificationIds = new Set();

    const poll = async () => {
        if (isStopped || !getStoredToken()) return;
        if (!("Notification" in window) || Notification.permission !== "granted") {
            return;
        }

        try {
            const notifications = (await fetchBackendNotifications()).filter(
                canReceiveNotification
            );
            const unreadNotifications = notifications.filter(isUnreadNotification);
            const nextSeenIds = new Set(seenNotificationIds);

            unreadNotifications.forEach((notification) => {
                const id = String(getNotificationId(notification) || "");

                if (!id) return;

                if (initialized && !seenNotificationIds.has(id)) {
                    showBrowserNotification(
                        getNotificationTitle(notification),
                        getNotificationBody(notification),
                        getNotificationUrl(notification),
                        id
                    );
                }

                nextSeenIds.add(id);
            });

            seenNotificationIds = nextSeenIds;
            initialized = true;
        } catch {
            // The bell panel already shows loading errors when the user opens it.
        }
    };

    poll();

    const intervalId = window.setInterval(
        poll,
        BACKEND_NOTIFICATION_POLL_INTERVAL_MS
    );
    const handleFocus = () => poll();
    const handleVisibilityChange = () => {
        if (!document.hidden) poll();
    };
    const handlePollNow = () => poll();

    window.addEventListener("focus", handleFocus);
    window.addEventListener("big4:poll-notifications-now", handlePollNow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
        isStopped = true;
        backendNotificationsPollerStarted = false;
        window.clearInterval(intervalId);
        window.removeEventListener("focus", handleFocus);
        window.removeEventListener("big4:poll-notifications-now", handlePollNow);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
}

export default function NotificationManager() {
    const location = useLocation();

    useEffect(() => {
        if (!getStoredToken()) return;

        registrationPromise = registrationPromise || registerNotifications();
        registrationPromise.catch(() => {
            registrationPromise = null;
        });
    }, [location.pathname]);

    useEffect(() => {
        let unsubscribe = () => {};
        let isMounted = true;

        listenForForegroundMessages((payload) => {
            showForegroundNotification(payload);
        }).then((cleanup) => {
            if (isMounted) {
                unsubscribe = cleanup;
                return;
            }

            cleanup();
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [location.pathname]);

    useEffect(() => {
        if (!getStoredToken()) return undefined;

        const stopPolling = startBackendNotificationsPoller();

        return stopPolling;
    }, [location.pathname]);

    return null;
}
