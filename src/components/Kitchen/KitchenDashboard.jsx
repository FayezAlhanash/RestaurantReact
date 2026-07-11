import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BellRing, CheckCircle2, Flame, LogOut, Utensils } from "lucide-react";

import OrderCard from "../../components/Kitchen/OrderCard";
import { clearSession, getStoredUser } from "../../utils/auth";
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

export default function KitchenDashboard() {
    const [orders, setOrders] = useState([]);
    const [completedOrders, setCompletedOrders] = useState([]);
    const [showCompleted, setShowCompleted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const shouldPollRef = useRef(true);
    const navigate = useNavigate();
    const user = getStoredUser();

    const chefName =
        user?.name ||
        [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
        "أحمد خالد";

    const loadQueue = useCallback(async () => {
        try {
            const queue = await fetchKitchenQueue();
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
                    ? "Unauthorized. سجّل دخول بحساب المطبخ أو تأكد أن الحساب لديه صلاحية قائمة المطبخ."
                    : error.response?.data?.message || "تعذر جلب قائمة المطبخ"
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

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

    const handleStartPreparing = async (orderId) => {
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
            await startKitchenOrder(orderId);
            await loadQueue();
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message || "تعذر بدء تحضير الطلب"
            );
        }
    };

    const handleReady = async (orderId) => {
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
            await markKitchenOrderReady(orderId);
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
                error.response?.data?.message || "تعذر إنهاء الطلب"
            );
        }
    };

    const handleLogout = () => {
        clearSession();
        navigate("/", { replace: true });
    };

    return (
        <main className="kitchen-screen min-h-screen bg-[#1f2326] text-[#f5f1eb]">
            <header className="flex min-h-[76px] items-center justify-between border-b border-white/10 bg-[#292e33] px-5 shadow-[0_8px_24px_rgba(0,0,0,0.28)] lg:px-8">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex h-11 min-w-40 items-center justify-center gap-3 rounded-xl border border-white/10 bg-[#363c42] px-5 text-sm font-extrabold text-[#f8ded8] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#414850]"
                    >
                        تسجيل الخروج
                        <LogOut size={18} strokeWidth={2.5} />
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowCompleted((current) => !current)}
                        className={`flex h-11 min-w-44 items-center justify-center gap-3 rounded-xl border px-5 text-sm font-extrabold shadow-sm transition hover:-translate-y-0.5 ${
                            showCompleted
                                ? "border-emerald-300/30 bg-emerald-500/16 text-emerald-100"
                                : "border-white/10 bg-[#363c42] text-[#dff7e7] hover:bg-[#414850]"
                        }`}
                    >
                        الطلبات الخالصة
                        <span className="rounded-full bg-white/12 px-2 py-0.5 text-xs">
                            {completedOrders.length}
                        </span>
                        <CheckCircle2 size={18} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="text-right">
                    <p className="text-lg font-black text-white">
                        {chefName}
                    </p>
                    <p className="mt-1 text-sm font-extrabold text-[#bbb4aa]">
                        رئيس الطهاة
                    </p>
                </div>

                <div className="flex items-center gap-4 text-right">
                    <div>
                        <p className="text-lg font-black text-[#f8ded8]">
                            مطبخ فرع 4
                        </p>
                        <p className="mt-1 text-sm font-extrabold text-[#bbb4aa]">
                            المحطة الرئيسية ·{" "}
                            <span className="text-white">
                                {orders.length} طلب نشط
                            </span>
                        </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7f0710] text-white shadow-lg">
                        <Utensils size={24} strokeWidth={2.5} />
                    </div>
                </div>
            </header>

            <section className="px-5 py-6 lg:px-8">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#2a2f34] px-4 py-3 shadow-[0_8px_18px_rgba(0,0,0,0.18)]">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#78330f] text-[#ffe3cc]">
                            <Flame size={22} strokeWidth={2.5} />
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-black text-white">
                                {showCompleted ? "الطلبات الخالصة" : "قائمة التحضير"}
                            </p>
                            <p className="text-xs font-extrabold text-[#bbb4aa]">
                                {showCompleted
                                    ? "الطلبات التي تم تعليمها كجاهزة"
                                    : "متصل بقائمة المطبخ الحقيقية"}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={loadQueue}
                        className="flex h-14 items-center justify-center gap-3 rounded-2xl bg-[#9b7d06] px-5 text-sm font-black text-[#1f1804] shadow-[0_12px_24px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:bg-[#ac8c08]"
                    >
                        تحديث القائمة
                        <BellRing size={22} strokeWidth={2.4} />
                    </button>
                </div>

                {errorMessage && (
                    <p className="mb-5 rounded-2xl border border-amber-300/30 bg-amber-200/10 px-4 py-3 text-right text-sm font-extrabold text-amber-100">
                        {errorMessage}
                    </p>
                )}

                {isLoading ? (
                    <div className="rounded-2xl border border-white/10 bg-[#2a2f34] px-5 py-12 text-center font-black text-[#bbb4aa]">
                        جاري تحميل طلبات المطبخ...
                    </div>
                ) : showCompleted ? (
                    completedOrders.length ? (
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                            {completedOrders.map((order) => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    className="opacity-90"
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-white/10 bg-[#2a2f34] px-5 py-12 text-center font-black text-[#bbb4aa]">
                            لا يوجد طلبات خالصة حالياً
                        </div>
                    )
                ) : orders.length ? (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                        {orders.map((order) => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                onStartPreparing={handleStartPreparing}
                                onReady={handleReady}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-white/10 bg-[#2a2f34] px-5 py-12 text-center font-black text-[#bbb4aa]">
                        لا يوجد طلبات في المطبخ حالياً
                    </div>
                )}
            </section>
        </main>
    );
}
