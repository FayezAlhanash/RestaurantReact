import { AlertCircle, DollarSign, Flame, ShoppingBag, Store, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../../API/axios";
import { useTheme } from "../../context/ThemeContext";
import { getStoredUser } from "../../utils/auth";
import PieChart from "./PieChart";
import WeeklyOrdersChart from "./WeeklyOrdersChart";

function getRestaurantId() {
    const user = getStoredUser();

    return (
        user?.restaurant_id ??
        user?.restaurant?.id ??
        user?.employee?.restaurant_id ??
        user?.employee?.restaurant?.id ??
        1
    );
}

function getList(data) {
    if (Array.isArray(data?.restaurants)) return data.restaurants;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.orders)) return data.orders;
    if (Array.isArray(data?.queue)) return data.queue;
    if (Array.isArray(data?.data?.orders)) return data.data.orders;
    if (Array.isArray(data?.data?.queue)) return data.data.queue;
    if (Array.isArray(data?.top_foods)) return data.top_foods;
    if (Array.isArray(data?.topFoods)) return data.topFoods;
    if (Array.isArray(data?.foods)) return data.foods;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data)) return data;
    return [];
}

function formatCurrency(value) {
    const amount = Number(value);

    if (Number.isNaN(amount)) return "$0";

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
    }).format(amount);
}

function getCurrentYearFilters() {
    const year = new Date().getFullYear();

    return {
        from: `${year}-01-01`,
        to: `${year}-12-31`,
    };
}

function getTopFoodOrderCount(item, food) {
    return Number(
        item?.orders_count ??
            item?.order_count ??
            item?.ordered_count ??
            item?.times_ordered ??
            item?.sold_count ??
            item?.total_sold ??
            item?.total_orders ??
            item?.total_ordered ??
            item?.total_quantity ??
            item?.total_qty ??
            item?.quantity_sold ??
            item?.quantity ??
            item?.qty ??
            item?.count ??
            item?.pivot?.quantity ??
            item?.pivot?.count ??
            food?.orders_count ??
            food?.order_count ??
            food?.ordered_count ??
            food?.total_sold ??
            food?.total_quantity ??
            food?.quantity ??
            food?.qty ??
            food?.pivot?.quantity ??
            0
    );
}

function normalizeTopFood(item, restaurant) {
    const food = item?.food || item?.menu_item || item?.product || item;

    return {
        id: food?.id ?? item?.food_id ?? item?.id,
        name:
            food?.name ||
            food?.title ||
            item?.food_name ||
            item?.name ||
            item?.title ||
            "Food item",
        restaurant: restaurant?.name || item?.restaurant?.name || "Restaurant",
        orders: getTopFoodOrderCount(item, food),
    };
}

function getOrderItems(order) {
    return (
        order?.items ||
        order?.order_items ||
        order?.orderItems ||
        order?.details ||
        order?.foods ||
        []
    );
}

function buildTopFoodsFromOrders(orders, restaurant) {
    const foodCounts = new Map();

    orders.forEach((order) => {
        getList(getOrderItems(order)).forEach((item) => {
            const food = item?.food || item?.menu_item || item?.product || item;
            const id = food?.id ?? item?.food_id ?? item?.id;
            const name =
                food?.name ||
                food?.title ||
                item?.food_name ||
                item?.name ||
                item?.title ||
                "Food item";
            const quantity = Number(
                item?.quantity ?? item?.qty ?? item?.count ?? 1
            );
            const key = `${id ?? name}`;
            const current = foodCounts.get(key) || {
                id,
                name,
                restaurant: restaurant?.name || "Restaurant",
                orders: 0,
            };

            current.orders += quantity;
            foodCounts.set(key, current);
        });
    });

    return Array.from(foodCounts.values());
}

function normalizeDailyRevenue(item) {
    return {
        date: item?.date || item?.day || item?.created_at || "Unknown",
        revenue: Number(
            item?.revenue ??
                item?.total_revenue ??
                item?.total ??
                item?.amount ??
                0
        ),
    };
}

