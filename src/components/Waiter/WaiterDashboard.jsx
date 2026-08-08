import {
    Banknote,
    CheckCircle2,
    Clock3,
    DoorOpen,
    LogOut,
    RefreshCw,
    ReceiptText,
    Table2,
    Utensils,
    XCircle,
} from "lucide-react";
import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../API/axios";
import useRealtimeRefresh from "../../hooks/useRealtimeRefresh";
import { clearSession, getStoredUser } from "../../utils/auth";
import { getUserPermissions } from "../../utils/permissions";

const tableDeviceApi = axios.create({
    baseURL: "https://big4.me/api",
});

const getList = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.orders)) return data.orders;
    if (Array.isArray(data?.payments)) return data.payments;
    if (Array.isArray(data?.invoices)) return data.invoices;
    if (Array.isArray(data?.restaurant_orders)) return data.restaurant_orders;
    if (Array.isArray(data?.restaurantOrders)) return data.restaurantOrders;
    return [];
};

const getInvoiceId = (item) =>
    item?.invoice_id ??
    item?.invoice?.id ??
    item?.restaurant_invoice?.invoice_id ??
    item?.restaurantInvoice?.invoice_id ??
    item?.id ??
    null;

const getRestaurantOrderId = (item) =>
    item?.restaurant_order_id ??
    item?.restaurantOrderId ??
    item?.restaurant_order?.id ??
    item?.restaurantOrder?.id ??
    item?.id ??
    null;

const getTableNumber = (item) =>
    item?.table_number ??
    item?.tableNumber ??
    item?.number ??
    item?.table?.table_number ??
    item?.table?.tableNumber ??
    item?.order?.table_number ??
    item?.order?.table?.table_number ??
    item?.restaurant_order?.table_number ??
    item?.restaurantOrder?.table_number ??
    "-";

const getTotal = (item) =>
    Number(
        item?.total ??
            item?.amount ??
            item?.invoice?.total ??
            item?.invoice?.amount ??
            item?.restaurant_invoice?.invoice?.total ??
            item?.restaurantInvoice?.invoice?.total ??
            0
    );

const getItems = (order) =>
    getList(
        order?.items ||
            order?.order_items ||
            order?.orderItems ||
            order?.foods ||
            order?.restaurant_order_items ||
            order?.restaurantOrderItems ||
            []
    );

const getFoodName = (item) => {
    const food = item?.food || item?.menu_item || item?.product || {};

    return food?.name || food?.title || item?.name || item?.title || item?.food_name || "Item";
};

const normalizeResponseKey = (key) => String(key).toLowerCase().replace(/[_-]/g, "");

const SESSION_TOKEN_KEYS = new Set(
    [
        "session_token",
        "sessionToken",
        "table_session_token",
        "tableSessionToken",
        "table_token",
        "tableToken",
        "qr_token",
        "qrToken",
        "dine_in_token",
        "dineInToken",
        "token",
    ].map(normalizeResponseKey)
);

const SESSION_PATH_KEYS = new Set(
    [
        "qr_path",
        "qrPath",
        "qr_url",
        "qrUrl",
        "session_url",
        "sessionUrl",
        "customer_url",
        "customerUrl",
        "guest_url",
        "guestUrl",
        "url",
        "link",
    ].map(normalizeResponseKey)
);

const findFirstValueByKey = (value, keySet, seen = new WeakSet()) => {
    if (!value || typeof value !== "object") return "";
    if (seen.has(value)) return "";

    seen.add(value);

    if (Array.isArray(value)) {
        for (const item of value) {
            const nestedValue = findFirstValueByKey(item, keySet, seen);

            if (nestedValue !== undefined && nestedValue !== null && nestedValue !== "") {
                return nestedValue;
            }
        }

        return "";
    }

    for (const [key, nestedValue] of Object.entries(value)) {
        if (
            keySet.has(normalizeResponseKey(key)) &&
            nestedValue !== undefined &&
            nestedValue !== null &&
            nestedValue !== ""
        ) {
            return nestedValue;
        }
    }

    for (const nestedValue of Object.values(value)) {
        const foundValue = findFirstValueByKey(nestedValue, keySet, seen);

        if (foundValue !== undefined && foundValue !== null && foundValue !== "") {
            return foundValue;
        }
    }

    return "";
};

