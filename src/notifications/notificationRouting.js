import { getStoredUser, ROLE_IDS } from "../utils/auth";
import { getUserPermissions } from "../utils/permissions";

const roleScopedRoutes = {
    takeawayOrders: {
        [ROLE_IDS.CASHIER]: "/takeaway-orders?view=orders",
        [ROLE_IDS.KITCHEN]: "/kitchen/takeaway-orders?view=orders",
        [ROLE_IDS.WAREHOUSE_MANAGER]: "/warehouse/takeaway-orders?view=orders",
        [ROLE_IDS.MANAGER]: "/manager/takeaway-orders?view=orders",
    },
    kitchenOrders: {
        [ROLE_IDS.ADMIN]: "/kitchen-orders",
        [ROLE_IDS.KITCHEN]: "/kitchen/dashboard",
        [ROLE_IDS.WAREHOUSE_MANAGER]: "/warehouse/kitchen-orders",
        [ROLE_IDS.MANAGER]: "/manager/kitchen-orders",
    },
    dineInService: {
        [ROLE_IDS.WAITER]: "/waiter/serve-orders",
        [ROLE_IDS.KITCHEN]: "/kitchen/dine-in-service",
        [ROLE_IDS.WAREHOUSE_MANAGER]: "/warehouse/dine-in-service",
        [ROLE_IDS.MANAGER]: "/manager/dine-in-service",
    },
    lowStock: {
        [ROLE_IDS.KITCHEN]: "/kitchen/low-stock",
        [ROLE_IDS.WAREHOUSE_MANAGER]: "/warehouse/low-stock",
        [ROLE_IDS.MANAGER]: "/manager/low-stock",
    },
};

const routeKeyByPath = {
    "/takeaway-orders": "takeawayOrders",
    "/cashier": "takeawayOrders",
    "/kitchen/takeaway-orders": "takeawayOrders",
    "/warehouse/takeaway-orders": "takeawayOrders",
    "/manager/takeaway-orders": "takeawayOrders",
    "/kitchen-orders": "kitchenOrders",
    "/kitchen/dashboard": "kitchenOrders",
    "/warehouse/kitchen-orders": "kitchenOrders",
    "/manager/kitchen-orders": "kitchenOrders",
    "/dine-in-service": "dineInService",
    "/waiter/service": "dineInService",
    "/waiter/serve-orders": "dineInService",
    "/low-stock": "lowStock",
};

function getRoleId() {
    const user = getStoredUser();
    const roleId = Number(user?.role_id ?? user?.role?.id);

    return Number.isNaN(roleId) ? null : roleId;
}

function getNotificationText(notification = {}) {
    const data = notification.data || {};
    const title =
        notification.title ||
        data.title ||
        notification.notification?.title ||
        notification.type ||
        "";
    const body =
        notification.body ||
        notification.message ||
        data.body ||
        data.message ||
        notification.notification?.body ||
        "";
    const url = notification.url || data.url || notification.link || "";
    const type = data.type || notification.type || data.notification_type || "";

    return `${title} ${body} ${url} ${type}`.toLowerCase();
}

export function isKitchenOrderNotification(notification = {}) {
    const text = getNotificationText(notification);
    const isPickupUpdate =
        text.includes("pickup") ||
        text.includes("picked up") ||
        text.includes("ready takeaway");

    if (isPickupUpdate) return false;

    return (
        text.includes("new kitchen order") ||
        text.includes("kitchen order") ||
        text.includes("ready to prepare") ||
        text.includes("prepare") ||
        text.includes("/kitchen/dashboard") ||
        text.includes("/kitchen-orders") ||
        text.includes("/manager/kitchen-orders") ||
        text.includes("/warehouse/kitchen-orders")
    );
}

function canUseKitchenOrders() {
    const roleId = getRoleId();

    if (
        [
            ROLE_IDS.ADMIN,
            ROLE_IDS.KITCHEN,
            ROLE_IDS.WAREHOUSE_MANAGER,
            ROLE_IDS.MANAGER,
        ].includes(roleId)
    ) {
        return true;
    }

    return getUserPermissions().includes("manage_kitchen_orders");
}

export function canReceiveNotification(notification = {}) {
    if (isKitchenOrderNotification(notification)) {
        return canUseKitchenOrders();
    }

    return true;
}

function getRoleScopedRoute(routeKey, fallbackPath = "/") {
    const roleId = getRoleId();

    if (roleScopedRoutes[routeKey]?.[roleId]) {
        return roleScopedRoutes[routeKey][roleId];
    }

    return fallbackPath;
}

export function resolveNotificationUrl(url = window.location.pathname, notification = {}) {
    const rawPath = String(url || window.location.pathname);
    const parsedUrl = new URL(rawPath, window.location.origin);
    const routeKey = isKitchenOrderNotification(notification)
        ? "kitchenOrders"
        : routeKeyByPath[parsedUrl.pathname];

    if (!routeKey) return rawPath;

    const scopedRoute = new URL(
        getRoleScopedRoute(routeKey, parsedUrl.pathname),
        window.location.origin
    );

    parsedUrl.searchParams.forEach((value, key) => {
        if (!scopedRoute.searchParams.has(key)) {
            scopedRoute.searchParams.set(key, value);
        }
    });

    if (routeKey === "takeawayOrders" && !scopedRoute.searchParams.get("view")) {
        scopedRoute.searchParams.set("view", "orders");
    }

    return `${scopedRoute.pathname}${scopedRoute.search}${scopedRoute.hash}`;
}
