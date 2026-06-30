export const ROLE_IDS = {
    ADMIN: 1,
    CASHIER: 4,
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
        case ROLE_IDS.CASHIER:
            return "/cashier";
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

export function clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
}
