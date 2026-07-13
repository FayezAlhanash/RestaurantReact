import {
    CheckCircle2,
    Minus,
    Plus,
    ReceiptText,
    Search,
    ShoppingBag,
    Trash2,
    Utensils,
    X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../API/axios";
import CategoryTabs from "../Cashier/CategoryTabs";
import MenuItemCard from "../Cashier/MenuItem";
import ProductModal from "../Cashier/ProductModal";

const getList = (data) => {
    if (Array.isArray(data?.food)) return data.food;
    if (Array.isArray(data?.foods)) return data.foods;
    if (Array.isArray(data?.restaurants)) return data.restaurants;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
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

const getRestaurantImageUrl = (restaurant) => {
    const image =
        restaurant?.front_image ||
        restaurant?.image ||
        restaurant?.logo ||
        restaurant?.cover_image ||
        "";

    if (!image) {
        return "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80";
    }

    if (image.startsWith("http://") || image.startsWith("https://")) {
        return image;
    }

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
    restaurantName: food.restaurant?.name ?? restaurant?.name ?? "Restaurant",
    title: food.name ?? food.title ?? "Food item",
    description: food.description ?? "",
    price: Number(food.price ?? 0),
    image: getFoodImageUrl(food.image),
    category: String(food.category_id ?? food.category?.id ?? "uncategorized"),
    categoryName: food.category?.name ?? "Menu",
    modifierGroups: food.modifier_groups ?? food.modifierGroups ?? [],
});

const appendIfPresent = (formData, key, value) => {
    if (value !== undefined && value !== null && value !== "") {
        formData.append(key, value);
    }
};

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
    const foodsResponse = await api.get("/food", {
        params: { restaurant_id: restaurant.id },
    });
    const foods = getList(foodsResponse.data).map((food) =>
        normalizeFoodItem(food, restaurant)
    );
    const detailResponses = await Promise.allSettled(foods.map(fetchFoodDetails));

    return detailResponses.map((result, index) =>
        result.status === "fulfilled" ? result.value : foods[index]
    );
};

const buildOrderFormData = (cartItems, tableId, orderType) => {
    const formData = new FormData();

    appendIfPresent(formData, "order_type", orderType);
    appendIfPresent(formData, "table_id", tableId);
    appendIfPresent(formData, "table_number", tableId);

    cartItems.forEach((item, index) => {
        const unitPrice = Number(item.price ?? 0);
        const quantity = Number(item.quantity ?? 1);
        const modifierOptions = item.selectedModifierOptions ?? [];
        const notes = [`Table ${tableId}`, item.size, item.notes].filter(Boolean).join(" · ");

        appendIfPresent(formData, `items[${index}][food_id]`, item.food_id || item.id);
        appendIfPresent(formData, `items[${index}][menu_item_id]`, item.food_id || item.id);
        appendIfPresent(formData, `items[${index}][quantity]`, quantity);
        appendIfPresent(formData, `items[${index}][unit_price]`, unitPrice);
        appendIfPresent(formData, `items[${index}][price]`, unitPrice);
        appendIfPresent(formData, `items[${index}][total_price]`, unitPrice * quantity);
        appendIfPresent(formData, `items[${index}][notes]`, notes);

        modifierOptions.forEach((option, optionIndex) => {
            const optionId = option.modifier_option_id ?? option.id;

            appendIfPresent(
                formData,
                `items[${index}][modifiers][${optionIndex}]`,
                optionId
            );
            appendIfPresent(
                formData,
                `items[${index}][modifier_options][${optionIndex}]`,
                optionId
            );
        });
    });

    return formData;
};

const buildAddItemFormData = (item) => {
    const formData = new FormData();
    const modifierOptions = item.selectedModifierOptions ?? [];

    appendIfPresent(formData, "food_id", item.food_id || item.id);
    appendIfPresent(formData, "quantity", Number(item.quantity ?? 1));
    appendIfPresent(formData, "notes", [item.size, item.notes].filter(Boolean).join(" · "));

    modifierOptions.forEach((option, optionIndex) => {
        appendIfPresent(
            formData,
            `modifiers[${optionIndex}]`,
            option.modifier_option_id ?? option.id
        );
    });

    return formData;
};

