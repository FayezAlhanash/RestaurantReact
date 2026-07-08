export const ROLE_IDS = {
    ADMIN: 1,
    MANAGER: 3,
    CASHIER: 4,
    KITCHEN: 6,
    WAREHOUSE_MANAGER: 7,
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

        default:
            return null;
    }
}

export function getStoredUser() {
    try {
        return JSON.parse(localStorage.getItem("user"));
    } catch {
        return null;
    }
}

export function storeUser(user, profile = {}) {
    const profileData = profile.data ?? profile;

    localStorage.setItem(
        "user",
        JSON.stringify({
            ...user,
            role: profileData.role ?? user?.role ?? null,
            user_permissions:
                profileData.user_permissions ??
                profileData.permissions ??
                user?.user_permissions ??
                user?.permissions ??
                [],
        })
    );
}

export function clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
}
