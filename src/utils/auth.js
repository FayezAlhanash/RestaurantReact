export const ROLE_IDS = {
    ADMIN: 1,
    MANAGER: 3,
    CASHIER: 4,
    KITCHEN: 6,
    WAREHOUSE_MANAGER: 7,
    WAITER: 8,
};

export function getRoleId(user) {
    const value = user?.role_id ?? user?.role?.id;
    const roleId = Number(value);
    return Number.isNaN(roleId) ? null : roleId;
}

function collectPermissionKeys(user = {}) {
    const permissionSources = [
        user.permissions,
        user.role_permissions,
        user.rolePermissions,
        user.user_permissions,
        user.userPermissions,
        user.role?.permissions,
        user.role?.role_permissions,
    ];

    return Array.from(
        new Set(
            permissionSources.flatMap((permissions) => {
                if (!Array.isArray(permissions)) return [];

                return permissions.flatMap((permission) => {
                    if (typeof permission === "string") return [permission];
                    if (!permission || typeof permission !== "object") return [];

                    return [
                        permission.key,
                        permission.slug,
                        permission.code,
                        permission.name,
                        permission.permission_key,
                        permission.permission?.key,
                        permission.permission?.slug,
                        permission.permission?.code,
                        permission.permission?.name,
                        permission.pivot?.permission?.key,
                        permission.pivot?.permission?.slug,
                        permission.pivot?.permission?.code,
                        permission.pivot?.permission?.name,
                    ].filter(Boolean);
                });
            })
        )
    );
}

export function getPermissionHomePath(user = {}) {
    const permissions = collectPermissionKeys(user);
    const isAdmin = Number(user?.role_id ?? user?.role?.id) === ROLE_IDS.ADMIN;
    const can = (...requiredPermissions) =>
        requiredPermissions.some((permission) => permissions.includes(permission));

    if (can("manage_users", "manage_restaurant_staff")) return "/employee";
    if (can("manage_roles", "manage_permissions")) return "/roles";
    if (isAdmin && can("manage_restaurants", "monitor_restaurant")) return "/restaurants";
    if (can("manage_tables")) return "/tables";
    if (can("monitor_inventory", "manage_inventory")) return "/inventory";
    if (can("manage_takeaway_orders")) return "/takeaway-orders";
    if (can("manage_kitchen_orders")) return "/kitchen-orders";
    if (can("serve_dine_in_orders", "process_payments")) return "/dine-in-service";
    if (can("manage_menu")) return "/add-menu";
    if (can("view_recipes", "manage_recipes")) return "/ingredients";
    if (can("view_reports", "view_global_reports")) return "/reports";

    return "/no-tasks";
}

export function getHomePath(roleId, user = {}) {
    if (Number(roleId) !== ROLE_IDS.ADMIN) {
        const permissionHomePath = getPermissionHomePath(user);

        if (permissionHomePath) return permissionHomePath;
    }

    switch (Number(roleId)) {
        case ROLE_IDS.ADMIN:
            return "/dashboard";

        case ROLE_IDS.MANAGER:
            return "/manager/dashboard";

        case ROLE_IDS.CASHIER:
            return "/cashier";

        case ROLE_IDS.KITCHEN:
            return "/kitchen/dashboard";

        case ROLE_IDS.WAREHOUSE_MANAGER:
            return "/warehouse/dashboard";

        case ROLE_IDS.WAITER:
            return "/waiter";

        default:
            return getPermissionHomePath(user) || "/no-tasks";
    }
}

export function getStoredUser() {
    try {
        return JSON.parse(
            sessionStorage.getItem("user") || localStorage.getItem("user")
        );
    } catch {
        return null;
    }
}

export function getStoredToken() {
    return sessionStorage.getItem("token") || localStorage.getItem("token");
}

export function storeToken(token) {
    sessionStorage.setItem("token", token);
    localStorage.removeItem("token");
}

export function storeUser(user, profile = {}) {
    const profileData = profile.data ?? profile;
    const restaurant =
        profileData.restaurant ??
        profileData.user?.restaurant ??
        user?.restaurant ??
        null;
    const restaurantId =
        profileData.restaurant_id ??
        profileData.user?.restaurant_id ??
        restaurant?.id ??
        user?.restaurant_id ??
        user?.restaurant?.id ??
        null;
    const role =
        profileData.role ??
        profileData.user?.role ??
        user?.role ??
        null;
    const sessionUser = JSON.stringify({
        ...user,
        restaurant,
        restaurant_id: restaurantId,
        role,
        permissions:
            profileData.permissions ??
            profileData.user?.permissions ??
            user?.permissions ??
            [],
        role_permissions:
            profileData.role_permissions ??
            profileData.rolePermissions ??
            profileData.user?.role_permissions ??
            profileData.user?.rolePermissions ??
            user?.role_permissions ??
            user?.rolePermissions ??
            [],
        user_permissions:
            profileData.user_permissions ??
            profileData.userPermissions ??
            profileData.permissions ??
            profileData.user?.user_permissions ??
            profileData.user?.userPermissions ??
            profileData.user?.permissions ??
            user?.user_permissions ??
            user?.userPermissions ??
            user?.permissions ??
            [],
    });

    sessionStorage.setItem("user", sessionUser);
    localStorage.removeItem("user");
}

export function clearSession() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
}