const getCreatedOrderId = (data) => {
    const orderIds = data?.orders
        ?.map((order) => getCreatedOrderId(order))
        .filter(Boolean);

    if (orderIds?.length) return orderIds[0];

    return (
        data?.order?.id ??
        data?.data?.order?.id ??
        data?.data?.id ??
        data?.id ??
        null
    );
};

async function createDineInOrder(cartItems, tableId) {
    const typeVariants = ["dine-in", "dine_in", "dine in", "dinein", "DINE-IN"];
    let lastError;

    for (const orderType of typeVariants) {
        try {
            const response = await api.post(
                "/customer-dine-in/orders",
                buildOrderFormData(cartItems, tableId, orderType)
            );
            return response.data;
        } catch (error) {
            lastError = error;
            const message = JSON.stringify(error.response?.data || {}).toLowerCase();
            const isTypeError =
                error.response?.status === 422 &&
                message.includes("order type") &&
                message.includes("invalid");

            if (!isTypeError) throw error;
        }
    }

    throw lastError;
}

async function addItemsToDineInOrder(orderId, cartItems) {
    const responses = [];

    for (const item of cartItems) {
        const response = await api.post(
            `/customer-dine-in/orders/${orderId}/items`,
            buildAddItemFormData(item)
        );

        responses.push(response.data);
    }

    return responses;
}

function CustomerFoodCard({ item, onOpen }) {
    const imageUrl =
        item.image ||
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";

    return (
        <article className="flex gap-3 rounded-2xl border border-[#E7DCD6] bg-white p-3 shadow-sm">
            <img
                src={imageUrl}
                alt={item.title}
                className="h-24 w-24 shrink-0 rounded-xl bg-[#EDE5DF] object-cover"
            />
            <div className="flex min-w-0 flex-1 flex-col">
                <div className="min-w-0">
                    <p className="truncate text-xs font-black uppercase tracking-wide text-[#9A7A70]">
                        {item.restaurantName}
                    </p>
                    <h2 className="mt-1 line-clamp-1 text-base font-black text-[#241F1D]">
                        {item.title}
                    </h2>
                        <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-[#5F504A]">
                        {item.description || item.categoryName}
                    </p>
                </div>
                <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                    <span className="text-lg font-black text-[#7F1D1D]">
                        ${Number(item.price ?? 0).toFixed(2)}
                    </span>
                    <button
                        type="button"
                        onClick={onOpen}
                        className="grid h-10 w-10 place-items-center rounded-xl bg-[#7F1D1D] text-white shadow-sm transition active:scale-95"
                        aria-label={`Add ${item.title}`}
                    >
                        <Plus size={19} />
                    </button>
                </div>
            </div>
        </article>
    );
}

function RestaurantSelectCard({ restaurant, itemCount, isActive, onSelect }) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`group overflow-hidden rounded-2xl border bg-white text-left shadow-[0_16px_34px_rgba(42,28,22,0.10)] transition hover:-translate-y-0.5 active:scale-[0.99] ${
                isActive
                    ? "border-[#D8A23A] ring-4 ring-[#D8A23A]/20"
                    : "border-[#E7DCD6] hover:border-[#D8A23A]/60"
            }`}
        >
            <div className="relative h-36 overflow-hidden bg-[#EDE5DF] sm:h-44">
                <img
                    src={getRestaurantImageUrl(restaurant)}
                    alt={restaurant.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1D1410]/70 via-[#7A3A2C]/18 to-transparent" />
                <span className="absolute left-3 top-3 rounded-full bg-[#FFF7DA]/95 px-3 py-1 text-xs font-black text-[#5F3D06] backdrop-blur">
                    {itemCount} items
                </span>
                {isActive && (
                    <span className="absolute right-3 top-3 rounded-full bg-[#D8A23A] px-3 py-1 text-xs font-black text-[#241707]">
                        Open
                    </span>
                )}
                <div className="absolute bottom-3 left-3 right-3">
                    <h2 className="truncate text-xl font-black text-white">
                        {restaurant.name}
                    </h2>
                    {restaurant.description && (
                        <p className="mt-1 line-clamp-1 text-xs font-bold text-white/95 drop-shadow">
                            {restaurant.description}
                        </p>
                    )}
                </div>
            </div>
        </button>
    );
}

