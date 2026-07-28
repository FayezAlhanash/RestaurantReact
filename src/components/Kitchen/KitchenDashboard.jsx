import { useCallback, useEffect, useRef, useState } from "react";
import { BellRing, Building2, CheckCircle2, Flame, Utensils } from "lucide-react";

import OrderCard from "../../components/Kitchen/OrderCard";
import api from "../../API/axios";
import useRealtimeRefresh from "../../hooks/useRealtimeRefresh";
import { getStoredUser, ROLE_IDS } from "../../utils/auth";
import {
    fetchKitchenQueue,
    markKitchenOrderReady,
    startKitchenOrder,
} from "../../utils/kitchenOrders";

const normalizeStatus = (status) =>
    String(status || "pending")
        .toLowerCase()
        .replaceAll("-", "_")
        .replaceAll(" ", "_");

const isCompletedOrder = (order) =>
    ["ready", "completed", "done"].includes(normalizeStatus(order?.status));

const ADMIN_ALL_RESTAURANTS = "all";

export default function KitchenDashboard() {
    const [orders, setOrders] = useState([]);
    const [completedOrders, setCompletedOrders] = useState([]);
    const [showCompleted, setShowCompleted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [pendingOrderActions, setPendingOrderActions] = useState({});
    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
    const shouldPollRef = useRef(true);
    const user = getStoredUser();
    const isAdmin = Number(user?.role_id ?? user?.role?.id) === ROLE_IDS.ADMIN;
    const selectedRestaurant = restaurants.find(
        (restaurant) => String(restaurant.id) === String(selectedRestaurantId)
    );

    const chefName =
        user?.name ||
        [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
        "Ahmed Khaled";

    const loadQueue = useCallback(async () => {
        try {
            if (isAdmin && !selectedRestaurantId) {
                setOrders([]);
                setCompletedOrders([]);
                setErrorMessage("");
                setIsLoading(false);
                return;
            }

            const queue =
                isAdmin && selectedRestaurantId === ADMIN_ALL_RESTAURANTS
                    ? (
                          await Promise.allSettled(
                              restaurants.map(async (restaurant) => {
                                  const restaurantQueue = await fetchKitchenQueue(
                                      restaurant.id
                                  );

                                  return restaurantQueue.map((order) => ({
                                      ...order,
                                      sourceRestaurantId: restaurant.id,
                                  }));
                              })
                          )
                      ).flatMap((result) =>
                          result.status === "fulfilled" ? result.value : []
                      )
                    : await fetchKitchenQueue(
                          isAdmin ? selectedRestaurantId : undefined
                      );
            const activeQueue = queue.filter((order) => !isCompletedOrder(order));
            const readyQueue = queue.filter(isCompletedOrder);

            setOrders(activeQueue);
            setCompletedOrders((current) => {
                const readyOrders = new Map(
                    current.map((order) => [String(order.id), order])
                );

                readyQueue.forEach((order) => {
                    readyOrders.set(String(order.id), order);
                });

                return Array.from(readyOrders.values());
            });
            setErrorMessage("");
            shouldPollRef.current = true;
        } catch (error) {
            if (error.response?.status === 403) {
                shouldPollRef.current = false;
            }

            setErrorMessage(
                error.response?.status === 403
                    ? "Unauthorized. Sign in with a kitchen account or make sure this account has kitchen queue access."
                    : error.response?.data?.message || "Could not load the kitchen queue."
            );
        } finally {
            setIsLoading(false);
        }
    }, [isAdmin, restaurants, selectedRestaurantId]);

    useEffect(() => {
        if (!isAdmin) return undefined;

        const fetchRestaurants = async () => {
            try {
                const response = await api.get("/restaurants");
                const restaurantList = response.data.restaurants || response.data.data || [];

                setRestaurants(restaurantList);
                setSelectedRestaurantId((current) =>
                    current || (restaurantList.length ? ADMIN_ALL_RESTAURANTS : "")
                );
            } catch (error) {
                setErrorMessage(
                    error.response?.data?.message || "Could not load restaurants."
                );
            }
        };

        fetchRestaurants();
        return undefined;
    }, [isAdmin]);

    useEffect(() => {
        const initialLoadId = window.setTimeout(loadQueue, 0);
        const intervalId = window.setInterval(() => {
            if (shouldPollRef.current) {
                loadQueue();
            }
        }, 5000);

        return () => {
            shouldPollRef.current = false;
            window.clearTimeout(initialLoadId);
            window.clearInterval(intervalId);
        };
    }, [loadQueue]);

    useRealtimeRefresh(() => {
        shouldPollRef.current = true;
        loadQueue();
    });

    const handleStartPreparing = async (orderId) => {
        if (pendingOrderActions[String(orderId)]) return;

        const order = orders.find(
            (currentOrder) => String(currentOrder.id) === String(orderId)
        );
        const status = String(order?.status || "pending")
            .toLowerCase()
            .replaceAll("-", "_")
            .replaceAll(" ", "_");

        if (
            ["preparing", "in_progress", "in_preparation", "started", "ready"].includes(
                status
            )
        ) {
            return;
        }

        try {
            const backendIds = order?.backendIds?.length ? order.backendIds : [orderId];

            setPendingOrderActions((current) => ({
                ...current,
                [String(orderId)]: "start",
            }));
            await Promise.all(backendIds.map(startKitchenOrder));
            await loadQueue();
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message || "Could not start preparing the order."
            );
        } finally {
            setPendingOrderActions((current) => {
                const next = { ...current };

                delete next[String(orderId)];
                return next;
            });
        }
    };

    const handleReady = async (orderId) => {
        if (pendingOrderActions[String(orderId)]) return;

        const order = orders.find(
            (currentOrder) => String(currentOrder.id) === String(orderId)
        );
        const status = String(order?.status || "")
            .toLowerCase()
            .replaceAll("-", "_")
            .replaceAll(" ", "_");

        if (
            !["preparing", "in_progress", "in_preparation", "started"].includes(
                status
            )
        ) {
            return;
        }

        try {
            const backendIds = order?.backendIds?.length ? order.backendIds : [orderId];

            setPendingOrderActions((current) => ({
                ...current,
                [String(orderId)]: "ready",
            }));
            await Promise.all(backendIds.map(markKitchenOrderReady));
            if (order) {
                setCompletedOrders((current) => {
                    const next = current.filter(
                        (currentOrder) => String(currentOrder.id) !== String(orderId)
                    );

                    return [{ ...order, status: "ready" }, ...next];
                });
                setOrders((current) =>
                    current.filter(
                        (currentOrder) => String(currentOrder.id) !== String(orderId)
                    )
                );
                setShowCompleted(false);
            }
            await loadQueue();
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message || "Could not mark the order as ready."
            );
        } finally {
            setPendingOrderActions((current) => {
                const next = { ...current };

                delete next[String(orderId)];
                return next;
            });
        }
    };

    return (
        <main className="kitchen-screen min-h-screen bg-[#1f2326] text-[#f5f1eb]">
            <header className="flex min-h-[76px] items-center justify-between border-b border-white/10 bg-[#292e33] py-3 pl-20 pr-5 shadow-[0_8px_24px_rgba(0,0,0,0.28)] lg:pr-8">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setShowCompleted((current) => !current)}
                        className={`flex h-11 min-w-44 items-center justify-center gap-3 rounded-xl border px-5 text-sm font-extrabold shadow-sm transition hover:-translate-y-0.5 ${
                            showCompleted
                                ? "border-emerald-300/30 bg-emerald-500/16 text-emerald-100"
                                : "border-white/10 bg-[#363c42] text-[#dff7e7] hover:bg-[#414850]"
                        }`}
                    >
                        Ready Orders
                        <span className="rounded-full bg-white/12 px-2 py-0.5 text-xs">
                            {completedOrders.length}
                        </span>
                        <CheckCircle2 size={18} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="text-left">
                    <p className="text-lg font-black text-white">
                        {chefName}
                    </p>
                    <p className="mt-1 text-sm font-extrabold text-[#bbb4aa]">
                        Head Chef
                    </p>
                </div>

                <div className="flex items-center gap-4 text-left">
                    <div>
                        <p className="text-lg font-black text-[#f8ded8]">
                            {selectedRestaurant?.name
                                ? `${selectedRestaurant.name} Kitchen`
                                : isAdmin && selectedRestaurantId === ADMIN_ALL_RESTAURANTS
                                  ? "All Kitchens"
                                  : "Branch Kitchen"}
                        </p>
                        <p className="mt-1 text-sm font-extrabold text-[#bbb4aa]">
                            Main station ·{" "}
                            <span className="text-white">
                                {orders.length} active orders
                            </span>
                        </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7f0710] text-white shadow-lg">
                        <Utensils size={24} strokeWidth={2.5} />
                    </div>
                </div>
            </header>

            <section className="px-5 py-6 lg:px-8">
                {isAdmin && restaurants.length > 0 && (
                    <div className="mb-5 rounded-2xl border border-[#FFD166]/25 bg-[#2a2f34] p-4 shadow-[0_10px_22px_rgba(0,0,0,0.20)]">
                        <div className="mb-3 flex items-center gap-3 text-left">
                            <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#FFD166]/35 bg-[#FFD166]/12 text-[#FFD166]">
                                <Building2 size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#FFD166]">
                                    Admin kitchen view
                                </p>
                                <h2 className="text-lg font-black text-white">
                                    Choose a restaurant to view its kitchen
                                </h2>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {restaurants.map((restaurant) => {
                                const active =
                                    String(selectedRestaurantId) === String(restaurant.id);

                                return (
                                    <button
                                        key={restaurant.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedRestaurantId(restaurant.id);
                                            setOrders([]);
                                            setCompletedOrders([]);
                                            setShowCompleted(false);
                                            setIsLoading(true);
                                            shouldPollRef.current = true;
                                        }}
                                        className={`rounded-xl border px-4 py-2 text-sm font-black transition hover:-translate-y-0.5 ${
                                            active
                                                ? "border-[#FFD166] bg-[#FFD166] text-[#1f1804] shadow-[0_10px_20px_rgba(255,209,102,0.18)]"
                                                : "border-white/15 bg-[#1f2326] text-white hover:border-[#FFD166]/45 hover:text-[#FFD166]"
                                        }`}
                                    >
                                        {restaurant.name || `Restaurant #${restaurant.id}`}
                                    </button>
                                );
                            })}
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedRestaurantId(ADMIN_ALL_RESTAURANTS);
                                    setOrders([]);
                                    setCompletedOrders([]);
                                    setShowCompleted(false);
                                    setIsLoading(true);
                                    shouldPollRef.current = true;
                                }}
                                className={`rounded-xl border px-4 py-2 text-sm font-black transition hover:-translate-y-0.5 ${
                                    selectedRestaurantId === ADMIN_ALL_RESTAURANTS
                                        ? "border-[#FFD166] bg-[#FFD166] text-[#1f1804] shadow-[0_10px_20px_rgba(255,209,102,0.18)]"
                                        : "border-white/15 bg-[#1f2326] text-white hover:border-[#FFD166]/45 hover:text-[#FFD166]"
                                }`}
                            >
                                All Kitchens
                            </button>
                        </div>
                    </div>
                )}

                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#2a2f34] px-4 py-3 shadow-[0_8px_18px_rgba(0,0,0,0.18)]">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#78330f] text-[#ffe3cc]">
                            <Flame size={22} strokeWidth={2.5} />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-black text-white">
                                {showCompleted ? "Ready Orders" : "Prep Queue"}
                            </p>
                            <p className="text-xs font-extrabold text-[#bbb4aa]">
                                {showCompleted
                                    ? "Orders that are ready for handoff"
                                    : "Orders this kitchen is actively tracking"}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={loadQueue}
                        className="flex h-14 items-center justify-center gap-3 rounded-2xl bg-[#9b7d06] px-5 text-sm font-black text-[#1f1804] shadow-[0_12px_24px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:bg-[#ac8c08]"
                    >
                        Refresh Queue
                        <BellRing size={22} strokeWidth={2.4} />
                    </button>
                </div>

                {errorMessage && (
                    <p className="mb-5 rounded-2xl border border-amber-300/30 bg-amber-200/10 px-4 py-3 text-left text-sm font-extrabold text-amber-100">
                        {errorMessage}
                    </p>
                )}

                {isLoading ? (
                    <div className="rounded-2xl border border-white/10 bg-[#2a2f34] px-5 py-12 text-center font-black text-[#bbb4aa]">
                        Loading kitchen orders...
                    </div>
                ) : showCompleted ? (
                    completedOrders.length ? (
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                            {completedOrders.map((order) => (
                                <OrderCard
                                    key={`${order.sourceRestaurantId || selectedRestaurantId}-${order.id}`}
                                    order={order}
                                    className="opacity-90"
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-white/10 bg-[#2a2f34] px-5 py-12 text-center font-black text-[#bbb4aa]">
                            There are no ready orders for this kitchen right now.
                        </div>
                    )
                ) : orders.length ? (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                        {orders.map((order) => (
                            <OrderCard
                                key={`${order.sourceRestaurantId || selectedRestaurantId}-${order.id}`}
                                order={order}
                                onStartPreparing={handleStartPreparing}
                                onReady={handleReady}
                                pendingAction={pendingOrderActions[String(order.id)]}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-white/10 bg-[#2a2f34] px-5 py-12 text-center font-black text-[#bbb4aa]">
                        There are no orders for this kitchen right now.
                    </div>
                )}
            </section>
        </main>
    );
}
