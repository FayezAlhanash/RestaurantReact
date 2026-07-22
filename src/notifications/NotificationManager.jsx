import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "../API/axios";
import { getStoredToken, getStoredUser, ROLE_IDS } from "../utils/auth";
import { getUserPermissions } from "../utils/permissions";
import { ensureCurrentRestaurantId } from "../utils/restaurant";
import {
    listenForForegroundMessages,
    requestFcmToken,
} from "./firebase";

const FCM_TOKEN_STORAGE_KEY = "big4:fcm-token";
const FCM_USER_STORAGE_KEY = "big4:fcm-user-id";
const NOTIFICATION_POLL_INTERVAL_MS = 15000;
const READY_PICKUP_STATUSES = new Set([
    "ready",
    "prepared",
    "ready_for_pickup",
    "waiting_pickup",
]);

let registrationPromise = null;
let operationalPollerStarted = false;
const recentOperationalNotificationIds = new Set();

const getList = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.orders)) return data.orders;
    if (Array.isArray(data?.data?.orders)) return data.data.orders;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.ingredients)) return data.ingredients;
    if (Array.isArray(data?.alerts)) return data.alerts;
    if (Array.isArray(data?.data?.alerts)) return data.data.alerts;
    if (Array.isArray(data?.data?.items)) return data.data.items;
    if (Array.isArray(data?.data?.ingredients)) return data.data.ingredients;

    return [];
};

const normalizeValue = (value) =>
    String(value || "")
        .toLowerCase()
        .replaceAll("-", "_")
        .replaceAll(" ", "_");

const getOrderId = (order) =>
    order?.id ??
    order?.order_id ??
    order?.restaurant_order_id ??
    order?.restaurantOrderId ??
    order?.restaurant_order?.id ??
    order?.restaurantOrder?.id;

const getOrderNumber = (order) =>
    order?.number ?? order?.code ?? getOrderId(order) ?? "";

const getTableNumber = (order) =>
    order?.table_number ??
    order?.table?.table_number ??
    order?.restaurant_order?.table_number ??
    order?.restaurantOrder?.table_number ??
    "";

const getInventoryId = (item) =>
    item?.id ?? item?.ingredient_id ?? item?.inventory_id ?? item?.ingredient?.id;

const getInventoryName = (item) =>
    item?.name ?? item?.ingredient?.name ?? item?.item_name ?? "Inventory item";

const roleScopedRoutes = {
    takeawayOrders: {
        [ROLE_IDS.CASHIER]: "/takeaway-orders?view=orders",
        [ROLE_IDS.KITCHEN]: "/kitchen/takeaway-orders?view=orders",
        [ROLE_IDS.WAREHOUSE_MANAGER]: "/warehouse/takeaway-orders?view=orders",
        [ROLE_IDS.MANAGER]: "/manager/takeaway-orders?view=orders",
    },
    dineInService: {
        [ROLE_IDS.WAITER]: "/waiter/serve-orders",
        [ROLE_IDS.KITCHEN]: "/kitchen/dine-in-service",
        [ROLE_IDS.WAREHOUSE_MANAGER]: "/warehouse/dine-in-service",
        [ROLE_IDS.MANAGER]: "/manager/dine-in-service",
    },
    lowStock: {
        [ROLE_IDS.KITCHEN]: "/kitchen/low-stock",
        [ROLE_IDS.WAREHOUSE_MANAGER]: "/warehouse/low-stock",
        [ROLE_IDS.MANAGER]: "/manager/low-stock",
    },
};

const routeKeyByPath = {
    "/takeaway-orders": "takeawayOrders",
    "/cashier": "takeawayOrders",
    "/dine-in-service": "dineInService",
    "/waiter/service": "dineInService",
    "/waiter/serve-orders": "dineInService",
    "/low-stock": "lowStock",
};

function getRoleScopedRoute(routeKey, fallbackPath = "/") {
    const user = getStoredUser();
    const roleId = Number(user?.role_id ?? user?.role?.id);

    if (roleScopedRoutes[routeKey]?.[roleId]) {
        return roleScopedRoutes[routeKey][roleId];
    }

    return fallbackPath;
}

