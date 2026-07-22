import {
    AlertCircle,
    CircleDollarSign,
    Ellipsis,
    Flame,
    ShoppingBag,
    Store,
    Trophy,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../../API/axios";
import { useTheme } from "../../context/ThemeContext";
import { getStoredUser } from "../../utils/auth";
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
    if (Array.isArray(data?.data?.restaurants)) return data.data.restaurants;
    if (Array.isArray(data?.top_foods)) return data.top_foods;
    if (Array.isArray(data?.topFoods)) return data.topFoods;
    if (Array.isArray(data?.data?.top_foods)) return data.data.top_foods;
    if (Array.isArray(data?.data?.topFoods)) return data.data.topFoods;
    if (Array.isArray(data?.foods)) return data.foods;
    if (Array.isArray(data?.data?.foods)) return data.data.foods;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data?.items)) return data.data.items;
    if (Array.isArray(data?.order_items)) return data.order_items;
    if (Array.isArray(data?.data?.order_items)) return data.data.order_items;
    if (Array.isArray(data?.orderItems)) return data.orderItems;
    if (Array.isArray(data?.data?.orderItems)) return data.data.orderItems;
    if (Array.isArray(data?.details)) return data.details;
    if (Array.isArray(data?.data?.details)) return data.data.details;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.orders)) return data.orders;
    if (Array.isArray(data?.queue)) return data.queue;
    if (Array.isArray(data?.data?.orders)) return data.data.orders;
    if (Array.isArray(data?.data?.queue)) return data.data.queue;
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

function formatShortPeriod() {
    const year = new Date().getFullYear();

    return `Jan 01 - Dec 31, ${year}`;
}

function getDisplayDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value || "Today";

    return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
    });
}

function MiniBars({ color = "#42d09f" }) {
    return (
        <div className="flex h-10 items-end gap-1">
            {[18, 25, 31, 40, 48].map((height) => (
                <span
                    key={height}
                    className="w-1.5 rounded-t-full opacity-75"
                    style={{ height, backgroundColor: color }}
                />
            ))}
        </div>
    );
}

function OrdersBar({ items = [] }) {
    const latest = items[items.length - 1];
    const orderCount = Number(latest?.totalOrders || 0);
    const height = orderCount > 0 ? 164 : 160;

    return (
        <div className="flex h-full flex-col">
            <div className="relative mx-auto flex min-h-[220px] w-full max-w-[290px] flex-1 items-end justify-center px-8 pb-8 pt-12">
                <div className="absolute inset-x-8 top-[42%] border-t border-white/10" />
                <div className="absolute inset-x-8 top-[58%] border-t border-white/10" />
                <div className="absolute inset-x-8 top-[74%] border-t border-white/10" />
                <div className="relative z-10 flex flex-col items-center">
                    <div className="mb-4 rounded-lg bg-[#4fd99d] px-4 py-3 text-lg font-black text-[#07120f] shadow-[0_16px_34px_rgba(79,217,157,0.24)]">
                        {orderCount}
                    </div>
                    <div
                        className="w-20 rounded-t-[38px] bg-[linear-gradient(180deg,#54dda4_0%,#50d99d_52%,#45c98f_100%)] shadow-[0_22px_42px_rgba(79,217,157,0.22)]"
                        style={{ height }}
                    />
                    <span className="mt-5 text-sm font-black text-white">
                        {latest ? getDisplayDate(latest.date) : getDisplayDate(new Date())}
                    </span>
                </div>
            </div>
            <div className="border-t border-white/10 pt-6 text-center text-xs font-semibold uppercase tracking-[0.16em] text-[#8f887c]">
                Last 24 hours performance
            </div>
        </div>
    );
}

