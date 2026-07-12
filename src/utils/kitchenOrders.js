import api from "../API/axios";
import { getStoredUser, storeUser } from "./auth";

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
        id:
            item.id ??
            item.order_item_id ??
            item.food_id ??
            food.id ??
            `item-${index}`,
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

function getKitchenParentOrderId(order) {
    return (
        order.order_id ??
        order.parent_order_id ??
        order.parentOrderId ??
        order.order?.id ??
        order.cashier_order_id ??
        order.cashierOrderId ??
        order.invoice?.order_id ??
        order.restaurant_invoice?.invoice?.order_id ??
        null
    );
}

function getKitchenBackendOrderId(order) {
    return (
        order.id ??
        order.restaurant_order_id ??
        order.restaurantOrderId ??
        order.kitchen_order_id ??
        order.kitchenOrderId ??
        getKitchenParentOrderId(order)
    );
}

function getKitchenMergeKey(order) {
    const parentOrderId = getKitchenParentOrderId(order);

    if (parentOrderId) return `order:${parentOrderId}`;

    const invoiceId =
        order.invoice_id ??
        order.invoice?.id ??
        order.restaurant_invoice?.invoice_id ??
        order.restaurantInvoice?.invoice_id ??
        null;

    if (invoiceId) return `invoice:${invoiceId}`;

    return `single:${getKitchenBackendOrderId(order)}`;
}

function mergeStatus(statuses) {
    const normalizedStatuses = statuses.map((status) =>
        String(status || "pending")
            .toLowerCase()
            .replaceAll("-", "_")
            .replaceAll(" ", "_")
    );

    if (normalizedStatuses.every((status) => ["ready", "completed", "done"].includes(status))) {
        return "ready";
    }

    if (
        normalizedStatuses.some((status) =>
            ["preparing", "in_progress", "in_preparation", "started"].includes(status)
        )
    ) {
        return "preparing";
    }

    return normalizedStatuses[0] || "pending";
}

function getUserRestaurantId(user) {
    return (
        user?.restaurant_id ??
        user?.restaurant?.id ??
        user?.employee?.restaurant_id ??
        user?.employee?.restaurant?.id ??
        user?.pivot?.restaurant_id ??
        null
    );
}

async function ensureKitchenRestaurantId() {
    const user = getStoredUser();
    const restaurantId = getUserRestaurantId(user);

    if (restaurantId) return restaurantId;
    if (!user) return null;

    const response = await api.get("/profile/permissions");
    storeUser(user, response.data);

    return getUserRestaurantId(getStoredUser());
}

export function normalizeKitchenOrder(order) {
    const items =
        order.items ||
        order.order_items ||
        order.orderItems ||
        order.details ||
        order.foods ||
        [];

    const backendId = getKitchenBackendOrderId(order);
    const parentOrderId = getKitchenParentOrderId(order);

    return {
        id: parentOrderId ?? backendId,
        backendIds: backendId ? [backendId] : [],
        mergeKey: getKitchenMergeKey(order),
        type: normalizeOrderType(
            order.type || order.order_type || order.service_type || order.kind
        ),
        time: formatOrderTime(order.created_at || order.time || order.ordered_at),
        status: order.status || order.kitchen_status || "pending",
        items: getList(items).map(normalizeKitchenItem),
    };
}

function mergeKitchenOrders(orders) {
    const mergedOrders = new Map();

    orders.forEach((order) => {
        const key = order.mergeKey || `single:${order.id}`;
        const existingOrder = mergedOrders.get(key);

        if (!existingOrder) {
            mergedOrders.set(key, {
                ...order,
                backendIds: [...new Set(order.backendIds.length ? order.backendIds : [order.id])],
            });
            return;
        }

        existingOrder.backendIds = [
            ...new Set([
                ...existingOrder.backendIds,
                ...(order.backendIds.length ? order.backendIds : [order.id]),
            ]),
        ];
        existingOrder.items = [...existingOrder.items, ...order.items];
        existingOrder.status = mergeStatus([existingOrder.status, order.status]);
    });

    return Array.from(mergedOrders.values());
}

export async function fetchKitchenQueue() {
    const restaurantId = await ensureKitchenRestaurantId();
    const response = await api.get("/kitchen/queue", {
        params: restaurantId ? { restaurant_id: restaurantId } : undefined,
    });

    return mergeKitchenOrders(getList(response.data).map(normalizeKitchenOrder));
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
    const restaurantId =
        cartItems.find((item) => item.restaurant_id)?.restaurant_id ||
        user?.restaurant_id ||
        user?.restaurant?.id;

    return {
        type,
        order_type: type,
        restaurant_id: restaurantId,
        items: cartItems.map((item) => {
            const modifierOptions = item.selectedModifierOptions ?? [];
            const modifierOptionPayload = modifierOptions.map((option) => {
                const groupId = option.modifier_group_id ?? option.groupId;
                const optionId = option.modifier_option_id ?? option.id;

                return {
                    modifier_group_id: groupId,
                    group_id: groupId,
                    modifier_option_id: optionId,
                    option_id: optionId,
                    price: Number(option.price ?? 0),
                };
            });
            const modifierOptionIds = modifierOptions
                .map((option) => option.modifier_option_id ?? option.id)
                .filter(Boolean);
            const modifierSelections = modifierOptionPayload.reduce(
                (selections, option) => {
                    return {
                        ...selections,
                        [option.modifier_group_id]: option.modifier_option_id,
                    };
                },
                {}
            );
            const unitPrice = Number(item.price ?? 0);
            const quantity = Number(item.quantity ?? 1);

            return {
                food_id: item.food_id || item.id,
                menu_item_id: item.food_id || item.id,
                quantity,
                unit_price: unitPrice,
                price: unitPrice,
                total_price: unitPrice * quantity,
                notes: [item.size, item.notes].filter(Boolean).join(" · "),
                modifier_options: modifierOptionPayload,
                selected_modifier_options: modifierOptionPayload,
                selected_modifiers: modifierSelections,
                modifier_selections: modifierSelections,
                modifier_option_ids: modifierOptionIds,
                selected_modifier_option_ids: modifierOptionIds,
                modifiers: modifierOptionIds,
            };
        }),
    };
}

