import {
    Banknote,
    CheckCircle2,
    Clock3,
    LogOut,
    RefreshCw,
    ReceiptText,
    Utensils,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../API/axios";
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
    item?.table?.table_number ??
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
    const permissions = getUserPermissions();
    const canServeDineInOrders = permissions.includes("serve_dine_in_orders");
    const canProcessPayments = permissions.includes("process_payments");
    const initialTab =
        mode === "ready" || !canProcessPayments ? "ready" : "cash";
    const [activeTab, setActiveTab] = useState(initialTab);
    const [isLoading, setIsLoading] = useState(true);
    const [busyKey, setBusyKey] = useState("");
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
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

            setCashPayments(getList(cashResponse.data));
            setReadyOrders(getList(readyResponse.data));
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

    const runAction = async (key, action, successText) => {
        try {
            setBusyKey(key);
            setMessage("");
            setErrorMessage("");
            await action();
            setMessage(successText);
            await loadData();
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Action failed.");
        } finally {
            setBusyKey("");
        }
    };

    const visibleTabs = [
        { id: "cash", label: "Cash payments", icon: Banknote, show: canProcessPayments && mode !== "ready" },
        { id: "ready", label: "Ready orders", icon: CheckCircle2, show: canServeDineInOrders && mode !== "cash" },
    ].filter((tab) => tab.show);
    const safeActiveTab = visibleTabs.some((tab) => tab.id === activeTab)
        ? activeTab
        : visibleTabs[0]?.id || "ready";
    const currentItems = safeActiveTab === "cash" ? cashPayments : readyOrders;
    const title = safeActiveTab === "cash" ? "Cash payments" : "Ready orders";

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
                <div className="mb-5 grid gap-4 sm:grid-cols-3">
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
                <div className="mb-5 grid grid-cols-2 gap-2 rounded-[24px] border border-white/10 bg-[#252A2D] p-1.5 shadow-[0_18px_42px_rgba(0,0,0,0.16)]">
                    {visibleTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = safeActiveTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex h-12 items-center justify-center gap-1.5 rounded-2xl px-2 text-sm font-black transition sm:gap-2 ${
                                    isActive
                                        ? "bg-[#FFD166] text-[#151A1D]"
                                        : "text-white/58 hover:bg-white/[0.07] hover:text-white"
                                }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
                )}

                {message && (
                    <p className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-300">
                        {message}
                    </p>
                )}
                {errorMessage && (
                    <p className="mb-4 rounded-2xl border border-[#7F1D1D]/25 bg-[#7F1D1D]/12 px-4 py-3 text-sm font-black text-[#7F1D1D]">
                        {errorMessage}
                    </p>
                )}

                {isLoading ? (
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
                                                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#7F1D1D] text-sm font-black text-white shadow-[0_14px_28px_rgba(127,29,29,0.20)] transition hover:bg-[#681718] disabled:bg-white/15 disabled:text-white/40"
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
                                            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#FFD166] text-sm font-black text-[#151A1D] shadow-[0_14px_28px_rgba(255,209,102,0.16)] transition hover:bg-[#ffdc82] disabled:bg-white/15 disabled:text-white/40"
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
