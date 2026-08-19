import {
    Banknote,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Clock3,
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { getCartTotals, getRestaurantTaxRate } from "../../utils/tax";
import { useTheme } from "../../context/ThemeContext";
import { getStoredToken } from "../../utils/auth";
import CategoryTabs from "../Cashier/CategoryTabs";
import ProductModal from "../Cashier/ProductModal";
import useFoodAvailabilityRealtime from "../../hooks/useFoodAvailabilityRealtime";
import {
    FOOD_NOT_ORDERABLE_MESSAGE,
    FOOD_UNAVAILABLE_MESSAGE,
    MODIFIER_UNAVAILABLE_MESSAGE,
    applyModifierAvailabilityUpdates,
    applyFoodAvailabilityUpdates,
    getFoodKey,
    hasUnavailableCartItems,
    isFoodOrderable,
    normalizeFoodAvailability,
    removeUnavailableModifierSelections,
} from "../../utils/foodAvailability";

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
    if (image.startsWith("http://") || image.startsWith("https://"))
        return image;

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

const getRestaurantId = (restaurant) =>
    restaurant?.id ??
    restaurant?.restaurant_id ??
    restaurant?.restaurantId ??
    restaurant?.M_ID ??
    restaurant?.m_id ??
    restaurant?.merchant_id ??
    restaurant?.merchantId ??
    restaurant?.restaurant?.id ??
    null;

const normalizeRestaurant = (restaurant) => {
    const restaurantId = getRestaurantId(restaurant);

    return {
        ...restaurant,
        id: restaurantId,
        name:
            restaurant?.name ??
            restaurant?.restaurant_name ??
            restaurant?.restaurantName ??
            restaurant?.title ??
            "Restaurant",
    };
};

const normalizeFoodItem = (food, restaurant = null) => ({
    ...food,
    id: getRestaurantId(restaurant)
        ? `${getRestaurantId(restaurant)}-${food.id}`
        : food.id,
    food_id: food.id,
    restaurant_id:
        food.restaurant_id ??
        food.restaurantId ??
        food.M_ID ??
        food.m_id ??
        getRestaurantId(food.restaurant) ??
        getRestaurantId(restaurant),
    restaurantName: food.restaurant?.name ?? restaurant?.name ?? "Restaurant",
    restaurantTaxPercentage:
        food.restaurant?.tax_percentage ??
        food.restaurant?.taxPercentage ??
        restaurant?.tax_percentage ??
        restaurant?.taxPercentage ??
        food.tax_percentage ??
        food.taxPercentage ??
        0,
    restaurantTaxRate: getRestaurantTaxRate(
        food.restaurant ?? restaurant ?? food,
    ),
    title: food.name ?? food.title ?? "Food item",
    description: food.description ?? "",
    price: Number(food.price ?? 0),
    image: getFoodImageUrl(food.image),
    category: String(food.category_id ?? food.category?.id ?? "uncategorized"),
    categoryName: food.category?.name ?? "Menu",
    modifierGroups: food.modifier_groups ?? food.modifierGroups ?? [],
    ...normalizeFoodAvailability(food),
});

const appendIfPresent = (formData, key, value) => {
    if (value !== undefined && value !== null && value !== "") {
        formData.append(key, value);
    }
};

const getFirstRecord = (data) =>
    getList(data)[0] || data?.table || data?.data || data;

const getSessionToken = (table) =>
    table?.session_token ??
    table?.sessionToken ??
    table?.table_session_token ??
    table?.tableSessionToken ??
    table?.session?.session_token ??
    table?.session?.sessionToken ??
    table?.data?.session_token ??
    table?.data?.sessionToken ??
    table?.token ??
    table?.table?.token ??
    table?.table_token ??
    table?.tableToken ??
    table?.table?.table_token ??
    table?.table?.tableToken ??
    table?.qr_token ??
    table?.qrToken ??
    table?.dine_in_token ??
    table?.dineInToken ??
    "";

const getSessionTokenFromUrl = (tableId, search) => {
    const params = new URLSearchParams(search);
    const explicitToken =
        params.get("session_token") ||
        params.get("sessionToken") ||
        params.get("table_session_token") ||
        params.get("tableSessionToken") ||
        params.get("token") ||
        params.get("table_token") ||
        params.get("tableToken") ||
        params.get("qr_token") ||
        params.get("qrToken");

    if (explicitToken) return explicitToken;
    if (tableId && !/^\d+$/.test(String(tableId))) return tableId;

    return "";
};

const getTableIdForRequest = (tableId) =>
    tableId && /^\d+$/.test(String(tableId)) ? tableId : "";

const getSessionTokenHeaders = (sessionToken) => ({
    ...(sessionToken
        ? {
              "Table-Token": sessionToken,
              "X-Skip-User-Context": "1",
          }
        : {}),
});

const getCustomerSessionEndpoints = (sessionToken) => [
    `/customer-dine-in/session/${encodeURIComponent(sessionToken)}`,
    "/customer-dine-in/current-session",
    "/customer-dine-in/session/current",
];

const createSessionUnavailableError = (message) => {
    const error = new Error(message);
    error.isSessionUnavailable = true;
    return error;
};

const isMissingEndpointError = (error) => {
    if (error.response?.status !== 404) return false;

    const requestUrl = String(error.config?.url || "");

    if (requestUrl.includes("/customer-dine-in/")) return true;

    const message = String(
        error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            "",
    ).toLowerCase();

    return (
        message.includes("route") ||
        message.includes("endpoint") ||
        message.includes("could not be found")
    );
};

const isInvalidSessionError = (error) => {
    const data = error.response?.data;
    const status = String(data?.status || data?.error || "").toLowerCase();
    const message = String(data?.message || error.message || "").toLowerCase();

    return (
        data?.valid === false ||
        status === "invalid" ||
        message.includes("session is invalid") ||
        message.includes("invalid session") ||
        message.includes("table session is invalid")
    );
};

const getSessionRecord = (data) =>
    data?.session ??
    data?.data?.session ??
    data?.table_session ??
    data?.data?.table_session ??
    data?.data ??
    data ??
    {};

const isInactiveSessionResponse = (data) => {
    const session = getSessionRecord(data);
    const activeValue =
        data?.has_active_session ??
        data?.hasActiveSession ??
        data?.active_session ??
        data?.activeSession ??
        data?.session_active ??
        data?.sessionActive ??
        data?.is_session_active ??
        data?.isSessionActive ??
        data?.is_active ??
        data?.isActive ??
        data?.active ??
        data?.available ??
        data?.is_available ??
        data?.isAvailable ??
        data?.data?.has_active_session ??
        data?.data?.hasActiveSession ??
        data?.data?.active_session ??
        data?.data?.activeSession ??
        data?.data?.session_active ??
        data?.data?.sessionActive ??
        data?.data?.is_session_active ??
        data?.data?.isSessionActive ??
        data?.data?.is_active ??
        data?.data?.isActive ??
        data?.data?.active ??
        data?.data?.available ??
        data?.data?.is_available ??
        data?.data?.isAvailable ??
        session?.is_active ??
        session?.isActive ??
        session?.active ??
        session?.available ??
        session?.is_available ??
        session?.isAvailable;
    const status = String(
        data?.status ??
            data?.data?.status ??
            session?.status ??
            session?.state ??
            "",
    ).toLowerCase();
    const message = String(
        data?.message ?? data?.data?.message ?? session?.message ?? "",
    ).toLowerCase();
    const closedAt =
        session?.closed_at ??
        session?.closedAt ??
        data?.closed_at ??
        data?.closedAt ??
        data?.data?.closed_at ??
        data?.data?.closedAt;

    return (
        activeValue === false ||
        activeValue === 0 ||
        activeValue === "0" ||
        activeValue === "false" ||
        closedAt ||
        [
            "closed",
            "ended",
            "expired",
            "inactive",
            "completed",
            "cancelled",
            "canceled",
        ].includes(status) ||
        (message.includes("no active") && message.includes("session")) ||
        (message.includes("session") &&
            (message.includes("closed") ||
                message.includes("ended") ||
                message.includes("expired") ||
                message.includes("inactive")))
    );
};

const validateDineInSession = async (sessionToken, tableId) => {
    if (!sessionToken) {
        throw createSessionUnavailableError(
            "This table session is not available.",
        );
    }

    let lastError;
    let missingEndpointCount = 0;

    const endpoints = getCustomerSessionEndpoints(sessionToken);

    for (const endpoint of endpoints) {
        try {
            const response = await api.get(endpoint, {
                headers: getSessionTokenHeaders(sessionToken),
                params: {
                    session_token: sessionToken,
                    table_session_token: sessionToken,
                    table_token: sessionToken,
                    token: sessionToken,
                    table_id: getTableIdForRequest(tableId),
                },
            });

            if (isInactiveSessionResponse(response.data)) {
                throw createSessionUnavailableError(
                    "This table session has ended.",
                );
            }

            return response.data;
        } catch (error) {
            if (error.isSessionUnavailable) throw error;
            if (isInvalidSessionError(error)) {
                throw createSessionUnavailableError(
                    error.response?.data?.message ||
                        "This table session is not available.",
                );
            }

            lastError = error;
            if (isMissingEndpointError(error)) {
                missingEndpointCount += 1;
                continue;
            }

            throw createSessionUnavailableError(
                error.response?.data?.message ||
                    "This table session is no longer active.",
            );
        }
    }

    if (missingEndpointCount === endpoints.length) {
        throw createSessionUnavailableError(
            "This table session could not be verified.",
        );
    }

    throw createSessionUnavailableError(
        lastError?.response?.data?.message ||
            "This table session could not be verified.",
    );
};

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
        const foodDetails =
            details ||
            response.data?.food ||
            response.data?.data ||
            response.data;
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

const fetchRestaurantMenu = async (
    restaurant,
    { includeDetails = true } = {},
) => {
    const restaurantId = getRestaurantId(restaurant);

    if (!restaurantId) return [];

    const foodsResponse = await api.get("/food", {
        params: { restaurant_id: restaurantId },
    });
    const foods = getList(foodsResponse.data).map((food) =>
        normalizeFoodItem(food, restaurant),
    );

    if (!includeDetails) return foods;

    const detailResponses = await Promise.allSettled(
        foods.map(fetchFoodDetails),
    );

    return detailResponses.map((result, index) =>
        result.status === "fulfilled" ? result.value : foods[index],
    );
};

const buildOrderFormData = (cartItems, tableId, orderType, sessionToken) => {
    const formData = new FormData();
    const restaurantId = cartItems.find(
        (item) => item.restaurant_id,
    )?.restaurant_id;
    const requestTableId = getTableIdForRequest(tableId);

    appendIfPresent(formData, "order_type", orderType);
    appendIfPresent(formData, "type", orderType);
    appendIfPresent(formData, "service_type", orderType);
    appendIfPresent(formData, "kind", orderType);
    appendIfPresent(formData, "order_source", "dine_in");
    appendIfPresent(formData, "source", "dine_in");
    appendIfPresent(formData, "is_takeaway", 0);
    appendIfPresent(formData, "restaurant_id", restaurantId);
    appendIfPresent(formData, "table_id", requestTableId);
    appendIfPresent(formData, "table_number", requestTableId);
    appendIfPresent(formData, "session_token", sessionToken);
    appendIfPresent(formData, "table_session_token", sessionToken);
    appendIfPresent(formData, "table_token", sessionToken);
    appendIfPresent(formData, "token", sessionToken);
    appendIfPresent(formData, "qr_path", `/dine-in/${sessionToken}`);

    cartItems.forEach((item, index) => {
        const unitPrice = Number(item.price ?? 0);
        const quantity = Number(item.quantity ?? 1);
        const modifierOptions = item.selectedModifierOptions ?? [];
        const notes = [item.size, item.notes].filter(Boolean).join(" · ");

        appendIfPresent(
            formData,
            `items[${index}][food_id]`,
            item.food_id || item.id,
        );
        appendIfPresent(
            formData,
            `items[${index}][menu_item_id]`,
            item.food_id || item.id,
        );
        appendIfPresent(
            formData,
            `items[${index}][restaurant_id]`,
            item.restaurant_id,
        );
        appendIfPresent(formData, `items[${index}][quantity]`, quantity);
        appendIfPresent(formData, `items[${index}][unit_price]`, unitPrice);
        appendIfPresent(formData, `items[${index}][price]`, unitPrice);
        appendIfPresent(
            formData,
            `items[${index}][total_price]`,
            unitPrice * quantity,
        );
        appendIfPresent(formData, `items[${index}][notes]`, notes);

        modifierOptions.forEach((option, optionIndex) => {
            const optionId = option.modifier_option_id ?? option.id;

            appendIfPresent(
                formData,
                `items[${index}][modifiers][${optionIndex}]`,
                optionId,
            );
            appendIfPresent(
                formData,
                `items[${index}][modifier_options][${optionIndex}]`,
                optionId,
            );
        });
    });

    return formData;
};

const buildAddItemFormData = (item, sessionToken) => {
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
        Number(item.price ?? 0) * Number(item.quantity ?? 1),
    );
    appendIfPresent(
        formData,
        "notes",
        [item.size, item.notes].filter(Boolean).join(" · "),
    );
    appendIfPresent(formData, "session_token", sessionToken);
    appendIfPresent(formData, "table_session_token", sessionToken);
    appendIfPresent(formData, "table_token", sessionToken);
    appendIfPresent(formData, "token", sessionToken);
    appendIfPresent(formData, "qr_path", `/dine-in/${sessionToken}`);

    modifierOptions.forEach((option, optionIndex) => {
        appendIfPresent(
            formData,
            `modifiers[${optionIndex}]`,
            option.modifier_option_id ?? option.id,
        );
        appendIfPresent(
            formData,
            `modifier_options[${optionIndex}]`,
            option.modifier_option_id ?? option.id,
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

const getOrderId = (order = {}) =>
    order?.id ??
    order?.order_id ??
    order?.orderId ??
    order?.restaurant_order_id ??
    order?.restaurantOrderId ??
    order?.order?.id ??
    order?.data?.id ??
    null;

const TERMINAL_ORDER_STATUSES = [
    "cancelled",
    "canceled",
    "closed",
    "completed",
    "delivered",
    "served",
];

const isActiveDineInOrder = (order = {}) => {
    const status = String(
        order?.status ??
            order?.state ??
            order?.order_status ??
            order?.orderStatus ??
            order?.kitchen_status ??
            order?.kitchenStatus ??
            order?.order?.status ??
            "",
    ).toLowerCase();

    return !TERMINAL_ORDER_STATUSES.includes(status);
};

const collectDineInOrders = (value, orders = [], seen = new Set()) => {
    if (!value || typeof value !== "object" || seen.has(value)) return orders;

    seen.add(value);

    if (Array.isArray(value)) {
        value.forEach((item) => collectDineInOrders(item, orders, seen));
        return orders;
    }

    const directLists = [
        value.orders,
        value.order,
        value.active_orders,
        value.activeOrders,
        value.current_orders,
        value.currentOrders,
        value.dine_in_orders,
        value.dineInOrders,
        value.data?.orders,
        value.data?.order,
        value.data?.active_orders,
        value.data?.activeOrders,
        value.data?.current_orders,
        value.data?.currentOrders,
        value.data?.dine_in_orders,
        value.data?.dineInOrders,
        value.session?.orders,
        value.session?.active_orders,
        value.session?.activeOrders,
    ];

    directLists.forEach((list) => {
        if (Array.isArray(list)) {
            list.forEach((item) => collectDineInOrders(item, orders, seen));
        } else if (list && typeof list === "object" && getOrderId(list)) {
            orders.push(list);
        }
    });

    if (getOrderId(value)) {
        orders.push(value);
    }

    return orders;
};

const getUniqueActiveDineInOrders = (data) => {
    const uniqueOrders = new Map();

    collectDineInOrders(data).forEach((order) => {
        const orderId = getOrderId(order);

        if (!orderId || !isActiveDineInOrder(order)) return;

        uniqueOrders.set(String(orderId), order);
    });

    return Array.from(uniqueOrders.values());
};

const getCurrentDineInOrderEndpoints = (sessionToken) => [
    "/customer-dine-in/orders/current",
    "/customer-dine-in/current-order",
    `/customer-dine-in/session/${encodeURIComponent(sessionToken)}/orders`,
];

const getRestaurantScopedOrderRequests = (restaurantIds = []) =>
    restaurantIds.map((restaurantId) => ({
        endpoint: "/customer-dine-in/orders",
        params: { restaurant_id: restaurantId },
    }));

async function fetchCurrentDineInOrders(
    sessionToken,
    tableId,
    sessionData = null,
    restaurantIds = [],
) {
    const sessionOrders = getUniqueActiveDineInOrders(sessionData);

    if (sessionOrders.length) return sessionOrders;

    const requests = [
        ...getRestaurantScopedOrderRequests(restaurantIds),
        ...getCurrentDineInOrderEndpoints(sessionToken).map((endpoint) => ({
            endpoint,
            params: {},
        })),
    ];
    const collectedOrders = [];

    for (const { endpoint, params } of requests) {
        try {
            const response = await api.get(endpoint, {
                headers: getSessionTokenHeaders(sessionToken),
                params: {
                    ...params,
                    session_token: sessionToken,
                    table_session_token: sessionToken,
                    table_token: sessionToken,
                    token: sessionToken,
                    table_id: getTableIdForRequest(tableId),
                },
            });
            const orders = getUniqueActiveDineInOrders(response.data);

            collectedOrders.push(...orders);
        } catch (error) {
            if (
                isMissingEndpointError(error) ||
                error.response?.status === 404 ||
                error.response?.status === 405 ||
                error.response?.status === 422
            ) {
                continue;
            }
        }
    }

    return getUniqueActiveDineInOrders(collectedOrders);
}

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

const getFirstPresent = (values) =>
    values.find(
        (value) => value !== undefined && value !== null && value !== "",
    );

const isTruthyFlag = (value) =>
    value === true || value === 1 || String(value).toLowerCase() === "true";

const normalizeTimingStatus = (status) => String(status || "").toLowerCase();

const PREPARATION_STARTED_STATUSES = [
    "preparing",
    "in_progress",
    "in_preparation",
    "started",
    "ready",
    "completed",
    "served",
];

const READY_STATUSES = ["ready", "completed", "served"];

const getPreparationTrackingScope = (value = {}) =>
    String(
        getFirstPresent([
            value?.preparation_tracking_scope,
            value?.preparationTrackingScope,
            value?.order?.preparation_tracking_scope,
            value?.order?.preparationTrackingScope,
        ]) || "whole_order",
    ).toLowerCase();

const getPreparationTimingFromObject = (value = {}) => {
    const source = value?.restaurant_order ?? value?.restaurantOrder ?? value;
    const remainingMinutes = getFirstPresent([
        value?.remaining_minutes,
        value?.remainingMinutes,
        source?.remaining_minutes,
        source?.remainingMinutes,
        value?.estimated_time,
        value?.estimatedTime,
        source?.estimated_time,
        source?.estimatedTime,
    ]);
    const waitingForPreparation = getFirstPresent([
        value?.waiting_for_preparation,
        value?.waitingForPreparation,
        source?.waiting_for_preparation,
        source?.waitingForPreparation,
    ]);

    return {
        remainingMinutes,
        waitingForPreparation: isTruthyFlag(waitingForPreparation),
    };
};

const hasPreparationTiming = (timing) =>
    Boolean(timing?.waitingForPreparation) ||
    (timing?.remainingMinutes !== undefined &&
        timing?.remainingMinutes !== null &&
        timing?.remainingMinutes !== "");

const isPreparationOnTheWay = (timing) => {
    if (!hasPreparationTiming(timing) || timing?.waitingForPreparation)
        return false;

    const remainingMinutes = Number(timing.remainingMinutes);

    return Number.isFinite(remainingMinutes) && remainingMinutes <= 0;
};

const getPreparationTimingLabel = (
    timing,
    onTheWayLabel = "Your order is on the way",
) => {
    if (timing?.waitingForPreparation) return "Waiting";
    if (!hasPreparationTiming(timing)) return "-";
    if (isPreparationOnTheWay(timing)) return onTheWayLabel;

    return `${timing.remainingMinutes} min left`;
};

const getRestaurantOrdersForTiming = (order = {}) => [
    ...getList(order?.restaurant_orders),
    ...getList(order?.restaurantOrders),
    ...getList(order?.order?.restaurant_orders),
    ...getList(order?.order?.restaurantOrders),
    ...getList(order?.data?.restaurant_orders),
    ...getList(order?.data?.restaurantOrders),
    ...getList(order?.data?.order?.restaurant_orders),
    ...getList(order?.data?.order?.restaurantOrders),
];

const getRestaurantOrderItems = (restaurantOrder = {}) => [
    ...getList(restaurantOrder?.order_items),
    ...getList(restaurantOrder?.orderItems),
    ...getList(restaurantOrder?.items),
];

const getRestaurantOrderName = (restaurantOrder = {}, index = 0) =>
    restaurantOrder?.restaurant?.name ??
    restaurantOrder?.restaurant_name ??
    restaurantOrder?.restaurantName ??
    `Restaurant ${index + 1}`;

const getRestaurantOrderItemName = (item = {}, index = 0) =>
    item?.food?.name ??
    item?.food?.title ??
    item?.name ??
    item?.title ??
    item?.food_name ??
    item?.foodName ??
    `Item ${index + 1}`;

const getPerRestaurantPreparationTiming = (order = {}) => {
    if (getPreparationTrackingScope(order) !== "per_restaurant") return null;

    const restaurantOrders = getRestaurantOrdersForTiming(order);

    if (!restaurantOrders.length) return null;

    const restaurants = restaurantOrders.map((restaurantOrder, index) => {
        const status = normalizeTimingStatus(restaurantOrder.status);
        const timing = getPreparationTimingFromObject(restaurantOrder);
        const hasStarted = PREPARATION_STARTED_STATUSES.includes(status);
        const waitingForPreparation =
            timing.waitingForPreparation || !hasStarted;
        const remainingMinutes = Number(timing.remainingMinutes);

        return {
            id:
                restaurantOrder.id ??
                restaurantOrder.restaurant_order_id ??
                index,
            restaurantId:
                restaurantOrder.restaurant_id ?? restaurantOrder.restaurantId,
            restaurantName: getRestaurantOrderName(restaurantOrder, index),
            status,
            remainingMinutes: Number.isFinite(remainingMinutes)
                ? Math.max(0, remainingMinutes)
                : timing.remainingMinutes,
            waitingForPreparation,
            items: getRestaurantOrderItems(restaurantOrder).map(
                (item, itemIndex) => ({
                    id: item.id ?? `${index}-${itemIndex}`,
                    name: getRestaurantOrderItemName(item, itemIndex),
                    quantity: Number(item.quantity ?? 1),
                    notes: item.notes ?? "",
                }),
            ),
        };
    });
    const readyRestaurants = restaurants.filter(
        (restaurant) => !restaurant.waitingForPreparation,
    );
    const remainingMinutes = readyRestaurants
        .map((restaurant) => Number(restaurant.remainingMinutes))
        .filter(Number.isFinite);

    return {
        scope: "per_restaurant",
        waitingForPreparation: restaurants.some(
            (restaurant) => restaurant.waitingForPreparation,
        ),
        remainingMinutes: remainingMinutes.length
            ? Math.max(...remainingMinutes)
            : null,
        restaurants,
    };
};

const readStoredOrderTimings = (key) => {
    try {
        const value = JSON.parse(sessionStorage.getItem(key) || "[]");

        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
};

const findPreparationTiming = (value, seen = new Set()) => {
    if (!value || typeof value !== "object" || seen.has(value)) return null;

    seen.add(value);

    const perRestaurantTiming = getPerRestaurantPreparationTiming(value);

    if (perRestaurantTiming) return perRestaurantTiming;

    const timing = {
        scope: getPreparationTrackingScope(value),
        ...getPreparationTimingFromObject(value),
    };

    if (hasPreparationTiming(timing)) return timing;

    for (const child of Object.values(value)) {
        const nestedTiming = Array.isArray(child)
            ? child
                  .map((item) => findPreparationTiming(item, seen))
                  .find(Boolean)
            : findPreparationTiming(child, seen);

        if (nestedTiming) return nestedTiming;
    }

    return null;
};

const getBestPreparationTiming = (...values) => {
    const timings = values
        .map((value) => findPreparationTiming(value))
        .filter(Boolean);

    return (
        timings.find((timing) => timing.scope === "per_restaurant") ??
        timings[0] ??
        null
    );
};

async function fetchDineInOrderTiming(orderId, sessionToken) {
    if (!orderId || !sessionToken) return null;

    try {
        const response = await api.get(`/customer-dine-in/orders/${orderId}`, {
            headers: getSessionTokenHeaders(sessionToken),
        });

        return findPreparationTiming(response.data);
    } catch {
        return null;
    }
}

async function buildOrderTimingItems(orders, sessionToken) {
    const timingItems = await Promise.all(
        orders.map(async (order) => {
            const orderId = getOrderId(order);
            const timing =
                getBestPreparationTiming(order) ||
                (await fetchDineInOrderTiming(orderId, sessionToken));

            return orderId
                ? {
                      orderId: String(orderId),
                      timing,
                  }
                : null;
        }),
    );

    return timingItems.filter(Boolean);
}

async function selectDineInPayment(
    invoiceId,
    orderId,
    sessionToken,
    paymentMethod,
) {
    const formData = new FormData();

    appendIfPresent(formData, "invoice_id", invoiceId);
    appendIfPresent(formData, "order_id", orderId);
    appendIfPresent(formData, "session_token", sessionToken);
    appendIfPresent(formData, "table_session_token", sessionToken);
    appendIfPresent(formData, "table_token", sessionToken);
    appendIfPresent(formData, "token", sessionToken);
    appendIfPresent(formData, "qr_path", `/dine-in/${sessionToken}`);

    const endpoint =
        paymentMethod === "stripe"
            ? "/customer-dine-in/payments/stripe/create-intent"
            : "/customer-dine-in/payments/cash";

    const response = await api.post(endpoint, formData, {
        headers: getSessionTokenHeaders(sessionToken),
    });
    return response.data;
}

async function selectDineInPaymentForCurrentOrder(
    invoiceId,
    orderId,
    sessionToken,
    paymentMethod,
) {
    try {
        return await selectDineInPayment(
            invoiceId || orderId,
            orderId,
            sessionToken,
            paymentMethod,
        );
    } catch (error) {
        const message = JSON.stringify(
            error.response?.data || error.message || "",
        );
        const shouldRetryWithOrderId =
            orderId &&
            invoiceId &&
            String(orderId) !== String(invoiceId) &&
            message.includes("App\\\\Models\\\\Order");

        if (!shouldRetryWithOrderId) throw error;

        return selectDineInPayment(
            orderId,
            orderId,
            sessionToken,
            paymentMethod,
        );
    }
}

async function createDineInOrder(cartItems, tableId, sessionToken) {
    const typeVariants = ["dine-in", "dine_in", "dine in", "dinein", "DINE-IN"];
    let lastError;

    for (const orderType of typeVariants) {
        try {
            const response = await api.post(
                "/customer-dine-in/orders",
                buildOrderFormData(cartItems, tableId, orderType, sessionToken),
                {
                    headers: getSessionTokenHeaders(sessionToken),
                },
            );
            return response.data;
        } catch (error) {
            lastError = error;
            const message = JSON.stringify(
                error.response?.data || {},
            ).toLowerCase();
            const isTypeError =
                error.response?.status === 422 &&
                message.includes("order type") &&
                message.includes("invalid");

            if (!isTypeError) throw error;
        }
    }

    throw lastError;
}

async function cancelDineInOrder(orderId, sessionToken, tableId) {
    const formData = new FormData();

    appendIfPresent(formData, "session_token", sessionToken);
    appendIfPresent(formData, "table_session_token", sessionToken);
    appendIfPresent(formData, "table_token", sessionToken);
    appendIfPresent(formData, "token", sessionToken);
    appendIfPresent(formData, "table_id", getTableIdForRequest(tableId));
    appendIfPresent(formData, "qr_path", `/dine-in/${sessionToken}`);

    const requests = [
        () =>
            api.post(`/customer-dine-in/orders/${orderId}/cancel`, formData, {
                headers: getSessionTokenHeaders(sessionToken),
            }),
        () =>
            api.delete(`/customer-dine-in/orders/${orderId}`, {
                headers: getSessionTokenHeaders(sessionToken),
                data: formData,
            }),
        () =>
            api.post(`/cashier/orders/${orderId}/cancel`, formData, {
                headers: getSessionTokenHeaders(sessionToken),
            }),
    ];
    let lastError;

    for (const request of requests) {
        try {
            const response = await request();

            return response.data;
        } catch (error) {
            lastError = error;

            if (
                isMissingEndpointError(error) ||
                error.response?.status === 404 ||
                error.response?.status === 405
            ) {
                continue;
            }

            throw error;
        }
    }

    throw lastError;
}

async function deleteDineInOrderItem(orderId, itemId, sessionToken, tableId) {
    const formData = new FormData();

    appendIfPresent(formData, "session_token", sessionToken);
    appendIfPresent(formData, "table_session_token", sessionToken);
    appendIfPresent(formData, "table_token", sessionToken);
    appendIfPresent(formData, "token", sessionToken);
    appendIfPresent(formData, "table_id", getTableIdForRequest(tableId));
    appendIfPresent(formData, "qr_path", `/dine-in/${sessionToken}`);

    const requests = [
        () =>
            api.delete(`/customer-dine-in/order-items/${itemId}`, {
                headers: getSessionTokenHeaders(sessionToken),
                data: formData,
            }),
        () =>
            api.delete(`/customer-dine-in/orders/${orderId}/items/${itemId}`, {
                headers: getSessionTokenHeaders(sessionToken),
                data: formData,
            }),
        () =>
            api.delete(`/cashier/order-items/${itemId}`, {
                headers: getSessionTokenHeaders(sessionToken),
                data: formData,
            }),
    ];
    let lastError;

    for (const request of requests) {
        try {
            const response = await request();

            return response.data;
        } catch (error) {
            lastError = error;

            if (
                isMissingEndpointError(error) ||
                error.response?.status === 404 ||
                error.response?.status === 405
            ) {
                continue;
            }

            throw error;
        }
    }

    throw lastError;
}

async function addItemsToDineInOrder(orderId, cartItems, sessionToken) {
    const responses = [];

    for (const item of cartItems) {
        const response = await api.post(
            `/customer-dine-in/orders/${orderId}/items`,
            buildAddItemFormData(item, sessionToken),
            {
                headers: getSessionTokenHeaders(sessionToken),
            },
        );

        responses.push(response.data);
    }

    return responses;
}

function CustomerFoodTitle({ title }) {
    const containerRef = useRef(null);
    const textRef = useRef(null);
    const [shouldScroll, setShouldScroll] = useState(false);

    useEffect(() => {
        const container = containerRef.current;
        const text = textRef.current;

        if (!container || !text) return undefined;

        const updateScrollState = () => {
            const overflowWidth = Math.max(
                0,
                text.scrollWidth - container.clientWidth,
            );

            container.style.setProperty(
                "--customer-food-title-shift",
                `${overflowWidth}px`,
            );
            container.style.setProperty(
                "--customer-food-title-duration",
                `${Math.max(5.5, overflowWidth / 18).toFixed(1)}s`,
            );
            setShouldScroll(overflowWidth > 2);
        };

        updateScrollState();

        const resizeObserver = new ResizeObserver(updateScrollState);
        resizeObserver.observe(container);
        resizeObserver.observe(text);

        return () => resizeObserver.disconnect();
    }, [title]);

    return (
        <span
            ref={containerRef}
            className={`customer-food-title-marquee ${
                shouldScroll ? "is-scrolling" : ""
            }`}
            title={title}
        >
            <span ref={textRef} className="customer-food-title-marquee-text">
                {title}
            </span>
        </span>
    );
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
    const canOrder = isFoodOrderable(item);

    return (
        <article
            className={`customer-food-card group grid grid-cols-[118px_minmax(0,1fr)] overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.07] text-white shadow-[0_18px_45px_rgba(0,0,0,0.22)] backdrop-blur transition duration-300 hover:border-[#7F1D1D]/45 hover:bg-white/[0.10] focus:outline-none focus:ring-4 focus:ring-[#FFD166]/25 sm:block sm:rounded-[26px] ${
                canOrder
                    ? "cursor-pointer sm:hover:-translate-y-1"
                    : "cursor-not-allowed border-[#7F1D1D]/45"
            }`}
            role="button"
            tabIndex={0}
            aria-disabled={!canOrder}
            onClick={() => canOrder && onOpen()}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    if (!canOrder) return;
                    onOpen();
                }
            }}
        >
            <div className="relative min-h-[150px] overflow-hidden bg-[#111719] sm:h-44">
                <img
                    src={imageUrl}
                    alt={item.title}
                    className={`h-full w-full object-cover transition duration-700 ${
                        canOrder
                            ? "group-hover:scale-105"
                            : "grayscale contrast-110 opacity-55"
                    }`}
                />
                <div
                    className={`absolute inset-0 ${
                        canOrder
                            ? "bg-gradient-to-t from-[#111719] via-[#111719]/25 to-transparent"
                            : "bg-black/52"
                    }`}
                />
                <span
                    className={`menu-type-badge absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide shadow-lg sm:left-3 sm:top-3 sm:px-3 sm:text-[11px] ${
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
                {!canOrder && (
                    <div className="absolute inset-0 z-10 grid place-items-center px-3 text-center">
                        <div className="grid h-14 w-14 place-items-center rounded-full border-4 border-white bg-[#B91C1C] text-white shadow-[0_18px_38px_rgba(185,28,28,0.42)] sm:h-16 sm:w-16">
                            <X size={34} strokeWidth={4} />
                        </div>
                        <span className="mt-2 rounded-full border-2 border-white bg-[#B91C1C] px-4 py-1.5 text-base font-black text-white shadow-[0_16px_34px_rgba(0,0,0,0.38)] sm:px-5 sm:py-2 sm:text-lg">
                            Unavailable
                        </span>
                    </div>
                )}
            </div>

            <div className="flex min-h-[150px] min-w-0 flex-col p-3 sm:min-h-44 sm:p-4">
                <p className="truncate text-xs font-black uppercase tracking-wide text-[#FFD166]">
                    {item.restaurantName}
                </p>
                <h2 className="mt-1.5 text-base font-black leading-5 text-white sm:mt-2 sm:text-xl sm:leading-7">
                    <CustomerFoodTitle title={item.title} />
                </h2>
                <p className="mt-1.5 line-clamp-2 text-xs font-semibold leading-5 text-white/62 sm:mt-2 sm:text-sm sm:leading-6">
                    {item.description ||
                        item.categoryName ||
                        "Freshly prepared for your table."}
                </p>

                <div className="mt-auto flex items-center justify-between gap-2 pt-3 sm:gap-3 sm:pt-5">
                    <span
                        className={`truncate text-xs font-bold sm:text-sm ${canOrder ? "text-white/45" : "text-[#FFB3B3]"}`}
                    >
                        {canOrder ? "Tap to customize" : "Unavailable"}
                    </span>
                    <button
                        type="button"
                        disabled={!canOrder}
                        onClick={(event) => {
                            event.stopPropagation();
                            if (!canOrder) return;
                            onOpen();
                        }}
                        className="customer-food-add-button grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#7F1D1D] text-white shadow-[0_14px_28px_rgba(127,29,29,0.28)] transition hover:bg-[#681718] active:scale-95 disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/35 disabled:shadow-none sm:h-11 sm:w-11"
                        aria-label={
                            canOrder
                                ? `Add ${item.title}`
                                : `${item.title} unavailable`
                        }
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </div>
        </article>
    );
}

function RestaurantPicker({
    restaurants,
    menuItems,
    activeRestaurant,
    onSelect,
}) {
    if (!restaurants.length) return null;

    const getItemCount = (restaurantId) =>
        menuItems.filter(
            (item) => String(item.restaurant_id) === String(restaurantId),
        ).length;
    const isAllActive = activeRestaurant === "all" || !activeRestaurant;

    return (
        <section className="relative mb-3 overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.06] p-3 text-white shadow-[0_16px_38px_rgba(0,0,0,0.16)] backdrop-blur sm:mb-4 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#FFD166]">
                        Choose restaurant
                    </p>
                    <h2 className="mt-0.5 text-xl font-black leading-7 text-white sm:text-2xl">
                        Pick one or view all
                    </h2>
                </div>
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-black text-white/64">
                    {menuItems.length} dishes
                </span>
            </div>

            <div className="customer-order-scroll flex gap-2.5 overflow-x-auto pb-1">
                <button
                    type="button"
                    onClick={() => onSelect("all")}
                    className={`flex min-w-[128px] flex-col items-center gap-2 rounded-2xl border p-2.5 text-center shadow-sm transition active:scale-[0.98] sm:min-w-[148px] ${
                        isAllActive
                            ? "border-[#FFD166] bg-[#FFD166] text-[#17100E] shadow-[0_12px_24px_rgba(255,209,102,0.18)]"
                            : "border-white/10 bg-[#101719] text-white hover:border-[#FFD166]/40 hover:bg-white/[0.08]"
                    }`}
                >
                    <span
                        className={`grid h-14 w-14 place-items-center rounded-2xl ${
                            isAllActive
                                ? "bg-[#7F1D1D] text-white"
                                : "bg-white/10 text-[#FFD166]"
                        }`}
                    >
                        <Utensils size={22} />
                    </span>
                    <span className="min-w-0">
                        <span className="block text-base font-black leading-5">
                            All
                        </span>
                        <span
                            className={`mt-1 block text-[11px] font-black uppercase tracking-wide ${isAllActive ? "text-[#7F1D1D]" : "text-white/52"}`}
                        >
                            All menus
                        </span>
                    </span>
                </button>

                {restaurants.map((restaurant) => {
                    const active =
                        String(activeRestaurant) === String(restaurant.id);
                    const itemCount = getItemCount(restaurant.id);

                    return (
                        <button
                            key={restaurant.id}
                            type="button"
                            onClick={() => onSelect(String(restaurant.id))}
                            className={`flex min-w-[148px] flex-col items-center gap-2 rounded-2xl border p-2.5 text-center shadow-sm transition active:scale-[0.98] sm:min-w-[166px] ${
                                active
                                    ? "border-[#FFD166] bg-[#FFD166] text-[#17100E] shadow-[0_12px_24px_rgba(255,209,102,0.18)]"
                                    : "border-white/10 bg-[#101719] text-white hover:border-[#FFD166]/40 hover:bg-white/[0.08]"
                            }`}
                        >
                            <span className="relative">
                                <img
                                    src={getRestaurantImageUrl(restaurant)}
                                    alt={restaurant.name}
                                    className={`h-14 w-14 shrink-0 rounded-2xl bg-white object-cover ring-2 sm:h-16 sm:w-16 ${
                                        active
                                            ? "ring-[#7F1D1D]"
                                            : "ring-white/10"
                                    }`}
                                />
                                {active && (
                                    <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-[#7F1D1D] text-white">
                                        <CheckCircle2 size={14} />
                                    </span>
                                )}
                            </span>
                            <span className="min-w-0">
                                <span className="line-clamp-2 text-sm font-black leading-5 sm:text-base">
                                    {restaurant.name}
                                </span>
                                <span
                                    className={`mt-1 block text-[11px] font-black uppercase tracking-wide ${active ? "text-[#7F1D1D]" : "text-white/52"}`}
                                >
                                    {itemCount} dishes
                                </span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}

function FeaturedDishSlider({ featuredItems, onGoToMenu }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isSliderPaused, setIsSliderPaused] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartX = useRef(0);
    const activeItem = featuredItems[activeIndex];

    useEffect(() => {
        if (!featuredItems.length || isSliderPaused) return undefined;

        setActiveIndex((currentIndex) =>
            Math.min(currentIndex, featuredItems.length - 1),
        );

        const intervalId = window.setInterval(() => {
            setActiveIndex(
                (currentIndex) => (currentIndex + 1) % featuredItems.length,
            );
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
            <section className="relative mb-3 h-[240px] w-full overflow-hidden rounded-[22px] border border-white/10 bg-[#101517] px-4 text-white sm:mb-4 sm:h-[280px] sm:rounded-[26px] lg:h-[320px]">
                <div className="mx-auto flex h-full max-w-7xl items-center justify-center text-center">
                    <div>
                        <h2 className="text-2xl font-black">
                            Loading dishes...
                        </h2>
                        <p className="mt-2 text-sm font-semibold text-white/55">
                            Preparing the dine-in menu.
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
            className="relative mb-3 h-[240px] w-full touch-pan-y overflow-hidden rounded-[22px] border border-white/10 bg-[#101517] text-white shadow-[0_22px_54px_rgba(0,0,0,0.22)] sm:mb-4 sm:h-[280px] sm:rounded-[26px] lg:h-[320px]"
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

                        <div className="relative z-10 mx-auto grid h-full max-w-7xl items-end gap-4 px-4 py-6 sm:px-6 sm:py-7 lg:grid-cols-[minmax(0,0.95fr)_240px] lg:items-center">
                            <div className="customer-image-text max-w-2xl pb-8 sm:pb-9 lg:pb-0">
                                <p className="mb-2 inline-flex max-w-full rounded-full bg-[#FFD166] px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-[#241707] shadow-[0_12px_24px_rgba(255,209,102,0.18)] sm:mb-3 sm:px-3.5 sm:text-[11px]">
                                    Featured from {item.restaurantName}
                                </p>
                                <h1 className="line-clamp-2 text-3xl font-black leading-[1.02] tracking-normal text-white drop-shadow sm:text-4xl lg:text-5xl">
                                    {item.title}
                                </h1>
                                <p className="customer-image-text mt-3 line-clamp-2 max-w-xl text-sm font-extrabold leading-6 !text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.95)] sm:text-base sm:leading-7">
                                    {item.description ||
                                        `Freshly prepared by ${item.restaurantName}.`}
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
                                <div className="w-[230px] rounded-[24px] border border-white/10 bg-black/30 p-3 shadow-[0_24px_56px_rgba(0,0,0,0.24)] backdrop-blur xl:w-[240px]">
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
                                        <ShoppingBag
                                            className="shrink-0 text-[#FFD166]"
                                            size={22}
                                        />
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
                            index === activeIndex
                                ? "w-7 bg-[#FFD166] sm:w-9"
                                : "w-2 bg-white/40 sm:w-2.5"
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
    tax,
    total,
    onChangeQuantity,
    onRemoveItem,
    onClearOrder,
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
    const [pendingDeleteIndex, setPendingDeleteIndex] = useState(null);
    const [isClearPending, setIsClearPending] = useState(false);
    const hasUnavailableOrderItems = hasUnavailableCartItems(cartItems);
    const requestRemoveItem = (index) => {
        setIsClearPending(false);
        setPendingDeleteIndex(index);
    };
    const confirmRemoveItem = (index) => {
        onRemoveItem(index);
        setPendingDeleteIndex(null);
    };
    const requestClearOrder = () => {
        setPendingDeleteIndex(null);
        setIsClearPending(true);
    };
    const confirmClearOrder = () => {
        onClearOrder();
        setPendingDeleteIndex(null);
        setIsClearPending(false);
    };
    const handleQuantityChange = (index, amount) => {
        const item = cartItems[index];

        if (amount < 0 && Number(item?.quantity ?? 0) <= 1) {
            requestRemoveItem(index);
            return;
        }

        setPendingDeleteIndex(null);
        onChangeQuantity(index, amount);
    };

    return (
        <section
            className={`flex flex-col overflow-hidden border border-white/10 bg-[#151A1D]/92 text-white shadow-[0_28px_70px_rgba(0,0,0,0.30)] backdrop-blur-xl ${
                isMobile
                    ? "max-h-[74dvh] rounded-[28px]"
                    : "max-h-[calc(100dvh-7.5rem)] min-h-[520px] rounded-[28px]"
            }`}
        >
            <div
                className={`shrink-0 border-b border-white/10 bg-white/[0.03] ${isMobile ? "p-4" : "p-5"}`}
            >
                <div className="flex items-center gap-3">
                    <div
                        className={`${isMobile ? "h-10 w-10" : "h-12 w-12"} grid place-items-center rounded-2xl bg-[#7F1D1D] text-white shadow-[0_14px_32px_rgba(127,29,29,0.28)]`}
                    >
                        <ReceiptText size={isMobile ? 19 : 22} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2
                            className={`${isMobile ? "text-xl" : "text-2xl"} font-black leading-7`}
                        >
                            Your order
                        </h2>
                        <p className="text-sm font-bold text-white/55">
                            {itemCount
                                ? `${itemCount} items in your order`
                                : "No items yet"}
                        </p>
                    </div>
                    {itemCount > 0 && (
                        <button
                            type="button"
                            onClick={
                                isClearPending
                                    ? confirmClearOrder
                                    : requestClearOrder
                            }
                            className={`flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-black transition active:scale-95 ${
                                isClearPending
                                    ? "border-[#FF6B6B]/60 bg-[#7F1D1D] text-white hover:bg-[#9B1C1C]"
                                    : "border-[#7F1D1D]/40 bg-[#7F1D1D]/12 text-[#FFB3B3] hover:bg-[#7F1D1D]/20"
                            }`}
                            aria-label={
                                isClearPending
                                    ? "Confirm delete all items"
                                    : "Delete all items from order"
                            }
                            title={
                                isClearPending
                                    ? "Confirm delete all"
                                    : "Delete all"
                            }
                        >
                            <Trash2
                                size={16}
                                className={
                                    isClearPending
                                        ? "text-white [stroke:white]"
                                        : ""
                                }
                            />
                            <span>
                                {isClearPending ? "Confirm" : "Delete all"}
                            </span>
                        </button>
                    )}
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
                {isClearPending && (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[#7F1D1D]/45 bg-[#7F1D1D]/12 px-3 py-2">
                        <p className="min-w-0 text-xs font-black leading-5 text-[#FFB3B3]">
                            Delete every item in this order?
                        </p>
                        <button
                            type="button"
                            onClick={() => setIsClearPending(false)}
                            className="shrink-0 text-xs font-black text-white/70 transition hover:text-white"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            <div
                className={`customer-order-scroll min-h-0 flex-1 space-y-3 overflow-y-auto ${isMobile ? "p-3" : "p-4"}`}
            >
                {cartItems.length ? (
                    cartItems.map((item, index) => {
                        const isDeletePending = pendingDeleteIndex === index;
                        const canOrder = isFoodOrderable(item);

                        return (
                            <div
                                key={`${item.id}-${item.notes}-${index}`}
                                className={`rounded-2xl border ${isMobile ? "p-3" : "p-4"} ${
                                    isDeletePending
                                        ? "border-[#FF6B6B]/35 bg-[#7F1D1D]/18"
                                        : !canOrder
                                          ? "border-[#FF6B6B]/35 bg-[#7F1D1D]/16"
                                          : "border-white/10 bg-white/[0.07]"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p
                                            className={`${isMobile ? "text-base" : "text-lg"} break-words font-black leading-6 text-white`}
                                        >
                                            {item.title}
                                        </p>
                                        <p className="mt-1 truncate text-sm font-extrabold text-white/55">
                                            {item.restaurantName}
                                        </p>
                                        {!canOrder && (
                                            <p className="mt-1 text-xs font-black text-[#FFB3B3]">
                                                Unavailable
                                            </p>
                                        )}
                                        {item.notes && (
                                            <p className="mt-3 break-words text-sm font-semibold leading-5 text-white/72">
                                                {item.notes}
                                            </p>
                                        )}
                                    </div>
                                    {isDeletePending ? (
                                        <div className="flex shrink-0 gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    confirmRemoveItem(index)
                                                }
                                                className="grid h-9 w-9 place-items-center rounded-lg border border-[#FF6B6B]/55 bg-[#7F1D1D] text-white transition hover:bg-[#9B1C1C]"
                                                aria-label={`Confirm remove ${item.title}`}
                                            >
                                                <Trash2
                                                    size={17}
                                                    className="text-white [stroke:white]"
                                                />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setPendingDeleteIndex(null)
                                                }
                                                className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.06] text-white/60 transition hover:bg-white/10 hover:text-white"
                                                aria-label="Cancel remove"
                                            >
                                                <X size={17} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                requestRemoveItem(index)
                                            }
                                            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#7F1D1D] text-white transition hover:bg-[#9B1C1C]"
                                            aria-label={`Remove ${item.title}`}
                                        >
                                            <Trash2
                                                size={18}
                                                className="text-white [stroke:white]"
                                            />
                                        </button>
                                    )}
                                </div>

                                <div className="mt-4 flex items-center justify-between gap-3">
                                    <div className="flex shrink-0 items-center rounded-xl border border-white/10 bg-black/20 p-1">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleQuantityChange(index, -1)
                                            }
                                            className={`${isMobile ? "h-9 w-9" : "h-10 w-10"} grid place-items-center rounded-lg text-[#FFD166]`}
                                            aria-label="Decrease quantity"
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <span
                                            className={`${isMobile ? "w-8 text-base" : "w-10 text-lg"} text-center font-black`}
                                        >
                                            {item.quantity}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleQuantityChange(index, 1)
                                            }
                                            className={`${isMobile ? "h-9 w-9" : "h-10 w-10"} grid place-items-center rounded-lg text-[#FFD166]`}
                                            aria-label="Increase quantity"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    <span
                                        className={`${isMobile ? "text-base" : "text-lg"} shrink-0 font-black text-[#FFD166]`}
                                    >
                                        $
                                        {(
                                            Number(item.price ?? 0) *
                                            item.quantity
                                        ).toFixed(2)}
                                    </span>
                                </div>
                                {isDeletePending && (
                                    <p className="mt-3 rounded-xl border border-[#7F1D1D]/45 bg-[#7F1D1D]/12 px-3 py-2 text-xs font-black !text-[#7F1D1D]">
                                        Delete this item? Press the red button
                                        to confirm.
                                    </p>
                                )}
                            </div>
                        );
                    })
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

            <div
                className={`shrink-0 border-t border-white/10 ${isMobile ? "p-3" : "p-5"}`}
            >
                {hasUnavailableOrderItems && (
                    <p className="mb-3 rounded-2xl border border-[#FF6B6B]/35 bg-[#7F1D1D]/24 px-4 py-2.5 text-center text-sm font-extrabold leading-5 text-[#FFB3B3]">
                        {FOOD_UNAVAILABLE_MESSAGE}
                    </p>
                )}
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
                                    onClick={() =>
                                        onPaymentMethodChange(method.id)
                                    }
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
                            The waiter will collect and confirm the cash
                            payment.
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
                            <p
                                className={`mt-2 text-xs font-semibold ${stripeCardMessage ? "text-red-200" : "text-white/55"}`}
                            >
                                {stripeCardMessage ||
                                    (isStripeReady
                                        ? "Card ready."
                                        : "Loading Stripe...")}
                            </p>
                        </div>
                    )}
                </div>
                <div
                    className={`space-y-3 rounded-2xl border border-white/10 bg-white/[0.07] ${isMobile ? "p-3" : "p-4"} text-base`}
                >
                    <div className="flex items-center justify-between text-white/65">
                        <span>Subtotal</span>
                        <span className="font-black text-white">
                            ${subtotal.toFixed(2)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-white/65">
                        <span>Tax</span>
                        <span className="font-black text-white">
                            ${tax.toFixed(2)}
                        </span>
                    </div>
                    <div className="border-t border-dashed border-white/20" />
                    <div className="flex items-end justify-between">
                        <span className="text-lg font-black">Total</span>
                        <span
                            className={`${isMobile ? "text-2xl" : "text-3xl"} font-black text-[#FFD166]`}
                        >
                            ${total.toFixed(2)}
                        </span>
                    </div>
                </div>

                <div className="mt-4">
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={
                            !itemCount ||
                            hasUnavailableOrderItems ||
                            isSubmitting ||
                            (paymentMethod === "stripe" && !isStripeReady)
                        }
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
    tax,
    total,
    onChangeQuantity,
    onRemoveItem,
    onClearOrder,
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
    const hasUnavailableOrderItems = hasUnavailableCartItems(cartItems);

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
                            tax={tax}
                            total={total}
                            onChangeQuantity={onChangeQuantity}
                            onRemoveItem={onRemoveItem}
                            onClearOrder={onClearOrder}
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

            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 py-3 lg:hidden">
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
                            ${total.toFixed(2)}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={
                            hasUnavailableOrderItems ||
                            isSubmitting ||
                            (paymentMethod === "stripe" && !isStripeReady)
                        }
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
    tax,
    total,
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
        0,
    );
    const hasUnavailableOrderItems = hasUnavailableCartItems(cartItems);

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
                                {itemCount} item{itemCount === 1 ? "" : "s"}{" "}
                                will be sent to the restaurant.
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
                    {cartItems.map((item, index) => {
                        const canOrder = isFoodOrderable(item);

                        return (
                            <div
                                key={`${item.id}-${item.notes}-${index}`}
                                className={`rounded-2xl border p-3 ${
                                    canOrder
                                        ? "border-white/10 bg-white/[0.07]"
                                        : "border-[#FF6B6B]/35 bg-[#7F1D1D]/16"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="line-clamp-2 text-sm font-black text-white">
                                            {item.title}
                                        </p>
                                        <p className="mt-1 text-xs font-bold text-[#FFD166]">
                                            {item.restaurantName} · Qty{" "}
                                            {item.quantity}
                                        </p>
                                        {!canOrder && (
                                            <p className="mt-1 text-xs font-black text-[#FFB3B3]">
                                                Unavailable
                                            </p>
                                        )}
                                    </div>
                                    <span className="shrink-0 text-sm font-black text-white">
                                        $
                                        {(
                                            Number(item.price ?? 0) *
                                            item.quantity
                                        ).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="border-t border-white/10 p-5">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                        <div>
                            <p className="mb-2 text-xs font-black uppercase tracking-wide text-white/55">
                                Payment method
                            </p>
                            <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/10 p-1">
                                {[
                                    {
                                        id: "cash",
                                        label: "Cash",
                                        icon: Banknote,
                                    },
                                    {
                                        id: "stripe",
                                        label: "Stripe",
                                        icon: CreditCard,
                                    },
                                ].map((method) => {
                                    const Icon = method.icon;
                                    const isActive =
                                        paymentMethod === method.id;

                                    return (
                                        <button
                                            key={method.id}
                                            type="button"
                                            onClick={() =>
                                                onPaymentMethodChange(method.id)
                                            }
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
                                The waiter will collect and confirm the cash
                                payment.
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
                                <p
                                    className={`mt-2 text-xs font-semibold ${stripeCardMessage ? "text-red-200" : "text-white/55"}`}
                                >
                                    {stripeCardMessage ||
                                        (isStripeReady
                                            ? "Card ready."
                                            : "Loading Stripe...")}
                                </p>
                            </div>
                        )}

                        <div className="mt-3 space-y-2 border-t border-dashed border-white/20 pt-3">
                            <div className="flex items-center justify-between text-sm font-bold text-white/65">
                                <span>Subtotal</span>
                                <span className="text-white">
                                    ${subtotal.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm font-bold text-white/65">
                                <span>Tax</span>
                                <span className="text-white">
                                    ${tax.toFixed(2)}
                                </span>
                            </div>
                        </div>
                        <div className="mt-3 flex items-end justify-between">
                            <span className="text-lg font-black">Total</span>
                            <span className="text-3xl font-black text-[#FFD166]">
                                ${total.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {hasUnavailableOrderItems && (
                            <p className="rounded-2xl border border-[#FF6B6B]/35 bg-[#7F1D1D]/24 px-4 py-2.5 text-center text-sm font-extrabold leading-5 text-[#FFB3B3] sm:col-span-2">
                                {FOOD_UNAVAILABLE_MESSAGE}
                            </p>
                        )}
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
                            disabled={
                                hasUnavailableOrderItems ||
                                isSubmitting ||
                                (paymentMethod === "stripe" && !isStripeReady)
                            }
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

function CustomerOnboarding({ onFinish }) {
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
            Math.min(onboardingSlides.length - 1, current + 1),
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

            <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-end px-5 py-5 sm:px-8">
                <button
                    type="button"
                    onClick={onFinish}
                    className="touch-manipulation rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-white backdrop-blur transition active:scale-95"
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

function SessionUnavailableScreen({
    title = "Menu unavailable",
    message,
    variant = "error",
}) {
    const isLoadingVariant = variant === "loading";
    const messageText = String(message || "");
    const friendlyMessage = messageText.toLowerCase().includes("session")
        ? "This table menu is not available right now. Please ask the waiter for help."
        : messageText || "This table menu is not available right now.";

    return (
        <main className="grid min-h-dvh place-items-center bg-[radial-gradient(circle_at_82%_12%,rgba(127,29,29,0.12),transparent_30%),radial-gradient(circle_at_14%_20%,rgba(255,209,102,0.13),transparent_24%),linear-gradient(145deg,#fffaf3_0%,#f8efe4_48%,#f1dfd0_100%)] px-4 py-6">
            <article
                className={`w-full max-w-md rounded-[28px] border p-6 text-center shadow-[0_24px_70px_rgba(77,46,28,0.16)] ${
                    isLoadingVariant
                        ? "border-[#ead2bd] bg-[#fffaf3] text-[#241707]"
                        : "border-white/10 bg-[#20272A] text-white"
                }`}
            >
                <div
                    className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl border ${
                        isLoadingVariant
                            ? "border-[#9A6400]/25 bg-[#FFD166]/22 text-[#9A6400]"
                            : "border-[#FFD166]/25 bg-[#FFD166]/10 text-[#FFD166]"
                    }`}
                >
                    <ReceiptText size={30} />
                </div>
                <h1
                    className={`mt-5 text-3xl font-black ${
                        isLoadingVariant ? "text-[#241707]" : "text-white"
                    }`}
                >
                    {title}
                </h1>
                <p
                    className={`mx-auto mt-3 max-w-sm text-sm font-semibold leading-6 ${
                        isLoadingVariant ? "text-[#6f6255]" : "text-white/65"
                    }`}
                >
                    {friendlyMessage}
                </p>
            </article>
        </main>
    );
}

function DineInOrder() {
    const { isLight, toggleTheme } = useTheme();
    const { tableId = "1" } = useParams();
    const location = useLocation();
    const sessionTokenFromUrl = useMemo(
        () => getSessionTokenFromUrl(tableId, location.search),
        [location.search, tableId],
    );
    const orderStorageKey = `customer-dine-in-order:${tableId}`;
    const invoiceStorageKey = `customer-dine-in-invoice:${tableId}`;
    const orderTimingsStorageKey = `customer-dine-in-order-times:${tableId}`;
    const sessionTokenStorageKey = `customer-dine-in-session-token:${tableId}`;
    const onboardingStorageKey = `customer-dine-in-onboarding:${tableId}`;
    const [restaurants, setRestaurants] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [sessionToken, setSessionToken] = useState(
        () => sessionStorage.getItem(sessionTokenStorageKey) || "",
    );
    const [activeRestaurant, setActiveRestaurant] = useState("all");
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
    const [isSessionAvailable, setIsSessionAvailable] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [orderTimings, setOrderTimings] = useState(() =>
        readStoredOrderTimings(orderTimingsStorageKey),
    );
    const [showOrderTimings, setShowOrderTimings] = useState(false);
    const [pendingCancelOrderId, setPendingCancelOrderId] = useState("");
    const [cancelingOrderId, setCancelingOrderId] = useState("");
    const [pendingDeleteItemKey, setPendingDeleteItemKey] = useState("");
    const [deletingItemKey, setDeletingItemKey] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(
        () => sessionStorage.getItem(onboardingStorageKey) !== "done",
    );
    const menuSectionRef = useRef(null);
    const stripeCardContainerRef = useRef(null);
    const stripeCardRef = useRef(null);
    const cartItemsRef = useRef(cartItems);
    const orderTimingsRef = useRef(orderTimings);

    const saveOrderTimings = (getNextTimings) => {
        setOrderTimings((current) => {
            const nextTimings = getNextTimings(current);

            sessionStorage.setItem(
                orderTimingsStorageKey,
                JSON.stringify(nextTimings),
            );

            return nextTimings;
        });
    };

    useEffect(() => {
        cartItemsRef.current = cartItems;
    }, [cartItems]);

    useEffect(() => {
        orderTimingsRef.current = orderTimings;
    }, [orderTimings]);

    useEffect(() => {
        if (!successMessage) return undefined;

        const timeoutId = window.setTimeout(() => {
            setSuccessMessage("");
        }, 4000);

        return () => window.clearTimeout(timeoutId);
    }, [successMessage]);

    useEffect(() => {
        if (!errorMessage || isSessionAvailable === false) return undefined;

        const timeoutId = window.setTimeout(() => {
            setErrorMessage("");
        }, 5000);

        return () => window.clearTimeout(timeoutId);
    }, [errorMessage, isSessionAvailable]);

    useEffect(() => {
        const loadMenu = async () => {
            let hasVerifiedSession = false;

            setIsLoading(true);
            setErrorMessage("");

            try {
                if (sessionTokenFromUrl) {
                    sessionStorage.setItem(
                        sessionTokenStorageKey,
                        String(sessionTokenFromUrl),
                    );
                    setSessionToken(String(sessionTokenFromUrl));
                }

                const tableDetails = await fetchTableDetails(tableId);
                const nextSessionToken = getSessionToken(tableDetails);
                const resolvedSessionToken =
                    nextSessionToken ||
                    sessionTokenFromUrl ||
                    sessionStorage.getItem(sessionTokenStorageKey) ||
                    "";

                if (nextSessionToken) {
                    sessionStorage.setItem(
                        sessionTokenStorageKey,
                        String(nextSessionToken),
                    );
                    setSessionToken(String(nextSessionToken));
                }

                if (!resolvedSessionToken) {
                    throw createSessionUnavailableError(
                        "This table session is not available.",
                    );
                }

                const sessionData = await validateDineInSession(
                    resolvedSessionToken,
                    tableId,
                );
                hasVerifiedSession = true;
                setIsSessionAvailable(true);

                const restaurantsResponse = await api.get("/restaurants");
                const restaurantList = getList(restaurantsResponse.data)
                    .map(normalizeRestaurant)
                    .filter((restaurant) => restaurant.id);
                const menuResponses = await Promise.allSettled(
                    restaurantList.map((restaurant) =>
                        fetchRestaurantMenu(restaurant, {
                            includeDetails: false,
                        }),
                    ),
                );
                const initialMenuItems = menuResponses.flatMap((result) =>
                    result.status === "fulfilled" ? result.value : [],
                );

                setRestaurants(restaurantList);
                setMenuItems(initialMenuItems);
                setIsLoading(false);

                Promise.allSettled(
                    restaurantList.map((restaurant) =>
                        fetchRestaurantMenu(restaurant, {
                            includeDetails: true,
                        }),
                    ),
                ).then((detailResponses) => {
                    const detailedMenuItems = detailResponses.flatMap(
                        (result) =>
                            result.status === "fulfilled" ? result.value : [],
                    );

                    if (detailedMenuItems.length) {
                        setMenuItems(detailedMenuItems);
                    }
                });

                fetchCurrentDineInOrders(
                    resolvedSessionToken,
                    tableId,
                    sessionData,
                    restaurantList.map(getRestaurantId).filter(Boolean),
                )
                    .then((activeOrders) =>
                        buildOrderTimingItems(
                            activeOrders,
                            resolvedSessionToken,
                        ),
                    )
                    .then((activeOrderTimings) => {
                        if (activeOrderTimings.length) {
                            setOrderTimings(activeOrderTimings);
                            sessionStorage.setItem(
                                orderTimingsStorageKey,
                                JSON.stringify(activeOrderTimings),
                            );
                            setShowOrderTimings(true);
                            setSuccessMessage(
                                activeOrderTimings.length === 1
                                    ? "You have an active order for this table."
                                    : `You have ${activeOrderTimings.length} active orders for this table.`,
                            );
                            return;
                        }

                        setSuccessMessage("");
                        setOrderTimings([]);
                        sessionStorage.removeItem(orderStorageKey);
                        sessionStorage.removeItem(invoiceStorageKey);
                        sessionStorage.removeItem(orderTimingsStorageKey);
                        setShowOrderTimings(false);
                    })
                    .catch(() => {
                        setOrderTimings([]);
                        setShowOrderTimings(false);
                    });
            } catch (error) {
                if (error.isSessionUnavailable || !hasVerifiedSession) {
                    sessionStorage.removeItem(sessionTokenStorageKey);
                    sessionStorage.removeItem(orderStorageKey);
                    sessionStorage.removeItem(invoiceStorageKey);
                    sessionStorage.removeItem(orderTimingsStorageKey);
                    setSessionToken("");
                    setCartItems([]);
                    setRestaurants([]);
                    setMenuItems([]);
                    setOrderTimings([]);
                    setShowOrderTimings(false);
                    setIsSessionAvailable(false);
                    setShowOnboarding(false);
                    setErrorMessage(
                        error.message ||
                            "This table session is not available. Ask the waiter to open a new table session.",
                    );
                    return;
                }

                try {
                    const foodsResponse = await api.get("/food");
                    const foods = getList(foodsResponse.data).map(
                        normalizeFoodItem,
                    );
                    setMenuItems(foods);

                    Promise.allSettled(foods.map(fetchFoodDetails)).then(
                        (detailResponses) => {
                            setMenuItems(
                                detailResponses.map((result, index) =>
                                    result.status === "fulfilled"
                                        ? result.value
                                        : foods[index],
                                ),
                            );
                        },
                    );

                    if (
                        !sessionTokenFromUrl &&
                        !sessionStorage.getItem(sessionTokenStorageKey)
                    ) {
                        setErrorMessage(
                            "Open this page from a valid table QR link before placing an order.",
                        );
                    }
                } catch (fallbackError) {
                    setErrorMessage(
                        fallbackError.response?.data?.message ||
                            "Menu could not be loaded.",
                    );
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadMenu();
    }, [
        invoiceStorageKey,
        orderStorageKey,
        orderTimingsStorageKey,
        sessionTokenFromUrl,
        sessionTokenStorageKey,
        tableId,
    ]);

    const refreshMenuItems = useCallback(async () => {
        if (restaurants.length) {
            const detailResponses = await Promise.allSettled(
                restaurants.map((restaurant) =>
                    fetchRestaurantMenu(restaurant, { includeDetails: true }),
                ),
            );
            const detailedMenuItems = detailResponses.flatMap((result) =>
                result.status === "fulfilled" ? result.value : [],
            );

            if (detailedMenuItems.length) {
                setMenuItems(detailedMenuItems);
            }

            return;
        }

        const foodsResponse = await api.get("/food");
        const foods = getList(foodsResponse.data).map(normalizeFoodItem);
        const detailResponses = await Promise.allSettled(foods.map(fetchFoodDetails));

        setMenuItems(
            detailResponses.map((result, index) =>
                result.status === "fulfilled" ? result.value : foods[index],
            ),
        );
    }, [restaurants]);

    useEffect(() => {
        if (!orderTimings.length || !sessionToken) {
            return undefined;
        }

        let isMounted = true;

        const refreshTiming = async () => {
            const currentOrderTimings = orderTimingsRef.current;

            if (!currentOrderTimings.length) return;

            const refreshedTimings = await Promise.all(
                currentOrderTimings.map(async (orderTiming) => ({
                    ...orderTiming,
                    timing:
                        (await fetchDineInOrderTiming(
                            orderTiming.orderId,
                            sessionToken,
                        )) ?? orderTiming.timing,
                })),
            );

            if (!isMounted) return;

            setOrderTimings(refreshedTimings);
            sessionStorage.setItem(
                orderTimingsStorageKey,
                JSON.stringify(refreshedTimings),
            );
        };

        refreshTiming();
        const intervalId = window.setInterval(refreshTiming, 5000);

        return () => {
            isMounted = false;
            window.clearInterval(intervalId);
        };
    }, [orderTimings.length, orderTimingsStorageKey, sessionToken]);

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
                    setStripeCardMessage(
                        error.message || "Stripe could not be loaded.",
                    );
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
                activeRestaurant === "all" ||
                !activeRestaurant ||
                String(item.restaurant_id) === String(activeRestaurant);
            const matchesCategory =
                activeCategory === "all" ||
                String(item.category) === String(activeCategory);
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
                (restaurant) =>
                    String(restaurant.id) === String(activeRestaurant),
            ),
        [activeRestaurant, restaurants],
    );

    const featuredItems = useMemo(
        () => menuItems.filter((item) => item.image).slice(0, 12),
        [menuItems],
    );

    const activeRestaurantCategories = useMemo(() => {
        const categoryMap = new Map();

        menuItems
            .filter(
                (item) =>
                    activeRestaurant === "all" ||
                    !activeRestaurant ||
                    String(item.restaurant_id) === String(activeRestaurant),
            )
            .forEach((item) => {
                categoryMap.set(String(item.category), {
                    id: String(item.category),
                    name: item.categoryName,
                });
            });

        return Array.from(categoryMap.values());
    }, [activeRestaurant, menuItems]);

    const availabilityRestaurantIds = useMemo(() => {
        if (activeRestaurant !== "all" && activeRestaurant)
            return [activeRestaurant];

        const restaurantIds = restaurants.length
            ? restaurants.map((restaurant) => restaurant.id)
            : menuItems.map((item) => item.restaurant_id);

        return Array.from(new Set(restaurantIds.map(String).filter(Boolean)));
    }, [activeRestaurant, menuItems, restaurants]);

    const handleMenuAvailabilityUpdate = useCallback((event) => {
        if (event?.type === "modifier_availability_updated") {
            const modifierOptions = Array.isArray(event?.modifier_options)
                ? event.modifier_options
                : [];

            if (!modifierOptions.length) return;

            const unavailableOptionIds = new Set(
                modifierOptions
                    .filter((option) => option?.can_order === false)
                    .map((option) =>
                        String(
                            option.modifier_option_id ??
                                option.modifierOptionId ??
                                option.id
                        )
                    )
            );
            const cartHadUnavailableModifier = cartItemsRef.current.some((item) =>
                (item.selectedModifierOptions ?? []).some((option) =>
                    unavailableOptionIds.has(
                        String(option.modifier_option_id ?? option.id)
                    )
                )
            );

            setMenuItems((currentItems) =>
                applyModifierAvailabilityUpdates(currentItems, modifierOptions),
            );
            setSelectedItem((currentItem) =>
                currentItem
                    ? applyModifierAvailabilityUpdates([currentItem], modifierOptions)[0]
                    : currentItem,
            );
            setCartItems((currentItems) =>
                removeUnavailableModifierSelections(
                    applyModifierAvailabilityUpdates(currentItems, modifierOptions),
                ),
            );

            if (cartHadUnavailableModifier) {
                setSuccessMessage("");
                setErrorMessage(MODIFIER_UNAVAILABLE_MESSAGE);
            }

            return;
        }

        const updatedFoods = Array.isArray(event?.foods) ? event.foods : [];

        if (!updatedFoods.length) return;

        const unavailableFoodIds = new Set(
            updatedFoods
                .filter((food) => food?.can_order === false)
                .map((food) => String(food.food_id ?? food.foodId ?? food.id)),
        );

        setMenuItems((currentItems) =>
            applyFoodAvailabilityUpdates(currentItems, updatedFoods),
        );
        setSelectedItem((currentItem) =>
            currentItem
                ? applyFoodAvailabilityUpdates([currentItem], updatedFoods)[0]
                : currentItem,
        );
        if (
            cartItemsRef.current.some((item) =>
                unavailableFoodIds.has(getFoodKey(item)),
            )
        ) {
            setSuccessMessage("");
            setErrorMessage(FOOD_UNAVAILABLE_MESSAGE);
        }

        setCartItems((currentItems) =>
            applyFoodAvailabilityUpdates(currentItems, updatedFoods),
        );
    }, []);

    useFoodAvailabilityRealtime(
        availabilityRestaurantIds,
        handleMenuAvailabilityUpdate,
    );

    useEffect(() => {
        if (activeRestaurant || !restaurants.length) return;

        setActiveRestaurant("all");
    }, [activeRestaurant, restaurants]);

    const { subtotal, tax, total } = useMemo(
        () => getCartTotals(cartItems),
        [cartItems],
    );
    const itemCount = cartItems.reduce(
        (total, item) => total + Number(item.quantity ?? 1),
        0,
    );

    const addToCart = (product) => {
        if (!isFoodOrderable(product)) {
            setSuccessMessage("");
            setErrorMessage(FOOD_NOT_ORDERABLE_MESSAGE);
            return false;
        }

        setCartItems((current) => {
            const existingIndex = current.findIndex(
                (item) =>
                    item.id === product.id &&
                    item.size === product.size &&
                    item.notes === product.notes,
            );

            if (existingIndex === -1) return [...current, product];

            return current.map((item, index) =>
                index === existingIndex
                    ? { ...item, quantity: item.quantity + product.quantity }
                    : item,
            );
        });
        return true;
    };

    const changeQuantity = (indexToChange, amount) => {
        setCartItems((items) =>
            items
                .map((item, index) =>
                    index === indexToChange
                        ? {
                              ...item,
                              quantity: Math.max(0, item.quantity + amount),
                          }
                        : item,
                )
                .filter((item) => item.quantity > 0),
        );
    };

    const removeCartItem = (indexToRemove) => {
        setCartItems((items) =>
            items.filter((_, currentIndex) => currentIndex !== indexToRemove),
        );
    };

    const clearOrder = () => {
        setCartItems([]);
        setIsConfirmOrderOpen(false);
        setIsMobileCartOpen(false);
        setErrorMessage("");
        setSuccessMessage("");
    };

    const cancelActiveOrder = async (orderId) => {
        if (!orderId || cancelingOrderId) return;

        if (pendingCancelOrderId !== String(orderId)) {
            setPendingCancelOrderId(String(orderId));
            setSuccessMessage("");
            setErrorMessage("");
            return;
        }

        setCancelingOrderId(String(orderId));
        setErrorMessage("");
        setSuccessMessage("");

        try {
            await cancelDineInOrder(orderId, sessionToken, tableId);
            setPendingCancelOrderId("");
            saveOrderTimings((currentTimings) =>
                currentTimings.filter(
                    (orderTiming) =>
                        String(orderTiming.orderId) !== String(orderId),
                ),
            );
            setShowOrderTimings(
                orderTimingsRef.current.some(
                    (orderTiming) =>
                        String(orderTiming.orderId) !== String(orderId),
                ),
            );
            sessionStorage.removeItem(orderStorageKey);
            sessionStorage.removeItem(invoiceStorageKey);
            setSuccessMessage(`Order #${orderId} canceled.`);
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message ||
                    "Could not cancel this order. Please ask the waiter for help.",
            );
        } finally {
            setCancelingOrderId("");
        }
    };

    const deleteActiveOrderItem = async (orderId, itemId) => {
        const itemKey = `${orderId}:${itemId}`;

        if (!orderId || !itemId || deletingItemKey) return;

        if (pendingDeleteItemKey !== itemKey) {
            setPendingDeleteItemKey(itemKey);
            setPendingCancelOrderId("");
            setSuccessMessage("");
            setErrorMessage("");
            return;
        }

        setDeletingItemKey(itemKey);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            await deleteDineInOrderItem(orderId, itemId, sessionToken, tableId);
            setPendingDeleteItemKey("");
            saveOrderTimings((currentTimings) =>
                currentTimings
                    .map((orderTiming) => {
                        if (String(orderTiming.orderId) !== String(orderId)) {
                            return orderTiming;
                        }

                        const timing = orderTiming.timing;

                        if (
                            timing?.scope !== "per_restaurant" ||
                            !Array.isArray(timing.restaurants)
                        ) {
                            return orderTiming;
                        }

                        const restaurants = timing.restaurants
                            .map((restaurant) => ({
                                ...restaurant,
                                items: restaurant.items.filter(
                                    (item) =>
                                        String(item.id) !== String(itemId),
                                ),
                            }))
                            .filter((restaurant) => restaurant.items.length);

                        return {
                            ...orderTiming,
                            timing: {
                                ...timing,
                                restaurants,
                            },
                        };
                    })
                    .filter(
                        (orderTiming) =>
                            orderTiming.timing?.scope !== "per_restaurant" ||
                            orderTiming.timing.restaurants.length,
                    ),
            );
            setSuccessMessage("Item deleted from this order.");
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message ||
                    "Could not delete this item. Please ask the waiter for help.",
            );
        } finally {
            setDeletingItemKey("");
        }
    };

    const submitOrder = async () => {
        if (!cartItems.length) return;
        if (hasUnavailableCartItems(cartItems)) {
            setIsConfirmOrderOpen(false);
            setSuccessMessage("");
            setErrorMessage(FOOD_UNAVAILABLE_MESSAGE);
            return;
        }

        setIsSubmitting(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            if (!sessionToken) {
                throw new Error(
                    "Please scan the table QR again or ask the waiter for help.",
                );
            }

            if (paymentMethod === "stripe" && !isStripeReady) {
                throw new Error(
                    "Stripe is still loading. Try again in a moment.",
                );
            }

            const response = await createDineInOrder(
                cartItems,
                tableId,
                sessionToken,
            );
            const createdOrderId = getCreatedOrderId(response);
            const invoiceId = getCreatedInvoiceId(response);

            if (createdOrderId) {
                sessionStorage.setItem(orderStorageKey, String(createdOrderId));

                if (invoiceId) {
                    sessionStorage.setItem(
                        invoiceStorageKey,
                        String(invoiceId),
                    );
                }
            } else {
                throw new Error("Order was created without an order id.");
            }

            const paymentResponse = await selectDineInPaymentForCurrentOrder(
                invoiceId,
                createdOrderId,
                sessionToken,
                paymentMethod,
            );

            if (paymentMethod === "stripe") {
                await confirmStripePayment(
                    findStripeClientSecret(paymentResponse),
                    stripeCardRef.current,
                );
            }

            const nextOrderTiming =
                getBestPreparationTiming(paymentResponse, response) ||
                (await fetchDineInOrderTiming(createdOrderId, sessionToken));

            saveOrderTimings((currentTimings) => {
                const nextOrderTimingItem = {
                    orderId: String(createdOrderId),
                    timing: nextOrderTiming,
                };
                const nextTimings = currentTimings.filter(
                    (orderTiming) =>
                        String(orderTiming.orderId) !== String(createdOrderId),
                );

                return [...nextTimings, nextOrderTimingItem];
            });
            setShowOrderTimings(true);
            setCartItems([]);
            setIsConfirmOrderOpen(false);
            setIsMobileCartOpen(false);
            setSuccessMessage(
                paymentMethod === "cash"
                    ? "Cash payment selected. The waiter will collect it."
                    : "Stripe payment completed.",
            );
        } catch (error) {
            const validationErrors = error.response?.data?.errors;
            const firstValidationError = validationErrors
                ? Object.values(validationErrors).flat().find(Boolean)
                : "";

            setIsConfirmOrderOpen(false);
            const responseMessage = error.response?.data?.message || "";
            const errorText = JSON.stringify(
                error.response?.data || error.message || "",
            );
            const isMissingPreparationSnapshotColumn =
                errorText.includes("preparation_batch_size_snapshot") ||
                errorText.includes("preparation_time_snapshot");
            const sessionExpired =
                error.response?.status === 422 &&
                responseMessage.toLowerCase().includes("session");

            if (error.response?.status === 422) {
                refreshMenuItems().catch((refreshError) => {
                    console.error(refreshError.response?.data || refreshError);
                });
            }

            if (sessionExpired) {
                sessionStorage.removeItem(sessionTokenStorageKey);
                setSessionToken("");
                setCartItems([]);
                setIsSessionAvailable(false);
            }

            setErrorMessage(
                isMissingPreparationSnapshotColumn
                    ? "Order could not be saved. The backend database needs the latest order-items migration."
                    : firstValidationError ||
                          responseMessage ||
                          error.message ||
                          "Order could not be sent.",
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
        if (hasUnavailableCartItems(cartItems)) {
            setSuccessMessage("");
            setErrorMessage(FOOD_UNAVAILABLE_MESSAGE);
            return;
        }
        if (!sessionToken) {
            setSuccessMessage("");
            setErrorMessage(
                "Please scan the table QR again or ask the waiter for help.",
            );
            return;
        }

        setErrorMessage("");
        setSuccessMessage("");
        setIsConfirmOrderOpen(true);
    };

    if (isLoading) {
        return (
            <SessionUnavailableScreen
                title="Welcome"
                message="Preparing your table menu..."
                variant="loading"
            />
        );
    }

    if (isSessionAvailable === false) {
        return <SessionUnavailableScreen message={errorMessage} />;
    }

    if (showOnboarding) {
        return <CustomerOnboarding onFinish={finishOnboarding} />;
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
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/10 text-[#FFD166] shadow-sm transition hover:bg-white/[0.14] active:scale-95 sm:h-11 sm:w-11 sm:rounded-2xl"
                            aria-label={
                                isLight
                                    ? "Switch to dark mode"
                                    : "Switch to light mode"
                            }
                            title={isLight ? "Dark mode" : "Light mode"}
                        >
                            {isLight ? <Moon size={20} /> : <Sun size={20} />}
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                itemCount > 0 && setIsMobileCartOpen(true)
                            }
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

            <main
                className={`relative mx-auto grid max-w-7xl gap-3 px-2 pt-2 sm:gap-5 sm:px-4 sm:pt-4 ${itemCount ? "pb-28 lg:pb-8" : "pb-6 sm:pb-8"}`}
            >
                <FeaturedDishSlider
                    featuredItems={featuredItems}
                    onGoToMenu={goToDishRestaurantMenu}
                />

                <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start xl:grid-cols-[minmax(0,1fr)_390px]">
                    <div className="min-w-0">
                        <RestaurantPicker
                            restaurants={restaurants}
                            menuItems={menuItems}
                            activeRestaurant={activeRestaurant}
                            onSelect={selectRestaurant}
                        />

                        {(successMessage || orderTimings.length > 0) && (
                            <div className="mb-4 space-y-3">
                                {successMessage && (
                                    <p className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
                                        <CheckCircle2 size={18} />
                                        {successMessage}
                                    </p>
                                )}
                                {orderTimings.length > 0 && (
                                    <div className="space-y-3">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowOrderTimings(
                                                    (current) => !current,
                                                )
                                            }
                                            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[#FFD166]/45 bg-[#FFD166]/16 px-4 py-3 text-left text-white shadow-[0_12px_26px_rgba(255,209,102,0.10)]"
                                        >
                                            <span className="flex items-center gap-3">
                                                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFD166] text-[#151A1D] shadow-[0_10px_20px_rgba(255,209,102,0.18)]">
                                                    <Clock3 size={20} />
                                                </span>
                                                <span>
                                                    <span className="block text-xs font-black uppercase tracking-[0.14em] text-[#FFD166]">
                                                        Order times
                                                    </span>
                                                    <span className="mt-0.5 block text-sm font-black text-white">
                                                        {orderTimings.length}{" "}
                                                        active order
                                                        {orderTimings.length ===
                                                        1
                                                            ? ""
                                                            : "s"}
                                                    </span>
                                                </span>
                                            </span>
                                            <span className="text-sm font-black text-white/70">
                                                {showOrderTimings
                                                    ? "Hide"
                                                    : "Show"}
                                            </span>
                                        </button>

                                        {showOrderTimings && (
                                            <div className="space-y-2 rounded-2xl border border-white/10 bg-[#12181B] p-3 text-white">
                                                {orderTimings.map(
                                                    (orderTiming, index) => {
                                                        const timing =
                                                            orderTiming.timing;
                                                        const orderId = String(
                                                            orderTiming.orderId,
                                                        );
                                                        const isCancelPending =
                                                            pendingCancelOrderId ===
                                                            orderId;
                                                        const isCanceling =
                                                            cancelingOrderId ===
                                                            orderId;
                                                        const isPerRestaurant =
                                                            timing?.scope ===
                                                                "per_restaurant" &&
                                                            Array.isArray(
                                                                timing.restaurants,
                                                            );
                                                        const label =
                                                            isPerRestaurant
                                                                ? timing.waitingForPreparation
                                                                    ? "Waiting for restaurants"
                                                                    : getPreparationTimingLabel(
                                                                          timing,
                                                                      )
                                                                : getPreparationTimingLabel(
                                                                      timing,
                                                                  );

                                                        return (
                                                            <div
                                                                key={orderId}
                                                                className="rounded-xl bg-white/[0.07] px-3 py-3"
                                                            >
                                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                                    <div className="min-w-0">
                                                                        <span className="block text-sm font-black text-white/70">
                                                                            Order{" "}
                                                                            {index +
                                                                                1}
                                                                        </span>
                                                                        {isCancelPending && (
                                                                            <span className="mt-1 block text-xs font-black text-[#FFB3B3]">
                                                                                Delete
                                                                                this
                                                                                order?
                                                                                Press
                                                                                confirm
                                                                                to
                                                                                cancel
                                                                                it.
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex shrink-0 items-center gap-2">
                                                                        <span className="text-xl font-black text-white">
                                                                            {
                                                                                label
                                                                            }
                                                                        </span>
                                                                        {isCancelPending && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    setPendingCancelOrderId(
                                                                                        "",
                                                                                    )
                                                                                }
                                                                                disabled={
                                                                                    isCanceling
                                                                                }
                                                                                className="grid h-9 w-9 place-items-center rounded-lg border border-[#9B1C1C]/35 bg-[#FFF1F1] text-[#7F1D1D] shadow-[0_6px_14px_rgba(127,29,29,0.10)] transition hover:border-[#9B1C1C]/55 hover:bg-[#FFE1E1] disabled:cursor-wait disabled:opacity-70"
                                                                                aria-label="Cancel delete order"
                                                                                title="Cancel"
                                                                            >
                                                                                <X
                                                                                    size={
                                                                                        17
                                                                                    }
                                                                                    className="text-[#7F1D1D] [stroke:#7F1D1D]"
                                                                                />
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                cancelActiveOrder(
                                                                                    orderId,
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                isCanceling
                                                                            }
                                                                            className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-xs font-black text-white shadow-[0_8px_18px_rgba(127,29,29,0.18)] transition active:scale-[0.96] disabled:cursor-wait disabled:!bg-[#7F1D1D] disabled:!text-white disabled:opacity-80 ${
                                                                                isCancelPending
                                                                                    ? "border-[#FF6B6B]/55 bg-[#7F1D1D] hover:bg-[#9B1C1C]"
                                                                                    : "border-[#FF6B6B]/35 bg-[#7F1D1D] hover:border-[#FF8A8A]/55 hover:bg-[#681718]"
                                                                            }`}
                                                                            aria-label={
                                                                                isCancelPending
                                                                                    ? `Confirm cancel order ${orderId}`
                                                                                    : `Cancel order ${orderId}`
                                                                            }
                                                                            title={
                                                                                isCancelPending
                                                                                    ? "Confirm cancel order"
                                                                                    : "Cancel order"
                                                                            }
                                                                        >
                                                                            <Trash2
                                                                                size={
                                                                                    15
                                                                                }
                                                                                className="text-white [stroke:white]"
                                                                            />
                                                                            <span>
                                                                                {isCanceling
                                                                                    ? "Canceling..."
                                                                                    : isCancelPending
                                                                                      ? "Confirm"
                                                                                      : "Cancel"}
                                                                            </span>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                {isPerRestaurant && (
                                                                    <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                                                                        {timing.restaurants.map(
                                                                            (
                                                                                restaurant,
                                                                            ) => {
                                                                                const restaurantLabel =
                                                                                    restaurant.waitingForPreparation
                                                                                        ? "Waiting for preparation"
                                                                                        : READY_STATUSES.includes(
                                                                                                restaurant.status,
                                                                                            )
                                                                                          ? "Ready"
                                                                                          : getPreparationTimingLabel(
                                                                                                restaurant,
                                                                                                "On the way",
                                                                                            );

                                                                                return (
                                                                                    <div
                                                                                        key={`${orderTiming.orderId}-${restaurant.id}`}
                                                                                        className="rounded-xl border border-white/10 bg-black/15 p-3"
                                                                                    >
                                                                                        <div className="flex items-start justify-between gap-3">
                                                                                            <div className="min-w-0">
                                                                                                <p className="truncate text-sm font-black text-white">
                                                                                                    {
                                                                                                        restaurant.restaurantName
                                                                                                    }
                                                                                                </p>
                                                                                                <p className="mt-1 text-xs font-bold text-white/55">
                                                                                                    {
                                                                                                        restaurant
                                                                                                            .items
                                                                                                            .length
                                                                                                    }{" "}
                                                                                                    item
                                                                                                    {restaurant
                                                                                                        .items
                                                                                                        .length ===
                                                                                                    1
                                                                                                        ? ""
                                                                                                        : "s"}
                                                                                                </p>
                                                                                            </div>
                                                                                            <span
                                                                                                className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-black ${
                                                                                                    restaurant.waitingForPreparation
                                                                                                        ? "bg-[#FFD166]/16 text-[#FFD166]"
                                                                                                        : "bg-emerald-400/16 text-emerald-200"
                                                                                                }`}
                                                                                            >
                                                                                                {
                                                                                                    restaurantLabel
                                                                                                }
                                                                                            </span>
                                                                                        </div>
                                                                                        {restaurant
                                                                                            .items
                                                                                            .length >
                                                                                            0 && (
                                                                                            <div className="mt-3 space-y-1">
                                                                                                {restaurant.items.map(
                                                                                                    (
                                                                                                        item,
                                                                                                    ) => {
                                                                                                        const itemKey = `${orderId}:${item.id}`;
                                                                                                        const isDeletePending =
                                                                                                            pendingDeleteItemKey ===
                                                                                                            itemKey;
                                                                                                        const isDeleting =
                                                                                                            deletingItemKey ===
                                                                                                            itemKey;

                                                                                                        return (
                                                                                                            <div
                                                                                                                key={
                                                                                                                    item.id
                                                                                                                }
                                                                                                                className={`flex items-start justify-between gap-2 rounded-lg px-2 py-1.5 ${
                                                                                                                    isDeletePending
                                                                                                                        ? "bg-[#7F1D1D]/18"
                                                                                                                        : "bg-black/10"
                                                                                                                }`}
                                                                                                            >
                                                                                                                <div className="min-w-0">
                                                                                                                    <p className="text-xs font-semibold leading-5 text-white/70">
                                                                                                                        {
                                                                                                                            item.quantity
                                                                                                                        }

                                                                                                                        x{" "}
                                                                                                                        {
                                                                                                                            item.name
                                                                                                                        }
                                                                                                                    </p>
                                                                                                                    {isDeletePending && (
                                                                                                                        <p className="mt-0.5 text-[11px] font-black text-[#FFB3B3]">
                                                                                                                            Delete
                                                                                                                            this
                                                                                                                            item?
                                                                                                                            Press
                                                                                                                            confirm.
                                                                                                                        </p>
                                                                                                                    )}
                                                                                                                </div>
                                                                                                                <div className="flex shrink-0 items-center gap-1.5">
                                                                                                                    {isDeletePending && (
                                                                                                                        <button
                                                                                                                            type="button"
                                                                                                                            onClick={() =>
                                                                                                                                setPendingDeleteItemKey(
                                                                                                                                    "",
                                                                                                                                )
                                                                                                                            }
                                                                                                                            disabled={
                                                                                                                                isDeleting
                                                                                                                            }
                                                                                                                            className="grid h-8 w-8 place-items-center rounded-lg border border-[#9B1C1C]/35 bg-[#FFF1F1] text-[#7F1D1D] shadow-[0_6px_14px_rgba(127,29,29,0.10)] transition hover:border-[#9B1C1C]/55 hover:bg-[#FFE1E1] disabled:cursor-wait disabled:opacity-70"
                                                                                                                            aria-label={`Cancel delete ${item.name}`}
                                                                                                                            title="Cancel"
                                                                                                                        >
                                                                                                                            <X
                                                                                                                                size={
                                                                                                                                    15
                                                                                                                                }
                                                                                                                                className="text-[#7F1D1D] [stroke:#7F1D1D]"
                                                                                                                            />
                                                                                                                        </button>
                                                                                                                    )}
                                                                                                                    <button
                                                                                                                        type="button"
                                                                                                                        onClick={() =>
                                                                                                                            deleteActiveOrderItem(
                                                                                                                                orderId,
                                                                                                                                item.id,
                                                                                                                            )
                                                                                                                        }
                                                                                                                        disabled={
                                                                                                                            isDeleting
                                                                                                                        }
                                                                                                                        className={`grid h-8 min-w-8 place-items-center rounded-lg border px-2 text-xs font-black text-white shadow-[0_8px_18px_rgba(127,29,29,0.18)] transition hover:bg-[#681718] active:scale-[0.96] disabled:cursor-wait disabled:!bg-[#7F1D1D] disabled:!text-white disabled:opacity-80 ${
                                                                                                                            isDeletePending
                                                                                                                                ? "border-[#FF6B6B]/55 bg-[#7F1D1D]"
                                                                                                                                : "border-[#FF6B6B]/35 bg-[#7F1D1D]"
                                                                                                                        }`}
                                                                                                                        aria-label={
                                                                                                                            isDeletePending
                                                                                                                                ? `Confirm delete ${item.name}`
                                                                                                                                : `Delete ${item.name}`
                                                                                                                        }
                                                                                                                        title={
                                                                                                                            isDeletePending
                                                                                                                                ? "Confirm delete item"
                                                                                                                                : "Delete item"
                                                                                                                        }
                                                                                                                    >
                                                                                                                        {isDeleting ? (
                                                                                                                            "..."
                                                                                                                        ) : isDeletePending ? (
                                                                                                                            "Confirm"
                                                                                                                        ) : (
                                                                                                                            <Trash2
                                                                                                                                size={
                                                                                                                                    15
                                                                                                                                }
                                                                                                                                className="text-white [stroke:white]"
                                                                                                                            />
                                                                                                                        )}
                                                                                                                    </button>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        );
                                                                                                    },
                                                                                                )}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            },
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {errorMessage && (
                            <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
                                {errorMessage}
                            </p>
                        )}

                        <section
                            ref={menuSectionRef}
                            className="scroll-mt-20 min-w-0 rounded-[22px] border border-white/10 bg-white/[0.06] p-3 shadow-[0_22px_54px_rgba(0,0,0,0.18)] backdrop-blur sm:scroll-mt-24 sm:p-4"
                        >
                            {activeRestaurantData ||
                            activeRestaurant === "all" ? (
                                <>
                                    <div className="mb-3 flex flex-col gap-3 rounded-[20px] border border-white/10 bg-[#12181B] p-2.5 text-white sm:mb-4 sm:p-3 md:flex-row md:items-center md:justify-between">
                                        <div className="flex min-w-0 items-center gap-3">
                                            {activeRestaurantData ? (
                                                <img
                                                    src={getRestaurantImageUrl(
                                                        activeRestaurantData,
                                                    )}
                                                    alt={
                                                        activeRestaurantData.name
                                                    }
                                                    className="h-12 w-12 shrink-0 rounded-xl object-cover ring-2 ring-white/10 sm:h-16 sm:w-16 sm:rounded-2xl"
                                                />
                                            ) : (
                                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#FFD166] text-[#151A1D] sm:h-16 sm:w-16 sm:rounded-2xl">
                                                    <Utensils size={24} />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-xs font-black uppercase tracking-wide text-[#FFD166]">
                                                    {activeRestaurantData
                                                        ? "Menu"
                                                        : "All menus"}
                                                </p>
                                                <h2 className="truncate text-xl font-black sm:text-2xl">
                                                    {activeRestaurantData?.name ||
                                                        "All restaurants"}
                                                </h2>
                                            </div>
                                        </div>

                                        <label className="flex h-11 min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.07] px-3 backdrop-blur sm:h-12 sm:rounded-2xl sm:px-4 md:w-[340px]">
                                            <Search
                                                size={18}
                                                className="text-[#FFD166]"
                                            />
                                            <input
                                                value={search}
                                                onChange={(event) =>
                                                    setSearch(
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder={
                                                    activeRestaurantData
                                                        ? "Search this menu..."
                                                        : "Search all menus..."
                                                }
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
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 2xl:grid-cols-3">
                                            {visibleItems.map((item) => (
                                                <CustomerFoodCard
                                                    key={item.id}
                                                    item={item}
                                                    onOpen={() =>
                                                        setSelectedItem(item)
                                                    }
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="rounded-[24px] border border-dashed border-white/15 bg-white/[0.04] px-6 py-14 text-center text-white">
                                            <h3 className="text-lg font-black">
                                                No items found
                                            </h3>
                                            <p className="mt-1 text-sm font-semibold text-white/55">
                                                Try another search or category.
                                            </p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(127,29,29,0.24),transparent_34%),linear-gradient(135deg,#161D20,#202629)] px-6 py-14 text-center text-white">
                                    <ShoppingBag
                                        className="mx-auto text-[#FFD166]"
                                        size={34}
                                    />
                                    <h2 className="mt-3 text-xl font-black">
                                        Choose a restaurant to see its dishes
                                    </h2>
                                    <p className="mt-2 text-sm font-medium text-white/60">
                                        The dish modal will open only when you
                                        tap a food item.
                                    </p>
                                </div>
                            )}
                        </section>
                    </div>

                    <aside className="sticky top-24 hidden lg:block">
                        <OrderPanel
                            cartItems={cartItems}
                            itemCount={itemCount}
                            subtotal={subtotal}
                            tax={tax}
                            total={total}
                            onChangeQuantity={changeQuantity}
                            onRemoveItem={removeCartItem}
                            onClearOrder={clearOrder}
                            onSubmit={openConfirmOrder}
                            isSubmitting={isSubmitting}
                            paymentMethod={paymentMethod}
                            onPaymentMethodChange={setPaymentMethod}
                            isStripeReady={isStripeReady}
                            stripeCardMessage={stripeCardMessage}
                            stripeCardContainerRef={stripeCardContainerRef}
                        />
                    </aside>
                </div>
            </main>

            <MobileOrderBar
                cartItems={cartItems}
                itemCount={itemCount}
                subtotal={subtotal}
                tax={tax}
                total={total}
                onChangeQuantity={changeQuantity}
                onRemoveItem={removeCartItem}
                onClearOrder={clearOrder}
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
                    variant={isLight ? "dineIn" : "dineInDark"}
                />
            )}

            {isConfirmOrderOpen && (
                <ConfirmOrderModal
                    cartItems={cartItems}
                    subtotal={subtotal}
                    tax={tax}
                    total={total}
                    paymentMethod={paymentMethod}
                    onPaymentMethodChange={setPaymentMethod}
                    isStripeReady={isStripeReady}
                    stripeCardMessage={stripeCardMessage}
                    stripeCardContainerRef={stripeCardContainerRef}
                    isSubmitting={isSubmitting}
                    onCancel={() =>
                        !isSubmitting && setIsConfirmOrderOpen(false)
                    }
                    onConfirm={submitOrder}
                />
            )}
        </div>
    );
}

export default DineInOrder;
