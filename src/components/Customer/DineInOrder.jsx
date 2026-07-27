import {
    Banknote,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    CreditCard,
    Minus,
    Moon,
    Plus,
    ReceiptText,
    Search,
    ShoppingBag,
    Sun,
    Trash2,
    Utensils,
    X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import api from "../../API/axios";
import onboardingChefsTasting from "../../assets/onboarding-chefs-tasting.jpg";
import onboardingMediterraneanBar from "../../assets/onboarding-mediterranean-bar.jpg";
import onboardingRestaurantRoom from "../../assets/onboarding-restaurant-room.jpg";
import {
    confirmStripePayment,
    createStripeCardElement,
    findStripeClientSecret,
} from "../../utils/stripePayments";
import { useTheme } from "../../context/ThemeContext";
import { getStoredToken } from "../../utils/auth";
import CategoryTabs from "../Cashier/CategoryTabs";
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

const getFirstRecord = (data) => getList(data)[0] || data?.table || data?.data || data;

const getTableToken = (table) =>
    table?.table_token ??
    table?.tableToken ??
    table?.table?.table_token ??
    table?.table?.tableToken ??
    table?.table?.token ??
    table?.token ??
    table?.qr_token ??
    table?.qrToken ??
    table?.dine_in_token ??
    table?.dineInToken ??
    "";

const getTableNumber = (table, fallback) =>
    table?.table_number ?? table?.tableNumber ?? table?.number ?? fallback;

const getTableTokenFromUrl = (tableId, search) => {
    const params = new URLSearchParams(search);
    const explicitToken =
        params.get("token") ||
        params.get("table_token") ||
        params.get("tableToken") ||
        params.get("qr_token") ||
        params.get("qrToken");

    if (explicitToken) return explicitToken;
    if (tableId && !/^\d+$/.test(String(tableId))) return tableId;

    return "";
};

const getTableTokenHeaders = (tableToken) => ({
    ...(tableToken ? { "Table-Token": tableToken } : {}),
});

const fetchTableDetails = async (tableId) => {
    if (!getStoredToken()) return null;

    try {
        const response = await api.get(`/tables/${tableId}`);
        return getFirstRecord(response.data);
    } catch {
        return null;
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

const buildOrderFormData = (cartItems, tableId, orderType, tableToken) => {
    const formData = new FormData();
    const restaurantId = cartItems.find((item) => item.restaurant_id)?.restaurant_id;

    appendIfPresent(formData, "order_type", orderType);
    appendIfPresent(formData, "type", orderType);
    appendIfPresent(formData, "service_type", orderType);
    appendIfPresent(formData, "kind", orderType);
    appendIfPresent(formData, "order_source", "dine_in");
    appendIfPresent(formData, "source", "dine_in");
    appendIfPresent(formData, "is_takeaway", 0);
    appendIfPresent(formData, "restaurant_id", restaurantId);
    appendIfPresent(formData, "table_id", tableId);
    appendIfPresent(formData, "table_number", tableId);
    appendIfPresent(formData, "table_token", tableToken);

    cartItems.forEach((item, index) => {
        const unitPrice = Number(item.price ?? 0);
        const quantity = Number(item.quantity ?? 1);
        const modifierOptions = item.selectedModifierOptions ?? [];
        const notes = [`Table ${tableId}`, item.size, item.notes].filter(Boolean).join(" · ");

        appendIfPresent(formData, `items[${index}][food_id]`, item.food_id || item.id);
        appendIfPresent(formData, `items[${index}][menu_item_id]`, item.food_id || item.id);
        appendIfPresent(formData, `items[${index}][restaurant_id]`, item.restaurant_id);
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

const buildAddItemFormData = (item, tableToken) => {
    const formData = new FormData();
    const modifierOptions = item.selectedModifierOptions ?? [];

    appendIfPresent(formData, "food_id", item.food_id || item.id);
    appendIfPresent(formData, "menu_item_id", item.food_id || item.id);
    appendIfPresent(formData, "restaurant_id", item.restaurant_id);
    appendIfPresent(formData, "quantity", Number(item.quantity ?? 1));
    appendIfPresent(formData, "unit_price", Number(item.price ?? 0));
    appendIfPresent(formData, "price", Number(item.price ?? 0));
    appendIfPresent(
        formData,
        "total_price",
        Number(item.price ?? 0) * Number(item.quantity ?? 1)
    );
    appendIfPresent(formData, "notes", [item.size, item.notes].filter(Boolean).join(" · "));
    appendIfPresent(formData, "table_token", tableToken);

    modifierOptions.forEach((option, optionIndex) => {
        appendIfPresent(
            formData,
            `modifiers[${optionIndex}]`,
            option.modifier_option_id ?? option.id
        );
        appendIfPresent(
            formData,
            `modifier_options[${optionIndex}]`,
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

const collectInvoiceIds = (value, ids = []) => {
    if (!value || typeof value !== "object") return ids;

    const invoiceId =
        value.invoice_id ??
        value.invoice?.id ??
        value.order?.invoice_id ??
        value.order?.invoice?.id ??
        value.restaurant_invoice?.invoice_id ??
        value.restaurantInvoice?.invoice_id ??
        value.data?.invoice_id ??
        value.data?.invoice?.id ??
        value.data?.order?.invoice_id ??
        value.data?.order?.invoice?.id ??
        value.data?.restaurant_invoice?.invoice_id ??
        value.data?.restaurantInvoice?.invoice_id;

    if (invoiceId && !ids.some((id) => String(id) === String(invoiceId))) {
        ids.push(invoiceId);
    }

    Object.values(value).forEach((child) => {
        if (child && typeof child === "object") {
            collectInvoiceIds(child, ids);
        }
    });

    return ids;
};

const getCreatedInvoiceId = (data) => collectInvoiceIds(data)[0] ?? null;

async function selectDineInPayment(invoiceId, orderId, tableToken, paymentMethod) {
    const formData = new FormData();

    appendIfPresent(formData, "invoice_id", invoiceId);
    appendIfPresent(formData, "order_id", orderId);
    appendIfPresent(formData, "table_token", tableToken);

    const endpoint =
        paymentMethod === "stripe"
            ? "/customer-dine-in/payments/stripe/create-intent"
            : "/customer-dine-in/payments/cash";

    const response = await api.post(endpoint, formData, {
        headers: getTableTokenHeaders(tableToken),
    });
    return response.data;
}

async function selectDineInPaymentForCurrentOrder(
    invoiceId,
    orderId,
    tableToken,
    paymentMethod
) {
    try {
        return await selectDineInPayment(
            invoiceId || orderId,
            orderId,
            tableToken,
            paymentMethod
        );
    } catch (error) {
        const message = JSON.stringify(error.response?.data || error.message || "");
        const shouldRetryWithOrderId =
            orderId &&
            invoiceId &&
            String(orderId) !== String(invoiceId) &&
            message.includes("App\\\\Models\\\\Order");

        if (!shouldRetryWithOrderId) throw error;

        return selectDineInPayment(orderId, orderId, tableToken, paymentMethod);
    }
}

async function createDineInOrder(cartItems, tableId, tableToken) {
    const typeVariants = ["dine-in", "dine_in", "dine in", "dinein", "DINE-IN"];
    let lastError;

    for (const orderType of typeVariants) {
        try {
            const response = await api.post(
                "/customer-dine-in/orders",
                buildOrderFormData(cartItems, tableId, orderType, tableToken),
                {
                    headers: getTableTokenHeaders(tableToken),
                }
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

async function addItemsToDineInOrder(orderId, cartItems, tableToken) {
    const responses = [];

    for (const item of cartItems) {
        const response = await api.post(
            `/customer-dine-in/orders/${orderId}/items`,
            buildAddItemFormData(item, tableToken),
            {
                headers: getTableTokenHeaders(tableToken),
            }
        );

        responses.push(response.data);
    }

    return responses;
}

function CustomerFoodCard({ item, onOpen }) {
    const imageUrl =
        item.image ||
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
    const isDiet =
        item?.is_diet ??
        item?.isDiet ??
        item?.diet ??
        item?.diet_food ??
        item?.dietFood ??
        item?.is_diet_food;

    return (
        <article className="customer-food-card group grid grid-cols-[118px_minmax(0,1fr)] overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.07] text-white shadow-[0_18px_45px_rgba(0,0,0,0.22)] backdrop-blur transition duration-300 hover:border-[#7F1D1D]/45 hover:bg-white/[0.10] sm:block sm:rounded-[26px] sm:hover:-translate-y-1">
            <div className="relative min-h-[150px] overflow-hidden bg-[#111719] sm:h-44">
                <img
                    src={imageUrl}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111719] via-[#111719]/25 to-transparent" />
                <span
                    className={`absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide shadow-lg sm:left-3 sm:top-3 sm:px-3 sm:text-[11px] ${
                        isDiet
                            ? "bg-[#047857] text-[#D1FAE5]"
                            : "bg-[#334155] text-white"
                    }`}
                >
                    {isDiet ? "Diet" : "Regular"}
                </span>
                <span className="absolute bottom-2 right-2 rounded-full bg-black/55 px-2.5 py-1 text-xs font-black text-[#FFD166] backdrop-blur sm:bottom-3 sm:right-3 sm:px-3 sm:text-sm">
                    ${Number(item.price ?? 0).toFixed(2)}
                </span>
            </div>

            <div className="flex min-h-[150px] min-w-0 flex-col p-3 sm:min-h-44 sm:p-4">
                <p className="truncate text-xs font-black uppercase tracking-wide text-[#FFD166]">
                    {item.restaurantName}
                </p>
                <h2 className="mt-1.5 line-clamp-2 text-base font-black leading-5 text-white sm:mt-2 sm:line-clamp-1 sm:text-xl sm:leading-7">
                    {item.title}
                </h2>
                <p className="mt-1.5 line-clamp-2 text-xs font-semibold leading-5 text-white/62 sm:mt-2 sm:text-sm sm:leading-6">
                    {item.description || item.categoryName || "Freshly prepared for your table."}
                </p>

                <div className="mt-auto flex items-center justify-between gap-2 pt-3 sm:gap-3 sm:pt-5">
                    <span className="truncate text-xs font-bold text-white/45 sm:text-sm">Tap to customize</span>
                    <button
                        type="button"
                        onClick={onOpen}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#7F1D1D] text-white shadow-[0_14px_28px_rgba(127,29,29,0.28)] transition hover:bg-[#681718] active:scale-95 sm:h-11 sm:w-11"
                        aria-label={`Add ${item.title}`}
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </div>
        </article>
    );
}

function RestaurantPicker({ restaurants, menuItems, activeRestaurant, onSelect }) {
    if (!restaurants.length) return null;

    const getItemCount = (restaurantId) =>
        menuItems.filter((item) => String(item.restaurant_id) === String(restaurantId)).length;

    return (
        <section className="relative mb-3 overflow-hidden rounded-[24px] border border-[#E8D2C7] bg-[#FFF9F1] p-3 text-[#251918] shadow-[0_18px_42px_rgba(127,29,29,0.10)] sm:mb-4 sm:rounded-[28px] sm:p-4 dark:border-white/10 dark:bg-[#151A1D] dark:text-white dark:shadow-[0_18px_45px_rgba(0,0,0,0.20)]">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#7F1D1D] via-[#FFD166] to-[#16A34A]" />
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9A6400] dark:text-[#FFD166]">
                        Choose restaurant
                    </p>
                    <h2 className="mt-1 text-xl font-black text-[#241716] dark:text-white sm:text-2xl">
                        Pick the kitchen you want
                    </h2>
                </div>

            </div>

            <div className="customer-order-scroll relative flex gap-3 overflow-x-auto pb-1">
                {restaurants.map((restaurant) => {
                    const active = String(activeRestaurant) === String(restaurant.id);

                    return (
                        <button
                            key={restaurant.id}
                            type="button"
                            onClick={() => onSelect(String(restaurant.id))}
                            className={`flex min-w-[230px] items-center gap-3 rounded-2xl border p-2.5 text-left shadow-sm transition hover:-translate-y-0.5 active:scale-[0.99] sm:min-w-[270px] ${
                                active
                                    ? "border-[#D59A19] bg-[linear-gradient(135deg,#FFF9E8_0%,#FFE29A_58%,#FFD166_100%)] text-[#160F0E] shadow-[0_14px_30px_rgba(154,100,0,0.16)] ring-2 ring-[#FFD166]/30 dark:border-[#FFD166]/70 dark:bg-[linear-gradient(135deg,#FFF9E8_0%,#FFE29A_58%,#FFD166_100%)] dark:text-[#160F0E]"
                                    : "border-[#E8CDBE] bg-white text-[#251918] hover:border-[#C48A17]/60 hover:bg-[#FFF8EC] dark:border-white/10 dark:bg-[#101719] dark:text-white dark:hover:border-[#FFD166]/40 dark:hover:bg-white/[0.08]"
                            }`}
                        >
                            <img
                                src={getRestaurantImageUrl(restaurant)}
                                alt={restaurant.name}
                                className={`h-14 w-14 shrink-0 rounded-2xl object-cover ring-2 ${
                                    active ? "ring-[#FFD166]/60" : "ring-[#FFD166]/20 dark:ring-white/10"
                                }`}
                            />
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-black">
                                    {restaurant.name}
                                </span>
                                <span className={`mt-1 block text-xs font-black ${active ? "text-[#7F1D1D] dark:text-[#7F1D1D]" : "text-[#7A6258] dark:text-white/55"}`}>
                                    {getItemCount(restaurant.id)} dishes
                                </span>
                            </span>
                            <span
                                className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${
                                    active
                                        ? "bg-[#7F1D1D] text-white shadow-[0_10px_20px_rgba(127,29,29,0.22)] dark:bg-[#FFD166] dark:text-[#251918]"
                                        : "bg-[#FFF1CF] text-[#9A6400] dark:bg-white/10 dark:text-[#FFD166]"
                                }`}
                            >
                                {active ? <CheckCircle2 size={18} /> : <ChevronRight size={17} />}
                            </span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}

function FeaturedDishSlider({ featuredItems, tableNumber, onGoToMenu }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isSliderPaused, setIsSliderPaused] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartX = useRef(0);
    const activeItem = featuredItems[activeIndex];

    useEffect(() => {
        if (!featuredItems.length || isSliderPaused) return undefined;

        setActiveIndex((currentIndex) =>
            Math.min(currentIndex, featuredItems.length - 1)
        );

        const intervalId = window.setInterval(() => {
            setActiveIndex((currentIndex) => (currentIndex + 1) % featuredItems.length);
        }, 3000);

        return () => window.clearInterval(intervalId);
    }, [featuredItems.length, isSliderPaused]);

    const selectByIndex = (index) => {
        if (!featuredItems.length) return;

        setActiveIndex((index + featuredItems.length) % featuredItems.length);
    };

    const goToPreviousSlide = () => {
        selectByIndex(activeIndex - 1);
    };

    const goToNextSlide = () => {
        selectByIndex(activeIndex + 1);
    };

    const handlePointerDown = (event) => {
        if (event.target.closest("a,button")) return;

        setIsSliderPaused(true);
        setIsDragging(true);
        dragStartX.current = event.clientX;
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event) => {
        if (!isDragging) return;

        setDragOffset(event.clientX - dragStartX.current);
    };

    const handlePointerUp = (event) => {
        if (!isDragging) return;

        const distance = event.clientX - dragStartX.current;

        if (distance > 80) {
            goToPreviousSlide();
        } else if (distance < -80) {
            goToNextSlide();
        }

        setDragOffset(0);
        setIsDragging(false);
        setIsSliderPaused(false);
    };

    if (!featuredItems.length) {
        return (
            <section className="relative mb-3 h-[320px] w-full overflow-hidden rounded-[24px] border border-white/10 bg-[#101517] px-4 text-white sm:mb-4 sm:h-[380px] sm:rounded-[30px] lg:h-[430px]">
                <div className="mx-auto flex h-full max-w-7xl items-center justify-center text-center">
                    <div>
                        <h2 className="text-2xl font-black">Loading dishes...</h2>
                        <p className="mt-2 text-sm font-semibold text-white/55">
                            Preparing the dine-in menu for table {tableNumber}.
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section
            onMouseEnter={() => setIsSliderPaused(true)}
            onMouseLeave={() => !isDragging && setIsSliderPaused(false)}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative mb-3 h-[320px] w-full touch-pan-y overflow-hidden rounded-[24px] border border-white/10 bg-[#101517] text-white shadow-[0_28px_70px_rgba(0,0,0,0.28)] sm:mb-4 sm:h-[380px] sm:rounded-[30px] lg:h-[430px]"
        >
            <div
                className={`absolute inset-0 flex cursor-grab select-none ${
                    isDragging
                        ? "cursor-grabbing"
                        : "transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                }`}
                style={{
                    transform: `translate3d(calc(-${activeIndex * 100}% + ${dragOffset}px), 0, 0)`,
                }}
            >
                {featuredItems.map((item) => (
                    <article
                        key={`${item.restaurant_id}-${item.id}`}
                        className="relative h-full w-full min-w-full overflow-hidden"
                    >
                        <img
                            src={item.image}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,13,14,0.86)_0%,rgba(10,13,14,0.58)_42%,rgba(10,13,14,0.10)_100%)]" />
                        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#101517] to-transparent" />

                        <div className="relative z-10 mx-auto grid h-full max-w-7xl items-end gap-4 px-4 py-7 sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,0.95fr)_280px] lg:items-center">
                            <div className="customer-image-text max-w-2xl pb-8 sm:pb-9 lg:pb-0">
                                <p className="mb-2 inline-flex max-w-full rounded-full bg-[#FFD166] px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-[#241707] shadow-[0_12px_24px_rgba(255,209,102,0.18)] sm:mb-3 sm:px-3.5 sm:text-[11px]">
                                    Featured from {item.restaurantName}
                                </p>
                                <h1 className="line-clamp-2 text-3xl font-black leading-[1.02] tracking-normal text-white drop-shadow sm:text-5xl lg:text-6xl">
                                    {item.title}
                                </h1>
                                <p className="customer-image-text mt-3 line-clamp-2 max-w-xl text-sm font-extrabold leading-6 !text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.95)] sm:text-base sm:leading-7">
                                    {item.description || `Freshly prepared by ${item.restaurantName}.`}
                                </p>

                                <div className="mt-4 flex flex-wrap items-center gap-2.5 sm:mt-5 sm:gap-3">
                                    <button
                                        type="button"
                                        onClick={() => onGoToMenu(item)}
                                        className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#7F1D1D] px-4 py-2.5 text-xs font-black text-white shadow-[0_18px_36px_rgba(127,29,29,0.30)] transition hover:bg-[#681718] active:scale-[0.98] sm:min-h-[46px] sm:rounded-2xl sm:px-5 sm:py-3 sm:text-sm"
                                    >
                                        Go to menu
                                        <ChevronRight size={18} />
                                    </button>
                                    <span className="rounded-xl border border-white/10 bg-black/28 px-3 py-2 text-sm font-black text-[#FFD166] backdrop-blur sm:rounded-2xl sm:px-3.5 sm:py-2.5 sm:text-base">
                                        ${Number(item.price ?? 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <div className="hidden justify-self-end lg:block">
                                <div className="w-[260px] rounded-[26px] border border-white/10 bg-black/30 p-3 shadow-[0_30px_70px_rgba(0,0,0,0.28)] backdrop-blur xl:w-[280px]">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="aspect-[4/3] w-full rounded-[20px] object-cover"
                                    />
                                    <div className="flex items-center justify-between gap-3 pt-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-black text-white">
                                                {item.restaurantName}
                                            </p>
                                            <p className="truncate text-xs font-bold text-white/52">
                                                {item.categoryName}
                                            </p>
                                        </div>
                                        <ShoppingBag className="shrink-0 text-[#FFD166]" size={22} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            <div className="absolute bottom-4 left-1/2 z-20 flex max-w-[58vw] -translate-x-1/2 items-center gap-1.5 overflow-hidden sm:bottom-7 sm:gap-2">
                {featuredItems.map((item, index) => (
                    <button
                        key={`${item.restaurant_id}-${item.id}-dot`}
                        type="button"
                        onClick={() => selectByIndex(index)}
                        className={`h-2 shrink-0 rounded-full transition sm:h-2.5 ${
                            index === activeIndex ? "w-7 bg-[#FFD166] sm:w-9" : "w-2 bg-white/40 sm:w-2.5"
                        }`}
                        aria-label={`Show ${item.title}`}
                    />
                ))}
            </div>

            {activeItem && (
                <div className="pointer-events-none absolute right-3 top-3 z-20 rounded-xl border border-white/10 bg-black/28 px-3 py-2 text-xs font-black text-white/70 backdrop-blur sm:right-5 sm:top-5 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                    {activeIndex + 1} / {featuredItems.length}
                </div>
            )}
        </section>
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
    paymentMethod,
    onPaymentMethodChange,
    isStripeReady,
    stripeCardMessage,
    stripeCardContainerRef,
    layout = "desktop",
    onClose,
}) {
    const isMobile = layout === "mobile";

    return (
        <section
            className={`flex flex-col overflow-hidden border border-white/10 bg-[#151A1D]/92 text-white shadow-[0_28px_70px_rgba(0,0,0,0.30)] backdrop-blur-xl ${
                isMobile
                    ? "max-h-[74dvh] rounded-[28px]"
                    : "max-h-[calc(100dvh-7.5rem)] min-h-[520px] rounded-[28px]"
            }`}
        >
            <div className={`shrink-0 border-b border-white/10 bg-white/[0.03] ${isMobile ? "p-4" : "p-5"}`}>
                <div className="flex items-center gap-3">
                    <div className={`${isMobile ? "h-10 w-10" : "h-12 w-12"} grid place-items-center rounded-2xl bg-[#7F1D1D] text-white shadow-[0_14px_32px_rgba(127,29,29,0.28)]`}>
                        <ReceiptText size={isMobile ? 19 : 22} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className={`${isMobile ? "text-xl" : "text-2xl"} font-black leading-7`}>Your order</h2>
                        <p className="text-sm font-bold text-white/55">
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

            <div className={`customer-order-scroll min-h-0 flex-1 space-y-3 overflow-y-auto ${isMobile ? "p-3" : "p-4"}`}>
                {cartItems.length ? (
                    cartItems.map((item, index) => (
                        <div
                            key={`${item.id}-${item.notes}-${index}`}
                            className={`rounded-2xl border border-white/10 bg-white/[0.07] ${isMobile ? "p-3" : "p-4"}`}
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
                                <div className="flex shrink-0 items-center rounded-xl border border-white/10 bg-black/20 p-1">
                                    <button
                                        type="button"
                                        onClick={() => onChangeQuantity(index, -1)}
                                        className={`${isMobile ? "h-9 w-9" : "h-10 w-10"} grid place-items-center rounded-lg text-[#FFD166]`}
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
                                        className={`${isMobile ? "h-9 w-9" : "h-10 w-10"} grid place-items-center rounded-lg text-[#FFD166]`}
                                        aria-label="Increase quantity"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <span className={`${isMobile ? "text-base" : "text-lg"} shrink-0 font-black text-[#FFD166]`}>
                                    ${(Number(item.price ?? 0) * item.quantity).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex h-full min-h-64 flex-col items-center justify-center px-6 text-center">
                        <ShoppingBag className="text-[#FFD166]" size={34} />
                        <h3 className="mt-3 font-black">Your order is empty</h3>
                        <p className="mt-1 text-sm font-medium text-white/55">
                            Add dishes and they will appear here.
                        </p>
                    </div>
                )}
            </div>

            <div className={`shrink-0 border-t border-white/10 ${isMobile ? "p-3" : "p-5"}`}>
            <div className="mb-4">
                <p className="mb-2 text-xs font-black uppercase tracking-wide text-white/55">
                    Payment method
                </p>
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/10 p-1">
                    {[
                        { id: "cash", label: "Cash", icon: Banknote },
                        { id: "stripe", label: "Stripe", icon: CreditCard },
                    ].map((method) => {
                        const Icon = method.icon;
                        const isActive = paymentMethod === method.id;

                        return (
                            <button
                                key={method.id}
                                type="button"
                                onClick={() => onPaymentMethodChange(method.id)}
                                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-black transition ${
                                    isActive
                                        ? "bg-[#FFD166] text-[#151A1D]"
                                        : "text-white/70 hover:bg-white/10 hover:text-white"
                                }`}
                            >
                                <Icon size={16} />
                                {method.label}
                            </button>
                        );
                    })}
                </div>
                {paymentMethod === "cash" && (
                    <p className="mt-2 text-xs font-semibold text-white/55">
                        The waiter will collect and confirm the cash payment.
                    </p>
                )}
                {paymentMethod === "stripe" && (
                    <div className="mt-3 rounded-xl border border-white/10 bg-white/10 p-3">
                        <p className="mb-2 text-xs font-black uppercase tracking-wide text-white/55">
                            Card
                        </p>
                        <div
                            ref={stripeCardContainerRef}
                            className="rounded-lg border border-white/10 bg-white px-3 py-3"
                        />
                        <p className={`mt-2 text-xs font-semibold ${stripeCardMessage ? "text-red-200" : "text-white/55"}`}>
                            {stripeCardMessage || (isStripeReady ? "Card ready." : "Loading Stripe...")}
                        </p>
                    </div>
                )}
            </div>
            <div className={`space-y-3 rounded-2xl border border-white/10 bg-white/[0.07] ${isMobile ? "p-3" : "p-4"} text-base`}>
                <div className="flex items-center justify-between text-white/65">
                    <span>Subtotal</span>
                    <span className="font-black text-white">
                        ${subtotal.toFixed(2)}
                    </span>
                </div>
                <div className="border-t border-dashed border-white/20" />
                <div className="flex items-end justify-between">
                    <span className="text-lg font-black">Total</span>
                    <span className={`${isMobile ? "text-2xl" : "text-3xl"} font-black text-[#FFD166]`}>
                        ${subtotal.toFixed(2)}
                    </span>
                </div>
            </div>

            <div className="mt-4">
                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={!itemCount || isSubmitting || (paymentMethod === "stripe" && !isStripeReady)}
                    className="h-12 w-full rounded-2xl bg-[#7F1D1D] px-4 text-sm font-black text-white shadow-[0_16px_32px_rgba(127,29,29,0.25)] transition hover:bg-[#681718] disabled:cursor-not-allowed disabled:!bg-[#7F1D1D] disabled:!text-white disabled:opacity-65 disabled:shadow-none"
                >
                    {isSubmitting ? "Sending..." : "Confirm order"}
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
    paymentMethod,
    onPaymentMethodChange,
    isStripeReady,
    stripeCardMessage,
    stripeCardContainerRef,
    isOpen,
    onOpen,
    onClose,
}) {
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (isOpen) setIsClosing(false);
    }, [isOpen]);

    const closeBill = () => {
        if (isClosing) return;

        setIsClosing(true);
        window.setTimeout(onClose, 180);
    };

    if (!itemCount) return null;

    return (
        <div>
            {isOpen && (
                <div
                    className={`${isClosing ? "order-backdrop-exit" : "order-backdrop-enter"} fixed inset-0 z-[300] flex items-end justify-center bg-black/35 p-3 backdrop-blur-[2px] sm:p-5`}
                    onClick={closeBill}
                >
                    <div
                        className={`${isClosing ? "order-sheet-exit" : "order-sheet-enter"} w-[min(92vw,380px)] sm:w-[min(84vw,420px)]`}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <OrderPanel
                            cartItems={cartItems}
                            itemCount={itemCount}
                            subtotal={subtotal}
                            onChangeQuantity={onChangeQuantity}
                            onRemoveItem={onRemoveItem}
                            onSubmit={onSubmit}
                            isSubmitting={isSubmitting}
                            paymentMethod={paymentMethod}
                            onPaymentMethodChange={onPaymentMethodChange}
                            isStripeReady={isStripeReady}
                            stripeCardMessage={stripeCardMessage}
                            stripeCardContainerRef={stripeCardContainerRef}
                            layout="mobile"
                            onClose={closeBill}
                        />
                    </div>
                </div>
            )}

            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 py-3">
                <div className="pointer-events-auto mx-auto flex max-w-[760px] items-center gap-2.5 rounded-[26px] border border-[#E8D2C7]/80 bg-[#FFF8EF]/92 p-2 shadow-[0_-10px_36px_rgba(127,29,29,0.13)] backdrop-blur-xl dark:border-white/10 dark:bg-[#101517]/92 dark:shadow-[0_-18px_40px_rgba(0,0,0,0.28)] sm:gap-3 sm:p-2.5">
                    <button
                        type="button"
                        onClick={() => {
                            setIsClosing(false);
                            onOpen();
                        }}
                        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-[#E6CFC2] bg-white/92 px-3 py-2.5 text-left text-[#251918] shadow-[0_14px_34px_rgba(127,29,29,0.10)] transition hover:border-[#D7B9A8] active:scale-[0.99] dark:border-white/10 dark:bg-white/[0.07] dark:text-white sm:gap-3 sm:px-4 sm:py-3"
                    >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#7F1D1D] text-white shadow-[0_12px_24px_rgba(127,29,29,0.22)] sm:h-10 sm:w-10">
                            <ShoppingBag size={18} />
                        </span>
                        <span className="min-w-0">
                            <span className="block truncate text-sm font-black">
                                {itemCount} items
                            </span>
                            <span className="block text-xs font-bold text-[#7B6A63] dark:text-white/65">
                                View bill
                            </span>
                        </span>
                        <span className="ml-auto shrink-0 rounded-xl bg-[#FFF1CF] px-3 py-1.5 text-base font-black text-[#9A6400] dark:bg-white/10 dark:text-[#FFD166] sm:text-lg">
                            ${subtotal.toFixed(2)}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={isSubmitting || (paymentMethod === "stripe" && !isStripeReady)}
                        className="h-12 shrink-0 rounded-2xl bg-[#7F1D1D] px-5 text-xs font-black text-white shadow-[0_16px_32px_rgba(127,29,29,0.24)] transition hover:bg-[#681718] active:scale-95 disabled:opacity-60 sm:h-14 sm:px-6 sm:text-sm"
                    >
                        {isSubmitting ? "Sending..." : "Confirm"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ConfirmOrderModal({
    cartItems,
    subtotal,
    paymentMethod,
    onPaymentMethodChange,
    isStripeReady,
    stripeCardMessage,
    stripeCardContainerRef,
    isSubmitting,
    onCancel,
    onConfirm,
}) {
    const itemCount = cartItems.reduce(
        (total, item) => total + Number(item.quantity ?? 1),
        0
    );

    return (
        <div className="modal-backdrop-enter fixed inset-0 z-[300] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md">
            <div className="modal-panel-enter w-full max-w-[520px] overflow-hidden rounded-[28px] border border-white/10 bg-[#151A1D] text-white shadow-[0_34px_90px_rgba(0,0,0,0.55)]">
                <div className="border-b border-white/10 bg-white/[0.04] p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#FFD166]">
                                Final check
                            </p>
                            <h2 className="mt-1 text-2xl font-black">
                                Confirm your order
                            </h2>
                            <p className="mt-1 text-sm font-bold text-white/55">
                                {itemCount} item{itemCount === 1 ? "" : "s"} will be sent to the restaurant.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/10 text-white/70 transition hover:bg-white/[0.14] hover:text-white disabled:opacity-50"
                            aria-label="Close confirmation"
                        >
                            <X size={19} />
                        </button>
                    </div>
                </div>

                <div className="customer-order-scroll max-h-[45dvh] space-y-3 overflow-y-auto p-4">
                    {cartItems.map((item, index) => (
                        <div
                            key={`${item.id}-${item.notes}-${index}`}
                            className="rounded-2xl border border-white/10 bg-white/[0.07] p-3"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="line-clamp-2 text-sm font-black text-white">
                                        {item.title}
                                    </p>
                                    <p className="mt-1 text-xs font-bold text-[#FFD166]">
                                        {item.restaurantName} · Qty {item.quantity}
                                    </p>
                                </div>
                                <span className="shrink-0 text-sm font-black text-white">
                                    ${(Number(item.price ?? 0) * item.quantity).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="border-t border-white/10 p-5">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                        <div>
                            <p className="mb-2 text-xs font-black uppercase tracking-wide text-white/55">
                                Payment method
                            </p>
                            <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/10 p-1">
                                {[
                                    { id: "cash", label: "Cash", icon: Banknote },
                                    { id: "stripe", label: "Stripe", icon: CreditCard },
                                ].map((method) => {
                                    const Icon = method.icon;
                                    const isActive = paymentMethod === method.id;

                                    return (
                                        <button
                                            key={method.id}
                                            type="button"
                                            onClick={() => onPaymentMethodChange(method.id)}
                                            disabled={isSubmitting}
                                            className={`flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                                isActive
                                                    ? "bg-[#FFD166] text-[#151A1D]"
                                                    : "text-white/70 hover:bg-white/10 hover:text-white"
                                            }`}
                                        >
                                            <Icon size={16} />
                                            {method.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {paymentMethod === "cash" && (
                            <p className="mt-2 text-xs font-semibold text-white/55">
                                The waiter will collect and confirm the cash payment.
                            </p>
                        )}

                        {paymentMethod === "stripe" && (
                            <div className="mt-3 rounded-xl border border-white/10 bg-white/10 p-3">
                                <p className="mb-2 text-xs font-black uppercase tracking-wide text-white/55">
                                    Card
                                </p>
                                <div
                                    ref={stripeCardContainerRef}
                                    className="rounded-lg border border-white/10 bg-white px-3 py-3"
                                />
                                <p className={`mt-2 text-xs font-semibold ${stripeCardMessage ? "text-red-200" : "text-white/55"}`}>
                                    {stripeCardMessage || (isStripeReady ? "Card ready." : "Loading Stripe...")}
                                </p>
                            </div>
                        )}

                        <div className="mt-3 flex items-end justify-between border-t border-dashed border-white/20 pt-3">
                            <span className="text-lg font-black">Total</span>
                            <span className="text-3xl font-black text-[#FFD166]">
                                ${subtotal.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="h-12 rounded-2xl border border-white/10 bg-white/[0.07] text-sm font-black text-white/72 transition hover:bg-white/[0.12] hover:text-white disabled:opacity-50"
                        >
                            Back
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isSubmitting || (paymentMethod === "stripe" && !isStripeReady)}
                            className="h-12 rounded-2xl bg-[#7F1D1D] text-sm font-black text-white shadow-[0_16px_32px_rgba(127,29,29,0.25)] transition hover:bg-[#681718] disabled:cursor-not-allowed disabled:!bg-[#7F1D1D] disabled:!text-white disabled:opacity-65 disabled:shadow-none"
                        >
                            {isSubmitting ? "Sending..." : "Place order"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const onboardingSlides = [
    {
        image: onboardingMediterraneanBar,
        eyebrow: "Welcome",
        title: "Your table is ready",
        description:
            "Relax, browse the menu, and order directly from your seat whenever you are ready.",
        align: "items-end text-left",
    },
    {
        image: onboardingChefsTasting,
        eyebrow: "Simple ordering",
        title: "Pick your favorites",
        description:
            "Choose a restaurant, filter dishes, customize your meal, and add everything to your bill.",
        align: "items-start text-left",
    },
    {
        image: onboardingRestaurantRoom,
        eyebrow: "Order now",
        title: "Good food is one tap away",
        description:
            "Send your order to the team and keep enjoying your time at the table.",
        align: "items-end text-left",
    },
];

function CustomerOnboarding({ tableNumber, onFinish }) {
    const [activeSlide, setActiveSlide] = useState(0);
    const isLastSlide = activeSlide === onboardingSlides.length - 1;

    const goToPrevious = () =>
        setActiveSlide((current) => Math.max(0, current - 1));

    const goToNext = () => {
        if (isLastSlide) {
            onFinish();
            return;
        }

        setActiveSlide((current) =>
            Math.min(onboardingSlides.length - 1, current + 1)
        );
    };

    return (
        <main className="customer-experience relative min-h-dvh overflow-hidden bg-[#140F0D] font-merriweather text-white">
            <div
                className="absolute inset-0 flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            >
                {onboardingSlides.map((item) => (
                    <img
                        key={item.title}
                        src={item.image}
                        alt=""
                        className="h-full w-full min-w-full object-cover object-center"
                    />
                ))}
            </div>
            <div className="customer-onboarding-overlay absolute inset-0" />

            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-5 sm:px-8">
                <div className="rounded-full border border-white/15 bg-black/25 px-4 py-2 text-xs font-black uppercase tracking-wide text-white/85 backdrop-blur">
                    Table {tableNumber}
                </div>
                <button
                    type="button"
                    onClick={onFinish}
                    className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-white backdrop-blur transition active:scale-95"
                >
                    Skip
                </button>
            </div>

            <div
                className="relative z-10 flex min-h-dvh transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            >
                {onboardingSlides.map((item, index) => (
                    <section
                        key={item.title}
                        className={`flex min-h-dvh w-full min-w-full flex-col justify-end px-5 pb-28 pt-24 sm:px-8 lg:px-12 ${item.align}`}
                    >
                        <div
                            className={`customer-onboarding-copy w-full max-w-xl transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                                index === activeSlide
                                    ? "translate-y-0 opacity-100"
                                    : "translate-y-5 opacity-0"
                            }`}
                        >
                            <p className="customer-onboarding-eyebrow mb-3 inline-flex rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide">
                                {item.eyebrow}
                            </p>
                            <h1 className="customer-onboarding-title max-w-[12ch] text-4xl font-black leading-[1.04] sm:text-6xl">
                                {item.title}
                            </h1>
                            <p className="customer-onboarding-description mt-4 max-w-md text-base font-bold leading-7 sm:text-lg">
                                {item.description}
                            </p>
                        </div>
                    </section>
                ))}
            </div>

            <div className="absolute inset-x-0 bottom-0 z-20 px-5 pb-8 sm:px-8 lg:px-12">
                <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-4">
                    <button
                        type="button"
                        onClick={goToPrevious}
                        disabled={activeSlide === 0}
                        className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur transition active:scale-95 disabled:opacity-35"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft size={22} />
                    </button>

                    <div className="flex items-center gap-2">
                        {onboardingSlides.map((item, index) => (
                            <button
                                key={item.title}
                                type="button"
                                onClick={() => setActiveSlide(index)}
                                className={`h-2.5 rounded-full transition ${
                                    index === activeSlide
                                        ? "w-8 bg-[#D8A23A]"
                                        : "w-2.5 bg-white/45"
                                }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={goToNext}
                        className={`flex h-12 shrink-0 items-center justify-center gap-2 rounded-full font-black shadow-[0_16px_34px_rgba(0,0,0,0.25)] transition active:scale-95 ${
                            isLastSlide
                                ? "min-w-36 bg-[#D8A23A] px-5 text-[#241707]"
                                : "w-12 bg-white text-[#241707]"
                        }`}
                        aria-label={isLastSlide ? "Order now" : "Next slide"}
                    >
                        {isLastSlide ? "Order Now" : <ChevronRight size={22} />}
                    </button>
                </div>
            </div>
        </main>
    );
}

function DineInOrder() {
    const { isLight, toggleTheme } = useTheme();
    const { tableId = "1" } = useParams();
    const location = useLocation();
    const tableTokenFromUrl = useMemo(
        () => getTableTokenFromUrl(tableId, location.search),
        [location.search, tableId]
    );
    const orderStorageKey = `customer-dine-in-order:${tableId}`;
    const invoiceStorageKey = `customer-dine-in-invoice:${tableId}`;
    const tableTokenStorageKey = `customer-dine-in-table-token:${tableId}`;
    const onboardingStorageKey = `customer-dine-in-onboarding:${tableId}`;
    const [restaurants, setRestaurants] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [tableToken, setTableToken] = useState(() =>
        sessionStorage.getItem(tableTokenStorageKey) || ""
    );
    const [tableNumber, setTableNumber] = useState(tableId);
    const [activeRestaurant, setActiveRestaurant] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");
    const [search, setSearch] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [isStripeReady, setIsStripeReady] = useState(false);
    const [stripeCardMessage, setStripeCardMessage] = useState("");
    const [cartItems, setCartItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
    const [isConfirmOrderOpen, setIsConfirmOrderOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeOrderId, setActiveOrderId] = useState(() =>
        sessionStorage.getItem(orderStorageKey)
    );
    const [activeInvoiceId, setActiveInvoiceId] = useState(() =>
        sessionStorage.getItem(invoiceStorageKey)
    );
    const [showOnboarding, setShowOnboarding] = useState(
        () => sessionStorage.getItem(onboardingStorageKey) !== "done"
    );
    const menuSectionRef = useRef(null);
    const stripeCardContainerRef = useRef(null);
    const stripeCardRef = useRef(null);

    useEffect(() => {
        const loadMenu = async () => {
            setIsLoading(true);
            setErrorMessage("");

            try {
                if (tableTokenFromUrl) {
                    sessionStorage.setItem(tableTokenStorageKey, String(tableTokenFromUrl));
                    setTableToken(String(tableTokenFromUrl));
                }

                const tableDetails = await fetchTableDetails(tableId);
                const nextTableToken = getTableToken(tableDetails);
                const resolvedTableToken =
                    nextTableToken ||
                    tableTokenFromUrl ||
                    sessionStorage.getItem(tableTokenStorageKey) ||
                    "";

                if (nextTableToken) {
                    sessionStorage.setItem(tableTokenStorageKey, String(nextTableToken));
                    setTableToken(String(nextTableToken));
                }

                setTableNumber(getTableNumber(tableDetails, tableId));

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

                if (!resolvedTableToken) {
                    setErrorMessage("Open this page from a valid table QR link before placing an order.");
                }
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

                    if (!tableTokenFromUrl && !sessionStorage.getItem(tableTokenStorageKey)) {
                        setErrorMessage("Open this page from a valid table QR link before placing an order.");
                    }
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
    }, [tableId, tableTokenFromUrl, tableTokenStorageKey]);

    useEffect(() => {
        const storedOrderId = sessionStorage.getItem(orderStorageKey);
        const storedInvoiceId = sessionStorage.getItem(invoiceStorageKey);
        setActiveOrderId(storedOrderId);
        setActiveInvoiceId(storedInvoiceId);
    }, [invoiceStorageKey, orderStorageKey]);

    useEffect(() => {
        let isMounted = true;

        if (paymentMethod !== "stripe") {
            stripeCardRef.current?.destroy();
            stripeCardRef.current = null;
            setIsStripeReady(false);
            setStripeCardMessage("");
            return undefined;
        }

        setIsStripeReady(false);
        setStripeCardMessage("Loading Stripe...");

        window.setTimeout(() => {
            if (!isMounted || !stripeCardContainerRef.current) return;

            createStripeCardElement(stripeCardContainerRef.current)
                .then((stripeCardSetup) => {
                    if (!isMounted || !stripeCardSetup) return;

                    stripeCardRef.current = stripeCardSetup.card;
                    setIsStripeReady(true);
                    setStripeCardMessage("");

                    stripeCardSetup.card.on("change", (event) => {
                        setStripeCardMessage(event.error?.message || "");
                    });
                })
                .catch((error) => {
                    if (!isMounted) return;

                    setIsStripeReady(false);
                    setStripeCardMessage(error.message || "Stripe could not be loaded.");
                });
        }, 0);

        return () => {
            isMounted = false;
            stripeCardRef.current?.destroy();
            stripeCardRef.current = null;
        };
    }, [paymentMethod, isMobileCartOpen, isConfirmOrderOpen]);

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

    const featuredItems = useMemo(
        () =>
            menuItems
                .filter((item) => item.image)
                .slice(0, 12),
        [menuItems]
    );

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

    useEffect(() => {
        if (activeRestaurant || !restaurants.length) return;

        setActiveRestaurant(String(restaurants[0].id));
    }, [activeRestaurant, restaurants]);

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
            if (!tableToken) {
                throw new Error("Open this page from a valid table QR link before placing an order.");
            }

            if (paymentMethod === "stripe" && !isStripeReady) {
                throw new Error("Stripe is still loading. Try again in a moment.");
            }

            const response = await createDineInOrder(cartItems, tableId, tableToken);
            const createdOrderId = getCreatedOrderId(response);
            const invoiceId = getCreatedInvoiceId(response);

            if (createdOrderId) {
                sessionStorage.removeItem(orderStorageKey);
                sessionStorage.removeItem(invoiceStorageKey);
                setActiveOrderId(null);
                setActiveInvoiceId(null);
            } else {
                throw new Error("Order was created without an order id.");
            }

            const paymentResponse = await selectDineInPaymentForCurrentOrder(
                invoiceId,
                createdOrderId,
                tableToken,
                paymentMethod
            );

            if (paymentMethod === "stripe") {
                await confirmStripePayment(
                    findStripeClientSecret(paymentResponse),
                    stripeCardRef.current
                );
            }

            setCartItems([]);
            setIsConfirmOrderOpen(false);
            setIsMobileCartOpen(false);
            setSuccessMessage(
                paymentMethod === "cash"
                    ? "Cash payment selected. The waiter will collect it."
                    : "Stripe payment completed."
            );
        } catch (error) {
            const validationErrors = error.response?.data?.errors;
            const firstValidationError = validationErrors
                ? Object.values(validationErrors).flat().find(Boolean)
                : "";

            setIsConfirmOrderOpen(false);
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

    const finishOnboarding = () => {
        sessionStorage.setItem(onboardingStorageKey, "done");
        setShowOnboarding(false);
    };

    const goToDishRestaurantMenu = (item) => {
        setActiveRestaurant(String(item.restaurant_id));
        setActiveCategory("all");
        setSearch("");

        window.setTimeout(() => {
            menuSectionRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }, 0);
    };

    const selectRestaurant = (restaurantId) => {
        setActiveRestaurant(String(restaurantId));
        setActiveCategory("all");
        setSearch("");
    };

    const openConfirmOrder = () => {
        if (!cartItems.length) return;
        if (!tableToken) {
            setSuccessMessage("");
            setErrorMessage("Open this page from a valid table QR link before placing an order.");
            return;
        }

        setErrorMessage("");
        setSuccessMessage("");
        setIsConfirmOrderOpen(true);
    };

    if (showOnboarding) {
        return (
            <CustomerOnboarding
                tableNumber={tableNumber}
                onFinish={finishOnboarding}
            />
        );
    }

    return (
        <div className="customer-experience min-h-dvh overflow-hidden bg-[#101517] font-merriweather text-white">
            <div className="customer-dark-overlay pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_80%_12%,rgba(127,29,29,0.24),transparent_30%),radial-gradient(circle_at_12%_20%,rgba(255,209,102,0.13),transparent_24%),linear-gradient(145deg,#101517_0%,#171D20_48%,#26181B_100%)]" />

            <header className="customer-dark-header sticky top-0 z-30 border-b border-white/10 bg-[#101517]/82 px-3 py-2.5 text-white shadow-[0_12px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:px-4 sm:py-3">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#7F1D1D] text-white shadow-[0_12px_30px_rgba(127,29,29,0.28)] sm:h-11 sm:w-11">
                            <Utensils size={18} />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-black text-white">
                                Big-4 Menu
                            </p>
                            <p className="text-xs font-bold text-white/60">
                                Table {tableNumber}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/10 text-[#FFD166] shadow-sm transition hover:bg-white/[0.14] active:scale-95 sm:h-11 sm:w-11 sm:rounded-2xl"
                            aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
                            title={isLight ? "Dark mode" : "Light mode"}
                        >
                            {isLight ? <Moon size={20} /> : <Sun size={20} />}
                        </button>

                        <button
                            type="button"
                            onClick={() => itemCount > 0 && setIsMobileCartOpen(true)}
                            className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/10 text-[#FFD166] shadow-sm transition active:scale-95 sm:h-11 sm:w-11 sm:rounded-2xl lg:pointer-events-none"
                            aria-label="Open bill"
                        >
                            <ShoppingBag size={20} />
                            {itemCount > 0 && (
                                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#7F1D1D] px-1 text-[10px] font-black text-white">
                                    {itemCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <main className={`relative mx-auto grid max-w-7xl gap-3 px-2 pt-2 sm:gap-5 sm:px-4 sm:pt-4 ${itemCount ? "pb-28" : "pb-6 sm:pb-8"}`}>
                <div>
                    <FeaturedDishSlider
                        featuredItems={featuredItems}
                        tableNumber={tableNumber}
                        onGoToMenu={goToDishRestaurantMenu}
                    />
                </div>

                <div className="min-w-0">
                    <RestaurantPicker
                        restaurants={restaurants}
                        menuItems={menuItems}
                        activeRestaurant={activeRestaurant}
                        onSelect={selectRestaurant}
                    />

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

                    <section ref={menuSectionRef} className="scroll-mt-20 min-w-0 rounded-[24px] border border-white/10 bg-white/[0.06] p-2 shadow-[0_28px_70px_rgba(0,0,0,0.24)] backdrop-blur sm:scroll-mt-24 sm:rounded-[30px] sm:p-4">
                        {activeRestaurantData ? (
                            <>
                                <div className="mb-3 flex flex-col gap-3 rounded-[20px] border border-white/10 bg-[#12181B] p-2.5 text-white sm:mb-4 sm:rounded-[24px] sm:p-3 md:flex-row md:items-center md:justify-between">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <img
                                            src={getRestaurantImageUrl(activeRestaurantData)}
                                            alt={activeRestaurantData.name}
                                            className="h-12 w-12 shrink-0 rounded-xl object-cover ring-2 ring-white/10 sm:h-16 sm:w-16 sm:rounded-2xl"
                                        />
                                        <div className="min-w-0">
                                            <p className="text-xs font-black uppercase tracking-wide text-[#FFD166]">
                                                Menu
                                            </p>
                                            <h2 className="truncate text-xl font-black sm:text-2xl">
                                                {activeRestaurantData.name}
                                            </h2>
                                        </div>
                                    </div>

                                    <label className="flex h-11 min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.07] px-3 backdrop-blur sm:h-12 sm:rounded-2xl sm:px-4 md:w-[340px]">
                                        <Search size={18} className="text-[#FFD166]" />
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
                                    variant="dark"
                                />

                                {visibleItems.length ? (
                                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                                        {visibleItems.map((item) => (
                                            <CustomerFoodCard
                                                key={item.id}
                                                item={item}
                                                onOpen={() => setSelectedItem(item)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-[24px] border border-dashed border-white/15 bg-white/[0.04] px-6 py-14 text-center text-white">
                                        <h3 className="text-lg font-black">No items found</h3>
                                        <p className="mt-1 text-sm font-semibold text-white/55">
                                            Try another search or category.
                                        </p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(127,29,29,0.24),transparent_34%),linear-gradient(135deg,#161D20,#202629)] px-6 py-14 text-center text-white">
                                <ShoppingBag className="mx-auto text-[#FFD166]" size={34} />
                                <h2 className="mt-3 text-xl font-black">
                                    Choose a restaurant to see its dishes
                                </h2>
                                <p className="mt-2 text-sm font-medium text-white/60">
                                    The dish modal will open only when you tap a food item.
                                </p>
                            </div>
                        )}
                    </section>
                </div>

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
                onSubmit={openConfirmOrder}
                isSubmitting={isSubmitting}
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                isStripeReady={isStripeReady}
                stripeCardMessage={stripeCardMessage}
                stripeCardContainerRef={stripeCardContainerRef}
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
                    variant={isLight ? "light" : "dark"}
                />
            )}

            {isConfirmOrderOpen && (
                <ConfirmOrderModal
                    cartItems={cartItems}
                    subtotal={subtotal}
                    paymentMethod={paymentMethod}
                    onPaymentMethodChange={setPaymentMethod}
                    isStripeReady={isStripeReady}
                    stripeCardMessage={stripeCardMessage}
                    stripeCardContainerRef={stripeCardContainerRef}
                    isSubmitting={isSubmitting}
                    onCancel={() => !isSubmitting && setIsConfirmOrderOpen(false)}
                    onConfirm={submitOrder}
                />
            )}
        </div>
    );
}

export default DineInOrder;
