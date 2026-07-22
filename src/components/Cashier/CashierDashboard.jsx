import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CatalogOrders from "./CatalogOrders";
import MenuItemCard from "./MenuItem";
import OrderSidebar from "./OrderSidebar";
import PickupOrders from "./PickupOrders";
import ProductModal from "./ProductModal";
import RightSidebar from "./RightSidebar";
import TopBar from "./TopBar";
import api from "../../API/axios";
import RestaurantsManagements from "../Admin/RestaurantsManagements";
import TablesManagements from "../Admin/TablesManagements";
import Warehouse from "../Warehouse/Warehouse";
import StockActions from "../Warehouse/StockAction";
import LowStock from "../Warehouse/LowStock";
import WaiterDashboard from "../Waiter/WaiterDashboard";
import { getStoredUser, storeUser } from "../../utils/auth";
import { ensureCurrentRestaurantId } from "../../utils/restaurant";
import {
    getProfileUserPermissions,
    getUserPermissions,
    toPermissionKeys,
} from "../../utils/permissions";
import { BookOpen, House, ReceiptText, ShieldAlert, Store } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const REPORTS_BACKGROUND =
    "bg-[radial-gradient(circle_at_86%_12%,rgba(127,29,29,0.14),transparent_30%),radial-gradient(circle_at_16%_22%,rgba(255,209,102,0.10),transparent_26%),linear-gradient(145deg,#0D1214_0%,#12191C_54%,#211619_100%)]";
const CASHIER_VIEW_IDS = new Set([
    "menu",
    "catalog",
    "orders",
    "serveOrders",
    "inventory",
    "stockActions",
    "lowStock",
    "tables",
    "restaurants",
]);

const getList = (data) => {
    if (Array.isArray(data?.food)) return data.food;
    if (Array.isArray(data?.foods)) return data.foods;
    if (Array.isArray(data?.modifier_groups)) return data.modifier_groups;
    if (Array.isArray(data?.modifierGroups)) return data.modifierGroups;
    if (Array.isArray(data?.groups)) return data.groups;
    if (Array.isArray(data?.modifier_options)) return data.modifier_options;
    if (Array.isArray(data?.modifierOptions)) return data.modifierOptions;
    if (Array.isArray(data?.options)) return data.options;
    if (Array.isArray(data?.restaurants)) return data.restaurants;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
};

const needsRestaurantId = (error) => {
    const data = error.response?.data || {};
    const message = JSON.stringify(data).toLowerCase();

    return (
        error.response?.status === 422 &&
        message.includes("restaurant") &&
        message.includes("required")
    );
};

const getFoodImageUrl = (image) => {
    if (!image) return "";
    if (image.startsWith("http://") || image.startsWith("https://")) return image;

    const cleanPath = image.replace(/^\/+/, "");

    if (cleanPath.startsWith("storage/")) {
        return `https://big4.me/${cleanPath}`;
    }

    return `https://big4.me/storage/${cleanPath}`;
};

const normalizeFoodItem = (food, restaurant = null) => ({
    ...food,
    id: restaurant?.id ? `${restaurant.id}-${food.id}` : food.id,
    food_id: food.id,
    restaurant_id: food.restaurant_id ?? food.restaurant?.id ?? restaurant?.id,
    restaurantName: food.restaurant?.name ?? restaurant?.name ?? "",
    title: food.name ?? food.title ?? "Food item",
    description: food.description ?? "",
    price: Number(food.price ?? 0),
    image: getFoodImageUrl(food.image),
    category: String(food.category_id ?? food.category?.id ?? "uncategorized"),
    categoryName: food.category?.name ?? "Uncategorized",
    modifierGroups: food.modifier_groups ?? food.modifierGroups ?? [],
});

const foodDetailsCache = new Map();

const hasModifierGroups = (food) =>
    Boolean(
        food?.modifierGroups?.length ||
            food?.modifier_groups?.length ||
            food?.groups?.length
    );

const fetchFoodDetails = async (food) => {
    const foodId = food?.food_id ?? food?.id;

    if (!foodId) return food;
    if (foodDetailsCache.has(String(foodId))) {
        return foodDetailsCache.get(String(foodId));
    }

    try {
        const response = await api.get(`/food/${foodId}`);
        const [details] = getList(response.data);
        const foodDetails = details || response.data?.food || response.data?.data || response.data;
        const modifierGroups =
            foodDetails?.modifier_groups ??
            foodDetails?.modifierGroups ??
            foodDetails?.groups ??
            [];
        const detailedFood = modifierGroups.length ? { ...food, modifierGroups } : food;

        foodDetailsCache.set(String(foodId), detailedFood);
        return detailedFood;
    } catch {
        foodDetailsCache.set(String(foodId), food);
        return food;
    }
};