function appendIfPresent(formData, key, value) {
    if (value !== undefined && value !== null && value !== "") {
        formData.append(key, value);
    }
}

function createCashierOrderFormData(cartItems, type = "dine_in") {
    const payload = createCashierOrderPayload(cartItems, type);
    const formData = new FormData();

    appendIfPresent(formData, "type", payload.type);
    appendIfPresent(formData, "order_type", payload.order_type);
    appendIfPresent(formData, "restaurant_id", payload.restaurant_id);

    payload.items.forEach((item, itemIndex) => {
        appendIfPresent(formData, `items[${itemIndex}][food_id]`, item.food_id);
        appendIfPresent(formData, `items[${itemIndex}][menu_item_id]`, item.menu_item_id);
        appendIfPresent(formData, `items[${itemIndex}][quantity]`, item.quantity);
        appendIfPresent(formData, `items[${itemIndex}][unit_price]`, item.unit_price);
        appendIfPresent(formData, `items[${itemIndex}][price]`, item.price);
        appendIfPresent(formData, `items[${itemIndex}][total_price]`, item.total_price);
        appendIfPresent(formData, `items[${itemIndex}][notes]`, item.notes);

        item.modifiers.forEach((optionId, optionIndex) => {
            appendIfPresent(
                formData,
                `items[${itemIndex}][modifiers][${optionIndex}]`,
                optionId
            );
        });
    });

    return formData;
}

function isOrderTypeValidationError(error) {
    const message = JSON.stringify(error.response?.data || {}).toLowerCase();

    return (
        error.response?.status === 422 &&
        message.includes("order type") &&
        message.includes("invalid")
    );
}

export async function createCashierOrder(cartItems, type = "dine_in") {
    const typeVariants =
        type === "takeaway"
            ? ["takeaway", "take-away", "take_away", "take away", "TAKEAWAY"]
            : [type, "dine-in", "dine_in", "dine in", "dinein", "DINE-IN"];
    let lastError;

    for (const orderType of typeVariants) {
        try {
            const response = await api.post(
                "/cashier/orders",
                createCashierOrderFormData(cartItems, orderType)
            );
            return response.data;
        } catch (error) {
            lastError = error;

            if (!isOrderTypeValidationError(error)) {
                throw error;
            }
        }
    }

    throw lastError;
}

function collectInvoiceIds(value, ids = []) {
    if (!value || typeof value !== "object") return ids;

    const invoiceId =
        value.invoice_id ??
        value.invoice?.id ??
        value.order?.invoice_id ??
        value.order?.invoice?.id ??
        value.data?.invoice_id ??
        value.data?.invoice?.id ??
        value.data?.order?.invoice_id ??
        value.data?.order?.invoice?.id;

    if (invoiceId && !ids.some((id) => String(id) === String(invoiceId))) {
        ids.push(invoiceId);
    }

    if (Array.isArray(value.orders)) {
        value.orders.forEach((order) => collectInvoiceIds(order, ids));
    }

    if (Array.isArray(value.data)) {
        value.data.forEach((item) => collectInvoiceIds(item, ids));
    }

    return ids;
}

export function getCreatedInvoiceIds(data) {
    return collectInvoiceIds(data);
}

export async function payCashierInvoice(invoiceId, paymentMethod = "cash") {
    const formData = new FormData();
    formData.append("invoice_id", invoiceId);

    const endpoint =
        paymentMethod === "stripe"
            ? "/cashier/payments/stripe/create-intent"
            : "/cashier/payments/cash";
    const response = await api.post(endpoint, formData);

    return response.data;
}

export async function payCashierOrderInvoices(orderResponse, paymentMethod = "cash") {
    const invoiceIds = getCreatedInvoiceIds(orderResponse);

    if (!invoiceIds.length) {
        throw new Error("No invoice was returned for this order.");
    }

    const payments = [];

    for (const invoiceId of invoiceIds) {
        payments.push(await payCashierInvoice(invoiceId, paymentMethod));
    }

    return payments;
}

export function getCreatedOrderId(data) {
    const orderIds = data?.orders
        ?.map((order) => getCreatedOrderId(order))
        .filter(Boolean)
        .join(", ");

    if (orderIds) return orderIds;

    return (
        data?.order?.id ??
        data?.data?.order?.id ??
        data?.data?.id ??
        data?.id ??
        null
    );
}
