import api from "../API/axios";
import { getStoredUser, storeUser } from "./auth";
import { confirmStripePayment, findStripeClientSecret } from "./stripePayments";

const kitchenOrderDetailCache = new Map();
let cashierOrderListPromise = null;

function getList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.orders)) return data.orders;
    if (Array.isArray(data?.queue)) return data.queue;
    if (Array.isArray(data?.data?.orders)) return data.data.orders;
    if (Array.isArray(data?.data?.queue)) return data.data.queue;
    return [];
}

function getRecord(data) {
    return (
        data?.order ??
        data?.restaurant_order ??
        data?.restaurantOrder ??
        data?.data?.order ??
        data?.data?.restaurant_order ??
        data?.data?.restaurantOrder ??
        data?.data ??
        data
    );
}

function normalizeOrderType(type, fallback = "dine_in") {
    const value = String(type || fallback)
        .toLowerCase()
        .replaceAll("-", "_")
        .replaceAll(" ", "_");

    if (["delivery", "deliver"].includes(value)) return "delivery";
    if (["takeaway", "take_away", "takeout", "take_out"].includes(value)) {
        return "takeaway";
    }

    return "dine_in";
}

function hasDineInTableSignal(order, items = []) {
    const tableValue =
        order?.table_id ??
        order?.table_number ??
        order?.tableToken ??
        order?.table_token ??
        order?.table?.id ??
        order?.table?.table_number ??
        order?.order?.table_id ??
        order?.order?.table_number ??
        order?.order?.table?.id ??
        order?.order?.table?.table_number ??
        order?.cashier_order?.table_id ??
        order?.cashier_order?.table_number ??
        order?.cashierOrder?.table_id ??
        order?.cashierOrder?.table_number ??
        order?.restaurant_order?.table_id ??
        order?.restaurant_order?.table_number ??
        order?.restaurantOrder?.table_id ??
        order?.restaurantOrder?.table_number;

    if (tableValue) return true;

    return items.some((item) => /\btable\s*#?\s*\d+/i.test(item.note || ""));
}

function hideTableNotes(note) {
    return String(note || "")
        .split("·")
        .map((part) => part.trim())
        .filter((part) => part && !/^table\b/i.test(part))
        .join(" · ");
}

function hasDeliveryAddressSignal(order) {
    const deliveryValue =
        order?.delivery_address_id ??
        order?.deliveryAddressId ??
        order?.delivery_address?.id ??
        order?.deliveryAddress?.id ??
        order?.order?.delivery_address_id ??
        order?.order?.deliveryAddressId ??
        order?.order?.delivery_address?.id ??
        order?.order?.deliveryAddress?.id ??
        order?.cashier_order?.delivery_address_id ??
        order?.cashier_order?.deliveryAddressId ??
        order?.cashierOrder?.delivery_address_id ??
        order?.cashierOrder?.deliveryAddressId ??
        order?.restaurant_invoice?.invoice?.delivery_address_id ??
        order?.restaurantInvoice?.invoice?.delivery_address_id ??
        null;

    return Boolean(deliveryValue);
}

function hasDeliveryCustomerSignal(order) {
    const customerValue =
        order?.customer_id ??
        order?.customerId ??
        order?.customer?.id ??
        order?.order?.customer_id ??
        order?.order?.customerId ??
        order?.order?.customer?.id ??
        order?.cashier_order?.customer_id ??
        order?.cashier_order?.customerId ??
        order?.cashierOrder?.customer_id ??
        order?.cashierOrder?.customerId ??
        order?.restaurant_invoice?.invoice?.customer_id ??
        order?.restaurantInvoice?.invoice?.customer_id ??
        null;

    return Boolean(customerValue);
}

function resolveKitchenOrderType(order, items) {
    const explicitType = normalizeOrderType(getOrderTypeValue(order), "");

    if (explicitType === "delivery" || hasDeliveryAddressSignal(order)) {
        return "delivery";
    }

    if (explicitType === "takeaway") {
        return explicitType;
    }

    if (hasDineInTableSignal(order, items)) {
        return "dine_in";
    }

    if (hasDeliveryCustomerSignal(order)) {
        return "delivery";
    }

    return "takeaway";
}

function getResolvedOrderTypeFromRecord(order) {
    const items =
        order?.items ||
        order?.order_items ||
        order?.orderItems ||
        order?.details ||
        order?.foods ||
        [];

    return resolveKitchenOrderType(order, getList(items).map(normalizeKitchenItem));
}

function getOrderTypeValue(order) {
    return (
        order?.type ??
        order?.order_type ??
        order?.service_type ??
        order?.kind ??
        order?.order?.type ??
        order?.order?.order_type ??
        order?.order?.service_type ??
        order?.cashier_order?.type ??
        order?.cashier_order?.order_type ??
        order?.cashier_order?.service_type ??
        order?.cashierOrder?.type ??
        order?.cashierOrder?.order_type ??
        order?.cashierOrder?.service_type ??
        order?.restaurant_order?.type ??
        order?.restaurant_order?.order_type ??
        order?.restaurant_order?.service_type ??
        order?.restaurantOrder?.type ??
        order?.restaurantOrder?.order_type ??
        order?.restaurantOrder?.service_type ??
        order?.restaurant_invoice?.invoice?.type ??
        order?.restaurant_invoice?.invoice?.order_type ??
        order?.restaurant_invoice?.invoice?.service_type ??
        order?.restaurantInvoice?.invoice?.type ??
        order?.restaurantInvoice?.invoice?.order_type ??
        order?.restaurantInvoice?.invoice?.service_type
    );
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

function dedupeNoteSegments(value) {
    return String(value || "")
        .split("·")
        .map((segment) => segment.trim())
        .filter(Boolean)
        .filter(
            (segment, index, segments) =>
                segments.findIndex(
                    (currentSegment) =>
                        currentSegment.toLowerCase() === segment.toLowerCase()
                ) === index
        )
        .join(" · ");
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
        note: hideTableNotes(
            dedupeNoteSegments(
                item.note ||
                    item.notes ||
                    item.special_instructions ||
                    item.pivot?.notes ||
                    ""
            )
        ),
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

function getOrderRestaurantId(order) {
    return (
        order?.restaurant_id ??
        order?.restaurantId ??
        order?.restaurant?.id ??
        order?.food?.restaurant_id ??
        order?.food?.restaurant?.id ??
        order?.menu_item?.restaurant_id ??
        order?.menu_item?.restaurant?.id ??
        order?.order?.restaurant_id ??
        order?.order?.restaurantId ??
        order?.order?.restaurant?.id ??
        order?.cashier_order?.restaurant_id ??
        order?.cashier_order?.restaurantId ??
        order?.cashierOrder?.restaurant_id ??
        order?.cashierOrder?.restaurantId ??
        order?.restaurant_order?.restaurant_id ??
        order?.restaurant_order?.restaurantId ??
        order?.restaurant_order?.restaurant?.id ??
        order?.restaurantOrder?.restaurant_id ??
        order?.restaurantOrder?.restaurantId ??
        order?.restaurantOrder?.restaurant?.id ??
        order?.invoice?.restaurant_id ??
        order?.restaurant_invoice?.restaurant_id ??
        order?.restaurant_invoice?.restaurant?.id ??
        order?.restaurantInvoice?.restaurant_id ??
        order?.restaurantInvoice?.restaurant?.id ??
        null
    );
}

function getKitchenItems(order) {
    const candidateGroups = [
        [
            order?.items,
            order?.order_items,
            order?.orderItems,
            order?.details,
            order?.foods,
        ],
        [
            order?.restaurant_order?.items,
            order?.restaurant_order?.order_items,
            order?.restaurant_order?.orderItems,
            order?.restaurantOrder?.items,
            order?.restaurantOrder?.order_items,
            order?.restaurantOrder?.orderItems,
        ],
        [
            order?.order?.items,
            order?.order?.order_items,
            order?.order?.orderItems,
            order?.cashier_order?.items,
            order?.cashier_order?.order_items,
            order?.cashier_order?.orderItems,
            order?.cashierOrder?.items,
            order?.cashierOrder?.order_items,
            order?.cashierOrder?.orderItems,
        ],
    ];

    for (const candidates of candidateGroups) {
        const items = candidates.flatMap(getList);

        if (items.length) return items;
    }

    return [];
}

function hasItemForRestaurant(order, restaurantId) {
    return getKitchenItems(order).some(
        (item) => String(getOrderRestaurantId(item)) === String(restaurantId)
    );
}

function getKitchenRecordsForRestaurant(order, restaurantId) {
    const restaurantOrders = [
        ...getList(order?.restaurant_orders),
        ...getList(order?.restaurantOrders),
        ...(order?.restaurant_order && typeof order.restaurant_order === "object"
            ? [order.restaurant_order]
            : []),
        ...(order?.restaurantOrder && typeof order.restaurantOrder === "object"
            ? [order.restaurantOrder]
            : []),
    ];

    if (restaurantOrders.length) {
        return restaurantOrders
            .filter(
                (restaurantOrder) =>
                    String(getOrderRestaurantId(restaurantOrder)) ===
                        String(restaurantId) ||
                    hasItemForRestaurant(restaurantOrder, restaurantId)
            )
            .map((restaurantOrder) => ({
                ...restaurantOrder,
                cashier_order: order,
                cashierOrder: order,
                order: restaurantOrder.order ?? order,
            }));
    }

    return String(getOrderRestaurantId(order)) === String(restaurantId) ||
        hasItemForRestaurant(order, restaurantId)
        ? [order]
        : [];
}

function getKitchenOrderCandidateIds(order) {
    return [
        getKitchenParentOrderId(order),
        getKitchenBackendOrderId(order),
        order?.id,
        order?.order_id,
        order?.restaurant_order_id,
        order?.restaurantOrderId,
        order?.order?.id,
        order?.cashier_order_id,
        order?.cashierOrderId,
        order?.cashier_order?.id,
        order?.cashierOrder?.id,
        order?.invoice?.order_id,
        order?.restaurant_invoice?.invoice?.order_id,
        order?.restaurantInvoice?.invoice?.order_id,
        order?.restaurant_invoice?.invoice?.id,
        order?.restaurantInvoice?.invoice?.id,
    ]
        .filter(Boolean)
        .map((id) => String(id));
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

function isTruthyFlag(value) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;

    return ["1", "true", "yes"].includes(
        String(value ?? "")
            .trim()
            .toLowerCase()
    );
}

function getFirstPresent(values) {
    return values.find((value) => value !== undefined && value !== null && value !== "");
}

function getKitchenTimingFields(order = {}) {
    const source = order?.restaurant_order ?? order?.restaurantOrder ?? order;

    return {
        preparing_at: getFirstPresent([
            order?.preparing_at,
            order?.preparingAt,
            source?.preparing_at,
            source?.preparingAt,
        ]),
        estimated_ready_at: getFirstPresent([
            order?.estimated_ready_at,
            order?.estimatedReadyAt,
            source?.estimated_ready_at,
            source?.estimatedReadyAt,
        ]),
        remaining_minutes: getFirstPresent([
            order?.remaining_minutes,
            order?.remainingMinutes,
            source?.remaining_minutes,
            source?.remainingMinutes,
        ]),
        waiting_for_preparation: isTruthyFlag(
            getFirstPresent([
                order?.waiting_for_preparation,
                order?.waitingForPreparation,
                source?.waiting_for_preparation,
                source?.waitingForPreparation,
            ])
        ),
        is_delayed: isTruthyFlag(
            getFirstPresent([
                order?.is_delayed,
                order?.isDelayed,
                source?.is_delayed,
                source?.isDelayed,
            ])
        ),
    };
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
    const backendId = getKitchenBackendOrderId(order);
    const parentOrderId = getKitchenParentOrderId(order);

    const normalizedItems = getKitchenItems(order).map(normalizeKitchenItem);
    const hasTypeSignal = Boolean(getOrderTypeValue(order));
    const hasLocationSignal =
        hasDineInTableSignal(order, normalizedItems) ||
        hasDeliveryAddressSignal(order) ||
        hasDeliveryCustomerSignal(order);

    return {
        id: parentOrderId ?? backendId,
        backendIds: backendId ? [backendId] : [],
        detailIds: [...new Set(getKitchenOrderCandidateIds(order))],
        needsTypeDetail: !hasTypeSignal && !hasLocationSignal,
        mergeKey: getKitchenMergeKey(order),
        type: resolveKitchenOrderType(order, normalizedItems),
        time: formatOrderTime(order.created_at || order.time || order.ordered_at),
        status: order.status || order.kitchen_status || "pending",
        items: normalizedItems,
        ...getKitchenTimingFields(order),
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
                detailIds: [...new Set(order.detailIds?.length ? order.detailIds : [order.id])],
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
        existingOrder.preparing_at = existingOrder.preparing_at ?? order.preparing_at;
        existingOrder.estimated_ready_at =
            existingOrder.estimated_ready_at ?? order.estimated_ready_at;
        existingOrder.remaining_minutes =
            existingOrder.remaining_minutes ?? order.remaining_minutes;
        existingOrder.waiting_for_preparation =
            existingOrder.waiting_for_preparation || order.waiting_for_preparation;
        existingOrder.is_delayed = existingOrder.is_delayed || order.is_delayed;
        existingOrder.needsTypeDetail =
            existingOrder.needsTypeDetail && order.needsTypeDetail;
        existingOrder.detailIds = [
            ...new Set([
                ...(existingOrder.detailIds || []),
                ...(order.detailIds?.length ? order.detailIds : [order.id]),
            ]),
        ];
    });

    return Array.from(mergedOrders.values());
}

async function fetchCashierOrderList() {
    if (!cashierOrderListPromise) {
        cashierOrderListPromise = api
            .get("/cashier/orders")
            .then((response) => getList(response.data).map(getRecord))
            .catch(() => []);
    }

    return cashierOrderListPromise;
}

function findOrderDetailInList(orderId, orders) {
    const id = String(orderId);

    return orders.find((order) => {
        const ids = [
            order?.id,
            order?.order_id,
            order?.restaurant_order_id,
            order?.restaurantOrderId,
            order?.restaurant_orders?.[0]?.id,
            order?.restaurantOrders?.[0]?.id,
            order?.invoice?.order_id,
            order?.restaurant_invoice?.invoice?.order_id,
            order?.restaurantInvoice?.invoice?.order_id,
        ]
            .filter(Boolean)
            .map((value) => String(value));

        return ids.includes(id);
    });
}

async function fetchKitchenOrderDetail(orderId) {
    if (!orderId) return null;

    const cacheKey = String(orderId);

    if (kitchenOrderDetailCache.has(cacheKey)) {
        return kitchenOrderDetailCache.get(cacheKey);
    }

    const cashierOrders = await fetchCashierOrderList();
    const detailFromList = findOrderDetailInList(orderId, cashierOrders);

    if (detailFromList) {
        kitchenOrderDetailCache.set(cacheKey, detailFromList);
        return detailFromList;
    }

    try {
        const response = await api.get(`/cashier/orders/${orderId}`);
        const detail = getRecord(response.data);

        kitchenOrderDetailCache.set(cacheKey, detail);
        return detail;
    } catch {
        kitchenOrderDetailCache.set(cacheKey, null);
        return null;
    }
}

async function enrichKitchenOrdersWithOrderDetails(orders) {
    const enrichedOrders = await Promise.all(
        orders.map(async (order) => {
            if (!order.needsTypeDetail) return order;

            const detailIds = order.detailIds?.length ? order.detailIds : [order.id];
            let detail = null;

            for (const detailId of detailIds) {
                detail = await fetchKitchenOrderDetail(detailId);
                if (detail) break;
            }

            if (!detail) return order;

            return {
                ...order,
                type: getResolvedOrderTypeFromRecord(detail),
            };
        })
    );

    return enrichedOrders;
}

async function fetchCashierKitchenQueueFallback(restaurantId) {
    const cashierRequests = [
        api.get("/cashier/orders", {
            params: restaurantId ? { restaurant_id: restaurantId } : undefined,
        }),
    ];

    if (restaurantId) {
        cashierRequests.push(api.get("/cashier/orders"));
    }

    const cashierResponses = await Promise.allSettled(cashierRequests);
    const cashierOrders = cashierResponses
        .flatMap((result) =>
            result.status === "fulfilled" ? getList(result.value.data) : []
        )
        .map(getRecord);
    const kitchenRecords = restaurantId
        ? cashierOrders.flatMap((order) =>
              getKitchenRecordsForRestaurant(order, restaurantId)
          )
        : cashierOrders;
    const mergedFallbackOrders = mergeKitchenOrders(
        kitchenRecords.map(normalizeKitchenOrder)
    );

    return enrichKitchenOrdersWithOrderDetails(mergedFallbackOrders);
}

export async function fetchKitchenQueue(restaurantIdOverride = undefined) {
    const restaurantId =
        restaurantIdOverride === undefined
            ? await ensureKitchenRestaurantId()
            : restaurantIdOverride;
    let response;

    try {
        response = await api.get("/kitchen/queue", {
            params: restaurantId ? { restaurant_id: restaurantId } : undefined,
        });
    } catch (error) {
        if (restaurantIdOverride && error.response?.status === 403) {
            return fetchCashierKitchenQueueFallback(restaurantId);
        }

        if (!restaurantIdOverride) {
            throw error;
        }

        const fallbackOrders = await fetchCashierKitchenQueueFallback(restaurantId);

        if (fallbackOrders.length || !error.response) return fallbackOrders;

        throw error;
    }

    const mergedOrders = mergeKitchenOrders(
        getList(response.data).map(normalizeKitchenOrder)
    );

    return enrichKitchenOrdersWithOrderDetails(mergedOrders);
}

export async function startKitchenOrder(orderId) {
    const response = await api.patch(
        `/kitchen/orders/${orderId}/start-preparing`
    );
    const record = getRecord(response.data);
    const hasOrderShape =
        record &&
        typeof record === "object" &&
        (record.id ||
            record.restaurant_order_id ||
            record.restaurantOrderId ||
            record.order_id ||
            record.status ||
            record.kitchen_status);

    return hasOrderShape ? normalizeKitchenOrder(record) : response.data;
}

export async function markKitchenOrderReady(orderId) {
    const response = await api.patch(`/kitchen/orders/${orderId}/mark-ready`);
    return getRecord(response.data);
}

export function createCashierOrderPayload(cartItems, type = "takeaway") {
    const user = getStoredUser();
    const restaurantId =
        cartItems.find((item) => item.restaurant_id)?.restaurant_id ||
        user?.restaurant_id ||
        user?.restaurant?.id;

    return {
        type,
        order_type: type,
        service_type: type,
        kind: type,
        order_source: "cashier",
        source: "cashier",
        is_takeaway: normalizeOrderType(type) === "takeaway" ? 1 : 0,
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
                notes: dedupeNoteSegments([item.size, item.notes].filter(Boolean).join(" · ")),
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

function createCashierOrderFormData(cartItems, type = "takeaway") {
    const payload = createCashierOrderPayload(cartItems, type);
    const formData = new FormData();

    appendIfPresent(formData, "type", payload.type);
    appendIfPresent(formData, "order_type", payload.order_type);
    appendIfPresent(formData, "service_type", payload.service_type);
    appendIfPresent(formData, "kind", payload.kind);
    appendIfPresent(formData, "order_source", payload.order_source);
    appendIfPresent(formData, "source", payload.source);
    appendIfPresent(formData, "is_takeaway", payload.is_takeaway);
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

export async function createCashierOrder(cartItems, type = "takeaway") {
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

export async function payCashierInvoice(invoiceId, paymentMethod = "cash", stripeCard = null) {
    const formData = new FormData();
    formData.append("invoice_id", invoiceId);

    const endpoint =
        paymentMethod === "stripe"
            ? "/cashier/payments/stripe/create-intent"
            : "/cashier/payments/cash";
    const response = await api.post(endpoint, formData);

    if (paymentMethod === "stripe") {
        const clientSecret = findStripeClientSecret(response.data);
        const paymentIntent = await confirmStripePayment(clientSecret, stripeCard);

        return {
            ...response.data,
            paymentIntent,
        };
    }

    return response.data;
}

export async function payCashierOrderInvoices(
    orderResponse,
    paymentMethod = "cash",
    stripeCard = null
) {
    const invoiceIds = getCreatedInvoiceIds(orderResponse);

    if (!invoiceIds.length) {
        throw new Error("No invoice was returned for this order.");
    }

    const payments = [];

    for (const invoiceId of invoiceIds) {
        payments.push(await payCashierInvoice(invoiceId, paymentMethod, stripeCard));
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