const fetchRestaurantMenu = async (restaurant) => {
    const foodsResponse = await api.get("/food", { params: { restaurant_id: restaurant.id } });
    const foods = getList(foodsResponse.data).map((food) =>
        normalizeFoodItem(food, restaurant)
    );
    return foods;
};

const loadFoodDetailsInBatches = async (foods, batchSize = 6) => {
    const detailedFoods = [];

    for (let index = 0; index < foods.length; index += batchSize) {
        const batch = foods.slice(index, index + batchSize);
        const detailResponses = await Promise.allSettled(
            batch.map(fetchFoodDetails)
        );

        detailedFoods.push(
            ...detailResponses.map((result, batchIndex) =>
                result.status === "fulfilled" ? result.value : batch[batchIndex]
            )
        );
    }

    return detailedFoods;
};

const hydrateMenuItemDetails = async (foods, onHydrated) => {
    const foodsMissingDetails = foods.filter((food) => !hasModifierGroups(food));

    if (!foodsMissingDetails.length) return;

    const hydratedFoods = await loadFoodDetailsInBatches(foodsMissingDetails, 6);
    const hydratedById = new Map(
        hydratedFoods.map((food) => [String(food.food_id ?? food.id), food])
    );

    onHydrated((currentFoods) =>
        currentFoods.map((food) => {
            const hydratedFood = hydratedById.get(String(food.food_id ?? food.id));

            return hydratedFood ? { ...food, ...hydratedFood } : food;
        })
    );
};

const getActiveViewFromSearch = (search) => {
    const view = new URLSearchParams(search).get("view");

    return CASHIER_VIEW_IDS.has(view) ? view : "menu";
};

