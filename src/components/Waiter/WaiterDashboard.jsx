import {
    Banknote,
    CheckCircle2,
    Clock3,
    DoorOpen,
    LogOut,
    RefreshCw,
    ReceiptText,
    Search,
    Table2,
    Utensils,
    XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../API/axios";
import useRealtimeRefresh from "../../hooks/useRealtimeRefresh";
import { clearSession, getStoredUser } from "../../utils/auth";
import { getUserPermissions } from "../../utils/permissions";

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

const normalizeTruthyValue = (value) => {
    const textValue = String(value ?? "").trim().toLowerCase();

    if (value === true || value === 1 || value === "1") return true;
    if (["true", "yes", "open", "opened", "active", "running"].includes(textValue)) return true;
    if (/\b(open|opened|active|running)\b/.test(textValue)) {
        return !/\b(closed|inactive|not active|finished|ended)\b/.test(textValue);
    }

    return false;
};

const getTablesList = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.tables)) return data.tables;
    if (Array.isArray(data?.data?.tables)) return data.data.tables;
    if (Array.isArray(data?.restaurant_tables)) return data.restaurant_tables;
    if (Array.isArray(data?.restaurantTables)) return data.restaurantTables;
    if (Array.isArray(data?.table_sessions)) return data.table_sessions;
    if (Array.isArray(data?.tableSessions)) return data.tableSessions;
    if (Array.isArray(data?.data)) return data.data;
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

const getWaiterTableId = (table) =>
    table?.id ??
    table?.table_id ??
    table?.tableId ??
    table?.table?.id ??
    table?.restaurant_table_id ??
    table?.restaurantTableId ??
    null;

const getWaiterTableNumber = (table) =>
    table?.table_number ??
    table?.tableNumber ??
    table?.number ??
    table?.name ??
    table?.table?.table_number ??
    table?.table?.tableNumber ??
    getWaiterTableId(table) ??
    "-";

const mergeTableSessionStatus = (table, statusData = {}) => {
    const hasActiveSession = statusData.has_active_session === true;

    return {
        ...table,
        has_active_session: hasActiveSession,
        table: statusData.table ?? table.table,
        active_session: statusData.session ?? null,
        session: statusData.session ?? null,
        session_token: statusData.session_token ?? "",
        qr_path: statusData.qr_path ?? "",
    };
};

const getSessionCandidate = (table) =>
    table?.active_session ??
    table?.activeSession ??
    table?.active_table_session ??
    table?.activeTableSession ??
    table?.current_session ??
    table?.currentSession ??
    table?.open_session ??
    table?.openSession ??
    table?.table_session ??
    table?.tableSession ??
    table?.dine_in_session ??
    table?.dineInSession ??
    table?.session ??
    table?.sessions ??
    null;

const isClosedStatus = (value) =>
    ["closed", "close", "inactive", "not_active", "not active", "finished", "ended"].includes(
        String(value).toLowerCase()
    );

const getExplicitTableSessionState = (table) => {
    const explicitActiveValue =
        table?.has_active_session ??
        table?.hasActiveSession ??
        table?.is_open ??
        table?.isOpen ??
        table?.opened ??
        table?.is_session_open ??
        table?.isSessionOpen;

    if (explicitActiveValue !== undefined && explicitActiveValue !== null && explicitActiveValue !== "") {
        return normalizeTruthyValue(explicitActiveValue) || Number(explicitActiveValue) > 0;
    }

    const statusValue =
        table?.session_status ??
        table?.sessionStatus ??
        table?.status ??
        table?.dine_in_status ??
        table?.dineInStatus;

    if (statusValue !== undefined && statusValue !== null && statusValue !== "") {
        if (isClosedStatus(statusValue)) return false;
        if (normalizeTruthyValue(statusValue)) return true;
    }

    return undefined;
};