function RevenueDonut({ items = [], total = 0 }) {
    const colors = ["#b30d0d", "#078a12", "#dfbd34", "#4267ac", "#b76fff", "#8b929c"];
    const positiveItems = items.length ? items : [];
    const safeTotal = positiveItems.reduce((sum, item) => sum + Math.max(Number(item.revenueValue || 0), 0), 0);
    let cursor = 0;
    const gradient = positiveItems.length
        ? positiveItems
              .map((item, index) => {
                  const value = Math.max(Number(item.revenueValue || 0), 0);
                  const start = cursor;
                  const end = safeTotal ? cursor + (value / safeTotal) * 100 : cursor + 100 / positiveItems.length;
                  cursor = end;
                  return `${colors[index % colors.length]} ${start}% ${end}%`;
              })
              .join(", ")
        : "#b30d0d 0% 33%, #078a12 33% 66%, #dfbd34 66% 100%";

    const legendItems = positiveItems.length
        ? positiveItems.slice(0, 3)
        : [
              { restaurant: "Burger Station", revenueValue: 1 },
              { restaurant: "Italian Corner", revenueValue: 1 },
              { restaurant: "Levant Grill", revenueValue: 1 },
          ];
    const legendTotal = legendItems.reduce((sum, item) => sum + Math.max(Number(item.revenueValue || 0), 0), 0) || legendItems.length;

    return (
        <div className="flex h-full flex-col justify-between">
            <div className="flex flex-1 items-center justify-center">
                <div
                    className="grid h-48 w-48 place-items-center rounded-full shadow-[0_18px_44px_rgba(0,0,0,0.26)]"
                    style={{ background: `conic-gradient(${gradient})` }}
                >
                    <div className="grid h-32 w-32 place-items-center rounded-full bg-[#111111] text-center">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8f887c]">
                                Total
                            </p>
                            <p className="mt-2 text-lg font-black text-white">
                                {formatCurrency(total)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="space-y-4">
                {legendItems.map((item, index) => (
                    <div key={`${item.restaurant}-${index}`} className="flex items-center justify-between gap-4 text-sm font-black">
                        <span className="flex min-w-0 items-center gap-3 text-[#ddd5c6]">
                            <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_16px_currentColor]"
                                style={{ backgroundColor: colors[index % colors.length], color: colors[index % colors.length] }}
                            />
                            <span className="truncate">{item.restaurant}</span>
                        </span>
                        <span className="text-white">
                            {Math.round((Math.max(Number(item.revenueValue || 0), 0) / legendTotal) * 1000) / 10}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function getTopFoodOrderCount(item, food) {
    return Number(
        item?.total_sold ??
            item?.sold ??
            item?.totalSold ??
            item?.soldQuantity ??
            item?.sold_quantity ??
            item?.sold_qty ??
            item?.sales_count ??
            item?.salesCount ??
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
            item?.quantitySold ??
            item?.amount_sold ??
            item?.amountSold ??
            item?.units_sold ??
            item?.unitsSold ??
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
    const food =
        item?.food ||
        item?.menu_item ||
        item?.menuItem ||
        item?.product ||
        item?.item ||
        item;

    return {
        id:
            item?.food_id ??
            item?.foodId ??
            item?.menu_item_id ??
            item?.menuItemId ??
            food?.id ??
            item?.id,
        name:
            item?.food_name ||
            item?.foodName ||
            item?.menu_item_name ||
            item?.menuItemName ||
            food?.name ||
            food?.title ||
            item?.name ||
            item?.title ||
            (item?.food_id ? `Food #${item.food_id}` : "Food item"),
        restaurant:
            restaurant?.name ||
            item?.restaurant?.name ||
            item?.restaurant_name ||
            item?.restaurantName ||
            "Restaurant",
        orders: getTopFoodOrderCount(item, food),
    };
}

function getOrderItems(order) {
    const candidates = [
        order?.items,
        order?.order_items,
        order?.orderItems,
        order?.details,
        order?.order_details,
        order?.orderDetails,
        order?.restaurant_order_items,
        order?.restaurantOrderItems,
        order?.foods,
        order?.food_items,
        order?.foodItems,
        order?.order?.items,
        order?.order?.order_items,
        order?.order?.orderItems,
        order?.cashier_order?.items,
        order?.cashier_order?.order_items,
        order?.cashierOrder?.items,
        order?.cashierOrder?.orderItems,
        order?.restaurant_order?.items,
        order?.restaurant_order?.order_items,
        order?.restaurantOrder?.items,
        order?.restaurantOrder?.orderItems,
        order?.restaurant_invoice?.items,
        order?.restaurantInvoice?.items,
    ];

    return candidates.flatMap(getList);
}

function buildTopFoodsFromOrders(orders, restaurant) {
    const foodCounts = new Map();

    const addItem = (item, fallbackRestaurant) => {
            const food =
                item?.food ||
                item?.menu_item ||
                item?.menuItem ||
                item?.product ||
                item?.item ||
                item;
            const id =
                item?.food_id ??
                item?.foodId ??
                item?.menu_item_id ??
                item?.menuItemId ??
                food?.id ??
                item?.id;
            const name =
                food?.name ||
                food?.title ||
                item?.food_name ||
                item?.foodName ||
                item?.menu_item_name ||
                item?.menuItemName ||
                item?.name ||
                item?.title ||
                (id ? `Food #${id}` : "Food item");
            const quantity = Number(
                item?.quantity ??
                    item?.qty ??
                    item?.count ??
                    item?.pivot?.quantity ??
                    item?.pivot?.count ??
                    1
            );
            const restaurantName =
                fallbackRestaurant?.name ||
                item?.restaurant?.name ||
                item?.restaurant_name ||
                item?.restaurantName ||
                restaurant?.name ||
                "Restaurant";
            const key = `${id ?? name}`;
            const current = foodCounts.get(key) || {
                id,
                name,
                restaurant: restaurantName,
                orders: 0,
            };

            current.orders += Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
            foodCounts.set(key, current);
    };

    orders.forEach((order) => {
        getList(getOrderItems(order)).forEach((item) => {
            addItem(item, order?.restaurant);
        });

        getList(order?.restaurant_orders || order?.restaurantOrders).forEach((restaurantOrder) => {
            getList(getOrderItems(restaurantOrder)).forEach((item) => {
                addItem(item, restaurantOrder?.restaurant || order?.restaurant);
            });
        });
    });

    return Array.from(foodCounts.values()).filter((food) => food.orders > 0);
}

async function fetchTopFoodsFallback(restaurant) {
    const [queueResponse, cashierResponse] = await Promise.allSettled([
        api.get("/kitchen/queue", {
            params: restaurant?.id ? { restaurant_id: restaurant.id } : undefined,
        }),
        api.get("/cashier/orders", {
            params: restaurant?.id ? { restaurant_id: restaurant.id } : undefined,
        }),
    ]);
    const queueOrders =
        queueResponse.status === "fulfilled" ? getList(queueResponse.value.data) : [];
    const cashierOrders =
        cashierResponse.status === "fulfilled" ? getList(cashierResponse.value.data) : [];

    return buildTopFoodsFromOrders([...queueOrders, ...cashierOrders], restaurant);
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
    const [isRevenueInfoOpen, setIsRevenueInfoOpen] = useState(false);
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

            return fetchTopFoodsFallback(restaurant);
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
                    const fallbackRestaurant = response.data?.restaurant || {
                        id: restaurantId,
                    };

                    if (fallbackTopFoods.length) {
                        setTopFoods(fallbackTopFoods.slice(0, 10));
                    } else {
                        setTopFoods(
                            (await fetchTopFoodsFallback(fallbackRestaurant))
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
    const restaurantCount = earnings.length;
    const maxRevenue = Math.max(...earnings.map((item) => item.revenueValue), 1);
    const maxFoodOrders = Math.max(...topFoods.map((item) => item.orders), 1);
    const stats = [
        {
            title: "Total Revenue",
            value: summaryLoading ? "Loading..." : formatCurrency(totalRevenueValue),
            helper: "+12.5%",
            suffix: "vs prev.",
            icon: CircleDollarSign,
            accent: "border-[#1cb782]/45 bg-[#0d3a2d] text-[#4fd99d]",
            graph: <MiniBars color="#42d09f" />,
        },
        {
            title: "Total Orders",
            value: summaryLoading ? "Loading..." : totalOrders,
            helper: "+3.2%",
            suffix: "vs prev.",
            icon: ShoppingBag,
            accent: "border-[#8795c7]/35 bg-[#202436] text-[#b9c6ff]",
            graph: <MiniBars color="#8795c7" />,
        },
        {
            title: "Top Unit",
            value: summaryLoading
                ? "Loading..."
                : topRestaurant?.restaurant || "No revenue yet",
            helper: topRestaurant ? topRestaurant.revenue : "$0.00",
            suffix: "Leading overall sales",
            icon: Trophy,
            accent: "border-[#d7b52f]/35 bg-[#30290f] text-[#d7b52f]",
        },
        {
            title: "Active Restaurants",
            value: summaryLoading ? "Loading..." : `${restaurantCount}/${restaurantCount}`,
            helper: "Registered operating units",
            suffix: "",
            icon: Store,
            accent: "border-[#d76666]/35 bg-[#321616] text-[#ff9999]",
        },
    ];
    const cardSurface =
        "dashboard-dark-card rounded-[14px] border border-white/10 bg-[linear-gradient(90deg,#111111_0%,#141414_52%,#101010_100%)] shadow-[0_18px_44px_rgba(0,0,0,0.22)]";
    const panelSurface =
        "dashboard-dark-card rounded-[14px] border border-white/10 bg-[linear-gradient(90deg,#111111_0%,#131313_52%,#101010_100%)] shadow-[0_18px_44px_rgba(0,0,0,0.18)]";
    return (
        <div className="admin-dashboard-page admin-rich-page min-h-full overflow-y-auto p-5 text-white sm:p-7 lg:p-10">
            <div className="mx-auto max-w-[1500px]">
                <section className="mb-7">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div>
                            <p className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.42em] text-[#d7b52f]">
                                Admin Overview
                                <span className="rounded-full border border-[#2fc78d]/40 bg-[#123529] px-3 py-1 text-[10px] tracking-normal text-[#59e3a8]">
                                    Live
                                </span>
                            </p>
                            <h1 className="mt-3 flex items-center gap-3 font-merriweather text-4xl font-black leading-none text-white sm:text-5xl">
                                Dashboard
                                <span className="h-3 w-3 rounded-full bg-[#59e3a8]" />
                            </h1>
                            <p className="mt-4 max-w-2xl text-base font-semibold text-[#9b9388]">
                                Unified restaurant performance analytics for fiscal year {new Date().getFullYear()}.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 sm:flex">
                            <div className="dashboard-light-tile rounded-[10px] border border-white/10 bg-[#121212] px-6 py-5">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8f887c]">
                                    Reporting Period
                                </p>
                                <p className="mt-2 whitespace-nowrap text-base font-black text-white">
                                    {formatShortPeriod()}
                                </p>
                            </div>
                            <div className="dashboard-light-tile rounded-[10px] border border-white/10 bg-[#121212] px-9 py-5 text-center">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8f887c]">
                                    Units
                                </p>
                                <p className="mt-2 text-3xl font-black tabular-nums text-[#d7b52f]">
                                    {summaryLoading ? "Loading..." : earnings.length}
                                </p>
                            </div>
                        </div>
                    </div>

                    {summaryError && (
                        <div className="mt-5 flex items-start gap-3 rounded-[10px] border border-[#7F1D1D]/30 bg-[#7F1D1D]/10 px-4 py-3 text-sm font-bold text-[#ff9999]">
                            <AlertCircle size={18} className="mt-0.5 shrink-0" />
                            <span>{summaryError}</span>
                        </div>
                    )}
                </section>

                <section className="mb-7 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((card) => {
                        const Icon = card.icon;

                        return (
                            <article
                                key={card.title}
                                className={`${cardSurface} min-h-[210px] overflow-hidden p-7 transition duration-200 hover:-translate-y-1 hover:border-white/20`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8f887c]">
                                            {card.title}
                                        </p>
                                        <h2 className={`mt-5 ${card.title === "Top Unit" ? "line-clamp-2 text-2xl" : "truncate font-merriweather text-4xl"} font-black leading-tight text-white`}>
                                            {card.value}
                                        </h2>
                                    </div>
                                    <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-[10px] border ${card.accent}`}>
                                        <Icon size={24} />
                                    </div>
                                </div>
                                {card.title === "Active Restaurants" ? (
                                    <>
                                        <div className="mt-9 flex items-center gap-3">
                                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/15">
                                                <div
                                                    className="h-full rounded-full bg-[#ff9999]"
                                                    style={{
                                                        width: `${restaurantCount ? 100 : 0}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="text-sm font-black text-white">
                                                {restaurantCount ? 100 : 0}%
                                            </span>
                                        </div>
                                        <p className="mt-5 text-sm font-semibold text-[#8f887c]">
                                            {card.helper}
                                        </p>
                                    </>
                                ) : (
                                    <div className="mt-10 flex items-end justify-between gap-4">
                                        <p className="text-sm font-semibold text-[#d9d1c5]">
                                            <span className={card.title === "Total Orders" ? "text-[#b9c6ff]" : "text-[#59e3a8]"}>
                                                {card.helper}
                                            </span>{" "}
                                            {card.suffix}
                                        </p>
                                        {card.graph}
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </section>

                <section className="mb-7 grid grid-cols-1 gap-7 xl:grid-cols-3">
                    <div className={`${panelSurface} relative min-h-[500px] p-8`}>
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-2xl font-black text-white">Daily Revenue</h2>
                                <p className="mt-2 text-sm font-semibold text-[#8f887c]">
                                    Trend analysis by day
                                </p>
                            </div>
                            <button
                                type="button"
                                aria-label="Daily revenue details"
                                onClick={() => setIsRevenueInfoOpen((value) => !value)}
                                className="grid h-9 w-9 place-items-center rounded-[8px] text-[#8f887c] transition hover:bg-white/10 hover:text-[#d7b52f]"
                            >
                                <Ellipsis size={22} />
                            </button>
                        </div>
                        {isRevenueInfoOpen && (
                            <div className="dashboard-info-popover absolute right-6 top-24 z-30 max-w-[260px] rounded-[10px] border border-white/10 bg-[#151515] p-4 text-sm font-semibold leading-6 text-white shadow-[0_18px_44px_rgba(0,0,0,0.28)]">
                                Shows total revenue grouped by day for the selected reporting period. Use it to spot daily sales peaks and slow days.
                            </div>
                        )}
                        <div className="h-[365px]">
                            <WeeklyOrdersChart
                                items={dailyRevenue}
                                valueKey="revenue"
                                label="Revenue"
                                valuePrefix="$"
                                color="#22C55E"
                                variant="line"
                                theme={isLight ? "light" : "dark"}
                            />
                        </div>
                    </div>

                    <div className={`${panelSurface} min-h-[500px] p-8`}>
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-2xl font-black text-white">Daily Orders</h2>
                                <p className="mt-2 text-sm font-semibold text-[#8f887c]">
                                    Volume tracking
                                </p>
                            </div>
                            <span className="rounded-md border border-[#2fc78d]/35 bg-[#123529] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#59e3a8]">
                                Realtime
                            </span>
                        </div>
                        <div className="h-[365px]">
                            <OrdersBar items={dailyOrders} />
                        </div>
                    </div>

                    <div className={`${panelSurface} min-h-[500px] p-8`}>
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-2xl font-black text-white">Revenue Share</h2>
                                <p className="mt-2 text-sm font-semibold text-[#8f887c]">
                                    Competitive split
                                </p>
                            </div>
                        </div>
                        <div className="h-[365px]">
                            <RevenueDonut items={earnings} total={totalRevenueValue} />
                        </div>
                    </div>
                </section>

                <section className="mb-7 grid grid-cols-1 gap-7 xl:grid-cols-[1.2fr_0.8fr]">
                    <div className={`${panelSurface} min-h-[440px] p-7`}>
                        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8f887c]">
                                    Financial ranking
                                </p>
                                <h2 className="mt-2 text-2xl font-black text-white">
                                    Restaurant Earnings
                                </h2>
                            </div>
                            <p className="text-3xl font-black tabular-nums text-[#59e3a8]">
                                {formatCurrency(totalRevenueValue)}
                            </p>
                        </div>

                        <div className="admin-dashboard-scroll max-h-[330px] space-y-3 overflow-y-auto pr-1">
                            {summaryLoading ? (
                                <div className="rounded-[10px] border border-dashed border-white/15 bg-white/[0.04] p-5 text-sm font-bold text-[#8f887c]">
                                    Loading restaurant revenue...
                                </div>
                            ) : earnings.length ? (
                                earnings.map((item, index) => {
                                    const percent = Math.round((item.revenueValue / maxRevenue) * 100);

                                    return (
                                        <div
                                            key={item.restaurant}
                                            className="rounded-[10px] border border-white/10 bg-white/[0.04] p-4 transition hover:border-[#d7b52f]/35 hover:bg-white/[0.06]"
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex min-w-0 items-center gap-4">
                                                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[8px] bg-[#d7b52f] text-lg font-black tabular-nums text-[#16120a]">
                                                        {index + 1}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-base font-black text-white">
                                                            {item.restaurant}
                                                        </p>
                                                        <p className="mt-1 text-sm font-semibold text-[#8f887c]">
                                                            {item.orders} orders
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="shrink-0 text-xl font-black tabular-nums text-[#59e3a8]">
                                                    {item.revenue}
                                                </span>
                                            </div>
                                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                                                <div
                                                    className="h-full rounded-full bg-[linear-gradient(90deg,#d7b52f_0%,#59e3a8_100%)]"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="rounded-[10px] border border-dashed border-white/15 bg-white/[0.04] p-5 text-sm font-bold text-[#8f887c]">
                                    No restaurant earnings available yet.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={`${panelSurface} min-h-[440px] p-7`}>
                        <div className="mb-6">
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8f887c]">
                                Menu demand
                            </p>
                            <h2 className="mt-2 text-2xl font-black text-white">
                                Top Foods
                            </h2>
                        </div>

                        <div className="admin-dashboard-scroll max-h-[330px] space-y-3 overflow-y-auto pr-1">
                            {summaryLoading ? (
                                <div className="rounded-[10px] border border-dashed border-white/15 bg-white/[0.04] p-5 text-sm font-bold text-[#8f887c]">
                                    Loading top foods...
                                </div>
                            ) : topFoods.length ? (
                                topFoods.map((item, index) => {
                                    const percent = Math.round((item.orders / maxFoodOrders) * 100);

                                    return (
                                        <div
                                            key={`${item.restaurant}-${item.id}-${index}`}
                                            className="rounded-[10px] border border-white/10 bg-white/[0.04] p-4"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] border border-[#d7b52f]/35 bg-[#30290f] text-[#d7b52f]">
                                                        <Flame size={18} />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-black text-white">
                                                            {index + 1}. {item.name}
                                                        </p>
                                                        <p className="mt-1 truncate text-xs font-semibold text-[#8f887c]">
                                                            {item.restaurant}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="shrink-0 text-xl font-black tabular-nums text-[#d7b52f]">
                                                    {item.orders}
                                                </span>
                                            </div>
                                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                                                <div
                                                    className="h-full rounded-full bg-[#d7b52f]"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="rounded-[10px] border border-dashed border-white/15 bg-white/[0.04] p-5 text-sm font-bold text-[#8f887c]">
                                    No top foods available for this period.
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <div className="mt-24 flex flex-col gap-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#4f4a43] sm:flex-row sm:items-center sm:justify-between">
                    <span>Big-4 Enterprise Suite v4.2.5_e</span>
                    <span>© {new Date().getFullYear()} Midnight Reserve Ops</span>
                </div>
            </div>
        </div>
    );
}

export default MainContent;