function OrderPanel({
    cartItems,
    itemCount,
    subtotal,
    onChangeQuantity,
    onRemoveItem,
    onSubmit,
    isSubmitting,
    layout = "desktop",
    onClose,
}) {
    const isMobile = layout === "mobile";

    return (
        <section
            className={`flex flex-col overflow-hidden border border-[#B75D42]/25 bg-[#5A2E25] text-white shadow-[0_20px_45px_rgba(90,46,37,0.20)] ${
                isMobile
                    ? "max-h-[78dvh] rounded-t-2xl"
                    : "max-h-[calc(100dvh-7.5rem)] min-h-[520px] rounded-2xl"
            }`}
        >
            <div className={`shrink-0 border-b border-white/10 ${isMobile ? "p-4" : "p-5"}`}>
                <div className="flex items-center gap-3">
                    <div className={`${isMobile ? "h-10 w-10" : "h-12 w-12"} grid place-items-center rounded-xl bg-[#D8A23A] text-[#261707]`}>
                        <ReceiptText size={isMobile ? 19 : 22} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className={`${isMobile ? "text-xl" : "text-2xl"} font-black leading-7`}>Bill</h2>
                        <p className="text-sm font-bold text-white/60">
                            {itemCount ? `${itemCount} items in your order` : "No items yet"}
                        </p>
                    </div>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/10 text-white transition active:scale-95"
                            aria-label="Close bill"
                        >
                            <X size={19} />
                        </button>
                    )}
                </div>
            </div>

            <div className={`min-h-0 flex-1 space-y-3 overflow-y-auto ${isMobile ? "p-3" : "p-4"}`}>
                {cartItems.length ? (
                    cartItems.map((item, index) => (
                        <div
                            key={`${item.id}-${item.notes}-${index}`}
                            className={`rounded-2xl border border-white/10 bg-white/10 ${isMobile ? "p-3" : "p-4"}`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className={`${isMobile ? "text-base" : "text-lg"} break-words font-black leading-6 text-white`}>
                                        {item.title}
                                    </p>
                                    <p className="mt-1 truncate text-sm font-extrabold text-white/55">
                                        {item.restaurantName}
                                    </p>
                                    {item.notes && (
                                        <p className="mt-3 break-words text-sm font-semibold leading-5 text-white/72">
                                            {item.notes}
                                        </p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onRemoveItem(index)}
                                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white/45 transition hover:bg-white/10 hover:text-[#F6C65B]"
                                    aria-label={`Remove ${item.title}`}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-3">
                                <div className="flex shrink-0 items-center rounded-xl border border-white/15 bg-[#4C261F] p-1">
                                    <button
                                        type="button"
                                        onClick={() => onChangeQuantity(index, -1)}
                                        className={`${isMobile ? "h-9 w-9" : "h-10 w-10"} grid place-items-center rounded-lg text-[#F6C65B]`}
                                        aria-label="Decrease quantity"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <span className={`${isMobile ? "w-8 text-base" : "w-10 text-lg"} text-center font-black`}>
                                        {item.quantity}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => onChangeQuantity(index, 1)}
                                        className={`${isMobile ? "h-9 w-9" : "h-10 w-10"} grid place-items-center rounded-lg text-[#F6C65B]`}
                                        aria-label="Increase quantity"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <span className={`${isMobile ? "text-base" : "text-lg"} shrink-0 font-black text-[#F6C65B]`}>
                                    ${(Number(item.price ?? 0) * item.quantity).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex h-full min-h-64 flex-col items-center justify-center px-6 text-center">
                        <ShoppingBag className="text-[#F6C65B]" size={34} />
                        <h3 className="mt-3 font-black">Your order is empty</h3>
                        <p className="mt-1 text-sm font-medium text-white/55">
                            Add dishes and they will appear here.
                        </p>
                    </div>
                )}
            </div>

            <div className={`shrink-0 border-t border-white/10 ${isMobile ? "p-3" : "p-5"}`}>
            <div className={`space-y-3 rounded-xl border border-white/10 bg-white/10 ${isMobile ? "p-3" : "p-4"} text-base`}>
                <div className="flex items-center justify-between text-white/65">
                    <span>Subtotal</span>
                    <span className="font-black text-white">
                        ${subtotal.toFixed(2)}
                    </span>
                </div>
                <div className="border-t border-dashed border-white/20" />
                <div className="flex items-end justify-between">
                    <span className="text-lg font-black">Total</span>
                    <span className={`${isMobile ? "text-2xl" : "text-3xl"} font-black text-[#F6C65B]`}>
                        ${subtotal.toFixed(2)}
                    </span>
                </div>
            </div>

            <div className="mt-4">
                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={!itemCount || isSubmitting}
                    className="h-12 w-full rounded-xl bg-[#D8A23A] px-4 text-sm font-black text-[#241707] shadow-sm transition hover:bg-[#F0BD4E] disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/45"
                >
                    {isSubmitting ? "Sending..." : "Send"}
                </button>
            </div>
            </div>
        </section>
    );
}

function MobileOrderBar({
    cartItems,
    itemCount,
    subtotal,
    onChangeQuantity,
    onRemoveItem,
    onSubmit,
    isSubmitting,
    isOpen,
    onOpen,
    onClose,
}) {
    if (!itemCount) return null;

    return (
        <div className="lg:hidden">
            {isOpen && (
                <div className="fixed inset-0 z-40 flex items-end bg-black/35 backdrop-blur-[2px]">
                    <div className="w-full">
                        <OrderPanel
                            cartItems={cartItems}
                            itemCount={itemCount}
                            subtotal={subtotal}
                            onChangeQuantity={onChangeQuantity}
                            onRemoveItem={onRemoveItem}
                            onSubmit={onSubmit}
                            isSubmitting={isSubmitting}
                            layout="mobile"
                            onClose={onClose}
                        />
                    </div>
                </div>
            )}

            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#6B3528]/20 bg-[#FFF8EA]/95 px-3 py-3 shadow-[0_-12px_30px_rgba(70,45,30,0.18)] backdrop-blur">
                <div className="mx-auto flex max-w-5xl items-center gap-3">
                    <button
                        type="button"
                        onClick={onOpen}
                        className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl bg-[#5A2E25] px-4 py-3 text-left text-white shadow-sm transition active:scale-[0.99]"
                    >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#D8A23A] text-[#241707]">
                            <ShoppingBag size={18} />
                        </span>
                        <span className="min-w-0">
                            <span className="block truncate text-sm font-black">
                                {itemCount} items
                            </span>
                            <span className="block text-xs font-bold text-white/65">
                                View bill
                            </span>
                        </span>
                        <span className="ml-auto shrink-0 text-lg font-black text-[#F6C65B]">
                            ${subtotal.toFixed(2)}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={isSubmitting}
                        className="h-14 shrink-0 rounded-2xl bg-[#D8A23A] px-5 text-sm font-black text-[#241707] shadow-sm transition active:scale-95 disabled:opacity-60"
                    >
                        {isSubmitting ? "Sending..." : "Send"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function DineInOrder() {
    const { tableId = "1" } = useParams();
    const orderStorageKey = `customer-dine-in-order:${tableId}`;
    const [restaurants, setRestaurants] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [activeRestaurant, setActiveRestaurant] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");
    const [search, setSearch] = useState("");
    const [cartItems, setCartItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeOrderId, setActiveOrderId] = useState(() =>
        sessionStorage.getItem(orderStorageKey)
    );

    useEffect(() => {
        const loadMenu = async () => {
            setIsLoading(true);
            setErrorMessage("");

            try {
                const restaurantsResponse = await api.get("/restaurants");
                const restaurantList = getList(restaurantsResponse.data);
                const menuResponses = await Promise.allSettled(
                    restaurantList.map(fetchRestaurantMenu)
                );

                setRestaurants(restaurantList);
                setMenuItems(
                    menuResponses.flatMap((result) =>
                        result.status === "fulfilled" ? result.value : []
                    )
                );
            } catch (error) {
                try {
                    const foodsResponse = await api.get("/food");
                    const foods = getList(foodsResponse.data).map(normalizeFoodItem);
                    const detailResponses = await Promise.allSettled(
                        foods.map(fetchFoodDetails)
                    );

                    setMenuItems(
                        detailResponses.map((result, index) =>
                            result.status === "fulfilled" ? result.value : foods[index]
                        )
                    );
                } catch (fallbackError) {
                    setErrorMessage(
                        fallbackError.response?.data?.message ||
                            "Menu could not be loaded."
                    );
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadMenu();
    }, []);

    useEffect(() => {
        const storedOrderId = sessionStorage.getItem(orderStorageKey);
        setActiveOrderId(storedOrderId);
    }, [orderStorageKey]);

    const visibleItems = useMemo(() => {
        const query = search.trim().toLowerCase();

        return menuItems.filter((item) => {
            const matchesRestaurant =
                activeRestaurant &&
                String(item.restaurant_id) === String(activeRestaurant);
            const matchesCategory =
                activeCategory === "all" || String(item.category) === String(activeCategory);
            const matchesSearch =
                !query ||
                `${item.title} ${item.description} ${item.restaurantName}`
                    .toLowerCase()
                    .includes(query);

            return matchesRestaurant && matchesCategory && matchesSearch;
        });
    }, [activeCategory, activeRestaurant, menuItems, search]);

    const activeRestaurantData = useMemo(
        () =>
            restaurants.find(
                (restaurant) => String(restaurant.id) === String(activeRestaurant)
            ),
        [activeRestaurant, restaurants]
    );

    const menuCountByRestaurant = useMemo(() => {
        const counts = new Map();

        menuItems.forEach((item) => {
            const key = String(item.restaurant_id ?? "");
            counts.set(key, (counts.get(key) || 0) + 1);
        });

        return counts;
    }, [menuItems]);

    const activeRestaurantCategories = useMemo(() => {
        const categoryMap = new Map();

        menuItems
            .filter((item) => String(item.restaurant_id) === String(activeRestaurant))
            .forEach((item) => {
                categoryMap.set(String(item.category), {
                    id: String(item.category),
                    name: item.categoryName,
                });
            });

        return Array.from(categoryMap.values());
    }, [activeRestaurant, menuItems]);

    const subtotal = cartItems.reduce(
        (total, item) => total + Number(item.price ?? 0) * Number(item.quantity ?? 1),
        0
    );
    const itemCount = cartItems.reduce(
        (total, item) => total + Number(item.quantity ?? 1),
        0
    );

    const addToCart = (product) => {
        setCartItems((current) => {
            const existingIndex = current.findIndex(
                (item) =>
                    item.id === product.id &&
                    item.size === product.size &&
                    item.notes === product.notes
            );

            if (existingIndex === -1) return [...current, product];

            return current.map((item, index) =>
                index === existingIndex
                    ? { ...item, quantity: item.quantity + product.quantity }
                    : item
            );
        });
    };

    const changeQuantity = (indexToChange, amount) => {
        setCartItems((items) =>
            items
                .map((item, index) =>
                    index === indexToChange
                        ? { ...item, quantity: Math.max(0, item.quantity + amount) }
                        : item
                )
                .filter((item) => item.quantity > 0)
        );
    };

    const submitOrder = async () => {
        if (!cartItems.length) return;

        setIsSubmitting(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            if (activeOrderId) {
                await addItemsToDineInOrder(activeOrderId, cartItems);
            } else {
                const response = await createDineInOrder(cartItems, tableId);
                const createdOrderId = getCreatedOrderId(response);

                if (createdOrderId) {
                    sessionStorage.setItem(orderStorageKey, String(createdOrderId));
                    setActiveOrderId(String(createdOrderId));
                }
            }

            setCartItems([]);
            setSuccessMessage(
                activeOrderId
                    ? "Items were added to your table order."
                    : "Your order was sent to the kitchen."
            );
        } catch (error) {
            const validationErrors = error.response?.data?.errors;
            const firstValidationError = validationErrors
                ? Object.values(validationErrors).flat().find(Boolean)
                : "";

            setErrorMessage(
                firstValidationError ||
                    error.response?.data?.message ||
                    error.message ||
                    "Order could not be sent."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-dvh bg-[radial-gradient(circle_at_top_left,rgba(246,198,91,0.26),transparent_32%),radial-gradient(circle_at_top_right,rgba(31,117,93,0.16),transparent_28%),linear-gradient(135deg,#FFF9EC_0%,#F2DCB8_50%,#D5AA78_100%)] font-[Raleway] text-[#241F1D]">
            <header className="sticky top-0 z-30 border-b border-[#B75D42]/25 bg-[#6B3528]/95 px-4 py-3 text-white shadow-[0_12px_30px_rgba(107,53,40,0.16)] backdrop-blur">
                <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#D8A23A] text-[#241707] shadow-sm">
                            <Utensils size={20} />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-black text-white">
                                Big-4 Menu
                            </p>
                            <p className="text-xs font-bold text-white/60">
                                Table {tableId}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => itemCount > 0 && setIsMobileCartOpen(true)}
                        className="relative grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/10 text-[#F6C65B] shadow-sm transition active:scale-95 lg:pointer-events-none"
                        aria-label="Open bill"
                    >
                        <ShoppingBag size={20} />
                        {itemCount > 0 && (
                            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#D8A23A] px-1 text-[10px] font-black text-[#241707]">
                                {itemCount}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            <main className={`mx-auto grid max-w-7xl gap-4 px-3 pt-4 sm:px-4 sm:pt-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start ${itemCount ? "pb-28 lg:pb-8" : "pb-8"}`}>
                <div className="min-w-0">
                    <section className="mb-4 overflow-hidden rounded-2xl border border-[#6F1515]/15 bg-[#fffdf8]/95 p-4 shadow-[0_18px_45px_rgba(70,45,30,0.14)] sm:mb-5 sm:p-5">
                        <p className="mb-2 inline-flex rounded-full bg-[#175F48]/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-[#175F48]">
                            Dine in ordering
                        </p>
                        <h1 className="text-xl font-black text-[#201A18] sm:text-2xl">
                            Choose a restaurant
                        </h1>
                        <p className="mt-1 text-sm font-semibold text-[#5F504A]">
                            Pick a restaurant to filter its menu. Tap a dish to customize it.
                        </p>
                    </section>

                    {successMessage && (
                        <p className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
                            <CheckCircle2 size={18} />
                            {successMessage}
                        </p>
                    )}

                    {errorMessage && (
                        <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
                            {errorMessage}
                        </p>
                    )}

                    <section className="min-w-0">
                        {isLoading ? (
                            <div className="rounded-2xl border border-[#E7DCD6] bg-white/80 px-6 py-14 text-center">
                                <h2 className="text-lg font-black">Loading restaurants...</h2>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                                {restaurants.map((restaurant) => (
                                    <RestaurantSelectCard
                                        key={restaurant.id}
                                        restaurant={restaurant}
                                        itemCount={menuCountByRestaurant.get(String(restaurant.id)) || 0}
                                        isActive={String(activeRestaurant) === String(restaurant.id)}
                                        onSelect={() => {
                                            setActiveRestaurant(String(restaurant.id));
                                            setActiveCategory("all");
                                            setSearch("");
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="mt-4 min-w-0 rounded-2xl border border-[#6F1515]/15 bg-[#fffdf8]/90 p-3 shadow-[0_18px_45px_rgba(70,45,30,0.12)] sm:mt-5 sm:p-4">
                        {activeRestaurantData ? (
                            <>
                                <div className="mb-4 flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-[#6B3528] via-[#A94F3A] to-[#1F755D] p-3 text-white sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <img
                                            src={getRestaurantImageUrl(activeRestaurantData)}
                                            alt={activeRestaurantData.name}
                                            className="h-14 w-14 shrink-0 rounded-xl object-cover ring-2 ring-white/20"
                                        />
                                        <div className="min-w-0">
                                            <p className="text-xs font-black uppercase tracking-wide text-[#F6C65B]">
                                                Menu
                                            </p>
                                                <h2 className="truncate text-lg font-black sm:text-xl">
                                                {activeRestaurantData.name}
                                            </h2>
                                        </div>
                                    </div>

                                    <label className="flex h-12 min-w-0 items-center gap-3 rounded-xl border border-white/15 bg-white/15 px-4 backdrop-blur sm:w-[340px]">
                                        <Search size={18} className="text-[#F6C65B]" />
                                        <input
                                            value={search}
                                            onChange={(event) => setSearch(event.target.value)}
                                            placeholder="Search this menu..."
                                            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/55"
                                        />
                                    </label>
                                </div>

                                <CategoryTabs
                                    activeCategory={activeCategory}
                                    setActiveCategory={setActiveCategory}
                                    categories={activeRestaurantCategories}
                                />

                                {visibleItems.length ? (
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                                        {visibleItems.map((item) => (
                                            <MenuItemCard
                                                key={item.id}
                                                item={item}
                                                onOpen={() => setSelectedItem(item)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-[#D8C8C1] bg-white/70 px-6 py-14 text-center">
                                        <h3 className="text-lg font-black">No items found</h3>
                                        <p className="mt-1 text-sm font-semibold text-[#5F504A]">
                                            Try another search or category.
                                        </p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="rounded-2xl bg-gradient-to-br from-[#6B3528] via-[#A94F3A] to-[#1F755D] px-6 py-14 text-center text-white">
                                <ShoppingBag className="mx-auto text-[#F6C65B]" size={34} />
                                <h2 className="mt-3 text-lg font-black">
                                    Choose a restaurant to see its dishes
                                </h2>
                                <p className="mt-1 text-sm font-medium text-white/70">
                                    The dish modal will open only when you tap a food item.
                                </p>
                            </div>
                        )}
                    </section>
                </div>

                <aside className="hidden lg:block lg:sticky lg:top-24">
                    <OrderPanel
                        cartItems={cartItems}
                        itemCount={itemCount}
                        subtotal={subtotal}
                        onChangeQuantity={changeQuantity}
                        onRemoveItem={(indexToRemove) =>
                            setCartItems((items) =>
                                items.filter((_, currentIndex) => currentIndex !== indexToRemove)
                            )
                        }
                        onSubmit={submitOrder}
                        isSubmitting={isSubmitting}
                    />
                </aside>
            </main>

            <MobileOrderBar
                cartItems={cartItems}
                itemCount={itemCount}
                subtotal={subtotal}
                onChangeQuantity={changeQuantity}
                onRemoveItem={(indexToRemove) =>
                    setCartItems((items) =>
                        items.filter((_, currentIndex) => currentIndex !== indexToRemove)
                    )
                }
                onSubmit={submitOrder}
                isSubmitting={isSubmitting}
                isOpen={isMobileCartOpen}
                onOpen={() => setIsMobileCartOpen(true)}
                onClose={() => setIsMobileCartOpen(false)}
            />

            {selectedItem && (
                <ProductModal
                    isOpen={Boolean(selectedItem)}
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    addToCart={addToCart}
                />
            )}
        </div>
    );
}

export default DineInOrder;