function normalizeDailyOrders(item) {
    return {
        date: item?.date || item?.day || item?.created_at || "Unknown",
        totalOrders: Number(
            item?.total_orders ??
                item?.orders ??
                item?.orders_count ??
                item?.count ??
                0
        ),
        completedOrders: Number(
            item?.completed_orders ??
                item?.completed ??
                item?.completed_count ??
                0
        ),
        cancelledOrders: Number(
            item?.cancelled_orders ??
                item?.canceled_orders ??
                item?.cancelled ??
                item?.canceled ??
                0
        ),
    };
}

function MainContent() {
    const { isLight } = useTheme();
    const [restaurantSummaries, setRestaurantSummaries] = useState([]);
    const [topFoods, setTopFoods] = useState([]);
    const [dailyRevenue, setDailyRevenue] = useState([]);
    const [dailyOrders, setDailyOrders] = useState([]);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [summaryError, setSummaryError] = useState("");

    useEffect(() => {
        const fetchRestaurantSummary = async (restaurant) => {
            const response = await api.get(
                `/restaurants/${restaurant.id}/reports/summary`,
                {
                    params: getCurrentYearFilters(),
                }
            );

            return {
                restaurant,
                summary: response.data,
            };
        };
        const fetchRestaurantTopFoods = async (restaurant) => {
            const response = await api.get(
                `/restaurants/${restaurant.id}/reports/top-foods`,
                {
                    params: {
                        ...getCurrentYearFilters(),
                        limit: 10,
                    },
                }
            );
            const reportFoods = getList(response.data).map((item) =>
                normalizeTopFood(item, restaurant)
            );

            if (reportFoods.length) return reportFoods;

            const queueResponse = await api.get("/kitchen/queue", {
                params: { restaurant_id: restaurant.id },
            });

            return buildTopFoodsFromOrders(
                getList(queueResponse.data),
                restaurant
            );
        };
        const fetchRestaurantDailyRevenue = async (restaurant) => {
            const response = await api.get(
                `/restaurants/${restaurant.id}/reports/daily-revenue`,
                {
                    params: getCurrentYearFilters(),
                }
            );

            return getList(response.data).map(normalizeDailyRevenue);
        };
        const fetchRestaurantDailyOrders = async (restaurant) => {
            const response = await api.get(
                `/restaurants/${restaurant.id}/reports/daily-orders`,
                {
                    params: getCurrentYearFilters(),
                }
            );

            return getList(response.data).map(normalizeDailyOrders);
        };

        const fetchSummary = async () => {
            setSummaryLoading(true);
            setSummaryError("");

            try {
                const restaurantsResponse = await api.get("/restaurants");
                const restaurants = getList(restaurantsResponse.data);
                const summaryResponses = await Promise.allSettled(
                    restaurants.map(fetchRestaurantSummary)
                );
                const topFoodResponses = await Promise.allSettled(
                    restaurants.map(fetchRestaurantTopFoods)
                );
                const dailyRevenueResponses = await Promise.allSettled(
                    restaurants.map(fetchRestaurantDailyRevenue)
                );
                const dailyOrdersResponses = await Promise.allSettled(
                    restaurants.map(fetchRestaurantDailyOrders)
                );
                const summaries = summaryResponses.map((result, index) => {
                    if (result.status === "fulfilled") return result.value;

                    return {
                        restaurant: restaurants[index],
                        summary: null,
                    };
                });
                const foods = topFoodResponses
                    .flatMap((result) =>
                        result.status === "fulfilled" ? result.value : []
                    )
                    .sort((a, b) => b.orders - a.orders)
                    .slice(0, 10);
                const revenueByDate = dailyRevenueResponses
                    .flatMap((result) =>
                        result.status === "fulfilled" ? result.value : []
                    )
                    .reduce((dates, item) => {
                        dates.set(item.date, (dates.get(item.date) || 0) + item.revenue);
                        return dates;
                    }, new Map());
                const dailyRevenueItems = Array.from(
                    revenueByDate,
                    ([date, revenue]) => ({
                        date,
                        revenue,
                    })
                ).sort((a, b) => new Date(a.date) - new Date(b.date));
                const ordersByDate = dailyOrdersResponses
                    .flatMap((result) =>
                        result.status === "fulfilled" ? result.value : []
                    )
                    .reduce((dates, item) => {
                        const current = dates.get(item.date) || {
                            date: item.date,
                            totalOrders: 0,
                            completedOrders: 0,
                            cancelledOrders: 0,
                        };

                        current.totalOrders += item.totalOrders;
                        current.completedOrders += item.completedOrders;
                        current.cancelledOrders += item.cancelledOrders;
                        dates.set(item.date, current);

                        return dates;
                    }, new Map());
                const dailyOrderItems = Array.from(ordersByDate.values()).sort(
                    (a, b) => new Date(a.date) - new Date(b.date)
                );

                setRestaurantSummaries(summaries);
                setTopFoods(foods);
                setDailyRevenue(dailyRevenueItems);
                setDailyOrders(dailyOrderItems);
            } catch (error) {
                try {
                    const restaurantId = getRestaurantId();
                    const response = await api.get(
                        `/restaurants/${restaurantId}/reports/summary`,
                        {
                            params: getCurrentYearFilters(),
                        }
                    );
                    const topFoodsResponse = await api.get(
                        `/restaurants/${restaurantId}/reports/top-foods`,
                        {
                            params: {
                                ...getCurrentYearFilters(),
                                limit: 10,
                            },
                        }
                    );
                    const dailyRevenueResponse = await api.get(
                        `/restaurants/${restaurantId}/reports/daily-revenue`,
                        {
                            params: getCurrentYearFilters(),
                        }
                    );
                    const dailyOrdersResponse = await api.get(
                        `/restaurants/${restaurantId}/reports/daily-orders`,
                        {
                            params: getCurrentYearFilters(),
                        }
                    );

                    setRestaurantSummaries([
                        {
                            restaurant: response.data?.restaurant,
                            summary: response.data,
                        },
                    ]);
                    const fallbackTopFoods = getList(topFoodsResponse.data).map(
                        (item) => normalizeTopFood(item, response.data?.restaurant)
                    );

                    if (fallbackTopFoods.length) {
                        setTopFoods(fallbackTopFoods.slice(0, 10));
                    } else {
                        const queueResponse = await api.get("/kitchen/queue", {
                            params: { restaurant_id: restaurantId },
                        });

                        setTopFoods(
                            buildTopFoodsFromOrders(
                                getList(queueResponse.data),
                                response.data?.restaurant
                            )
                                .sort((a, b) => b.orders - a.orders)
                                .slice(0, 10)
                        );
                    }
                    setDailyRevenue(
                        getList(dailyRevenueResponse.data).map(normalizeDailyRevenue)
                    );
                    setDailyOrders(
                        getList(dailyOrdersResponse.data).map(normalizeDailyOrders)
                    );
                } catch (fallbackError) {
                    setSummaryError(
                        fallbackError.response?.data?.message ||
                            error.response?.data?.message ||
                            "Unable to load dashboard revenue"
                    );
                }
            } finally {
                setSummaryLoading(false);
            }
        };

        fetchSummary();
    }, []);

    const earnings = useMemo(
        () =>
            restaurantSummaries
                .map(({ restaurant, summary }) => ({
                    restaurant:
                        summary?.restaurant?.name ||
                        restaurant?.name ||
                        `Restaurant #${restaurant?.id ?? ""}`,
                    orders: Number(summary?.orders?.total ?? 0),
                    revenueValue: Number(summary?.revenue?.total ?? 0),
                    revenue: formatCurrency(summary?.revenue?.total),
                }))
                .sort((a, b) => b.revenueValue - a.revenueValue),
        [restaurantSummaries]
    );
    const totalRevenueValue = earnings.reduce(
        (total, item) => total + item.revenueValue,
        0
    );
    const totalOrders = earnings.reduce((total, item) => total + item.orders, 0);
    const topRestaurant = earnings[0];
    const activeRestaurants = earnings.filter((item) => item.revenueValue > 0).length;
    const maxRevenue = Math.max(...earnings.map((item) => item.revenueValue), 1);
    const maxFoodOrders = Math.max(...topFoods.map((item) => item.orders), 1);

    const stats = [
        {
            title: "Total Revenue",
            value: summaryLoading ? "Loading..." : formatCurrency(totalRevenueValue),
            helper: "Across all restaurants",
            icon: DollarSign,
            accent: "border-emerald-400/35 bg-emerald-400/10 text-emerald-300",
        },
        {
            title: "Total Orders",
            value: summaryLoading ? "Loading..." : totalOrders,
            helper: "Orders in selected period",
            icon: ShoppingBag,
            accent: "border-sky-400/35 bg-sky-400/10 text-sky-300",
        },
        {
            title: "Top Restaurant",
            value: summaryLoading
                ? "Loading..."
                : topRestaurant?.restaurant || "No revenue yet",
            helper: topRestaurant ? topRestaurant.revenue : "Waiting for sales",
            icon: Trophy,
            accent: "border-[#FFD166]/35 bg-[#FFD166]/10 text-[#FFD166]",
        },
        {
            title: "Active Restaurants",
            value: summaryLoading ? "Loading..." : `${activeRestaurants}/${earnings.length}`,
            helper: "Restaurants with revenue",
            icon: Store,
            accent: "border-[#7F1D1D]/35 bg-[#7F1D1D]/10 text-[#7F1D1D]",
        },
    ];
    const titleText = isLight ? "text-[#241815]" : "text-white";
    const mutedText = isLight ? "text-[#6B5A52]" : "text-white/48";
    const softText = isLight ? "text-[#7A6A64]" : "text-white/52";
    const tinyLabelText = isLight ? "text-[#7A6A64]" : "text-white/42";
    const rowSurface = isLight
        ? "border-[#E4CFC3] bg-[#FFF9F2] hover:border-[#7F1D1D]/28 hover:bg-[#FFF4EA]"
        : "border-white/10 bg-[#172124] hover:border-[#7F1D1D]/30 hover:bg-[#1C2A2F]";
    const emptySurface = isLight
        ? "border-[#E4CFC3] bg-[#FFF9F2] text-[#7A6A64]"
        : "border-white/14 bg-[#172124] text-white/45";
    const getStatValueClass = (title) =>
        title === "Top Restaurant"
            ? `mt-3 line-clamp-2 text-3xl font-black leading-tight sm:text-[2.15rem] ${titleText}`
            : `mt-3 truncate text-4xl font-black leading-none tabular-nums sm:text-[2.65rem] ${titleText}`;
    const cardFrame =
        "rounded-[22px] border border-white/10 shadow-[0_22px_55px_rgba(0,0,0,0.24)] ring-1 ring-white/[0.03]";
    const cardSurface =
        `${cardFrame} ${
            isLight
                ? "border-[#E4CFC3] bg-[#FFF9F2] shadow-[0_18px_44px_rgba(70,45,30,0.10)]"
                : "bg-[linear-gradient(145deg,rgba(36,49,53,0.96),rgba(25,36,39,0.94))]"
        }`;

    return (
        <div className={`min-h-full overflow-y-auto p-4 sm:p-6 lg:p-8 ${isLight ? "bg-[#FBF6EF] text-[#241815]" : "bg-[linear-gradient(145deg,#0A1012_0%,#111A1D_46%,#25171B_100%)] text-white"}`}>
            <div className="mx-auto max-w-[1500px]">
                <section className={`${cardSurface} mb-6 overflow-hidden rounded-[26px] p-5 backdrop-blur-sm sm:p-6`}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="admin-dashboard-hero-eyebrow text-xs font-black uppercase tracking-[0.18em] text-[#FFD166]">
                                Admin overview
                            </p>
                            <h1 className={`mt-2 text-4xl font-black sm:text-5xl ${titleText}`}>
                                Dashboard
                            </h1>
                            <p className={`mt-2 max-w-2xl text-base font-medium ${mutedText}`}>
                                Live revenue, orders, and restaurant performance for the current year.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:flex">
                            <div className={`rounded-2xl border px-4 py-3 ${isLight ? "border-[#E4CFC3] bg-[#FFF4EA]" : "border-white/10 bg-white/[0.07]"}`}>
                                <p className={`text-xs font-bold ${tinyLabelText}`}>Period</p>
                                <p className={`mt-1 text-base font-black ${titleText}`}>
                                    {getCurrentYearFilters().from} to {getCurrentYearFilters().to}
                                </p>
                            </div>
                            <div className={`rounded-2xl border px-4 py-3 ${isLight ? "border-[#E4CFC3] bg-[#FFF4EA]" : "border-white/10 bg-white/[0.07]"}`}>
                                <p className={`text-xs font-bold ${tinyLabelText}`}>Restaurants</p>
                                <p className={`mt-1 text-2xl font-black tabular-nums ${titleText}`}>
                                    {summaryLoading ? "Loading..." : earnings.length}
                                </p>
                            </div>
                        </div>
                    </div>

                    {summaryError && (
                        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#7F1D1D]/30 bg-[#7F1D1D]/10 px-4 py-3 text-sm font-bold text-[#7F1D1D]">
                            <AlertCircle size={18} className="mt-0.5 shrink-0" />
                            <span>{summaryError}</span>
                        </div>
                    )}
                </section>

                <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((card) => {
                        const Icon = card.icon;

                        return (
                            <article
                                key={card.title}
                                className={`${cardSurface} p-5 transition duration-200 hover:-translate-y-1 ${isLight ? "hover:border-[#7F1D1D]/28 hover:bg-[#FFF4EA]" : "hover:border-white/18 hover:bg-[#253236]"}`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className={`text-xs font-black uppercase tracking-[0.12em] ${tinyLabelText}`}>
                                            {card.title}
                                        </p>
                                        <h2 className={getStatValueClass(card.title)}>
                                            {card.value}
                                        </h2>
                                    </div>
                                    <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border ${card.accent}`}>
                                        <Icon size={23} />
                                    </div>
                                </div>
                                <p className={`mt-5 text-sm font-semibold ${softText}`}>
                                    {card.helper}
                                </p>
                            </article>
                        );
                    })}
                </section>

                <section className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
                    <div className={`${cardSurface} p-5`}>
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <h2 className={`text-2xl font-black ${titleText}`}>Daily Revenue</h2>
                                <p className={`text-sm font-medium ${mutedText}`}>
                                    Revenue grouped by day
                                </p>
                            </div>
                        </div>
                        <div className="h-[320px]">
                            <WeeklyOrdersChart
                                items={dailyRevenue}
                                valueKey="revenue"
                                label="Revenue"
                                valuePrefix="$"
                                color="#7DD3C7"
                                variant="line"
                                theme={isLight ? "light" : "dark"}
                            />
                        </div>
                    </div>

                    <div className={`${cardSurface} p-5`}>
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <h2 className={`text-2xl font-black ${titleText}`}>Daily Orders</h2>
                                <p className={`text-sm font-medium ${mutedText}`}>
                                    Orders grouped by day
                                </p>
                            </div>
                        </div>
                        <div className="h-[320px]">
                            <WeeklyOrdersChart
                                items={dailyOrders}
                                valueKey="totalOrders"
                                label="Orders"
                                valuePrefix=""
                                color="#14B8A6"
                                theme={isLight ? "light" : "dark"}
                            />
                        </div>
                    </div>

                    <div className={`${cardSurface} p-5`}>
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <h2 className={`text-2xl font-black ${titleText}`}>Revenue Share</h2>
                                <p className={`text-sm font-medium ${mutedText}`}>
                                    Split by restaurant
                                </p>
                            </div>
                        </div>
                        <div className="h-[320px]">
                            <PieChart items={earnings} theme={isLight ? "light" : "dark"} />
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                    <div className={`flex h-[520px] min-h-0 flex-col ${cardSurface} p-5`}>
                        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h2 className={`text-2xl font-black ${titleText}`}>Restaurant Earnings</h2>
                                <p className={`text-sm font-medium ${mutedText}`}>
                                    Ranked by revenue
                                </p>
                            </div>
                            <p className="text-3xl font-black tabular-nums text-emerald-300">
                                {formatCurrency(totalRevenueValue)}
                            </p>
                        </div>

                        <div className="admin-dashboard-scroll min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                            {summaryLoading ? (
                                <div className={`rounded-2xl border border-dashed p-5 text-sm font-bold ${emptySurface}`}>
                                    Loading restaurant revenue...
                                </div>
                            ) : earnings.length ? (
                                earnings.map((item, index) => {
                                    const percent = Math.round(
                                        (item.revenueValue / maxRevenue) * 100
                                    );

                                    return (
                                        <div
                                            key={item.restaurant}
                                            className={`rounded-2xl border p-4 transition duration-200 ${rowSurface}`}
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[linear-gradient(135deg,#9B2C2C_0%,#7F1D1D_48%,#4E1515_100%)] text-xl font-black tabular-nums text-white shadow-[0_10px_24px_rgba(127,29,29,0.22)]">
                                                        {index + 1}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className={`truncate text-lg font-black ${titleText}`}>
                                                            {item.restaurant}
                                                        </p>
                                                        <p className={`text-sm font-bold ${mutedText}`}>
                                                            {item.orders} orders
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="shrink-0 text-2xl font-black tabular-nums text-emerald-300">
                                                    {item.revenue}
                                                </span>
                                            </div>
                                            <div className={`mt-4 h-3 overflow-hidden rounded-full ${isLight ? "bg-[#F0E1D8]" : "bg-white/10"}`}>
                                                <div
                                                    className="h-full rounded-full bg-[linear-gradient(90deg,#9B2C2C_0%,#7F1D1D_48%,#4E1515_100%)] shadow-[0_0_18px_rgba(127,29,29,0.20)]"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className={`rounded-2xl border border-dashed p-5 text-sm font-bold ${emptySurface}`}>
                                    No restaurant earnings available yet.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={`flex h-[520px] min-h-0 flex-col ${cardSurface} p-5`}>
                        <div className="mb-5 shrink-0">
                            <h2 className={`text-2xl font-black ${titleText}`}>Top Foods</h2>
                            <p className={`text-sm font-medium ${mutedText}`}>
                                Most ordered items, limit 10
                            </p>
                        </div>

                        <div className="admin-dashboard-scroll min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                            {summaryLoading ? (
                                <div className={`rounded-2xl border border-dashed p-5 text-sm font-bold ${emptySurface}`}>
                                    Loading top foods...
                                </div>
                            ) : topFoods.length ? (
                                topFoods.map((item, index) => {
                                    const percent = Math.round(
                                        (item.orders / maxFoodOrders) * 100
                                    );

                                    return (
                                        <div
                                            key={`${item.restaurant}-${item.id}-${index}`}
                                            className={`rounded-2xl border p-4 ${isLight ? "border-[#E4CFC3] bg-[#FFF9F2]" : "border-white/10 bg-[#172124]"}`}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#FFD166]/30 bg-[linear-gradient(135deg,rgba(255,225,132,0.18)_0%,rgba(255,193,66,0.13)_52%,rgba(177,112,0,0.18)_100%)] text-[#FFE184] shadow-[0_10px_24px_rgba(255,193,66,0.14)]">
                                                        <Flame size={20} />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className={`truncate text-base font-black ${titleText}`}>
                                                            {index + 1}. {item.name}
                                                        </p>
                                                        <p className={`truncate text-sm font-bold ${mutedText}`}>
                                                            {item.restaurant}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="shrink-0 bg-[linear-gradient(180deg,#FFE184_0%,#FFC142_48%,#C47A00_100%)] bg-clip-text text-2xl font-black tabular-nums text-transparent">
                                                    {item.orders}
                                                </span>
                                            </div>
                                            <div className={`mt-4 h-2.5 overflow-hidden rounded-full ${isLight ? "bg-[#F0E1D8]" : "bg-white/10"}`}>
                                                <div
                                                    className="h-full rounded-full bg-[linear-gradient(90deg,#FFE184_0%,#FFC142_52%,#C47A00_100%)] shadow-[0_0_18px_rgba(255,193,66,0.18)]"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className={`rounded-2xl border border-dashed p-5 text-sm font-bold ${emptySurface}`}>
                                    No top foods available for this period.
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default MainContent;
