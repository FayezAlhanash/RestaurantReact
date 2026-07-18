export const RESTAURANT_ROLE_IDS = [3, 6, 7];
const RESTAURANT_ROLE_NAMES = [
    "manager",
    "chef",
    "kitchen",
    "warehouse manager",
    "warehouse",
];

const ADMIN_ONLY_PERMISSION_KEYS = [
    "manage_restaurants",
    "manage_users",
    "manage_roles",
    "force_cancel_orders",
    "manage_tables",
    "manage_permissions",
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
    if (isAdminOnlyPermission(permission)) return isAdminRole(role);

    return (
        permission?.scope === "global" ||
        isRestaurantRole(role)
    );
}

export function canAssignPermissionToUser(user, permission) {
    if (!user || !permission) return false;
    if (isAdminOnlyPermission(permission)) return isAdminUser(user);

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
