import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCw } from "lucide-react";
import api from "../API/axios";

export default function ReadyOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchReadyOrders = async () => {
        try {
            setError("");

            const response = await api.get("/ready-orders");

            const readyOrders = Array.isArray(response.data?.orders)
                ? response.data.orders
                : [];

            setOrders(readyOrders);
        } catch (error) {
            console.error(error.response?.data || error);
            setError("Failed to load ready orders.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = window.setTimeout(fetchReadyOrders, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, []);

    return (
        <div
            className="min-h-screen px-6 py-8"
            style={{
                backgroundColor: "#0f0f0f",
                color: "#ffffff",
            }}
        >
            <div className="mx-auto max-w-7xl">

                {/* Header */}
                <div className="mb-10">
                    <p
                        className="text-sm font-black uppercase tracking-[0.3em]"
                        style={{ color: "#f2d35b" }}
                    >
                        Order Status
                    </p>

                    <h1
                        className="mt-2 text-4xl font-black"
                        style={{ color: "#ffffff" }}
                    >
                        Ready Orders
                    </h1>

                    <p
                        className="mt-2 text-sm font-medium"
                        style={{ color: "#a3a3a3" }}
                    >
                        Please collect your order when your number appears.
                    </p>
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="flex min-h-[450px] items-center justify-center">
                        <div className="text-center">
                            <RefreshCw
                                size={42}
                                className="mx-auto animate-spin"
                                style={{ color: "#f2d35b" }}
                            />

                            <p
                                className="mt-4 font-bold"
                                style={{ color: "#a3a3a3" }}
                            >
                                Loading ready orders...
                            </p>
                        </div>
                    </div>
                ) : error ? (
                    /* Error */
                    <div
                        className="rounded-2xl p-6 text-center font-bold"
                        style={{
                            color: "#fca5a5",
                            backgroundColor: "rgba(239,68,68,0.10)",
                            border: "1px solid rgba(239,68,68,0.30)",
                        }}
                    >
                        {error}
                    </div>
                ) : orders.length === 0 ? (
                    /* Empty State */
                    <div className="flex min-h-[450px] items-center justify-center">
                        <div className="text-center">
                            <CheckCircle2
                                size={68}
                                className="mx-auto"
                                style={{ color: "#444444" }}
                            />

                            <h2
                                className="mt-5 text-2xl font-black"
                                style={{ color: "#ffffff" }}
                            >
                                No orders are ready yet
                            </h2>

                            <p
                                className="mt-2 font-medium"
                                style={{ color: "#8a8a8a" }}
                            >
                                Ready order numbers will appear here automatically.
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Ready Orders */
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className="relative overflow-hidden rounded-[28px] p-7 transition duration-300 hover:-translate-y-1"
                                style={{
                                    backgroundColor: "#1a1a1a",
                                    border: "1px solid rgba(215,181,47,0.45)",
                                    boxShadow:
                                        "0 18px 50px rgba(0,0,0,0.45)",
                                }}
                            >
                                {/* Gold line */}
                                <div
                                    className="absolute inset-x-0 top-0 h-1"
                                    style={{
                                        backgroundColor: "#d7b52f",
                                    }}
                                />

                                {/* Status */}
                                <div className="flex items-center justify-between">
                                    <span
                                        className="rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em]"
                                        style={{
                                            color: "#f2d35b",
                                            backgroundColor:
                                                "rgba(215,181,47,0.14)",
                                            border:
                                                "1px solid rgba(215,181,47,0.25)",
                                        }}
                                    >
                                        Ready
                                    </span>

                                    <CheckCircle2
                                        size={27}
                                        style={{
                                            color: "#f2d35b",
                                        }}
                                    />
                                </div>

                                {/* Order Number */}
                                <div className="py-10 text-center">
                                    <p
                                        className="text-sm font-black uppercase tracking-[0.3em]"
                                        style={{
                                            color: "#a3a3a3",
                                        }}
                                    >
                                        Order Number
                                    </p>

                                    <div
                                        className="mt-5 text-[88px] font-black leading-none"
                                        style={{
                                            color: "#ffffff",
                                            WebkitTextFillColor: "#ffffff",
                                        }}
                                    >
                                        {order.id}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div
                                    className="pt-5 text-center"
                                    style={{
                                        borderTop:
                                            "1px solid rgba(255,255,255,0.10)",
                                    }}
                                >
                                    <p
                                        className="text-sm font-black capitalize"
                                        style={{
                                            color: "#d4d4d4",
                                        }}
                                    >
                                        {order.order_type?.replace("-", " ") ||
                                            "Order"}
                                    </p>

                                    <p
                                        className="mt-2 text-xs font-black uppercase tracking-[0.2em]"
                                        style={{
                                            color: "#f2d35b",
                                        }}
                                    >
                                        Ready for pickup
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
