import {
    Bell,
    CheckCheck,
    Inbox,
    Loader2,
    RefreshCw,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../API/axios";
import { useTheme } from "../../context/ThemeContext";

function getList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.notifications)) return data.notifications;
    if (Array.isArray(data?.data?.notifications)) return data.data.notifications;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data?.items)) return data.data.items;

    return [];
}

function getUnreadCount(data) {
    return Number(
        data?.unread_count ??
            data?.unreadCount ??
            data?.count ??
            data?.data?.unread_count ??
            data?.data?.unreadCount ??
            data?.data?.count ??
            0
    );
}

function getNotificationTitle(notification) {
    return (
        notification?.title ||
        notification?.data?.title ||
        notification?.notification?.title ||
        notification?.type ||
        "Notification"
    );
}

function getNotificationBody(notification) {
    return (
        notification?.body ||
        notification?.message ||
        notification?.data?.body ||
        notification?.data?.message ||
        notification?.notification?.body ||
        "You have a new update."
    );
}

function getOrderNumber(notification) {
    const directValue =
        notification?.order_number ??
        notification?.orderNumber ??
        notification?.order_id ??
        notification?.orderId ??
        notification?.restaurant_order_id ??
        notification?.restaurantOrderId ??
        notification?.data?.order_number ??
        notification?.data?.orderNumber ??
        notification?.data?.order_id ??
        notification?.data?.orderId ??
        notification?.data?.restaurant_order_id ??
        notification?.data?.restaurantOrderId ??
        notification?.order?.number ??
        notification?.order?.id ??
        "";

    if (directValue) return String(directValue);

    const searchableText = `${getNotificationTitle(notification)} ${getNotificationBody(notification)}`;
    const orderMatch =
        searchableText.match(/order\s*#?\s*(\d+)/i) ||
        searchableText.match(/طلب\s*#?\s*(\d+)/i) ||
        searchableText.match(/#\s*(\d+)/);

    return orderMatch?.[1] || "";
}

function getNotificationId(notification) {
    return notification?.id ?? notification?.notification_id ?? notification?.uuid;
}

function isUnread(notification) {
    if (notification?.read_at || notification?.readAt) return false;
    if (typeof notification?.is_read === "boolean") return !notification.is_read;
    if (typeof notification?.read === "boolean") return !notification.read;

    return true;
}

function getNotificationUrl(notification) {
    return notification?.url || notification?.data?.url || notification?.link || "";
}

function formatNotificationTime(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function NotificationsButton() {
    const navigate = useNavigate();
    const { isLight } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [isShown, setIsShown] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isMarkingAll, setIsMarkingAll] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [error, setError] = useState("");

    const panelClass = isLight
        ? "border-[#E4CFC3] bg-[#FFF9F2] text-[#241815] shadow-[0_28px_70px_rgba(70,45,30,0.18)] ring-1 ring-[#7F1D1D]/10"
        : "border-white/10 bg-[#151C1F] text-white shadow-[0_28px_70px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.04]";
    const dividerClass = isLight ? "border-[#E4CFC3]" : "border-white/10";
    const mutedTextClass = isLight ? "text-[#7A6A64]" : "text-white/50";

    const loadUnreadCount = async () => {
        try {
            const response = await api.get("/notifications/unread-count");

            setUnreadCount(getUnreadCount(response.data));
        } catch {
            setUnreadCount(0);
        }
    };

    const loadNotifications = async () => {
        setIsLoading(true);
        setError("");

        try {
            const [notificationsResponse, countResponse] = await Promise.all([
                api.get("/notifications"),
                api.get("/notifications/unread-count").catch(() => null),
            ]);

            setNotifications(getList(notificationsResponse.data));
            if (countResponse) {
                setUnreadCount(getUnreadCount(countResponse.data));
            }
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                    "Could not load notifications."
            );
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const initialLoadId = window.setTimeout(loadUnreadCount, 0);

        const intervalId = window.setInterval(loadUnreadCount, 30000);

        return () => {
            window.clearTimeout(initialLoadId);
            window.clearInterval(intervalId);
        };
    }, []);

    const openPanel = () => {
        setIsOpen(true);
        setIsShown(false);
        requestAnimationFrame(() => setIsShown(true));
        loadNotifications();
    };

    const closePanel = () => {
        setIsShown(false);
        window.setTimeout(() => setIsOpen(false), 160);
    };

    const markAllAsRead = async () => {
        setIsMarkingAll(true);
        setError("");

        try {
            await api.post("/notifications/mark-all-as-read");
            setNotifications((current) =>
                current.map((notification) => ({
                    ...notification,
                    is_read: true,
                    read_at: notification.read_at || new Date().toISOString(),
                }))
            );
            setUnreadCount(0);
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                    "Could not mark notifications as read."
            );
        } finally {
            setIsMarkingAll(false);
        }
    };

    const markAsRead = async (notification) => {
        const id = getNotificationId(notification);
        const url = getNotificationUrl(notification);

        if (id && isUnread(notification)) {
            try {
                await api.post(`/notifications/mark-as-read/${id}`);
                setNotifications((current) =>
                    current.map((currentNotification) =>
                        String(getNotificationId(currentNotification)) === String(id)
                            ? {
                                  ...currentNotification,
                                  is_read: true,
                                  read_at:
                                      currentNotification.read_at ||
                                      new Date().toISOString(),
                              }
                            : currentNotification
                    )
                );
                setUnreadCount((current) => Math.max(0, current - 1));
            } catch {
                // Keep navigation responsive even if read-state syncing fails.
            }
        }

        if (url) {
            closePanel();

            if (String(url).startsWith("http")) {
                window.location.assign(url);
                return;
            }

            navigate(url);
        }
    };

    return (
        <div className="relative z-[120]">
            <button
                type="button"
                aria-label="Notifications"
                onClick={isOpen ? closePanel : openPanel}
                className="relative grid h-11 w-11 place-items-center rounded-none border-r border-white/10 text-[#d8d1c5] transition hover:text-[#d7b52f] active:scale-95"
            >
                {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#7F1D1D] px-1.5 text-[10px] font-black text-white ring-2 ring-white/80">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
                <Bell size={19} />
            </button>

            {isOpen && (
                <div
                    className={`fixed right-4 top-20 z-[120] w-[min(92vw,380px)] origin-top-right overflow-hidden rounded-2xl border transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        isShown
                            ? "translate-y-0 scale-100 opacity-100"
                            : "translate-y-1 scale-95 opacity-0"
                    } ${panelClass}`}
                >
                    <div className={`flex items-center justify-between border-b px-3.5 py-3 ${dividerClass}`}>
                        <div>
                            <p className="text-sm font-black text-[#8f5f00]">
                                Notifications
                            </p>
                            <p className={`text-xs font-bold ${mutedTextClass}`}>
                                {unreadCount > 0
                                    ? `${unreadCount} unread`
                                    : "All caught up"}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={loadNotifications}
                                disabled={isLoading}
                                aria-label="Refresh notifications"
                                className="notification-icon-button grid h-9 w-9 place-items-center rounded-xl border transition active:scale-95 disabled:cursor-wait"
                            >
                                <RefreshCw
                                    size={16}
                                    className={isLoading ? "animate-spin" : ""}
                                />
                            </button>
                            <button
                                type="button"
                                onClick={closePanel}
                                aria-label="Close notifications"
                                className="notification-icon-button grid h-9 w-9 place-items-center rounded-xl border transition active:scale-95"
                            >
                                <X size={17} />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[430px] overflow-y-auto p-3">
                        <button
                            type="button"
                            onClick={markAllAsRead}
                            disabled={!unreadCount || isMarkingAll}
                            className="notification-mark-all-button mb-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-black transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isMarkingAll ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <CheckCheck size={17} />
                            )}
                            Mark all as read
                        </button>

                        {error && (
                            <p className="mb-3 rounded-xl border border-[#7F1D1D]/35 bg-[#7F1D1D]/12 px-3 py-2 text-sm font-black text-[#7F1D1D]">
                                {error}
                            </p>
                        )}

                        {isLoading ? (
                            <div className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-8 text-sm font-black ${dividerClass} ${mutedTextClass}`}>
                                <Loader2 size={17} className="animate-spin" />
                                Loading notifications...
                            </div>
                        ) : notifications.length ? (
                            <div className="space-y-2">
                                {notifications.map((notification, index) => {
                                    const id = getNotificationId(notification) ?? index;
                                    const unread = isUnread(notification);
                                    const time = formatNotificationTime(
                                        notification.created_at ||
                                            notification.createdAt ||
                                            notification.time
                                    );
                                    const orderNumber = getOrderNumber(notification);

                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => markAsRead(notification)}
                                            className={`notification-row w-full rounded-xl border px-3 py-3 text-left transition hover:-translate-y-0.5 active:scale-[0.99] ${
                                                unread ? "is-unread" : ""
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <span
                                                    className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                                                        unread
                                                            ? "bg-[#7F1D1D]"
                                                            : "bg-transparent"
                                                    }`}
                                                />
                                                <span className="min-w-0 flex-1">
                                                    <span className="flex min-w-0 items-center justify-between gap-2">
                                                        <span className="min-w-0 truncate text-sm font-black">
                                                            {getNotificationTitle(
                                                                notification
                                                            )}
                                                        </span>
                                                        {orderNumber && (
                                                            <span className="notification-order-badge shrink-0 rounded-lg px-2.5 py-1 text-xs font-black">
                                                                #{orderNumber}
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="mt-1 block text-xs font-semibold leading-5 opacity-75">
                                                        {getNotificationBody(
                                                            notification
                                                        )}
                                                    </span>
                                                    {time && (
                                                        <span className="mt-1 block text-[11px] font-bold uppercase tracking-wide opacity-50">
                                                            {time}
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className={`rounded-2xl border px-4 py-10 text-center ${dividerClass}`}>
                                <Inbox
                                    size={28}
                                    className="mx-auto text-[#8f5f00]"
                                />
                                <p className="mt-3 text-sm font-black">
                                    No notifications
                                </p>
                                <p className={`mt-1 text-xs font-bold ${mutedTextClass}`}>
                                    New updates will appear here.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
