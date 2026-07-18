import { Navigate, Outlet } from "react-router-dom";
import { getHomePath, getStoredToken, getStoredUser } from "../../utils/auth";
import { canAny } from "../../utils/permissions";

export default function ProtectedRoute({
  allowedRoles = [],
  allowedPermissions = [],
}) {
  const token = getStoredToken();
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  const roleId = Number(user?.role_id ?? user?.role?.id);

  // 1) ROLE check
  const hasRoleGate = allowedRoles.length > 0;
  const hasPermissionGate = allowedPermissions.length > 0;
  const roleAllowed = !hasRoleGate || allowedRoles.includes(roleId);

  // 2) PERMISSION check
  const permissionAllowed =
    !hasPermissionGate || canAny(allowedPermissions);

  // 3) FINAL decision
  const isAllowed =
    hasRoleGate && hasPermissionGate
      ? roleAllowed || permissionAllowed
      : roleAllowed && permissionAllowed;

  if (!isAllowed) {
    return <Navigate to={getHomePath(roleId, user) || "/"} replace />;
  }

  return <Outlet />;
}
