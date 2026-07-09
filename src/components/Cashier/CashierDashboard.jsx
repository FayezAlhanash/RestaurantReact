import { useEffect, useMemo, useState } from "react";
import CategoryTabs from "./CategoryTabs";
import MenuItemCard from "./MenuItem";
import OrderSidebar from "./OrderSidebar";
import ProductModal from "./ProductModal";
import RightSidebar from "./RightSidebar";
import TopBar from "./TopBar";
import api from "../../API/axios";

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

function CashierDashboard() {
    const [openModal, setOpenModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [activeCategory, setActiveCategory] = useState("all");
    const [search, setSearch] = useState("");
    const [cartItems, setCartItems] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [isLoadingMenu, setIsLoadingMenu] = useState(true);
    const [menuError, setMenuError] = useState("");

    useEffect(() => {
        const fetchMenu = async () => {
            setIsLoadingMenu(true);
            setMenuError("");

            try {
                const res = await api.get("/food");
                setMenuItems(getList(res.data).map(normalizeFoodItem));
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
        <div className="min-h-dvh bg-[#F5F1EB] font-[Raleway] text-[#261F1D] lg:flex lg:h-dvh lg:overflow-hidden">
            <aside className="hidden shrink-0 lg:block">
                <RightSidebar />
            </aside>

            <main className="min-w-0 flex-1 lg:overflow-y-auto">
                <TopBar search={search} setSearch={setSearch} cartCount={cartItems.length} />

                <section className="px-4 pb-10 sm:px-6 xl:px-8">
                    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-[#9A7A70]">Today&apos;s menu</p>
                            <h1 className="text-2xl font-extrabold sm:text-3xl">Choose an item</h1>
                        </div>
                        <p className="text-sm font-medium text-[#806F69]">{visibleItems.length} items available</p>
                    </div>

                    <CategoryTabs
                        activeCategory={activeCategory}
                        setActiveCategory={setActiveCategory}
                        categories={categories}
                    />

                    {isLoadingMenu ? (
                        <div className="rounded-[28px] border border-[#E7DCD6] bg-white/70 px-6 py-16 text-center">
                            <h2 className="text-xl font-bold">Loading menu...</h2>
                            <p className="mt-2 text-[#806F69]">Getting the latest food list.</p>
                        </div>
                    ) : menuError ? (
                        <div className="rounded-[28px] border border-red-100 bg-red-50 px-6 py-16 text-center">
                            <h2 className="text-xl font-bold text-red-800">Menu unavailable</h2>
                            <p className="mt-2 text-red-700">{menuError}</p>
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
                        <div className="rounded-[28px] border border-dashed border-[#D8C8C1] bg-white/70 px-6 py-16 text-center">
                            <h2 className="text-xl font-bold">No items found</h2>
                            <p className="mt-2 text-[#806F69]">Try another category or search phrase.</p>
                        </div>
                    )}
                </section>

                <ProductModal
                    isOpen={openModal}
                    onClose={() => setOpenModal(false)}
                    item={selectedItem}
                    addToCart={addToCart}
                />
            </main>

            <aside className="border-t border-[#E9DED8] bg-white lg:h-dvh lg:w-[360px] lg:shrink-0 lg:border-l lg:border-t-0 xl:w-[390px]">
                <OrderSidebar cartItems={cartItems} setCartItems={setCartItems} />
            </aside>
        </div>
    );
}

export default CashierDashboard;