const getSessionTokenFromPath = (value) => {
    const text = String(value ?? "").trim();

    if (!text) return "";

    const tsesMatch = text.match(/TSES-[A-Za-z0-9_-]+/);

    if (tsesMatch?.[0]) return tsesMatch[0];

    try {
        const url = new URL(text, window.location.origin);
        const params = new URLSearchParams(url.search);
        const explicitToken =
            params.get("session_token") ||
            params.get("sessionToken") ||
            params.get("table_session_token") ||
            params.get("tableSessionToken") ||
            params.get("table_token") ||
            params.get("tableToken") ||
            params.get("qr_token") ||
            params.get("qrToken") ||
            params.get("dine_in_token") ||
            params.get("dineInToken") ||
            params.get("token");

        if (explicitToken) return explicitToken;

        const segments = url.pathname.split("/").filter(Boolean);
        const dineInIndex = segments.findIndex((segment) => segment === "dine-in");

        if (dineInIndex >= 0 && segments[dineInIndex + 1]) {
            return decodeURIComponent(segments[dineInIndex + 1]);
        }
    } catch {
        const segments = text.split(/[/?#]/).filter(Boolean);
        const dineInIndex = segments.findIndex((segment) => segment === "dine-in");

        if (dineInIndex >= 0 && segments[dineInIndex + 1]) {
            return decodeURIComponent(segments[dineInIndex + 1]);
        }
    }

    return "";
};

const getFirstPresent = (...values) => {
    const value = values.find((item) => item !== undefined && item !== null && item !== "");

    return value === undefined || value === null ? "" : String(value);
};

const getSessionTokenFromResponse = (data) => {
    const directToken = getFirstPresent(
        data?.session_token,
        data?.sessionToken,
        data?.table_session_token,
        data?.tableSessionToken,
        data?.table_token,
        data?.tableToken,
        data?.qr_token,
        data?.qrToken,
        data?.dine_in_token,
        data?.dineInToken,
        data?.token,
        data?.table?.session_token,
        data?.table?.sessionToken,
        data?.table?.table_session_token,
        data?.table?.tableSessionToken,
        data?.table?.table_token,
        data?.table?.tableToken,
        data?.table?.qr_token,
        data?.table?.qrToken,
        data?.table?.dine_in_token,
        data?.table?.dineInToken,
        data?.table?.token,
        data?.session?.session_token,
        data?.session?.sessionToken,
        data?.session?.table_session_token,
        data?.session?.tableSessionToken,
        data?.session?.table_token,
        data?.session?.tableToken,
        data?.session?.qr_token,
        data?.session?.qrToken,
        data?.session?.dine_in_token,
        data?.session?.dineInToken,
        data?.session?.token,
        data?.table_session?.session_token,
        data?.table_session?.sessionToken,
        data?.table_session?.table_session_token,
        data?.table_session?.tableSessionToken,
        data?.table_session?.table_token,
        data?.table_session?.tableToken,
        data?.table_session?.qr_token,
        data?.table_session?.qrToken,
        data?.table_session?.dine_in_token,
        data?.table_session?.dineInToken,
        data?.table_session?.token,
        data?.data?.session_token,
        data?.data?.sessionToken,
        data?.data?.table_session_token,
        data?.data?.tableSessionToken,
        data?.data?.table_token,
        data?.data?.tableToken,
        data?.data?.qr_token,
        data?.data?.qrToken,
        data?.data?.dine_in_token,
        data?.data?.dineInToken,
        data?.data?.token,
        data?.data?.table?.session_token,
        data?.data?.table?.sessionToken,
        data?.data?.table?.table_session_token,
        data?.data?.table?.tableSessionToken,
        data?.data?.table?.table_token,
        data?.data?.table?.tableToken,
        data?.data?.table?.qr_token,
        data?.data?.table?.qrToken,
        data?.data?.table?.dine_in_token,
        data?.data?.table?.dineInToken,
        data?.data?.table?.token,
        data?.data?.session?.session_token,
        data?.data?.session?.sessionToken,
        data?.data?.session?.table_session_token,
        data?.data?.session?.tableSessionToken,
        data?.data?.session?.table_token,
        data?.data?.session?.tableToken,
        data?.data?.session?.qr_token,
        data?.data?.session?.qrToken,
        data?.data?.session?.dine_in_token,
        data?.data?.session?.dineInToken,
        data?.data?.session?.token,
        data?.data?.table_session?.session_token,
        data?.data?.table_session?.sessionToken,
        data?.data?.table_session?.table_session_token,
        data?.data?.table_session?.tableSessionToken,
        data?.data?.table_session?.table_token,
        data?.data?.table_session?.tableToken,
        data?.data?.table_session?.qr_token,
        data?.data?.table_session?.qrToken,
        data?.data?.table_session?.dine_in_token,
        data?.data?.table_session?.dineInToken,
        data?.data?.table_session?.token,
        findFirstValueByKey(data, SESSION_TOKEN_KEYS)
    );

    return directToken || getSessionTokenFromPath(findFirstValueByKey(data, SESSION_PATH_KEYS));
};

const getQrPathFromResponse = (data, sessionToken) =>
    getFirstPresent(
        data?.qr_path,
        data?.qrPath,
        data?.qr_url,
        data?.qrUrl,
        data?.session_url,
        data?.sessionUrl,
        data?.customer_url,
        data?.customerUrl,
        data?.guest_url,
        data?.guestUrl,
        data?.session?.qr_path,
        data?.session?.qrPath,
        data?.session?.qr_url,
        data?.session?.qrUrl,
        data?.session?.session_url,
        data?.session?.sessionUrl,
        data?.session?.customer_url,
        data?.session?.customerUrl,
        data?.session?.guest_url,
        data?.session?.guestUrl,
        data?.table?.qr_path,
        data?.table?.qrPath,
        data?.table?.qr_url,
        data?.table?.qrUrl,
        data?.table?.session_url,
        data?.table?.sessionUrl,
        data?.table?.customer_url,
        data?.table?.customerUrl,
        data?.table?.guest_url,
        data?.table?.guestUrl,
        data?.data?.qr_path,
        data?.data?.qrPath,
        data?.data?.qr_url,
        data?.data?.qrUrl,
        data?.data?.session_url,
        data?.data?.sessionUrl,
        data?.data?.customer_url,
        data?.data?.customerUrl,
        data?.data?.guest_url,
        data?.data?.guestUrl,
        data?.data?.session?.qr_path,
        data?.data?.session?.qrPath,
        data?.data?.session?.qr_url,
        data?.data?.session?.qrUrl,
        data?.data?.session?.session_url,
        data?.data?.session?.sessionUrl,
        data?.data?.session?.customer_url,
        data?.data?.session?.customerUrl,
        data?.data?.session?.guest_url,
        data?.data?.session?.guestUrl,
        data?.data?.table?.qr_path,
        data?.data?.table?.qrPath,
        data?.data?.table?.qr_url,
        data?.data?.table?.qrUrl,
        data?.data?.table?.session_url,
        data?.data?.table?.sessionUrl,
        data?.data?.table?.customer_url,
        data?.data?.table?.customerUrl,
        data?.data?.table?.guest_url,
        data?.data?.table?.guestUrl,
        findFirstValueByKey(data, SESSION_PATH_KEYS),
        sessionToken ? `/dine-in/${sessionToken}` : ""
    );

const buildCustomerSessionPath = (sessionToken) =>
    sessionToken ? `/dine-in/${encodeURIComponent(sessionToken)}` : "";

const buildSessionUrl = (qrPath, sessionToken) => {
    const fallbackPath = buildCustomerSessionPath(sessionToken);
    const nextPath = String(qrPath || fallbackPath).trim();

    if (!nextPath) return "";

    try {
        const url = new URL(nextPath, window.location.origin);

        if (fallbackPath && url.pathname.startsWith("/api/")) {
            return `${window.location.origin}${fallbackPath}`;
        }

        if (nextPath.startsWith("http://") || nextPath.startsWith("https://")) {
            return url.toString();
        }
    } catch {
        // Fall back to path normalization below.
    }

    const normalizedPath = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;

    if (fallbackPath && normalizedPath.startsWith("/api/")) {
        return `${window.location.origin}${fallbackPath}`;
    }

    return `${window.location.origin}${normalizedPath}`;
};

const getStoredDeviceKey = (tableId) => {
    try {
        const storedDevice = JSON.parse(
            localStorage.getItem(`table-device:${tableId}`) || "null"
        );

        return storedDevice?.device_key ?? storedDevice?.device?.device_key ?? "";
    } catch {
        return "";
    }
};

function WaiterCard({ title, eyebrow, total, emphasizeTotal = false, children, action }) {
    return (
        <article className="flex min-h-[260px] min-w-0 flex-col rounded-[28px] border border-white/10 bg-[#252A2D] p-5 shadow-[0_18px_42px_rgba(0,0,0,0.20)]">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-[#FFD166]">
                        {eyebrow}
                    </p>
                    <h2 className="mt-2 break-words text-2xl font-black text-white">{title}</h2>
                </div>
                {total !== undefined && !emphasizeTotal && (
                    <span className="shrink-0 rounded-full bg-[#FFD166]/14 px-3 py-1 text-sm font-black text-[#FFD166]">
                        ${Number(total).toFixed(2)}
                    </span>
                )}
            </div>
            {total !== undefined && emphasizeTotal && (
                <div className="mt-5 rounded-2xl border border-[#FFD166]/25 bg-[#FFD166]/10 px-4 py-4">
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-[#FFD166]">
                        Amount to collect
                    </p>
                    <p className="mt-2 break-words text-5xl font-black leading-none text-[#FFD166]">
                        ${Number(total).toFixed(2)}
                    </p>
                </div>
            )}
            <div className="mt-4 min-h-0 flex-1">{children}</div>
            {action && <div className="mt-4">{action}</div>}
        </article>
    );
}

export default function WaiterDashboard({ mode = "all", embedded = false }) {
    const [cashPayments, setCashPayments] = useState([]);
    const [readyOrders, setReadyOrders] = useState([]);
    const [tableSessionNumber, setTableSessionNumber] = useState("");
    const permissions = getUserPermissions();
    const canServeDineInOrders = permissions.includes("serve_dine_in_orders");
    const canProcessPayments = permissions.includes("process_payments");
    const initialTab =
        mode === "ready"
            ? "ready"
            : mode === "cash"
                ? "cash"
                : canServeDineInOrders
                    ? "sessions"
                    : "cash";
    const [activeTab, setActiveTab] = useState(initialTab);
    const [isLoading, setIsLoading] = useState(true);
    const [busyKey, setBusyKey] = useState("");
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [openedSession, setOpenedSession] = useState(null);
    const navigate = useNavigate();
    const user = getStoredUser();
    const waiterName =
        user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Waiter";

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [cashResponse, readyResponse] = await Promise.all([
                canProcessPayments
                    ? api.get("/waiter/pending-cash-payments")
                    : Promise.resolve({ data: [] }),
                canServeDineInOrders
                    ? api.get("/waiter/ready-restaurant-orders")
                    : Promise.resolve({ data: [] }),
            ]);

            const nextReadyOrders = getList(readyResponse.data);
            setCashPayments(getList(cashResponse.data));
            setReadyOrders(nextReadyOrders);
            setErrorMessage("");
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Could not load waiter data.");
        } finally {
            setIsLoading(false);
        }
    }, [canProcessPayments, canServeDineInOrders]);

    useEffect(() => {
        const timeoutId = window.setTimeout(loadData, 0);
        const intervalId = window.setInterval(loadData, 7000);

        return () => {
            window.clearTimeout(timeoutId);
            window.clearInterval(intervalId);
        };
    }, [loadData]);

    useRealtimeRefresh(() => {
        loadData();
    });

    const confirmCash = async (payment) => {
        if (!canProcessPayments) return;

        const invoiceId = getInvoiceId(payment);
        const formData = new FormData();
        formData.append("invoice_id", invoiceId);

        await api.post("/waiter/payments/cash/mark-paid", formData);
    };

    const markServed = async (order) => {
        if (!canServeDineInOrders) return;

        const formData = new FormData();
        const invoiceId = getInvoiceId(order);

        if (invoiceId) formData.append("invoice_id", invoiceId);

        await api.post(`/waiter/restaurant-orders/${getRestaurantOrderId(order)}/served`, formData);
    };

    const openTableSession = async (tableId) => {
        if (!canServeDineInOrders) return;

        const buildOpenedSession = (data) => {
            const sessionToken = getSessionTokenFromResponse(data);
            const qrPath = getQrPathFromResponse(data, sessionToken);

            if (!sessionToken) return null;

            const sessionUrl = buildSessionUrl(qrPath, sessionToken);

            return {
                tableId,
                sessionToken,
                qrPath,
                sessionUrl,
                qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=14&data=${encodeURIComponent(sessionUrl)}`,
            };
        };

        const fetchCurrentSessionFromDeviceKey = async (deviceKey) => {

            if (!deviceKey) return null;

            const response = await tableDeviceApi.get("/table-device/current-session", {
                headers: {
                    Authorization: `Bearer ${deviceKey}`,
                    "X-Table-Device-Key": deviceKey,
                },
            });

            return buildOpenedSession(response.data);
        };

        const fetchCurrentSessionFromStoredDevice = async () =>
            fetchCurrentSessionFromDeviceKey(getStoredDeviceKey(tableId));

        const fetchCurrentSessionFromTableDetails = async () => {
            try {
                const response = await api.get(`/tables/${tableId}`);

                return buildOpenedSession(response.data);
            } catch {
                return null;
            }
        };

        try {
            const response = await api.post(`/tables/${tableId}/session/open`);
            const nextOpenedSession =
                buildOpenedSession(response.data) ||
                (await fetchCurrentSessionFromTableDetails()) ||
                (await fetchCurrentSessionFromStoredDevice());

            setOpenedSession(nextOpenedSession);

            return nextOpenedSession?.sessionToken
                ? `Session opened for table ${tableId}. QR is shown below.`
                : `Session opened for table ${tableId}.`;
        } catch (error) {
            if (error.response?.status === 409) {
                const sessionId = error.response?.data?.session_id;
                const nextOpenedSession =
                    (await fetchCurrentSessionFromTableDetails()) ||
                    (await fetchCurrentSessionFromStoredDevice());

                setOpenedSession(nextOpenedSession);

                if (nextOpenedSession?.sessionToken) {
                    return sessionId
                        ? `Table ${tableId} already has active session #${sessionId}. QR is shown below.`
                        : `Table ${tableId} already has an active session. QR is shown below.`;
                }

                return sessionId
                    ? `Table ${tableId} already has active session #${sessionId}.`
                    : `Table ${tableId} already has an active session.`;
            }

            if (error.response?.status === 422) {
                setOpenedSession(null);
                return error.response?.data?.message || `Table ${tableId} cannot open a session.`;
            }

            throw error;
        }
    };

    const closeTableSession = async (tableId) => {
        if (!canServeDineInOrders) return;

        try {
            await api.post(`/tables/${tableId}/session/close`);
            setOpenedSession(null);
            return `Session closed for table ${tableId}.`;
        } catch (error) {
            if (error.response?.status === 422) {
                setOpenedSession(null);
                return error.response?.data?.message || `Table ${tableId} has no active session.`;
            }

            throw error;
        }
    };

    const runAction = async (key, action, successText) => {
        try {
            setBusyKey(key);
            setMessage("");
            setErrorMessage("");
            const actionMessage = await action();
            setMessage(actionMessage || successText);
            await loadData();
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Action failed.");
        } finally {
            setBusyKey("");
        }
    };

    const visibleTabs = [
        { id: "sessions", label: "Table sessions", icon: DoorOpen, show: canServeDineInOrders && mode !== "cash" },
        { id: "cash", label: "Cash payments", icon: Banknote, show: canProcessPayments && mode !== "ready" },
        { id: "ready", label: "Ready orders", icon: CheckCircle2, show: canServeDineInOrders && mode !== "cash" },
    ].filter((tab) => tab.show);
    const safeActiveTab = visibleTabs.some((tab) => tab.id === activeTab)
        ? activeTab
        : visibleTabs[0]?.id || "ready";
    const currentItems =
        safeActiveTab === "cash"
            ? cashPayments
            : readyOrders;
    const title =
        safeActiveTab === "cash"
            ? "Cash payments"
            : safeActiveTab === "sessions"
                ? "Table sessions"
                : "Ready orders";

    const handleLogout = () => {
        clearSession();
        navigate("/", { replace: true });
    };

    const cashTotal = useMemo(
        () => cashPayments.reduce((total, item) => total + getTotal(item), 0),
        [cashPayments]
    );

    return (
        <main className={`${embedded ? "min-h-[calc(100dvh-88px)]" : "min-h-screen"} bg-[radial-gradient(circle_at_85%_8%,rgba(127,29,29,0.18),transparent_28%),radial-gradient(circle_at_15%_20%,rgba(255,209,102,0.12),transparent_24%),linear-gradient(145deg,#101517_0%,#171D20_52%,#26181B_100%)] text-white`}>
            {!embedded && (
            <header className="sticky top-0 z-20 border-b border-white/10 bg-[#101517]/92 px-3 py-3 shadow-sm backdrop-blur-xl sm:px-4 sm:py-4">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#FFD166] text-[#151A1D] sm:h-12 sm:w-12">
                            <Utensils size={22} />
                        </div>
                        <div className="min-w-0">
                            <h1 className="truncate text-lg font-black sm:text-xl">Waiter dashboard</h1>
                            <p className="text-sm font-bold text-white/55">{waiterName}</p>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={loadData}
                            className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.07] text-[#FFD166]"
                            aria-label="Refresh"
                        >
                            <RefreshCw size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="flex h-11 items-center gap-2 rounded-xl bg-[#7F1D1D] px-3 text-sm font-black text-white sm:px-4"
                        >
                            <LogOut size={17} />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </header>
            )}

            <section className="mx-auto max-w-6xl px-3 py-5 sm:px-4 sm:py-6">
                <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-[26px] border border-white/10 bg-[#252A2D] p-5 shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
                        <p className="text-sm font-black uppercase tracking-[0.14em] text-white/55">Table session</p>
                        <p className="mt-3 text-5xl font-black text-[#FFD166]">New</p>
                        <p className="mt-2 text-sm font-bold text-white/58">
                            Open guest QR access
                        </p>
                    </div>
                    <div className="rounded-[26px] border border-white/10 bg-[#252A2D] p-5 shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
                        <p className="text-sm font-black uppercase tracking-[0.14em] text-white/55">Cash due</p>
                        <p className="mt-3 text-5xl font-black text-[#FFD166]">{cashPayments.length}</p>
                    </div>
                    <div className="rounded-[26px] border border-white/10 bg-[#252A2D] p-5 shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
                        <p className="text-sm font-black uppercase tracking-[0.14em] text-white/55">Ready</p>
                        <p className="mt-3 text-5xl font-black text-[#FFD166]">{readyOrders.length}</p>
                    </div>
                    <div className="rounded-[26px] border border-[#7F1D1D]/25 bg-[#7F1D1D]/14 p-5 text-white shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
                        <p className="text-sm font-black uppercase tracking-[0.14em] text-white/65">Money to collect</p>
                        <p className="mt-3 text-5xl font-black text-[#FFD166]">
                            ${cashTotal.toFixed(2)}
                        </p>
                        <p className="mt-2 text-sm font-bold text-white/58">
                            Pending cash payments
                        </p>
                    </div>
                </div>

                {visibleTabs.length > 1 && (
                <div className={`mb-5 grid gap-2 rounded-[24px] border border-white/10 bg-[#252A2D] p-1.5 shadow-[0_18px_42px_rgba(0,0,0,0.16)] ${visibleTabs.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
                    {visibleTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = safeActiveTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex h-12 min-w-0 items-center justify-center gap-1.5 rounded-2xl px-2 text-xs font-black transition sm:gap-2 sm:text-sm ${
                                    isActive
                                        ? "bg-[#FFD166] text-[#151A1D]"
                                        : "text-white/58 hover:bg-white/[0.07] hover:text-white"
                                }`}
                            >
                                <Icon size={18} className="shrink-0" />
                                <span className="min-w-0 truncate">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
                )}

                {message && (
                    <div className="waiter-success-message mb-4 flex items-center gap-3 rounded-[24px] border px-4 py-3 shadow-[0_18px_42px_rgba(6,78,59,0.16)]">
                        <div className="waiter-success-icon grid h-10 w-10 shrink-0 place-items-center rounded-2xl shadow-[0_12px_24px_rgba(6,78,59,0.24)]">
                            <CheckCircle2 size={22} />
                        </div>
                        <div className="min-w-0">
                            <p className="waiter-success-title text-xs font-black uppercase tracking-[0.16em]">
                                Table opened successfully
                            </p>
                            <p className="waiter-success-copy mt-0.5 text-sm font-black">
                                {message}
                            </p>
                        </div>
                    </div>
                )}
                {errorMessage && (
                    <p className="mb-4 rounded-2xl border border-[#7F1D1D]/25 bg-[#7F1D1D]/12 px-4 py-3 text-sm font-black text-[#7F1D1D]">
                        {errorMessage}
                    </p>
                )}

                {safeActiveTab === "sessions" ? (
                    <div className="rounded-[28px] border border-white/10 bg-[#252A2D] p-5 shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="min-w-0 flex-1">
                                <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-[#FFD166]">
                                    <Table2 size={18} />
                                    Open table session
                                </p>
                                <h2 className="mt-2 text-2xl font-black text-white">
                                    Start a new dine-in session
                                </h2>
                                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/58">
                                    Enter the table ID. The generated customer session token appears here after the session opens.
                                </p>
                            </div>

                            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-[620px]">
                                <input
                                    value={tableSessionNumber}
                                    onChange={(event) => {
                                        const nextTableId = event.target.value;

                                        setTableSessionNumber(nextTableId);
                                        setOpenedSession(null);
                                    }}
                                    placeholder="Table ID"
                                    className="h-12 min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#101517] px-4 text-base font-black text-white outline-none transition placeholder:text-white/35 focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const tableId = tableSessionNumber.trim();

                                        runAction(
                                            "session:open",
                                            () => openTableSession(tableId),
                                            "Session opened."
                                        );
                                    }}
                                    disabled={busyKey === "session:open" || !tableSessionNumber.trim()}
                                    className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#FFD166] px-5 text-sm font-black text-[#151A1D] shadow-[0_14px_28px_rgba(255,209,102,0.16)] transition hover:bg-[#ffdc82] disabled:!bg-[#7F1D1D] disabled:!text-white disabled:!opacity-100 dark:disabled:!bg-[#7F1D1D] dark:disabled:!text-white"
                                >
                                    <DoorOpen size={18} />
                                    {busyKey === "session:open" ? "Opening..." : "Open session"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const tableId = tableSessionNumber.trim();

                                        runAction(
                                            "session:close",
                                            () => closeTableSession(tableId),
                                            "Session closed."
                                        );
                                    }}
                                    disabled={busyKey === "session:close" || !tableSessionNumber.trim()}
                                    className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#7F1D1D]/35 bg-[#7F1D1D]/12 px-5 text-sm font-black text-[#FFB4A8] transition hover:bg-[#7F1D1D]/18 disabled:!bg-[#7F1D1D] disabled:!text-white disabled:!opacity-100 dark:disabled:!bg-[#7F1D1D] dark:disabled:!text-white"
                                >
                                    <XCircle size={18} />
                                    {busyKey === "session:close" ? "Closing..." : "Close session"}
                                </button>
                            </div>
                        </div>

                        {openedSession?.sessionToken && (
                            <div className="mt-5 grid place-items-center rounded-2xl border border-[#FFD166]/25 bg-[#101517] p-5">
                                {openedSession.qrImageUrl && (
                                    <div className="rounded-[28px] bg-white p-4 shadow-[0_24px_70px_rgba(0,0,0,0.30)]">
                                        <img
                                            src={openedSession.qrImageUrl}
                                            alt={`QR code for table ${openedSession.tableId}`}
                                            className="h-[min(58dvh,22rem)] w-[min(58dvh,22rem)] min-w-[240px] min-h-[240px]"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                ) : isLoading ? (
                    <div className="rounded-[28px] border border-white/10 bg-[#252A2D] px-6 py-16 text-center text-xl font-black shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
                        Loading {title.toLowerCase()}...
                    </div>
                ) : currentItems.length ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {currentItems.map((item, index) => {
                            const invoiceId = getInvoiceId(item);
                            const restaurantOrderId = getRestaurantOrderId(item);
                            const key = `${activeTab}:${invoiceId || restaurantOrderId || index}`;

                            if (safeActiveTab === "cash") {
                                return (
                                    <WaiterCard
                                        key={key}
                                        eyebrow={`Table ${getTableNumber(item)}`}
                                        title={`Invoice #${invoiceId || "-"}`}
                                        total={getTotal(item)}
                                        emphasizeTotal
                                        action={
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    runAction(
                                                        key,
                                                        () => confirmCash(item),
                                                        `Invoice #${invoiceId} marked paid.`
                                                    )
                                                }
                                                disabled={busyKey === key || !invoiceId}
                                                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#7F1D1D] text-sm font-black text-white shadow-[0_14px_28px_rgba(127,29,29,0.20)] transition hover:bg-[#681718] disabled:!bg-[#7F1D1D] disabled:!text-white disabled:!opacity-100 dark:disabled:!bg-[#7F1D1D] dark:disabled:!text-white"
                                            >
                                                <Banknote size={18} />
                                                {busyKey === key ? "Confirming..." : "Confirm cash"}
                                            </button>
                                        }
                                    >
                                        <p className="text-base font-semibold leading-6 text-white/62">
                                            Customer selected cash. Collect the money, then confirm.
                                        </p>
                                    </WaiterCard>
                                );
                            }

                            return (
                                <WaiterCard
                                    key={key}
                                    eyebrow={`Table ${getTableNumber(item)}`}
                                    title={`Order #${restaurantOrderId || "-"}`}
                                    total={getTotal(item)}
                                    action={
                                        <button
                                            type="button"
                                            onClick={() =>
                                                runAction(
                                                    key,
                                                    () => markServed(item),
                                                    `Order #${restaurantOrderId} marked served.`
                                                )
                                            }
                                            disabled={busyKey === key || !restaurantOrderId}
                                            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#FFD166] text-sm font-black text-[#151A1D] shadow-[0_14px_28px_rgba(255,209,102,0.16)] transition hover:bg-[#ffdc82] disabled:!bg-[#7F1D1D] disabled:!text-white disabled:!opacity-100 dark:disabled:!bg-[#7F1D1D] dark:disabled:!text-white"
                                        >
                                            <CheckCircle2 size={18} />
                                            {busyKey === key ? "Saving..." : "Mark served"}
                                        </button>
                                    }
                                >
                                    <div className="space-y-2">
                                        <p className="flex items-center gap-2 text-sm font-black text-white/58">
                                            <Clock3 size={16} />
                                            Ready to serve
                                        </p>
                                        {getItems(item).length ? (
                                            getItems(item).map((orderItem, orderItemIndex) => (
                                                <div
                                                    key={orderItem.id || orderItemIndex}
                                                    className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2"
                                                >
                                                    <div className="flex min-w-0 justify-between gap-3">
                                                        <span className="min-w-0 break-words font-black">
                                                            {getFoodName(orderItem)}
                                                        </span>
                                                        <span className="font-black text-[#FFD166]">
                                                            {Number(orderItem.quantity ?? 1)}x
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-4 text-sm font-bold text-white/58">
                                                No items returned.
                                            </p>
                                        )}
                                    </div>
                                </WaiterCard>
                            );
                        })}
                    </div>
                ) : (
                    <div className="rounded-[28px] border border-white/10 bg-[#252A2D] px-6 py-16 text-center shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
                        <ReceiptText className="mx-auto text-[#FFD166]" size={38} />
                        <h2 className="mt-3 text-xl font-black">No {title.toLowerCase()}</h2>
                        <p className="mt-2 text-sm font-bold text-white/55">
                            Nothing needs waiter action right now.
                        </p>
                    </div>
                )}
            </section>
        </main>
    );
}