function CashierDashboard({ embedded = false }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { isLight } = useTheme();
    const routeActiveView = useMemo(
        () => getActiveViewFromSearch(location.search),
        [location.search]
    );
    const activeView = routeActiveView;
    const setActiveView = (view) => {
        const params = new URLSearchParams(location.search);

        params.set("view", view);
        params.delete("orderId");
        navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    };
    const [permissions, setPermissions] = useState(() => getUserPermissions());
    const [openModal, setOpenModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [activeRestaurant, setActiveRestaurant] = useState("all");
    const [search, setSearch] = useState("");
    const [cartItems, setCartItems] = useState([]);
    const [restaurants, setRestaurants] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [isLoadingMenu, setIsLoadingMenu] = useState(true);
    const [menuError, setMenuError] = useState("");
    const restaurantFilterTrackRef = useRef(null);
    const restaurantFilterButtonRefs = useRef({});
    const [restaurantIndicatorStyle, setRestaurantIndicatorStyle] = useState({
        opacity: 0,
        transform: "translateX(0px)",
        width: 0,
    });

    useEffect(() => {
        const refreshProfile = async () => {
            const user = getStoredUser();

            if (!user) return;

            try {
                const res = await api.get("/profile/permissions");
                const nextPermissions = toPermissionKeys(
                    getProfileUserPermissions(res.data)
                );

                storeUser(user, res.data);
                setPermissions(nextPermissions);
            } catch (error) {
                console.log(error.response?.data || error);
            }
        };

        refreshProfile();

        const handleFocus = () => {
            refreshProfile();
        };

        const handleVisibilityChange = () => {
            if (!document.hidden) {
                refreshProfile();
            }
        };

        window.addEventListener("focus", handleFocus);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    const canManageTakeawayOrders = permissions.includes("manage_takeaway_orders");
    const canProcessPayments =
        canManageTakeawayOrders || permissions.includes("process_payments");
    const cashierVariant = isLight ? "light" : "dark";
    const embeddedNavigation = [
        { id: "menu", label: "Menu", icon: House },
        { id: "catalog", label: "Catalog", icon: BookOpen },
        { id: "orders", label: "Orders", icon: ReceiptText },
    ];

    useEffect(() => {
        const fetchMenu = async () => {
            setIsLoadingMenu(true);
            setMenuError("");

            try {
                const restaurantsResponse = await api.get("/restaurants");
                const restaurantList = getList(restaurantsResponse.data);

                setRestaurants(restaurantList);

                if (restaurantList.length) {
                    const menuResponses = await Promise.allSettled(
                        restaurantList.map(fetchRestaurantMenu)
                    );
                    const nextMenuItems = menuResponses.flatMap((result) =>
                        result.status === "fulfilled" ? result.value : []
                    );

                    setMenuItems(nextMenuItems);
                    hydrateMenuItemDetails(nextMenuItems, setMenuItems).catch(() => {});
                    return;
                }

                const restaurantId = await ensureCurrentRestaurantId();
                const foodResponse = await api.get("/food", {
                    params: restaurantId ? { restaurant_id: restaurantId } : {},
                });
                const foods = getList(foodResponse.data).map(normalizeFoodItem);

                setMenuItems(foods);
                hydrateMenuItemDetails(foods, setMenuItems).catch(() => {});
            } catch (error) {
                if (needsRestaurantId(error)) {
                    try {
                        const restaurantsResponse = await api.get("/restaurants");
                        const restaurantList = getList(restaurantsResponse.data);
                        setRestaurants(restaurantList);
                        const menuResponses = await Promise.allSettled(
                            restaurantList.map(fetchRestaurantMenu)
                        );
                        const nextMenuItems = menuResponses.flatMap((result) =>
                            result.status === "fulfilled" ? result.value : []
                        );

                        setMenuItems(nextMenuItems);
                        hydrateMenuItemDetails(nextMenuItems, setMenuItems).catch(() => {});
                    } catch (fallbackError) {
                        setMenuError(
                            fallbackError.response?.data?.message ||
                                "Menu items could not be loaded."
                        );
                    }

                    return;
                }

                setMenuError(error.response?.data?.message || "Menu items could not be loaded.");
            } finally {
                setIsLoadingMenu(false);
            }
        };

        fetchMenu();
    }, []);

    const restaurantFilters = useMemo(() => {
        const restaurantMap = new Map();

        menuItems.forEach((item) => {
            const id = String(item.restaurant_id || "unknown");

            if (!id || id === "unknown") return;

            restaurantMap.set(id, {
                id,
                name: item.restaurantName || "Restaurant",
                count: (restaurantMap.get(id)?.count || 0) + 1,
            });
        });

        restaurants.forEach((restaurant) => {
            const id = String(restaurant.id);
            const existing = restaurantMap.get(id);

            restaurantMap.set(id, {
                id,
                name: restaurant.name || existing?.name || "Restaurant",
                count: existing?.count || 0,
            });
        });

        return Array.from(restaurantMap.values()).filter(
            (restaurant) => restaurant.count > 0
        );
    }, [menuItems, restaurants]);

    const visibleItems = useMemo(() => {
        const query = search.trim().toLowerCase();

        return menuItems.filter((item) => {
            const matchesRestaurant =
                activeRestaurant === "all" ||
                String(item.restaurant_id) === String(activeRestaurant);
            const matchesSearch = !query || `${item.title} ${item.description}`.toLowerCase().includes(query);
            return matchesRestaurant && matchesSearch;
        });
    }, [activeRestaurant, menuItems, search]);

    useLayoutEffect(() => {
        const track = restaurantFilterTrackRef.current;
        const activeButton = restaurantFilterButtonRefs.current[activeRestaurant];

        if (!track || !activeButton) {
            setRestaurantIndicatorStyle((current) => ({ ...current, opacity: 0 }));
            return undefined;
        }

        const updateIndicator = () => {
            const trackRect = track.getBoundingClientRect();
            const buttonRect = activeButton.getBoundingClientRect();

            setRestaurantIndicatorStyle({
                opacity: 1,
                transform: `translateX(${buttonRect.left - trackRect.left + track.scrollLeft}px)`,
                width: buttonRect.width,
            });
        };

        updateIndicator();

        window.addEventListener("resize", updateIndicator);
        track.addEventListener("scroll", updateIndicator, { passive: true });

        return () => {
            window.removeEventListener("resize", updateIndicator);
            track.removeEventListener("scroll", updateIndicator);
        };
    }, [activeRestaurant, restaurantFilters]);

    const addToCart = (product) => {
        setCartItems((current) => {
            const existingIndex = current.findIndex(
                (item) => item.id === product.id && item.size === product.size && item.notes === product.notes
            );

            if (existingIndex === -1) return [...current, product];

            return current.map((item, index) =>
                index === existingIndex
                    ? { ...item, quantity: item.quantity + product.quantity }
                    : item
            );
        });
    };

    const openMenuItem = (item) => {
        const needsDetails = !hasModifierGroups(item);

        setSelectedItem(needsDetails ? { ...item, isLoadingDetails: true } : item);
        setOpenModal(true);

        if (!needsDetails) return;

        fetchFoodDetails(item).then((detailedItem) => {
            setSelectedItem({ ...detailedItem, isLoadingDetails: false });
            setMenuItems((currentItems) =>
                currentItems.map((currentItem) =>
                    String(currentItem.food_id ?? currentItem.id) ===
                    String(detailedItem.food_id ?? detailedItem.id)
                        ? { ...currentItem, ...detailedItem }
                        : currentItem
                )
            );
        });
    };

    return (
        <div
            className={
                embedded
                    ? `cashier-dashboard h-[calc(100dvh-88px)] overflow-hidden rounded-lg border border-white/10 ${REPORTS_BACKGROUND} font-merriweather text-white shadow-sm lg:flex`
                    : `cashier-dashboard min-h-dvh ${REPORTS_BACKGROUND} font-merriweather text-white lg:flex lg:h-dvh lg:overflow-hidden`
            }
        >
            {!embedded && (
            <aside className="hidden shrink-0 lg:block">
                <RightSidebar
                    activeView={activeView}
                    onViewChange={setActiveView}
                    permissions={permissions}
                />
            </aside>
            )}

            <main
                className={`min-w-0 flex-1 ${
                    embedded ? "cashier-scroll min-h-0 overflow-y-auto" : "cashier-scroll lg:overflow-y-auto"
                }`}
            >
                {embedded ? (
                    <div className="border-b border-white/[0.08] bg-[#0F1517]/72 px-4 py-3 backdrop-blur-xl sm:px-6">
                        <nav
                            className="relative inline-grid max-w-full grid-cols-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-1 shadow-[0_16px_38px_rgba(0,0,0,0.18)]"
                            style={{ "--active-index": embeddedNavigation.findIndex((item) => item.id === activeView) }}
                        >
                            <span className="pointer-events-none absolute bottom-1 left-1 top-1 w-[calc((100%-0.5rem)/3)] rounded-xl bg-[#FFD166] shadow-[0_10px_22px_rgba(255,209,102,0.18)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] [transform:translateX(calc(var(--active-index)*100%))]" />
                            {embeddedNavigation.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeView === item.id;

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setActiveView(item.id)}
                                        className={`relative z-10 inline-flex h-10 min-w-28 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black transition-colors duration-300 ${
                                            isActive
                                                ? "text-[#151A1D]"
                                                : "text-white/58 hover:bg-white/[0.07] hover:text-white"
                                        }`}
                                    >
                                        <Icon size={16} strokeWidth={isActive ? 2.7 : 2.2} />
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                ) : (
                    <TopBar search={search} setSearch={setSearch} cartCount={cartItems.length} />
                )}

                {!canManageTakeawayOrders &&
                ["menu", "catalog", "orders"].includes(activeView) ? (
                    <section className="grid min-h-[calc(100dvh-96px)] place-items-center px-4 pb-10 sm:px-6 xl:px-8">
                        <div className="max-w-md rounded-[28px] border border-white/10 bg-[#252A2D] px-6 py-12 text-center shadow-[0_18px_42px_rgba(0,0,0,0.20)]">
                            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#7F1D1D]/14 text-[#7F1D1D]">
                                <ShieldAlert size={26} />
                            </div>
                            <h1 className="mt-4 text-2xl font-black text-white">
                                Takeaway orders unavailable
                            </h1>
                            <p className="mt-3 text-sm font-medium leading-6 text-white/58">
                                This cashier needs the manage_takeaway_orders permission to
                                access menu, catalog, and takeaway order actions.
                            </p>
                        </div>
                    </section>
                ) : activeView === "catalog" ? (
                    <CatalogOrders />
                ) : activeView === "orders" ? (
                    <PickupOrders />
                ) : activeView === "serveOrders" && (
                    permissions.includes("serve_dine_in_orders") ||
                    permissions.includes("process_payments")
                ) ? (
                    <WaiterDashboard embedded />
                ) : activeView === "inventory" && permissions.includes("monitor_inventory") ? (
                    <Warehouse />
                ) : activeView === "stockActions" && permissions.includes("monitor_inventory") ? (
                    <StockActions />
                ) : activeView === "lowStock" && permissions.includes("monitor_inventory") ? (
                    <LowStock />
                ) : activeView === "tables" && permissions.includes("manage_tables") ? (
                    <TablesManagements />
                ) : activeView === "restaurants" && permissions.includes("manage_restaurants") ? (
                    <RestaurantsManagements />
                ) : (
                    <section className="px-4 pb-10 pt-1 sm:px-6 xl:px-8">
                        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-[#FFD166]">Today&apos;s menu</p>
                                <h1 className="text-2xl font-extrabold text-white sm:text-3xl">Choose an item</h1>
                            </div>
                            <p className="text-sm font-medium text-white/60">{visibleItems.length} items available</p>
                        </div>

                        <div
                            ref={restaurantFilterTrackRef}
                            className="customer-order-scroll relative mb-8 flex gap-2 overflow-x-auto rounded-[22px] border border-white/10 bg-white/[0.035] p-1 pb-2"
                        >
                            <span
                                className="pointer-events-none absolute top-1 z-0 h-14 rounded-2xl bg-[#FFD166] shadow-[0_14px_28px_rgba(255,209,102,0.16)] transition-[opacity,transform,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                                style={restaurantIndicatorStyle}
                            />
                            <button
                                ref={(element) => {
                                    restaurantFilterButtonRefs.current.all = element;
                                }}
                                type="button"
                                onClick={() => setActiveRestaurant("all")}
                                className={`relative z-10 inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-black transition-colors duration-300 ${
                                    activeRestaurant === "all"
                                        ? "text-[#151A1D]"
                                        : "text-white/70 hover:bg-white/[0.07] hover:text-white"
                                }`}
                            >
                                <Store size={17} />
                                All restaurants
                            </button>
                            {restaurantFilters.map((restaurant) => {
                                const isActive = activeRestaurant === restaurant.id;

                                return (
                                    <button
                                        ref={(element) => {
                                            restaurantFilterButtonRefs.current[restaurant.id] = element;
                                        }}
                                        key={restaurant.id}
                                        type="button"
                                        onClick={() => setActiveRestaurant(restaurant.id)}
                                        className={`relative z-10 inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black transition-colors duration-300 ${
                                            isActive
                                                ? "text-[#151A1D]"
                                                : "text-white/70 hover:bg-white/[0.07] hover:text-white"
                                        }`}
                                    >
                                        <Store size={17} />
                                        <span>{restaurant.name}</span>
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs ${
                                                isActive
                                                    ? "bg-[#151A1D]/10 text-[#151A1D]/72"
                                                    : "bg-white/10 text-white/50"
                                            }`}
                                        >
                                            {restaurant.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {isLoadingMenu ? (
                            <div className="rounded-[28px] border border-white/10 bg-[#252A2D] px-6 py-16 text-center shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
                                <h2 className="text-xl font-bold text-white">Loading menu...</h2>
                                <p className="mt-2 text-white/58">Getting the latest food list.</p>
                            </div>
                        ) : menuError ? (
                            <div className="rounded-[28px] border border-[#7F1D1D]/25 bg-[#7F1D1D]/12 px-6 py-16 text-center">
                                <h2 className="text-xl font-bold text-[#7F1D1D]">Menu unavailable</h2>
                                <p className="mt-2 text-[#ff9aaa]">{menuError}</p>
                            </div>
                        ) : visibleItems.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                {visibleItems.map((item) => (
                                    <MenuItemCard
                                        key={item.id}
                                        item={item}
                                        onOpen={() => openMenuItem(item)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-[28px] border border-dashed border-white/15 bg-[#252A2D] px-6 py-16 text-center shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
                                <h2 className="text-xl font-bold text-white">No items found</h2>
                                <p className="mt-2 text-white/58">Try another restaurant or search phrase.</p>
                            </div>
                        )}
                    </section>
                )}

                <ProductModal
                    isOpen={openModal}
                    onClose={() => setOpenModal(false)}
                    item={selectedItem}
                    addToCart={addToCart}
                    variant={cashierVariant}
                />
            </main>

            {canManageTakeawayOrders && !["tables", "restaurants", "inventory", "stockActions", "lowStock", "serveOrders"].includes(activeView) && (
                <aside
                    className={`cashier-order-panel relative z-10 border-t border-white/10 bg-[#0F1517] lg:w-[330px] lg:shrink-0 lg:border-l lg:border-t-0 xl:w-[340px] ${
                        embedded ? "cashier-scroll min-h-0 lg:h-full lg:overflow-y-auto" : "cashier-scroll lg:h-dvh"
                    }`}
                >
                    <OrderSidebar
                        cartItems={cartItems}
                        setCartItems={setCartItems}
                        canProcessPayments={canProcessPayments}
                    />
                </aside>
            )}
        </div>
    );
}

export default CashierDashboard;
