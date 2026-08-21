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
  "view_global_reports",
  "manage_global_loyalty_settings",
  "manage_global_kitchen_orders",
];

const RESTAURANT_ROLE_ALLOWED_ADMIN_KEYS = [
    "manage_users",
    "manage_tables",
];

const RESTAURANT_REQUIRED_PERMISSION_KEYS = [
    "manage_employee_shifts",
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

function isTruthyFlag(value) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;

    return ["1", "true", "yes"].includes(
        String(value ?? "")
            .trim()
            .toLowerCase()
    );
}

function isAdminOnlyPermission(permission) {
    return ADMIN_ONLY_PERMISSION_KEYS.includes(
        normalizePermissionKey(getPermissionKey(permission))
    );
}

function isRestaurantRoleAllowedAdminPermission(permission) {
    return RESTAURANT_ROLE_ALLOWED_ADMIN_KEYS.includes(
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
    return (
        Boolean(
            role.restaurant_id ??
                role.restaurantId ??
                role.restaurant?.id ??
                role.pivot?.restaurant_id ??
                role.pivot?.restaurantId ??
                null
        ) ||
        isTruthyFlag(role.requires_restaurant) ||
        isTruthyFlag(role.restaurant_required)
    );
}

function roleCanCarryRestaurantPermission(role = {}, permission = {}) {
    return roleHasRestaurantId(role) || Boolean(getPermissionRestaurantId(permission));
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
        RESTAURANT_REQUIRED_PERMISSION_KEYS.includes(
            normalizePermissionKey(getPermissionKey(permission))
        ) ||
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
        isTruthyFlag(role?.requires_restaurant) ||
        isTruthyFlag(role?.restaurant_required) ||
        Boolean(restaurantId) ||
        RESTAURANT_ROLE_IDS.includes(roleId) ||
        RESTAURANT_ROLE_NAMES.includes(roleName)
    );
}

export function roleRequiresRestaurantAssignment(role = {}) {
    const explicitRequirement =
        role?.requires_restaurant ?? role?.restaurant_required;

    if (explicitRequirement !== undefined && explicitRequirement !== null) {
        return isTruthyFlag(explicitRequirement);
    }

    return isRestaurantRole(role);
}

export function userHasRestaurantScope(user) {
    return Boolean(user?.restaurant_id) || isRestaurantRole(user?.role);
}

export function canAssignPermissionToRole(role, permission) {
    if (!role || !permission) return false;
    if (isAdminRole(role)) return true;

    if (isRestaurantRoleAllowedAdminPermission(permission)) {
        return true;
    }

    if (isAdminOnlyPermission(permission)) return false;

    if (permissionNeedsRestaurant(permission)) {
        return roleCanCarryRestaurantPermission(role, permission);
    }

    return (
        permission?.scope === "global" ||
        isRestaurantRole(role)
    );
}

export function canAssignPermissionToUser(user, permission) {
    if (!user || !permission) return false;
    if (isAdminUser(user)) return true;

    if (isRestaurantRoleAllowedAdminPermission(permission)) {
        return true;
    }

    if (isAdminOnlyPermission(permission)) return false;

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
