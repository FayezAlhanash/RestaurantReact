import api from "../API/axios";
import { getStoredUser } from "./auth";

function getList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.orders)) return data.orders;
    if (Array.isArray(data?.queue)) return data.queue;
    if (Array.isArray(data?.data?.orders)) return data.data.orders;
    if (Array.isArray(data?.data?.queue)) return data.data.queue;
    return [];
}

function normalizeOrderType(type) {
    const value = String(type || "dine_in")
        .toLowerCase()
        .replaceAll("-", "_")
        .replaceAll(" ", "_");

    if (["delivery", "deliver"].includes(value)) return "delivery";
    if (["takeaway", "take_away", "takeout", "take_out"].includes(value)) {
        return "takeaway";
    }

    return "dine_in";
}

function formatOrderTime(value) {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function normalizeKitchenItem(item, index) {
    const food = item.food || item.menu_item || item.product || item.item || {};

    return {
        id: item.id ?? item.food_id ?? food.id ?? index,
        name:
            food.name ||
            food.title ||
            item.name ||
            item.title ||
            item.food_name ||
            "Item",
        quantity: Number(item.quantity ?? item.qty ?? item.count ?? 1),
        note:
            item.note ||
            item.notes ||
            item.special_instructions ||
            item.pivot?.notes ||
            "",
    };
}

export function normalizeKitchenOrder(order) {
    const items =
        order.items ||
        order.order_items ||
        order.orderItems ||
        order.details ||
        order.foods ||
        [];

    return {
        id: order.id ?? order.order_id,
        type: normalizeOrderType(
            order.type || order.order_type || order.service_type || order.kind
        ),
        time: formatOrderTime(order.created_at || order.time || order.ordered_at),
        status: order.status || order.kitchen_status || "pending",
        items: getList(items).map(normalizeKitchenItem),
    };
}

export async function fetchKitchenQueue() {
    const response = await api.get("/kitchen/queue");
    return getList(response.data).map(normalizeKitchenOrder);
}

export async function startKitchenOrder(orderId) {
    const response = await api.patch(
        `/kitchen/orders/${orderId}/start-preparing`
    );
    return response.data;
}

export async function markKitchenOrderReady(orderId) {
    const response = await api.patch(`/kitchen/orders/${orderId}/mark-ready`);
    return response.data;
}

export function createCashierOrderPayload(cartItems, type = "dine_in") {
    const user = getStoredUser();
    const restaurantId = user?.restaurant_id || user?.restaurant?.id;

    return {
        type,
        order_type: type,
        restaurant_id: restaurantId,
        items: cartItems.map((item) => ({
            food_id: item.food_id || item.id,
            menu_item_id: item.id,
            quantity: item.quantity,
            notes: [item.size, item.notes].filter(Boolean).join(" · "),
        })),
    };
}

export async function createCashierOrder(cartItems, type = "dine_in") {
    const payload = createCashierOrderPayload(cartItems, type);
    const endpoints = [
        "/cashier/orders",
        "/order",
        "/orders",
        "/restaurant/orders",
    ];
    let lastError;

    for (const endpoint of endpoints) {
        try {
            const response = await api.post(endpoint, payload);
            return response.data;
        } catch (error) {
            lastError = error;

            if (error.response?.status !== 404) {
                throw error;
            }
        }
    }

    throw lastError;
}
