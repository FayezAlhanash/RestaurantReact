import { useEffect, useMemo, useState } from "react";
import CategoryTabs from "./CategoryTabs";
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
import {
    getProfileUserPermissions,
    getUserPermissions,
    toPermissionKeys,
} from "../../utils/permissions";
import { BookOpen, House, ReceiptText, ShieldAlert } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const REPORTS_BACKGROUND =
    "bg-[radial-gradient(circle_at_86%_12%,rgba(127,29,29,0.14),transparent_30%),radial-gradient(circle_at_16%_22%,rgba(255,209,102,0.10),transparent_26%),linear-gradient(145deg,#0D1214_0%,#12191C_54%,#211619_100%)]";

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

const fetchFoodDetails = async (food) => {
    try {
        const response = await api.get(`/food/${food.food_id}`);
        const [details] = getList(response.data);
        const foodDetails = details || response.data?.food || response.data?.data || response.data;
        const modifierGroups =
            foodDetails?.modifier_groups ??
            foodDetails?.modifierGroups ??
            foodDetails?.groups ??
            [];

        return modifierGroups.length ? { ...food, modifierGroups } : food;
    } catch {
        return food;
    }
};

const fetchRestaurantMenu = async (restaurant) => {
    const foodsResponse = await api.get("/food", { params: { restaurant_id: restaurant.id } });
    const foods = getList(foodsResponse.data).map((food) =>
        normalizeFoodItem(food, restaurant)
    );
    const detailResponses = await Promise.allSettled(foods.map(fetchFoodDetails));

    return detailResponses.map((result, index) =>
        result.status === "fulfilled" ? result.value : foods[index]
    );
};

function CashierDashboard({ embedded = false }) {
    const { isLight } = useTheme();
    const [activeView, setActiveView] = useState("menu");
    const [permissions, setPermissions] = useState(() => getUserPermissions());
    const [openModal, setOpenModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [activeCategory, setActiveCategory] = useState("all");
    const [search, setSearch] = useState("");
    const [cartItems, setCartItems] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [isLoadingMenu, setIsLoadingMenu] = useState(true);
    const [menuError, setMenuError] = useState("");

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
                const res = await api.get("/food");
                const foods = getList(res.data).map(normalizeFoodItem);
                const detailResponses = await Promise.allSettled(
                    foods.map(fetchFoodDetails)
                );

                setMenuItems(
                    detailResponses.map((result, index) =>
                        result.status === "fulfilled" ? result.value : foods[index]
                    )
                );
            } catch (error) {
                if (needsRestaurantId(error)) {
                    try {
                        const restaurantsResponse = await api.get("/restaurants");
                        const restaurants = getList(restaurantsResponse.data);
                        const menuResponses = await Promise.allSettled(
                            restaurants.map(fetchRestaurantMenu)
                        );

                        setMenuItems(
                            menuResponses.flatMap((result) =>
                                result.status === "fulfilled" ? result.value : []
                            )
                        );
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

    const categories = useMemo(() => {
        const categoryMap = new Map();

        menuItems.forEach((item) => {
            categoryMap.set(String(item.category), {
                id: String(item.category),
                name: item.categoryName,
            });
        });

        return Array.from(categoryMap.values());
    }, [menuItems]);

    const visibleItems = useMemo(() => {
        const query = search.trim().toLowerCase();

        return menuItems.filter((item) => {
            const matchesCategory =
                activeCategory === "all" || String(item.category) === String(activeCategory);
            const matchesSearch = !query || `${item.title} ${item.description}`.toLowerCase().includes(query);
            return matchesCategory && matchesSearch;
        });
    }, [activeCategory, menuItems, search]);

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

    return (
        <div
            className={
                embedded
                    ? `cashier-dashboard h-[calc(100dvh-88px)] overflow-hidden rounded-lg border border-white/10 ${REPORTS_BACKGROUND} font-[Raleway] text-white shadow-sm lg:flex`
                    : `cashier-dashboard min-h-dvh ${REPORTS_BACKGROUND} font-[Raleway] text-white lg:flex lg:h-dvh lg:overflow-hidden`
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
                    <div className="border-b border-white/[0.08] bg-[#0F1517]/78 px-4 py-3 backdrop-blur-xl sm:px-6">
                        <nav className="flex gap-2 overflow-x-auto">
                            {embeddedNavigation.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeView === item.id;

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setActiveView(item.id)}
                                        className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-black transition ${
                                            isActive
                                                ? "border-[#7F1D1D] bg-[#7F1D1D] text-white shadow-sm shadow-[#7F1D1D]/20"
                                                : "border-white/10 bg-white/[0.055] text-white/66 hover:border-[#FFD166]/30 hover:bg-white/[0.09] hover:text-white"
                                        }`}
                                    >
                                        <Icon size={17} />
                                        {item.label}
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

                        <CategoryTabs
                            activeCategory={activeCategory}
                            setActiveCategory={setActiveCategory}
                            categories={categories}
                            variant={cashierVariant}
                        />

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
                                        onOpen={() => {
                                            setSelectedItem(item);
                                            setOpenModal(true);
                                        }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-[28px] border border-dashed border-white/15 bg-[#252A2D] px-6 py-16 text-center shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
                                <h2 className="text-xl font-bold text-white">No items found</h2>
                                <p className="mt-2 text-white/58">Try another category or search phrase.</p>
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
                    className={`cashier-order-panel border-t border-white/10 bg-[#0F1517] lg:w-[360px] lg:shrink-0 lg:border-l lg:border-t-0 xl:w-[390px] ${
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
