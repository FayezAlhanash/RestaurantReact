import { getStoredUser } from "./auth";

const ADMIN_DEFAULT_PERMISSIONS = [
    "manage_users",
    "manage_roles",
    "manage_permissions",
];

export function toPermissionKeys(permissions = []) {
    if (!Array.isArray(permissions)) return [];

    return permissions
        .map((permission) =>
            typeof permission === "string"
                ? permission
                : permission?.key ?? permission?.name
        )
        .filter(Boolean);
}

export function getProfileUserPermissions(profile = {}) {
    const data = profile.data ?? profile;

    if (Array.isArray(data.user_permissions)) {
        return data.user_permissions;
    }

    if (Array.isArray(data.permissions)) {
        return data.permissions;
    }

    return [];
}

export function getUserPermissions() {
    const user = getStoredUser();

    if (!user) return [];

    const roleName = String(user.role?.name ?? "").toLowerCase();
    const roleId = Number(user.role_id ?? user.role?.id);

    if (Array.isArray(user.user_permissions)) {
        const userPermissions = toPermissionKeys(user.user_permissions);

        if (userPermissions.length) {
            return Array.from(new Set(userPermissions));
        }

        if (roleName === "admin" || roleId === 1) {
            return ADMIN_DEFAULT_PERMISSIONS;
        }

        return [];
    }

    if (Array.isArray(user.permissions)) {
        const userPermissions = toPermissionKeys(user.permissions);

        if (userPermissions.length) {
            return Array.from(new Set(userPermissions));
        }

        if (roleName === "admin" || roleId === 1) {
            return ADMIN_DEFAULT_PERMISSIONS;
        }

        return [];
    }

    if (roleName === "admin" || roleId === 1) {
        return ADMIN_DEFAULT_PERMISSIONS;
    }

    return [];
}

export function can(permission) {
    const permissions = getUserPermissions();

    return permissions.includes(permission);
}

export function canAny(requiredPermissions = []) {
    if (!requiredPermissions.length) return true;

    const permissions = getUserPermissions();

    return requiredPermissions.some((permission) =>
        permissions.includes(permission)
    );
}

export function canAll(requiredPermissions = []) {
    if (!requiredPermissions.length) return true;

    const permissions = getUserPermissions();

    return requiredPermissions.every((permission) =>
        permissions.includes(permission)
    );
}
