import { CheckCircle2, Clock3, PackageCheck, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../API/axios";

const getList = (data) => {
    if (Array.isArray(data?.orders)) return data.orders;
    if (Array.isArray(data?.data?.orders)) return data.data.orders;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
};

const normalizeStatus = (status) =>
    String(status || "")
        .toLowerCase()
        .replaceAll("-", "_")
        .replaceAll(" ", "_");

const normalizeType = (type) =>
    String(type || "")
        .toLowerCase()
        .replaceAll("-", "_")
        .replaceAll(" ", "_");

const getItems = (order) =>
    order?.items ||
    order?.order_items ||
    order?.orderItems ||
    order?.details ||
    order?.foods ||
    [];

const normalizeItem = (item, index) => {
    const food = item?.food || item?.menu_item || item?.product || item;

    return {
        id: item?.id ?? item?.food_id ?? food?.id ?? index,
        name:
            food?.name ||
            food?.title ||
            item?.food_name ||
            item?.name ||
            item?.title ||
            "Food item",
        quantity: Number(item?.quantity ?? item?.qty ?? item?.count ?? 1),
    };
};

const normalizeOrder = (order) => ({
    id: order?.id ?? order?.order_id,
    number: order?.number ?? order?.code ?? order?.id ?? order?.order_id,
    status: normalizeStatus(order?.status || order?.kitchen_status),
    type: normalizeType(order?.type || order?.order_type || order?.service_type),
    createdAt: order?.created_at || order?.time || order?.ordered_at,
    total: Number(
        order?.total ??
            order?.total_price ??
            order?.invoice?.total ??
            order?.invoice?.amount ??
            0
    ),
    items: getList(getItems(order)).map(normalizeItem),
});

function formatTime(value) {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function PickupOrders() {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmittingId, setIsSubmittingId] = useState(null);
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const loadOrders = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage("");

        try {
            const response = await api.get("/cashier/orders", {
                params: {
                    type: "takeaway",
                    order_type: "takeaway",
                },
            });

            setOrders(getList(response.data).map(normalizeOrder));
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message || "Could not load pickup orders."
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(loadOrders, 0);
        const intervalId = window.setInterval(loadOrders, 7000);

        return () => {
            window.clearTimeout(timeoutId);
            window.clearInterval(intervalId);
        };
    }, [loadOrders]);

    const readyOrders = useMemo(
        () =>
            orders.filter((order) => {
                const isTakeaway =
                    !order.type ||
                    ["takeaway", "take_away", "takeout"].includes(order.type);
                const isReady = [
                    "ready",
                    "prepared",
                    "ready_for_pickup",
                    "waiting_pickup",
                ].includes(order.status);

                return isTakeaway && isReady;
            }),
        [orders]
    );

    const handlePickedUp = async (orderId) => {
        setIsSubmittingId(orderId);
        setErrorMessage("");
        setMessage("");

        try {
            await api.post(`/cashier/orders/${orderId}/picked-up`);
            setOrders((current) =>
                current.filter((order) => String(order.id) !== String(orderId))
            );
            setMessage(`Order #${orderId} marked as picked up.`);
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message || "Could not confirm pickup."
            );
        } finally {
            setIsSubmittingId(null);
        }
    };

    return (
        <section className="px-4 pb-10 sm:px-6 xl:px-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-[#9A7A70]">
                        Takeaway pickup
                    </p>
                    <h1 className="text-2xl font-extrabold sm:text-3xl">
                        Orders ready for pickup
                    </h1>
                    <p className="mt-2 text-sm font-medium text-[#806F69]">
                        Confirm customer pickup to complete the order.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadOrders}
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
                    <h2 className="text-xl font-bold">Loading pickup orders...</h2>
                </div>
            ) : readyOrders.length ? (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                    {readyOrders.map((order) => (
                        <article
                            key={order.id}
                            className="rounded-[24px] border border-[#EEE5E1] bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-wide text-[#9A7A70]">
                                        Order
                                    </p>
                                    <h2 className="mt-1 text-3xl font-black text-[#7F1D1D]">
                                        #{order.number}
                                    </h2>
                                </div>
                                <span className="inline-flex items-center gap-2 rounded-2xl bg-green-50 px-3 py-2 text-sm font-black text-green-700">
                                    <PackageCheck size={17} />
                                    Ready
                                </span>
                            </div>

                            <div className="mt-4 flex items-center gap-2 text-sm font-bold text-[#8A7972]">
                                <Clock3 size={16} />
                                <span>{formatTime(order.createdAt) || "Takeaway"}</span>
                            </div>

                            <div className="mt-5 space-y-2">
                                {order.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between rounded-2xl bg-[#FCFAF8] px-4 py-3"
                                    >
                                        <span className="font-extrabold">{item.name}</span>
                                        <span className="rounded-xl bg-[#F9ECEC] px-3 py-1 text-sm font-black text-[#7F1D1D]">
                                            {item.quantity}x
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={() => handlePickedUp(order.id)}
                                disabled={isSubmittingId === order.id}
                                className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#7F1D1D] text-sm font-black text-white shadow-[0_10px_24px_rgba(127,29,29,0.18)] transition hover:bg-[#681718] disabled:bg-[#C9BAB5]"
                            >
                                <CheckCircle2 size={19} />
                                {isSubmittingId === order.id
                                    ? "Confirming..."
                                    : "Customer picked up"}
                            </button>
                        </article>
                    ))}
                </div>
            ) : (
                <div className="rounded-[28px] border border-dashed border-[#D8C8C1] bg-white/70 px-6 py-16 text-center">
                    <h2 className="text-xl font-bold">No ready takeaway orders</h2>
                    <p className="mt-2 text-[#806F69]">
                        Orders appear here after the kitchen marks them ready.
                    </p>
                </div>
            )}
        </section>
    );
}

export default PickupOrders;
