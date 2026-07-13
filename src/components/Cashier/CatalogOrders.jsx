import {
    Ban,
    Clock3,
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

const formatTime = (value) => {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    });
};

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
    const food = item?.food || item?.menu_item || item?.product || item;

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
        quantity: Number(item?.quantity ?? item?.qty ?? item?.count ?? 1),
        notes:
            item?.notes ||
            item?.note ||
            item?.special_instructions ||
            item?.pivot?.notes ||
            "",
    };
};

const normalizeRestaurantGroup = (restaurantOrder) => {
    const items = getList(getItems(restaurantOrder)).map(normalizeItem);
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
    };
};

const getRestaurantOrders = (order, normalizedItems) => {
    const restaurantOrders =
        order?.restaurant_orders ||
        order?.restaurantOrders ||
        order?.restaurant_order ||
        order?.restaurantOrder ||
        [];
    const list =
        Array.isArray(restaurantOrders) || Array.isArray(restaurantOrders?.data)
            ? getList(restaurantOrders)
            : restaurantOrders && typeof restaurantOrders === "object"
              ? [restaurantOrders]
              : [];

    if (list.length) {
        const groups = list.map(normalizeRestaurantGroup);
        const hasGroupItems = groups.some((group) => group.items.length);

        if (hasGroupItems || !normalizedItems.length) {
            return groups;
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
    const items = getList(getItems(order)).map(normalizeItem);

    return {
        id: order?.id ?? order?.order_id,
        number: order?.number ?? order?.code ?? order?.id ?? order?.order_id,
        status: normalizeStatus(order?.status || order?.kitchen_status),
        type: normalizeType(order?.type || order?.order_type || order?.service_type),
        createdAt: order?.created_at || order?.time || order?.ordered_at,
        items,
        restaurantOrders: getRestaurantOrders(order, items),
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

const getOrderItemCount = (order) => {
    const groupedItemCount = order.restaurantOrders.reduce(
        (total, group) => total + group.items.length,
        0
    );

    return groupedItemCount || order.items.length;
};

function CatalogOrders() {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [submittingKey, setSubmittingKey] = useState("");
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

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
                setOrders(kitchenOrders.map(normalizeOrder));
                return;
            }

            const cashierResponse = await api.get("/cashier/orders");
            const cashierOrders = getList(cashierResponse.data).map(normalizeOrder);
            setOrders(await loadOrderDetails(cashierOrders));
        } catch (error) {
            try {
                const response = await api.get("/cashier/orders");
                const cashierOrders = getList(response.data).map(normalizeOrder);
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

        return () => {
            window.clearTimeout(timeoutId);
            window.clearInterval(intervalId);
        };
    }, [loadOrders]);

    const visibleOrders = useMemo(
        () =>
            orders.filter(
                (order) =>
                    !order.status ||
                    visibleStatuses.has(order.status) ||
                    order.items.length > 0
            ),
        [orders]
    );

    const cancelOrder = async (orderId) => {
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
            setErrorMessage(error.response?.data?.message || "Could not cancel order.");
        } finally {
            setSubmittingKey("");
        }
    };

    const cancelRestaurantOrder = async (restaurantOrderId, orderId) => {
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
                error.response?.data?.message || "Could not cancel restaurant order."
            );
        } finally {
            setSubmittingKey("");
        }
    };

    const deleteOrderItem = async (itemId) => {
        const key = `item-delete:${itemId}`;

        setSubmittingKey(key);
        setMessage("");
        setErrorMessage("");

        try {
            await api.delete(`/cashier/order-items/${itemId}`);
            await loadOrders();
            setMessage(`Item #${itemId} deleted.`);
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Could not delete item.");
        } finally {
            setSubmittingKey("");
        }
    };

    return (
        <section className="px-4 pb-10 sm:px-6 xl:px-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-[#9A7A70]">
                        Kitchen catalog
                    </p>
                    <h1 className="text-2xl font-extrabold sm:text-3xl">
                        Active kitchen orders
                    </h1>
                    <p className="mt-2 text-sm font-medium text-[#806F69]">
                        {visibleOrders.length} active orders
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => loadOrders({ showLoader: true })}
                    disabled={isLoading}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#7F1D1D] px-5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(127,29,29,0.16)] transition hover:bg-[#681718] disabled:bg-[#C9BAB5]"
                >
                    <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {message && (
                <p className="mb-4 rounded-2xl bg-green-50 px-4 py-3 text-sm font-extrabold text-green-700">
                    {message}
                </p>
            )}

            {errorMessage && (
                <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-extrabold text-red-700">
                    {errorMessage}
                </p>
            )}

            {isLoading ? (
                <div className="rounded-[28px] border border-[#E7DCD6] bg-white/70 px-6 py-16 text-center">
                    <h2 className="text-xl font-bold">Loading orders...</h2>
                </div>
            ) : visibleOrders.length ? (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {visibleOrders.map((order) => (
                        <article
                            key={order.id}
                            className="flex h-[620px] min-h-0 flex-col overflow-hidden rounded-[24px] border border-[#EEE5E1] bg-white shadow-sm"
                        >
                            <header className="shrink-0 flex flex-wrap items-start justify-between gap-4 border-b border-[#EEE5E1] px-5 py-5">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-wide text-[#9A7A70]">
                                        Order
                                    </p>
                                    <div className="mt-1 flex items-center gap-3">
                                        <h2 className="text-3xl font-black text-[#7F1D1D]">
                                            #{order.number}
                                        </h2>
                                        <span className="rounded-full bg-[#F9ECEC] px-3 py-1 text-xs font-black uppercase text-[#7F1D1D]">
                                            {statusLabels[order.status] || order.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-sm font-bold text-[#8A7972]">
                                    <Clock3 size={16} />
                                    <span>{formatTime(order.createdAt) || "Now"}</span>
                                </div>
                            </header>

                            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
                                {order.restaurantOrders.map((group, groupIndex) => (
                                    <div
                                        key={`${group.id || group.restaurantId || groupIndex}`}
                                        className="rounded-2xl border border-[#EEE5E1] bg-[#FCFAF8] p-4"
                                    >
                                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-[#7F1D1D]">
                                                    <Store size={18} />
                                                </span>
                                                <div>
                                                    <h3 className="font-extrabold">
                                                        {group.restaurantName}
                                                    </h3>
                                                    <p className="text-xs font-bold text-[#9A8982]">
                                                        {group.items.length} items
                                                    </p>
                                                </div>
                                            </div>

                                            {group.id && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        cancelRestaurantOrder(group.id, order.id)
                                                    }
                                                    disabled={
                                                        submittingKey ===
                                                        `restaurant:${group.id}`
                                                    }
                                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                                                >
                                                    <Ban size={15} />
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
                                                    className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-white px-4 py-3"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="font-extrabold">
                                                            {item.name}
                                                        </p>
                                                        {item.notes && (
                                                            <p className="mt-1 text-xs font-medium text-[#8A7972]">
                                                                {item.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-2">
                                                        <span className="rounded-xl bg-[#F9ECEC] px-3 py-2 text-sm font-black text-[#7F1D1D]">
                                                            {item.quantity}x
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteOrderItem(item.id)}
                                                            disabled={
                                                                submittingKey ===
                                                                `item-delete:${item.id}`
                                                            }
                                                            className="grid h-10 w-10 place-items-center rounded-xl border border-red-100 bg-red-50 text-red-700 transition hover:bg-red-100 disabled:opacity-60"
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

                            <footer className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-t border-[#EEE5E1] bg-[#FFFCFA] px-5 py-4">
                                <div className="flex items-center gap-2 text-sm font-bold text-[#8A7972]">
                                    <ShoppingBag size={17} />
                                    <span>{getOrderItemCount(order)} items</span>
                                    <Utensils size={17} />
                                    <span>{order.restaurantOrders.length} groups</span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => cancelOrder(order.id)}
                                    disabled={submittingKey === `order:${order.id}`}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#7F1D1D] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#681718] disabled:bg-[#C9BAB5]"
                                >
                                    <Trash2 size={16} />
                                    {submittingKey === `order:${order.id}`
                                        ? "Canceling..."
                                        : "Cancel order"}
                                </button>
                            </footer>
                        </article>
                    ))}
                </div>
            ) : (
                <div className="rounded-[28px] border border-dashed border-[#D8C8C1] bg-white/70 px-6 py-16 text-center">
                    <h2 className="text-xl font-bold">No active kitchen orders</h2>
                    <p className="mt-2 text-[#806F69]">
                        New orders will appear here after they are sent.
                    </p>
                </div>
            )}
        </section>
    );
}

export default CatalogOrders;