const isTableSessionOpen = (table) => {
    const explicitState = getExplicitTableSessionState(table);

    if (explicitState !== undefined) return explicitState;

    const directValue =
        table?.active_session_id ??
        table?.activeSessionId ??
        table?.active_table_session_id ??
        table?.activeTableSessionId ??
        table?.current_session_id ??
        table?.currentSessionId ??
        table?.open_session_id ??
        table?.openSessionId ??
        table?.session_id ??
        table?.sessionId ??
        table?.table_session_id ??
        table?.tableSessionId ??
        table?.dine_in_session_id ??
        table?.dineInSessionId ??
        table?.session_token ??
        table?.sessionToken ??
        table?.table_session_token ??
        table?.tableSessionToken ??
        table?.dine_in_token ??
        table?.dineInToken;

    if (directValue !== undefined && directValue !== null && directValue !== "") {
        return normalizeTruthyValue(directValue) || Number(directValue) > 0 || String(directValue).length > 3;
    }

    const session = getSessionCandidate(table);

    if (Array.isArray(session)) {
        return session.some((item) => isTableSessionOpen(item));
    }

    if (!session) return false;

    if (typeof session !== "object") {
        return normalizeTruthyValue(session) || Number(session) > 0 || String(session).length > 3;
    }

    const sessionStatus = session.status ?? session.session_status ?? session.sessionStatus;

    if (sessionStatus !== undefined && sessionStatus !== null && sessionStatus !== "") {
        if (isClosedStatus(sessionStatus)) return false;
        if (normalizeTruthyValue(sessionStatus)) return true;
    }

    return Boolean(
        session.id ||
            session.session_id ||
            session.sessionId ||
            session.token ||
            session.session_token ||
            session.sessionToken ||
            session.table_session_token ||
            session.tableSessionToken
    );
};

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
    const [tableSessions, setTableSessions] = useState([]);
    const [tableSearch, setTableSearch] = useState("");
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

    const loadServiceTables = useCallback(async () => {
        try {
            const response = await api.get("/tables-serve-dine-in");

            return getTablesList(response.data);
        } catch (error) {
            if (error.response?.status === 404) {
                const fallbackResponse = await api.get("/tables");

                return getTablesList(fallbackResponse.data);
            }

            throw error;
        }
    }, []);

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [cashResponse, readyResponse, tablesResponse] = await Promise.all([
                canProcessPayments
                    ? api.get("/waiter/pending-cash-payments")
                    : Promise.resolve({ data: [] }),
                canServeDineInOrders
                    ? api.get("/waiter/ready-restaurant-orders")
                    : Promise.resolve({ data: [] }),
                canServeDineInOrders
                    ? loadServiceTables()
                    : Promise.resolve([]),
            ]);

            setCashPayments(getList(cashResponse.data));
            setReadyOrders(getList(readyResponse.data));
            setTableSessions(tablesResponse);
            setErrorMessage("");
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Could not load waiter data.");
        } finally {
            setIsLoading(false);
        }
    }, [canProcessPayments, canServeDineInOrders, loadServiceTables]);

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

    const applyTableSessionStatus = useCallback((tableId, statusData) => {
        setTableSessions((currentTables) =>
            currentTables.map((table) =>
                String(getWaiterTableId(table)) === String(tableId)
                    ? mergeTableSessionStatus(table, statusData)
                    : table
            )
        );
    }, []);

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
                (await fetchCurrentSessionFromTableDetails());

            setOpenedSession(nextOpenedSession);
            applyTableSessionStatus(tableId, {
                has_active_session: true,
                session: response.data?.session ?? response.data?.data?.session ?? null,
                session_token: getSessionTokenFromResponse(response.data),
                qr_path: getQrPathFromResponse(response.data, getSessionTokenFromResponse(response.data)),
            });

            return nextOpenedSession?.sessionToken
                ? `Session opened for table ${tableId}. QR is shown below.`
                : `Session opened for table ${tableId}.`;
        } catch (error) {
            if (error.response?.status === 409) {
                const sessionId = error.response?.data?.session_id;
                const nextOpenedSession =
                    (await fetchCurrentSessionFromTableDetails());

                setOpenedSession(nextOpenedSession);
                applyTableSessionStatus(tableId, {
                    has_active_session: true,
                    session: {
                        id: sessionId,
                    },
                    session_token: getSessionTokenFromResponse(error.response?.data),
                    qr_path: getQrPathFromResponse(
                        error.response?.data,
                        getSessionTokenFromResponse(error.response?.data)
                    ),
                });

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
            applyTableSessionStatus(tableId, {
                has_active_session: false,
                session: null,
            });
            return `Session closed for table ${tableId}.`;
        } catch (error) {
            if (error.response?.status === 422) {
                setOpenedSession(null);
                applyTableSessionStatus(tableId, {
                    has_active_session: false,
                    session: null,
                });
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
            if (!key.startsWith("session:")) {
                await loadData();
            }
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
    const normalizedTableSessions = useMemo(
        () =>
            tableSessions
                .map((table) => {
                    const waiterTableId = getWaiterTableId(table);
                    const explicitState = getExplicitTableSessionState(table);

                    return {
                        ...table,
                        waiterTableId,
                        waiterTableNumber: getWaiterTableNumber(table),
                        isSessionOpen:
                            explicitState !== undefined ? explicitState : isTableSessionOpen(table),
                        sessionId:
                            table?.session_id ??
                            table?.sessionId ??
                            table?.session?.id ??
                            "",
                    };
                })
                .filter((table) => table.waiterTableId !== null && table.waiterTableId !== undefined)
                .sort((firstTable, secondTable) =>
                    String(firstTable.waiterTableNumber).localeCompare(
                        String(secondTable.waiterTableNumber),
                        undefined,
                        { numeric: true, sensitivity: "base" }
                    )
                ),
        [tableSessions]
    );
    const filteredTableSessions = useMemo(() => {
        const query = tableSearch.trim().toLowerCase();

        if (!query) return normalizedTableSessions;

        return normalizedTableSessions.filter((table) =>
            [
                `table ${table.waiterTableNumber}`,
                table.waiterTableNumber,
                table.waiterTableId,
                table.isSessionOpen ? "open" : "closed",
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query))
        );
    }, [normalizedTableSessions, tableSearch]);
    const openTables = normalizedTableSessions.filter((table) => table.isSessionOpen).length;
    const closedTables = normalizedTableSessions.length - openTables;

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
                <div className="mb-5 grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-[22px] border border-emerald-400/25 bg-emerald-400/10 p-4 shadow-[0_18px_42px_rgba(0,0,0,0.18)] sm:rounded-[26px] sm:p-5">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-100/70 sm:text-sm">Open</p>
                        <p className="mt-2 text-4xl font-black text-emerald-300 sm:mt-3 sm:text-5xl">{openTables}</p>
                        <p className="mt-2 text-sm font-bold text-emerald-50/62">
                            Active sessions
                        </p>
                    </div>
                    <div className="rounded-[22px] border border-[#7F1D1D]/35 bg-[#7F1D1D]/16 p-4 text-white shadow-[0_18px_42px_rgba(0,0,0,0.18)] sm:rounded-[26px] sm:p-5">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-white/65 sm:text-sm">Closed</p>
                        <p className="mt-2 text-4xl font-black text-[#FFB4A8] sm:mt-3 sm:text-5xl">{closedTables}</p>
                        <p className="mt-2 text-sm font-bold text-white/58">
                            No active session
                        </p>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-[#252A2D] p-4 shadow-[0_18px_42px_rgba(0,0,0,0.18)] sm:rounded-[26px] sm:p-5">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-white/55 sm:text-sm">Cash due</p>
                        <p className="mt-2 text-4xl font-black text-[#FFD166] sm:mt-3 sm:text-5xl">{cashPayments.length}</p>
                    </div>
                    <div className="rounded-[22px] border border-[#7F1D1D]/25 bg-[#7F1D1D]/14 p-4 text-white shadow-[0_18px_42px_rgba(0,0,0,0.18)] sm:rounded-[26px] sm:p-5">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-white/65 sm:text-sm">Money to collect</p>
                        <p className="mt-2 text-4xl font-black text-[#FFD166] sm:mt-3 sm:text-5xl">
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
                                Table session updated
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
                    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#252A2D] shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
                        <div className="flex flex-col gap-4 border-b border-white/[0.08] bg-white/[0.025] p-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0 flex-1">
                                <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-[#FFD166]">
                                    <Table2 size={18} />
                                    Table sessions
                                </p>
                                <h2 className="mt-2 text-2xl font-black text-white">
                                    {filteredTableSessions.length} table{filteredTableSessions.length === 1 ? "" : "s"}
                                </h2>
                            </div>

                            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-[460px]">
                                <div className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-[#101517] px-4 shadow-inner">
                                    <Search size={18} className="shrink-0 text-[#FFD166]" />
                                    <input
                                        value={tableSearch}
                                        onChange={(event) => setTableSearch(event.target.value)}
                                        placeholder="Search tables..."
                                        className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/35"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={loadData}
                                    className="grid h-12 w-full place-items-center rounded-2xl border border-[#FFD166]/30 bg-[#FFD166]/10 text-[#FFD166] transition hover:bg-[#FFD166]/18 sm:w-12"
                                    aria-label="Refresh tables"
                                    title="Refresh tables"
                                >
                                    <RefreshCw size={18} />
                                </button>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="px-6 py-16 text-center text-xl font-black">
                                Loading table sessions...
                            </div>
                        ) : filteredTableSessions.length ? (
                            <div className="grid gap-5 p-5 sm:grid-cols-2 xl:grid-cols-3">
                                {filteredTableSessions.map((table) => {
                                    const isOpen = table.isSessionOpen;
                                    const tableId = table.waiterTableId;
                                    const tableNumber = table.waiterTableNumber;
                                    const actionKey = `session:${isOpen ? "close" : "open"}:${tableId}`;
                                    const isBusy = busyKey === actionKey;

                                    return (
                                        <article
                                            key={tableId}
                                            className={`group relative min-h-[270px] overflow-hidden rounded-[24px] border p-5 shadow-[0_22px_54px_rgba(0,0,0,0.24)] ring-1 ring-white/[0.06] transition hover:-translate-y-1 ${
                                                isOpen
                                                    ? "border-emerald-300/28 bg-[linear-gradient(145deg,rgba(255,255,255,0.045)_0%,rgba(16,185,129,0.10)_38%,rgba(255,255,255,0.025)_100%),linear-gradient(160deg,#20282A_0%,#142521_56%,#101719_100%)]"
                                                    : "border-[#FFB4A8]/40 bg-[radial-gradient(circle_at_50%_-10%,rgba(255,180,168,0.26),transparent_42%),linear-gradient(155deg,#8F1D1D_0%,#681718_58%,#431313_100%)]"
                                            }`}
                                        >
                                            <span className={`absolute inset-x-5 top-0 h-1 rounded-b-full ${isOpen ? "bg-emerald-300/80" : "bg-[#FFB4A8]"}`} />
                                            <span className={`absolute bottom-5 left-0 top-5 w-1 rounded-r-full ${isOpen ? "bg-emerald-300/50" : "bg-[#FFB4A8]/70"}`} />
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex min-w-0 items-center gap-2 text-sm font-black text-white/78">
                                                    <Table2 size={17} className="shrink-0" />
                                                    <span className="min-w-0 truncate">Floor table</span>
                                                </div>
                                                <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black shadow-sm ${
                                                    isOpen
                                                        ? "border-emerald-500/35 bg-emerald-100 text-emerald-800"
                                                        : "border-[#FFD1CB]/35 bg-white/12 text-[#FFD1CB]"
                                                }`}>
                                                    {isOpen ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                                    {isOpen ? "Open" : "Closed"}
                                                </span>
                                            </div>

                                            <div className="mt-7 flex justify-center">
                                                <div className={`grid h-24 w-24 place-items-center rounded-[24px] border text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_18px_38px_rgba(0,0,0,0.18)] transition group-hover:scale-105 ${
                                                    isOpen
                                                        ? "border-emerald-200/28 bg-emerald-300/10"
                                                        : "border-white/28 bg-white/14"
                                                }`}>
                                                    <Utensils size={38} />
                                                </div>
                                            </div>

                                            <h3 className="mt-5 text-center text-3xl font-black leading-tight text-white">
                                                Table {tableNumber}
                                            </h3>
                                            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                                                <span className="rounded-full border border-white/18 bg-white/10 px-3 py-1 text-xs font-black text-white/78">
                                                    ID #{tableId}
                                                </span>
                                                <span className={`rounded-full border px-3 py-1 text-xs font-black ${
                                                    isOpen
                                                        ? "border-emerald-500/24 bg-emerald-100 text-emerald-800"
                                                        : "border-white/18 bg-white/10 text-white/78"
                                                }`}>
                                                    {isOpen ? "Serving now" : "Ready to open"}
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    runAction(
                                                        actionKey,
                                                        () =>
                                                            isOpen
                                                                ? closeTableSession(tableId)
                                                                : openTableSession(tableId),
                                                        isOpen ? "Session closed." : "Session opened."
                                                    )
                                                }
                                                disabled={isBusy}
                                                className={`mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-black shadow-[0_14px_28px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 ${
                                                    isOpen
                                                        ? "border border-emerald-300/35 bg-emerald-300/10 text-emerald-50 hover:border-emerald-200/55 hover:bg-emerald-300/16"
                                                        : "bg-[#FFD166] text-[#151A1D] hover:bg-[#ffdc82]"
                                                }`}
                                            >
                                                {isOpen ? <XCircle size={18} /> : <DoorOpen size={18} />}
                                                {isBusy
                                                    ? isOpen
                                                        ? "Closing..."
                                                        : "Opening..."
                                                    : isOpen
                                                        ? "Close session"
                                                        : "Open session"}
                                            </button>
                                        </article>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="px-6 py-16 text-center shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
                                <Table2 className="mx-auto text-[#FFD166]" size={38} />
                                <h2 className="mt-3 text-xl font-black">No tables found</h2>
                                <p className="mt-2 text-sm font-bold text-white/55">
                                    Refresh after adding tables in management.
                                </p>
                            </div>
                        )}

                        {openedSession?.sessionToken && (
                            <div className="border-t border-white/[0.08] p-5">
                                <div className="grid place-items-center rounded-2xl border border-[#FFD166]/25 bg-[#101517] p-5">
                                    {openedSession.qrImageUrl && (
                                        <div className="rounded-[28px] bg-white p-4 shadow-[0_24px_70px_rgba(0,0,0,0.30)]">
                                            <img
                                                src={openedSession.qrImageUrl}
                                                alt={`QR code for table ${openedSession.tableId}`}
                                                className="h-[min(58dvh,22rem)] min-h-[240px] w-[min(58dvh,22rem)] min-w-[240px]"
                                            />
                                        </div>
                                    )}
                                </div>
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
