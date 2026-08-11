import { getStoredUser } from "./auth";

const ADMIN_DEFAULT_PERMISSIONS = [
    "manage_users",
    "manage_employee_shifts",
    "manage_roles",
    "manage_permissions",
    "manage_global_loyalty_settings",
    "manage_loyalty_settings",
    "view_global_invoices",
];

export function getRevokedPermissions(data = {}) {
    return [
        ...(Array.isArray(data.revoked_permissions) ? data.revoked_permissions : []),
        ...(Array.isArray(data.revokedPermissions) ? data.revokedPermissions : []),
        ...(Array.isArray(data.removed_permissions) ? data.removed_permissions : []),
        ...(Array.isArray(data.removedPermissions) ? data.removedPermissions : []),
        ...(Array.isArray(data.denied_permissions) ? data.denied_permissions : []),
        ...(Array.isArray(data.deniedPermissions) ? data.deniedPermissions : []),
        ...(Array.isArray(data.excluded_permissions) ? data.excluded_permissions : []),
        ...(Array.isArray(data.excludedPermissions) ? data.excludedPermissions : []),
        ...(Array.isArray(data.permission_overrides?.denied)
            ? data.permission_overrides.denied
            : []),
        ...(Array.isArray(data.permissionOverrides?.denied)
            ? data.permissionOverrides.denied
            : []),
        ...(Array.isArray(data.user?.revoked_permissions)
            ? data.user.revoked_permissions
            : []),
        ...(Array.isArray(data.user?.revokedPermissions)
            ? data.user.revokedPermissions
            : []),
        ...(Array.isArray(data.user?.removed_permissions)
            ? data.user.removed_permissions
            : []),
        ...(Array.isArray(data.user?.removedPermissions)
            ? data.user.removedPermissions
            : []),
        ...(Array.isArray(data.user?.denied_permissions)
            ? data.user.denied_permissions
            : []),
        ...(Array.isArray(data.user?.deniedPermissions)
            ? data.user.deniedPermissions
            : []),
        ...(Array.isArray(data.user?.excluded_permissions)
            ? data.user.excluded_permissions
            : []),
        ...(Array.isArray(data.user?.excludedPermissions)
            ? data.user.excludedPermissions
            : []),
    ];
}

function normalizePermissionKey(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

function getPermissionIds(permission = {}) {
    if (typeof permission === "string") return [];
    if (!permission || typeof permission !== "object") return [];

    return [
        permission.id,
        permission.permission_id,
        permission.permissionId,
        permission.permission?.id,
        permission.pivot?.permission_id,
        permission.pivot?.permissionId,
        permission.pivot?.permission?.id,
    ]
        .filter((value) => value !== undefined && value !== null && value !== "")
        .map(String);
}

function toPermissionIdSet(permissions = []) {
    if (!Array.isArray(permissions)) return new Set();

    return new Set(permissions.flatMap(getPermissionIds));
}

function shouldKeepPermission(permission, revokedKeys, revokedIds) {
    const permissionKeys = toPermissionKeys([permission]).map(normalizePermissionKey);
    const permissionIds = getPermissionIds(permission);

    return (
        !permissionKeys.some((key) => revokedKeys.has(key)) &&
        !permissionIds.some((id) => revokedIds.has(id))
    );
}

export function toPermissionKeys(permissions = []) {
    if (!Array.isArray(permissions)) {
        if (permissions && typeof permissions === "object") {
            return Object.entries(permissions)
                .filter(([, value]) => Boolean(value))
                .map(([key]) => key);
        }

        return [];
    }

    return permissions
        .flatMap((permission) => {
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
        })
        .filter(Boolean);
}

export function getAssignedPermissionKeys(user = getStoredUser()) {
    if (!user) return [];

    return Array.from(
        new Set(
            toPermissionKeys([
                ...(Array.isArray(user.user_permissions) ? user.user_permissions : []),
                ...(Array.isArray(user.userPermissions) ? user.userPermissions : []),
                ...(Array.isArray(user.permissions) ? user.permissions : []),
                ...(Array.isArray(user.role_permissions) ? user.role_permissions : []),
                ...(Array.isArray(user.rolePermissions) ? user.rolePermissions : []),
                ...(Array.isArray(user.role?.permissions) ? user.role.permissions : []),
                ...(Array.isArray(user.role?.role_permissions)
                    ? user.role.role_permissions
                    : []),
            ])
        )
    );
}

export function getProfileUserPermissions(profile = {}) {
    const data = profile.data ?? profile;
    const permissions = [
        ...(Array.isArray(data.user_permissions) ? data.user_permissions : []),
        ...(Array.isArray(data.userPermissions) ? data.userPermissions : []),
        ...(Array.isArray(data.role_permissions) ? data.role_permissions : []),
        ...(Array.isArray(data.rolePermissions) ? data.rolePermissions : []),
        ...(Array.isArray(data.permissions) ? data.permissions : []),
        ...(Array.isArray(data.role?.permissions) ? data.role.permissions : []),
        ...(Array.isArray(data.role?.role_permissions)
            ? data.role.role_permissions
            : []),
        ...(Array.isArray(data.user?.permissions) ? data.user.permissions : []),
        ...(Array.isArray(data.user?.user_permissions)
            ? data.user.user_permissions
            : []),
        ...(Array.isArray(data.user?.role_permissions)
            ? data.user.role_permissions
            : []),
        ...(Array.isArray(data.user?.role?.permissions)
            ? data.user.role.permissions
            : []),
        ...(Array.isArray(data.user?.role?.role_permissions)
            ? data.user.role.role_permissions
            : []),
    ];

    if (!permissions.length && data.permissions && typeof data.permissions === "object") {
        return data.permissions;
    }

    return permissions;
}

export function getUserPermissions() {
    const user = getStoredUser();

    if (!user) return [];

    const roleName = String(user.role?.name ?? "").toLowerCase();
    const roleId = Number(user.role_id ?? user.role?.id);
    const revokedPermissionEntries = getRevokedPermissions(user);
    const revokedPermissionKeys = new Set(
        toPermissionKeys(revokedPermissionEntries).map(normalizePermissionKey)
    );
    const revokedPermissionIds = toPermissionIdSet(revokedPermissionEntries);
    const permissionEntries = [
        ...(Array.isArray(user.user_permissions) ? user.user_permissions : []),
        ...(Array.isArray(user.userPermissions) ? user.userPermissions : []),
        ...(Array.isArray(user.permissions) ? user.permissions : []),
        ...(Array.isArray(user.role_permissions) ? user.role_permissions : []),
        ...(Array.isArray(user.rolePermissions) ? user.rolePermissions : []),
        ...(Array.isArray(user.role?.permissions) ? user.role.permissions : []),
        ...(Array.isArray(user.role?.role_permissions)
            ? user.role.role_permissions
            : []),
    ];
    const userPermissions = toPermissionKeys(
        permissionEntries.filter((permission) =>
            shouldKeepPermission(
                permission,
                revokedPermissionKeys,
                revokedPermissionIds
            )
        )
    );

    if (userPermissions.length) {
        return Array.from(new Set(userPermissions));
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
