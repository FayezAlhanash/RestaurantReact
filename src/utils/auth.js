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

export function getHomePath(roleId) {
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
            return null;
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
