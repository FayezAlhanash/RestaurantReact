export const RESTAURANT_ROLE_IDS = [3, 6, 7];
const RESTAURANT_ROLE_NAMES = [
    "manager",
    "chef",
    "kitchen",
    "warehouse manager",
    "warehouse",
];

export function isRestaurantRole(role) {
    const roleId = Number(role?.id ?? role?.role_id);
    const roleName = String(role?.name ?? role?.key ?? "")
        .trim()
        .toLowerCase();

    return (
        RESTAURANT_ROLE_IDS.includes(roleId) ||
        RESTAURANT_ROLE_NAMES.includes(roleName)
    );
}

export function userHasRestaurantScope(user) {
    return Boolean(user?.restaurant_id) || isRestaurantRole(user?.role);
}

export function canAssignPermissionToRole(role, permission) {
    return permission?.scope === "global" || isRestaurantRole(role);
}

export function canAssignPermissionToUser(user, permission) {
    return Boolean(user) && Boolean(permission);
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
