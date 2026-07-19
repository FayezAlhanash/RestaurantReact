export const RESTAURANT_ROLE_IDS = [3, 4, 5, 6, 7, 8];
const RESTAURANT_ROLE_NAMES = [
    "manager",
    "cashier",
    "delivery",
    "chef",
    "kitchen",
    "warehouse manager",
    "warehouse",
    "waiter",
    "server",
];

const ADMIN_ONLY_PERMISSION_KEYS = [
    "manage_restaurants",
    "manage_roles",
    "force_cancel_orders",
    "manage_permissions",
];

const DYNAMIC_PERMISSION_KEYS = [
    "manage_users",
    "manage_tables",
];

function getPermissionKey(permission = {}) {
    return permission.key ?? permission.slug ?? permission.code ?? permission.name;
}

function normalizePermissionKey(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

function isAdminOnlyPermission(permission) {
    return ADMIN_ONLY_PERMISSION_KEYS.includes(
        normalizePermissionKey(getPermissionKey(permission))
    );
}

function isDynamicPermission(permission) {
    return DYNAMIC_PERMISSION_KEYS.includes(
        normalizePermissionKey(getPermissionKey(permission))
    );
}

function getPermissionRestaurantId(permission = {}) {
    return (
        permission.restaurant_id ??
        permission.restaurantId ??
        permission.restaurant?.id ??
        permission.pivot?.restaurant_id ??
        permission.pivot?.restaurantId ??
        permission.permission?.restaurant_id ??
        permission.permission?.restaurantId ??
        permission.permission?.restaurant?.id ??
        null
    );
}

function roleHasRestaurantId(role = {}) {
    return Boolean(
        role.restaurant_id ??
            role.restaurantId ??
            role.restaurant?.id ??
            role.pivot?.restaurant_id ??
            role.pivot?.restaurantId
    );
}

function userHasRestaurantId(user = {}) {
    return Boolean(
        user.restaurant_id ??
            user.restaurantId ??
            user.restaurant?.id ??
            user.manager?.restaurant_id ??
            user.manager?.restaurantId ??
            user.manager?.restaurant?.id ??
            user.employee?.restaurant_id ??
            user.employee?.restaurantId ??
            user.employee?.restaurant?.id
    );
}

function permissionNeedsRestaurant(permission = {}) {
    return (
        normalizePermissionKey(permission.scope) === "restaurant" ||
        Boolean(getPermissionRestaurantId(permission))
    );
}

function isAdminRole(role) {
    const roleId = Number(role?.id ?? role?.role_id);
    const roleName = String(role?.name ?? role?.key ?? "")
        .trim()
        .toLowerCase();

    return roleId === 1 || roleName === "admin";
}

function isAdminUser(user) {
    const roleId = Number(user?.role_id ?? user?.role?.id);
    const roleName = String(user?.role?.name ?? user?.role_name ?? "")
        .trim()
        .toLowerCase();

    return roleId === 1 || roleName === "admin";
}

export function isRestaurantRole(role) {
    const roleId = Number(role?.id ?? role?.role_id);
    const restaurantId = role?.restaurant_id ?? role?.restaurant?.id;
    const roleName = String(role?.name ?? role?.key ?? "")
        .trim()
        .toLowerCase();

    return (
        Boolean(role?.requires_restaurant) ||
        Boolean(restaurantId) ||
        RESTAURANT_ROLE_IDS.includes(roleId) ||
        RESTAURANT_ROLE_NAMES.includes(roleName)
    );
}

export function userHasRestaurantScope(user) {
    return Boolean(user?.restaurant_id) || isRestaurantRole(user?.role);
}

export function canAssignPermissionToRole(role, permission) {
    if (!role || !permission) return false;
    if (isAdminOnlyPermission(permission)) return isAdminRole(role);
    if (isDynamicPermission(permission)) return true;

    if (permissionNeedsRestaurant(permission)) {
        return roleHasRestaurantId(role);
    }

    return (
        permission?.scope === "global" ||
        isRestaurantRole(role)
    );
}

export function canAssignPermissionToUser(user, permission) {
    if (!user || !permission) return false;
    if (isAdminOnlyPermission(permission)) return isAdminUser(user);
    if (isDynamicPermission(permission)) return true;

    if (permissionNeedsRestaurant(permission)) {
        return userHasRestaurantId(user);
    }

    return (
        permission.scope === "global" ||
        userHasRestaurantScope(user)
    );
}

export function filterPermissionsForRole(role, permissions = []) {
    return permissions.filter((permission) =>
        canAssignPermissionToRole(role, permission)
    );
}

export function filterPermissionsForUser(user, permissions = []) {
    return permissions.filter((permission) =>
        canAssignPermissionToUser(user, permission)
    );
}