function appendUrlParam(url, key, value) {
    if (!value) return url;

    const separator = String(url).includes("?") ? "&" : "?";

    return `${url}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
}

function resolveNotificationUrl(url = window.location.pathname) {
    const rawPath = String(url || window.location.pathname);
    const parsedUrl = new URL(rawPath, window.location.origin);
    const routeKey = routeKeyByPath[parsedUrl.pathname];

    if (!routeKey) return rawPath;

    const scopedRoute = new URL(
        getRoleScopedRoute(routeKey, parsedUrl.pathname),
        window.location.origin
    );

    parsedUrl.searchParams.forEach((value, key) => {
        if (!scopedRoute.searchParams.has(key)) {
            scopedRoute.searchParams.set(key, value);
        }
    });

    if (routeKey === "takeawayOrders" && !scopedRoute.searchParams.get("view")) {
        scopedRoute.searchParams.set("view", "orders");
    }

    return `${scopedRoute.pathname}${scopedRoute.search}${scopedRoute.hash}`;
}

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

    const notification = payload.notification || {};
    const data = payload.data || {};
    const title = notification.title || data.title || "Big-4";
    const targetUrl = resolveNotificationUrl(data.url);

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

async function showOperationalNotification(title, body, url = window.location.pathname) {
    if (!("Notification" in window)) return;

    const permission =
        Notification.permission === "granted"
            ? "granted"
            : await Notification.requestPermission();

    if (permission !== "granted") return;

    const targetUrl = resolveNotificationUrl(url);
    const options = {
        body,
        icon: "/favicon.svg",
        data: { url: targetUrl },
    };

    if ("serviceWorker" in navigator) {
        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(title, options);
            return;
        } catch {
            // Fall back to the page Notification API below.
        }
    }

    const notification = new Notification(title, options);

    notification.onclick = () => {
        window.focus();
        window.location.assign(targetUrl);
        notification.close();
    };
}

function showOperationalNotificationOnce(id, title, body, url) {
    if (id && recentOperationalNotificationIds.has(id)) return;

    if (id) {
        recentOperationalNotificationIds.add(id);
        window.setTimeout(() => {
            recentOperationalNotificationIds.delete(id);
        }, 60000);
    }

    showOperationalNotification(title, body, url);
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

async function fetchReadyPickupOrders() {
    const response = await api.get("/cashier/orders", {
        params: {
            type: "takeaway",
            order_type: "takeaway",
        },
    });

    return getList(response.data).filter((order) => {
        const orderType = normalizeValue(
            order?.type || order?.order_type || order?.service_type
        );
        const status = normalizeValue(order?.status || order?.kitchen_status);
        const isTakeaway =
            !orderType || ["takeaway", "take_away", "takeout"].includes(orderType);

        return isTakeaway && READY_PICKUP_STATUSES.has(status);
    });
}

async function fetchReadyDineInOrders() {
    const response = await api.get("/waiter/ready-restaurant-orders");

    return getList(response.data);
}

async function fetchLowStockItems() {
    const restaurantId = await ensureCurrentRestaurantId();

    if (!restaurantId) return [];

    const response = await api.get(
        `/restaurants/${restaurantId}/inventory-alerts/low-stock`
    );

    return getList(response.data);
}

function notifyNewItems({ items, seenIds, initialized, buildId, notify }) {
    const nextSeenIds = new Set(seenIds);
    const newItems = [];

    items.forEach((item) => {
        const id = buildId(item);

        if (!id) return;
        if (!seenIds.has(id)) newItems.push(item);
        nextSeenIds.add(id);
    });

    if (initialized) {
        newItems.forEach(notify);
    }

    return nextSeenIds;
}

function startOperationalNotificationPoller() {
    if (operationalPollerStarted) return () => {};

    operationalPollerStarted = true;

    let isStopped = false;
    let isPickupInitialized = false;
    let isDineInInitialized = false;
    let isLowStockInitialized = false;
    let seenPickupIds = new Set();
    let seenDineInIds = new Set();
    let seenLowStockIds = new Set();

    const poll = async () => {
        if (isStopped || !getStoredToken()) return;
        if (Notification.permission !== "granted") return;

        const permissions = getUserPermissions();
        const user = getStoredUser();
        const isAdmin = Number(user?.role_id ?? user?.role?.id) === ROLE_IDS.ADMIN;
        const tasks = [];

        if (permissions.includes("manage_takeaway_orders")) {
            tasks.push(
                fetchReadyPickupOrders()
                    .then((orders) => {
                        seenPickupIds = notifyNewItems({
                            items: orders,
                            seenIds: seenPickupIds,
                            initialized: isPickupInitialized,
                            buildId: (order) => String(getOrderId(order) || ""),
                            notify: (order) => {
                                const orderNumber = getOrderNumber(order);

                                showOperationalNotificationOnce(
                                    `pickup:${getOrderId(order)}`,
                                    "Pickup order is ready",
                                    `Order #${orderNumber} is ready for customer pickup.`,
                                    appendUrlParam(
                                        getRoleScopedRoute("takeawayOrders", "/takeaway-orders?view=orders"),
                                        "orderId",
                                        getOrderId(order)
                                    )
                                );
                            },
                        });
                        isPickupInitialized = true;
                    })
                    .catch(() => {})
            );
        }

        if (permissions.includes("serve_dine_in_orders")) {
            tasks.push(
                fetchReadyDineInOrders()
                    .then((orders) => {
                        seenDineInIds = notifyNewItems({
                            items: orders,
                            seenIds: seenDineInIds,
                            initialized: isDineInInitialized,
                            buildId: (order) => String(getOrderId(order) || ""),
                            notify: (order) => {
                                const tableNumber = getTableNumber(order);
                                const orderNumber = getOrderNumber(order);
                                const suffix = tableNumber
                                    ? `Table ${tableNumber}`
                                    : `Order #${orderNumber}`;

                                showOperationalNotificationOnce(
                                    `dine-in:${getOrderId(order)}`,
                                    "Dine-in order is ready",
                                    `${suffix} is ready to serve.`,
                                    getRoleScopedRoute("dineInService", "/dine-in-service")
                                );
                            },
                        });
                        isDineInInitialized = true;
                    })
                    .catch(() => {})
            );
        }

        if (
            isAdmin ||
            permissions.includes("monitor_inventory") ||
            permissions.includes("manage_inventory")
        ) {
            tasks.push(
                fetchLowStockItems()
                    .then((items) => {
                        seenLowStockIds = notifyNewItems({
                            items,
                            seenIds: seenLowStockIds,
                            initialized: isLowStockInitialized,
                            buildId: (item) => String(getInventoryId(item) || ""),
                            notify: (item) => {
                                showOperationalNotificationOnce(
                                    `low-stock:${getInventoryId(item)}`,
                                    "Low stock alert",
                                    `${getInventoryName(item)} is below minimum stock.`,
                                    getRoleScopedRoute("lowStock", "/low-stock")
                                );
                            },
                        });
                        isLowStockInitialized = true;
                    })
                    .catch(() => {})
            );
        }

        await Promise.allSettled(tasks);
    };

    poll();

    const intervalId = window.setInterval(poll, NOTIFICATION_POLL_INTERVAL_MS);
    const handleFocus = () => poll();
    const handleVisibilityChange = () => {
        if (!document.hidden) poll();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
        isStopped = true;
        operationalPollerStarted = false;
        window.clearInterval(intervalId);
        window.removeEventListener("focus", handleFocus);
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
        if (!getStoredToken()) return undefined;

        const stopPolling = startOperationalNotificationPoller();

        return stopPolling;
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
        const handleLowStockEvent = (event) => {
            const item = event.detail || {};

            showOperationalNotificationOnce(
                `low-stock:${getInventoryId(item)}`,
                "Low stock alert",
                `${getInventoryName(item)} is below minimum stock.`,
                getRoleScopedRoute("lowStock", "/low-stock")
            );
        };

        window.addEventListener("big4:low-stock", handleLowStockEvent);

        return () => {
            window.removeEventListener("big4:low-stock", handleLowStockEvent);
        };
    }, []);

    useEffect(() => {
        const handleDineInReadyEvent = (event) => {
            const order = event.detail || {};
            const tableNumber = getTableNumber(order);
            const orderNumber = getOrderNumber(order);
            const suffix = tableNumber
                ? `Table ${tableNumber}`
                : `Order #${orderNumber}`;

            showOperationalNotificationOnce(
                `dine-in:${getOrderId(order) || orderNumber}`,
                "Dine-in order is ready",
                `${suffix} is ready to serve.`,
                getRoleScopedRoute("dineInService", "/dine-in-service")
            );
        };

        window.addEventListener("big4:dine-in-ready", handleDineInReadyEvent);

        return () => {
            window.removeEventListener("big4:dine-in-ready", handleDineInReadyEvent);
        };
    }, []);

    return null;
}
