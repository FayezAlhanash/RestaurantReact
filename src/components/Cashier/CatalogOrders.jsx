import {
    AlertTriangle,
    Ban,
    Clock3,
    Loader2,
    RefreshCw,
    ShoppingBag,
    Store,
    Trash2,
    Utensils,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../API/axios";

const getList = (data) => {
    if (Array.isArray(data?.orders)) return data.orders;
    if (Array.isArray(data?.queue)) return data.queue;
    if (Array.isArray(data?.data?.orders)) return data.data.orders;
    if (Array.isArray(data?.data?.queue)) return data.data.queue;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
};

const getOrder = (data) =>
    data?.order ||
    data?.data?.order ||
    data?.data ||
    data;

const getItems = (order) =>
    order?.items ||
    order?.order_items ||
    order?.orderItems ||
    order?.details ||
    order?.foods ||
    [];

const normalizeStatus = (status) =>
    String(status || "pending")
        .toLowerCase()
        .replaceAll("-", "_")
        .replaceAll(" ", "_");

const normalizeType = (type) =>
    String(type || "takeaway")
        .toLowerCase()
        .replaceAll("-", "_")
        .replaceAll(" ", "_");

const canceledStatuses = new Set([
    "cancelled",
    "canceled",
    "deleted",
    "removed",
    "void",
    "voided",
    "rejected",
]);

const getStatusValue = (value) =>
    value?.status ??
    value?.kitchen_status ??
    value?.order_status ??
    value?.state ??
    value?.pivot?.status ??
    "";

const isTruthyFlag = (value) =>
    value === true || value === 1 || String(value).toLowerCase() === "true";

const isCanceledRecord = (value) => {
    if (!value || typeof value !== "object") return false;

    if (canceledStatuses.has(normalizeStatus(getStatusValue(value)))) {
        return true;
    }

    return (
        isTruthyFlag(value.is_cancelled) ||
        isTruthyFlag(value.is_canceled) ||
        isTruthyFlag(value.cancelled) ||
        isTruthyFlag(value.canceled) ||
        isTruthyFlag(value.deleted) ||
        isTruthyFlag(value.is_deleted) ||
        Boolean(value.cancelled_at || value.canceled_at || value.deleted_at)
    );
};

const formatTime = (value) => {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getFirstPresent = (values) =>
    values.find((value) => value !== undefined && value !== null && value !== "");

const getPreparationTiming = (value = {}) => {
    const source = value?.restaurant_order ?? value?.restaurantOrder ?? value;

    return {
        preparingAt: getFirstPresent([
            value?.preparing_at,
            value?.preparingAt,
            source?.preparing_at,
            source?.preparingAt,
        ]),
        estimatedReadyAt: getFirstPresent([
            value?.estimated_ready_at,
            value?.estimatedReadyAt,
            source?.estimated_ready_at,
            source?.estimatedReadyAt,
        ]),
        remainingMinutes: getFirstPresent([
            value?.remaining_minutes,
            value?.remainingMinutes,
            source?.remaining_minutes,
            source?.remainingMinutes,
        ]),
        waitingForPreparation: isTruthyFlag(
            getFirstPresent([
                value?.waiting_for_preparation,
                value?.waitingForPreparation,
                source?.waiting_for_preparation,
                source?.waitingForPreparation,
            ])
        ),
        isDelayed: isTruthyFlag(
            getFirstPresent([
                value?.is_delayed,
                value?.isDelayed,
                source?.is_delayed,
                source?.isDelayed,
            ])
        ),
    };
};

const hasPreparationTiming = (timing = {}) =>
    timing.waitingForPreparation ||
    timing.preparingAt ||
    timing.estimatedReadyAt ||
    timing.remainingMinutes !== undefined ||
    timing.isDelayed;

function PreparationTimingPanel({ timing }) {
    if (!hasPreparationTiming(timing)) {
        return (
            <div className="rounded-xl border border-white/10 bg-[#12181B] px-3 py-3 text-sm font-black text-white/50">
                No preparation time from kitchen yet.
            </div>
        );
    }

    if (timing.waitingForPreparation) {
        return (
            <div className="rounded-xl border border-[#FFD166]/25 bg-[#FFD166]/10 px-3 py-3">
                <p className="mt-1 text-sm font-black text-white">
                    Waiting for preparation to start
                </p>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#FFD166]/45 bg-[#FFD166]/16 px-4 py-3 shadow-[0_12px_26px_rgba(255,209,102,0.10)]">
            <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFD166] text-[#151A1D] shadow-[0_10px_20px_rgba(255,209,102,0.18)]">
                    <Clock3 size={20} />
                </span>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#FFD166]">
                    Remaining
                </p>
            </div>
            <p className="text-2xl font-black leading-none text-white">
                {timing.remainingMinutes !== undefined &&
                timing.remainingMinutes !== null &&
                timing.remainingMinutes !== ""
                    ? `${timing.remainingMinutes} min`
                    : "-"}
                <span className="ml-2 align-middle text-xs font-black uppercase tracking-[0.12em] text-white/50">
                    left
                </span>
            </p>
        </div>
    );
}

const getRestaurantOrderId = (value) =>
    value?.restaurant_order_id ??
    value?.restaurantOrderId ??
    value?.restaurant_order?.id ??
    value?.restaurantOrder?.id ??
    value?.pivot?.restaurant_order_id ??
    null;

const getRestaurantId = (value) =>
    value?.restaurant_id ??
    value?.restaurant?.id ??
    value?.food?.restaurant_id ??
    value?.food?.restaurant?.id ??
    value?.menu_item?.restaurant_id ??
    value?.menu_item?.restaurant?.id ??
    null;

const getRestaurantName = (value) =>
    value?.restaurant?.name ??
    value?.restaurant_name ??
    value?.food?.restaurant?.name ??
    value?.menu_item?.restaurant?.name ??
    "Restaurant";

const normalizeItem = (item, index) => {
    if (isCanceledRecord(item) || isCanceledRecord(item?.pivot)) return null;

    const food = item?.food || item?.menu_item || item?.product || item;
    const quantity = Number(item?.quantity ?? item?.qty ?? item?.count ?? 1);

    if (quantity <= 0) return null;

    return {
        id: item?.id ?? item?.order_item_id ?? item?.food_id ?? food?.id ?? index,
        foodId: item?.food_id ?? food?.id,
        restaurantId: getRestaurantId(item),
        restaurantOrderId: getRestaurantOrderId(item),
        restaurantName: getRestaurantName(item),
        name:
            food?.name ||
            food?.title ||
            item?.food_name ||
            item?.name ||
            item?.title ||
            "Food item",
        quantity,
        notes:
            item?.notes ||
            item?.note ||
            item?.special_instructions ||
            item?.pivot?.notes ||
            "",
    };
};

const normalizeItems = (items) => getList(items).map(normalizeItem).filter(Boolean);

const normalizeRestaurantGroup = (restaurantOrder) => {
    if (isCanceledRecord(restaurantOrder)) return null;

    const items = normalizeItems(getItems(restaurantOrder));
    const firstItem = items[0] || restaurantOrder;

    return {
        id:
            restaurantOrder?.id ??
            restaurantOrder?.restaurant_order_id ??
            firstItem?.restaurantOrderId ??
            null,
        restaurantId: getRestaurantId(restaurantOrder) ?? firstItem?.restaurantId,
        restaurantName: getRestaurantName(restaurantOrder) || firstItem?.restaurantName,
        items,
        timing: getPreparationTiming(restaurantOrder),
    };
};

const getRestaurantOrderList = (order) => {
    const restaurantOrders =
        order?.restaurant_orders ||
        order?.restaurantOrders ||
        order?.restaurant_order ||
        order?.restaurantOrder ||
        [];

    return (
        Array.isArray(restaurantOrders) || Array.isArray(restaurantOrders?.data)
            ? getList(restaurantOrders)
            : restaurantOrders && typeof restaurantOrders === "object"
              ? [restaurantOrders]
              : []
    );
};

const getCanceledRestaurantOrderIds = (order) =>
    new Set(
        getRestaurantOrderList(order)
            .filter(isCanceledRecord)
            .map((restaurantOrder) => restaurantOrder?.id ?? getRestaurantOrderId(restaurantOrder))
            .filter(Boolean)
            .map((id) => String(id))
    );

const getRestaurantOrders = (order, normalizedItems) => {
    const list = getRestaurantOrderList(order);

    if (list.length) {
        const groups = list.map(normalizeRestaurantGroup).filter(Boolean);
        const hasGroupItems = groups.some((group) => group.items.length);

        if (hasGroupItems) {
            return groups.filter((group) => group.items.length);
        }

        if (!normalizedItems.length) {
            return [];
        }
    }

    const groups = new Map();

    normalizedItems.forEach((item) => {
        const key =
            item.restaurantOrderId ||
            item.restaurantId ||
            item.restaurantName ||
            "restaurant";
        const group = groups.get(key) || {
            id: item.restaurantOrderId,
            restaurantId: item.restaurantId,
            restaurantName: item.restaurantName,
            items: [],
        };

        group.items.push(item);
        groups.set(key, group);
    });

    return Array.from(groups.values());
};

const normalizeOrder = (order) => {
    if (isCanceledRecord(order)) return null;

    const canceledRestaurantOrderIds = getCanceledRestaurantOrderIds(order);
    const items = normalizeItems(getItems(order)).filter(
        (item) =>
            !item.restaurantOrderId ||
            !canceledRestaurantOrderIds.has(String(item.restaurantOrderId))
    );
    const restaurantOrders = getRestaurantOrders(order, items);

    return {
        id: order?.id ?? order?.order_id,
        number: order?.number ?? order?.code ?? order?.id ?? order?.order_id,
        status: normalizeStatus(order?.status || order?.kitchen_status),
        type: normalizeType(order?.type || order?.order_type || order?.service_type),
        createdAt: order?.created_at || order?.time || order?.ordered_at,
        items,
        restaurantOrders,
        timing: getPreparationTiming(order),
    };
};

const needsOrderDetails = (order) =>
    order.items.length === 0 ||
    order.restaurantOrders.some((group) => group.items.length === 0);

const visibleStatuses = new Set([
    "pending",
    "confirmed",
    "preparing",
    "in_progress",
    "in_preparation",
    "started",
    "ready",
    "prepared",
    "ready_for_pickup",
    "waiting_pickup",
]);

const statusLabels = {
    pending: "Pending",
    confirmed: "Confirmed",
    preparing: "Preparing",
    in_progress: "Preparing",
    in_preparation: "Preparing",
    started: "Preparing",
    ready: "Ready",
    prepared: "Ready",
    ready_for_pickup: "Ready",
    waiting_pickup: "Ready",
};

const statusBadgeClasses = {
    pending: "border-[#FFD166]/35 bg-[#FFD166]/14 text-[#FFD166]",
    confirmed: "border-[#FFD166]/35 bg-[#FFD166]/14 text-[#FFD166]",
    preparing: "catalog-status-badge--preparing",
    in_progress: "catalog-status-badge--preparing",
    in_preparation: "catalog-status-badge--preparing",
    started: "catalog-status-badge--preparing",
    ready: "border-emerald-300/35 bg-emerald-400/16 text-emerald-200",
    prepared: "border-emerald-300/35 bg-emerald-400/16 text-emerald-200",
    ready_for_pickup: "border-emerald-300/35 bg-emerald-400/16 text-emerald-200",
    waiting_pickup: "border-emerald-300/35 bg-emerald-400/16 text-emerald-200",
};

const preparingStatuses = new Set([
    "preparing",
    "in_progress",
    "in_preparation",
    "started",
]);

const readyStatuses = new Set([
    "ready",
    "prepared",
    "ready_for_pickup",
    "waiting_pickup",
]);

const getLockedOrderMessage = (order, action = "changed") => {
    const status = normalizeStatus(order?.status);
    const orderNumber = order?.number ?? order?.id;
    const orderLabel = orderNumber ? `Order #${orderNumber}` : "This order";

    if (preparingStatuses.has(status)) {
        return `${orderLabel} is already being prepared and can no longer be ${action}.`;
    }

    if (readyStatuses.has(status)) {
        return `${orderLabel} is ready and can no longer be ${action}.`;
    }

    return "";
};

const getOrderItemCount = (order) => {
    const groupedItemCount = order.restaurantOrders.reduce(
        (total, group) => total + group.items.length,
        0
    );

    return groupedItemCount || order.items.length;
};

const getOrderTiming = (order) => {
    if (hasPreparationTiming(order?.timing)) return order.timing;

    return (
        order?.restaurantOrders?.find((group) => hasPreparationTiming(group.timing))
            ?.timing ?? {}
    );
};

const normalizeOrders = (orders) => orders.map(normalizeOrder).filter(Boolean);

function CatalogOrders() {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [submittingKey, setSubmittingKey] = useState("");
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [confirmAction, setConfirmAction] = useState(null);
    const [isConfirmVisible, setIsConfirmVisible] = useState(false);
    const [expandedTimingOrderId, setExpandedTimingOrderId] = useState("");

    const loadOrderDetails = useCallback(async (orders) => {
        const detailResponses = await Promise.allSettled(
            orders.map(async (order) => {
                if (!order.id || !needsOrderDetails(order)) return order;

                const response = await api.get(`/cashier/orders/${order.id}`);
                return normalizeOrder(getOrder(response.data));
            })
        );

        return detailResponses.map((result, index) =>
            result.status === "fulfilled" ? result.value : orders[index]
        );
    }, []);

    const loadOrders = useCallback(async ({ showLoader = false } = {}) => {
        if (showLoader) {
            setIsLoading(true);
        }

        setErrorMessage("");

        try {
            const response = await api.get("/kitchen/queue");
            const kitchenOrders = getList(response.data);

            if (kitchenOrders.length) {
                setOrders(normalizeOrders(kitchenOrders));
                return;
            }

            const cashierResponse = await api.get("/cashier/orders");
            const cashierOrders = normalizeOrders(getList(cashierResponse.data));
            setOrders(await loadOrderDetails(cashierOrders));
        } catch (error) {
            try {
                const response = await api.get("/cashier/orders");
                const cashierOrders = normalizeOrders(getList(response.data));
                setOrders(await loadOrderDetails(cashierOrders));
            } catch (fallbackError) {
                setErrorMessage(
                    fallbackError.response?.data?.message ||
                        error.response?.data?.message ||
                        "Could not load orders."
                );
            }
        } finally {
            if (showLoader) {
                setIsLoading(false);
            }
        }
    }, [loadOrderDetails]);

    useEffect(() => {
        const timeoutId = window.setTimeout(
            () => loadOrders({ showLoader: true }),
            0
        );
        const intervalId = window.setInterval(loadOrders, 30000);
        const handleOrdersUpdated = () => {
            loadOrders();
        };

        window.addEventListener("big4:orders-updated", handleOrdersUpdated);

        return () => {
            window.clearTimeout(timeoutId);
            window.clearInterval(intervalId);
            window.removeEventListener("big4:orders-updated", handleOrdersUpdated);
        };
    }, [loadOrders]);

    const visibleOrders = useMemo(
        () =>
            orders.filter(
                (order) =>
                    getOrderItemCount(order) > 0 &&
                    (!order.status || visibleStatuses.has(order.status))
            ),
        [orders]
    );

    const openConfirmation = (action) => {
        setConfirmAction(action);
        setIsConfirmVisible(false);
        requestAnimationFrame(() => setIsConfirmVisible(true));
    };

    const closeConfirmation = () => {
        if (submittingKey) return;

        setIsConfirmVisible(false);
        window.setTimeout(() => setConfirmAction(null), 180);
    };

    const confirmDeletion = async () => {
        if (!confirmAction || submittingKey) return;

        await confirmAction.onConfirm();
        setIsConfirmVisible(false);
        window.setTimeout(() => setConfirmAction(null), 180);
    };

    const cancelOrder = async (order) => {
        const orderId = order?.id;
        const key = `order:${orderId}`;

        setSubmittingKey(key);
        setMessage("");
        setErrorMessage("");

        try {
            await api.post(`/cashier/orders/${orderId}/cancel`);
            setOrders((current) =>
                current.filter((order) => String(order.id) !== String(orderId))
            );
            setMessage(`Order #${orderId} canceled.`);
        } catch (error) {
            setErrorMessage(
                getLockedOrderMessage(order, "canceled") ||
                    error.response?.data?.message ||
                    "Could not cancel order."
            );
        } finally {
            setSubmittingKey("");
        }
    };

    const cancelRestaurantOrder = async (restaurantOrderId, order) => {
        const orderId = order?.id;
        const key = `restaurant:${restaurantOrderId}`;

        setSubmittingKey(key);
        setMessage("");
        setErrorMessage("");

        try {
            await api.post(`/cashier/restaurant-orders/${restaurantOrderId}/cancel`);
            setOrders((current) =>
                current
                    .map((order) =>
                        String(order.id) === String(orderId)
                            ? {
                                  ...order,
                                  restaurantOrders: order.restaurantOrders.filter(
                                      (group) =>
                                          String(group.id) !==
                                          String(restaurantOrderId)
                                  ),
                                  items: order.items.filter(
                                      (item) =>
                                          String(item.restaurantOrderId) !==
                                          String(restaurantOrderId)
                                  ),
                              }
                            : order
                    )
                    .filter((order) => order.restaurantOrders.length || order.items.length)
            );
            setMessage(`Restaurant order #${restaurantOrderId} canceled.`);
        } catch (error) {
            setErrorMessage(
                getLockedOrderMessage(order, "changed") ||
                    error.response?.data?.message ||
                    "Could not cancel restaurant order."
            );
        } finally {
            setSubmittingKey("");
        }
    };

    const deleteOrderItem = async (itemId, order) => {
        const key = `item-delete:${itemId}`;

        setSubmittingKey(key);
        setMessage("");
        setErrorMessage("");

        try {
            await api.delete(`/cashier/order-items/${itemId}`);
            await loadOrders();
            setMessage(`Item #${itemId} deleted.`);
        } catch (error) {
            setErrorMessage(
                getLockedOrderMessage(order, "changed") ||
                    error.response?.data?.message ||
                    "Could not delete item."
            );
        } finally {
            setSubmittingKey("");
        }
    };

    return (
        <section className="px-4 pb-10 sm:px-6 xl:px-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-[#FFD166]">
                        Kitchen catalog
                    </p>
                    <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
                        Active kitchen orders
                    </h1>
                    <p className="mt-2 text-sm font-medium text-white/58">
                        {visibleOrders.length} active orders
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => loadOrders({ showLoader: true })}
                    disabled={isLoading}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#7F1D1D] px-5 text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(127,29,29,0.20)] transition hover:bg-[#681718] disabled:!bg-[#7F1D1D] disabled:!text-white disabled:!opacity-100"
                >
                    <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {message && (
                <p className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-extrabold text-emerald-300">
                    {message}
                </p>
            )}

            {errorMessage && (
                <div className="catalog-order-alert mb-4 flex items-start gap-3 rounded-[22px] border border-[#7F1D1D]/18 bg-[linear-gradient(135deg,#FFF4EE_0%,#FBE5E5_100%)] px-4 py-3.5 text-[#7F1D1D] shadow-[0_14px_30px_rgba(127,29,29,0.08)] ring-1 ring-white/70">
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-[#7F1D1D] text-white shadow-[0_10px_22px_rgba(127,29,29,0.18)]">
                        <AlertTriangle size={18} />
                    </span>
                    <span className="min-w-0">
                        <span className="block text-xs font-black uppercase tracking-[0.14em] text-[#9A6400]">
                            Order update
                        </span>
                        <span className="mt-0.5 block text-sm font-black leading-6">
                            {errorMessage}
                        </span>
                    </span>
                </div>
            )}

            {isLoading ? (
                <div className="rounded-[28px] border border-white/10 bg-[#252A2D] px-6 py-16 text-center shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
                    <h2 className="text-xl font-bold">Loading orders...</h2>
                </div>
            ) : visibleOrders.length ? (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                    {visibleOrders.map((order) => {
                        const timing = getOrderTiming(order);
                        const isDineInOrder = order.type === "dine_in";
                        const isTakeawayOrder = order.type === "takeaway";
                        const showDineInTiming =
                            isDineInOrder &&
                            expandedTimingOrderId === String(order.id);

                        return (
                        <article
                            key={order.id}
                            className="flex max-h-[520px] min-h-[300px] flex-col overflow-hidden rounded-[18px] border border-white/10 bg-[#252A2D] shadow-[0_14px_32px_rgba(0,0,0,0.16)]"
                        >
                            <header className="shrink-0 flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-4 py-4">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-wide text-white/50">
                                        Order
                                    </p>
                                    <div className="mt-1 flex items-center gap-2">
                                        <h2 className="text-2xl font-black text-[#FFD166]">
                                            #{order.number}
                                        </h2>
                                        <span
                                            className={`rounded-full border px-3 py-1 text-xs font-black uppercase shadow-sm ${
                                                statusBadgeClasses[order.status] ||
                                                "border-white/15 bg-white/10 text-white"
                                            }`}
                                        >
                                            {statusLabels[order.status] || order.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-sm font-bold text-white/55">
                                    <Clock3 size={16} />
                                    <span>{formatTime(order.createdAt) || "Now"}</span>
                                </div>
                            </header>

                            {(isTakeawayOrder || isDineInOrder) && (
                                <div className="shrink-0 border-b border-white/10 px-4 py-3">
                                    {isTakeawayOrder ? (
                                        <PreparationTimingPanel timing={timing} compact />
                                    ) : (
                                        <div className="space-y-3">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setExpandedTimingOrderId((current) =>
                                                        current === String(order.id)
                                                            ? ""
                                                            : String(order.id)
                                                    )
                                                }
                                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#FFD166]/30 bg-[#FFD166]/12 px-3 text-xs font-black text-[#FFD166] transition hover:bg-[#FFD166]/18"
                                            >
                                                <Clock3 size={15} />
                                                {showDineInTiming
                                                    ? "Hide food time"
                                                    : "Show food time"}
                                            </button>
                                            {showDineInTiming && (
                                                <PreparationTimingPanel timing={timing} compact />
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
                                {order.restaurantOrders.map((group, groupIndex) => (
                                    <div
                                        key={`${group.id || group.restaurantId || groupIndex}`}
                                        className="rounded-xl border border-white/10 bg-white/[0.06] p-3"
                                    >
                                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#FFD166]/14 text-[#FFD166]">
                                                    <Store size={16} />
                                                </span>
                                                <div>
                                                    <h3 className="text-sm font-extrabold">
                                                        {group.restaurantName}
                                                    </h3>
                                                    <p className="text-xs font-bold text-white/45">
                                                        {group.items.length} items
                                                    </p>
                                                </div>
                                            </div>

                                            {group.id && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openConfirmation({
                                                            title: "Cancel this group?",
                                                            description: `This will remove the ${group.restaurantName} group from order #${order.number}.`,
                                                            confirmLabel: "Cancel group",
                                                            submittingLabel: "Canceling...",
                                                            submittingKey: `restaurant:${group.id}`,
                                                            onConfirm: () =>
                                                                cancelRestaurantOrder(
                                                                    group.id,
                                                                    order
                                                                ),
                                                        })
                                                    }
                                                    disabled={
                                                        submittingKey ===
                                                        `restaurant:${group.id}`
                                                    }
                                                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#FF6B6B]/35 bg-[#7F1D1D] px-2.5 text-xs font-black text-white shadow-[0_8px_18px_rgba(127,29,29,0.18)] transition hover:border-[#FF8A8A]/55 hover:bg-[#681718] active:scale-[0.98] disabled:cursor-wait disabled:!bg-[#7F1D1D] disabled:!text-white disabled:opacity-80"
                                                >
                                                    <Ban size={14} />
                                                    {submittingKey ===
                                                    `restaurant:${group.id}`
                                                        ? "Canceling..."
                                                        : "Cancel group"}
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            {group.items.map((item) => (
                                                <div
                                                    key={`${item.id}-${item.foodId}`}
                                                    className="flex flex-wrap items-start justify-between gap-2 rounded-lg bg-[#12181B] px-3 py-2.5"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-extrabold">
                                                            {item.name}
                                                        </p>
                                                        {item.notes && (
                                                            <p className="mt-1 text-xs font-medium text-white/50">
                                                                {item.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-2">
                                                        <span className="rounded-lg bg-[#FFD166]/14 px-2.5 py-1.5 text-xs font-black text-[#FFD166]">
                                                            {item.quantity}x
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openConfirmation({
                                                                    title: "Delete this item?",
                                                                    description: `${item.name} will be removed from order #${order.number}.`,
                                                                    confirmLabel: "Delete item",
                                                                    submittingLabel: "Deleting...",
                                                                    submittingKey: `item-delete:${item.id}`,
                                                                    onConfirm: () =>
                                                                        deleteOrderItem(
                                                                            item.id,
                                                                            order
                                                                        ),
                                                                })
                                                            }
                                                            disabled={
                                                                submittingKey ===
                                                                `item-delete:${item.id}`
                                                            }
                                                            className="grid h-9 w-9 place-items-center rounded-lg border border-[#FF6B6B]/35 bg-[#7F1D1D] text-white shadow-[0_8px_18px_rgba(127,29,29,0.18)] transition hover:border-[#FF8A8A]/55 hover:bg-[#681718] active:scale-[0.96] disabled:cursor-wait disabled:!bg-[#7F1D1D] disabled:!text-white disabled:opacity-80"
                                                            aria-label={`Delete ${item.name}`}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <footer className="shrink-0 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-[#12181B] px-4 py-3">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-white/55">
                                    <ShoppingBag size={15} />
                                    <span>{getOrderItemCount(order)} items</span>
                                    <Utensils size={15} />
                                    <span>{order.restaurantOrders.length} groups</span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        openConfirmation({
                                            title: "Cancel this order?",
                                            description: `Order #${order.number} and its groups will be canceled.`,
                                            confirmLabel: "Cancel order",
                                            submittingLabel: "Canceling...",
                                            submittingKey: `order:${order.id}`,
                                            onConfirm: () => cancelOrder(order),
                                        })
                                    }
                                    disabled={submittingKey === `order:${order.id}`}
                                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-[#FF6B6B]/35 bg-[#7F1D1D] px-3 text-xs font-black text-white shadow-[0_10px_22px_rgba(127,29,29,0.22)] transition hover:border-[#FF8A8A]/55 hover:bg-[#681718] active:scale-[0.98] disabled:!bg-[#7F1D1D] disabled:!text-white disabled:!opacity-80"
                                >
                                    <Trash2 size={15} />
                                    {submittingKey === `order:${order.id}`
                                        ? "Canceling..."
                                        : "Cancel order"}
                                </button>
                            </footer>
                        </article>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-[28px] border border-dashed border-white/15 bg-[#252A2D] px-6 py-16 text-center shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
                    <h2 className="text-xl font-bold">No active kitchen orders</h2>
                    <p className="mt-2 text-white/58">
                        New orders will appear here after they are sent.
                    </p>
                </div>
            )}

            {confirmAction && (
                <div
                    className={`fixed inset-0 z-[200] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm transition-opacity duration-200 ${
                        isConfirmVisible ? "opacity-100" : "opacity-0"
                    }`}
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeConfirmation();
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="cashier-delete-confirm-title"
                        className={`w-full max-w-md rounded-[26px] border border-[#7F1D1D]/18 bg-[#fffaf5] p-5 text-[#241815] shadow-[0_28px_80px_rgba(36,24,21,0.26)] ring-1 ring-white/70 transition duration-200 ease-out ${
                            isConfirmVisible
                                ? "translate-y-0 scale-100 opacity-100"
                                : "translate-y-3 scale-95 opacity-0"
                        }`}
                    >
                        <div className="flex items-start gap-4">
                            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#7F1D1D]/18 bg-[#7F1D1D]/10 text-[#7F1D1D]">
                                <AlertTriangle size={23} />
                            </span>
                            <div className="min-w-0 flex-1">
                                <h2
                                    id="cashier-delete-confirm-title"
                                    className="text-xl font-black"
                                >
                                    {confirmAction.title}
                                </h2>
                                <p className="mt-2 text-sm font-semibold leading-6 text-[#6b5b53]">
                                    {confirmAction.description}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={closeConfirmation}
                                disabled={Boolean(submittingKey)}
                                className="h-12 rounded-2xl border border-[#d8c9bd] bg-white text-sm font-black text-[#5d4c45] shadow-sm transition hover:bg-[#fff4eb] active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
                            >
                                Keep it
                            </button>
                            <button
                                type="button"
                                onClick={confirmDeletion}
                                disabled={Boolean(submittingKey)}
                                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#7F1D1D] text-sm font-black text-white shadow-[0_16px_32px_rgba(127,29,29,0.24)] transition hover:bg-[#681718] active:scale-[0.98] disabled:cursor-wait disabled:opacity-80"
                            >
                                {submittingKey === confirmAction.submittingKey && (
                                    <Loader2 size={17} className="animate-spin" />
                                )}
                                {submittingKey === confirmAction.submittingKey
                                    ? confirmAction.submittingLabel
                                    : confirmAction.confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default CatalogOrders;
