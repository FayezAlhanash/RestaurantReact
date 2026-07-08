import { Navigate, Outlet } from "react-router-dom";
import { getHomePath, getStoredUser } from "../../utils/auth";
import { canAny } from "../../utils/permissions";

export default function ProtectedRoute({
  allowedRoles = [],
  allowedPermissions = [],
}) {
  const token = localStorage.getItem("token");
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  const roleId = Number(user?.role_id ?? user?.role?.id);

  // 1) ROLE check
  const roleAllowed =
    !allowedRoles.length || allowedRoles.includes(roleId);

  // 2) PERMISSION check
  const permissionAllowed =
    !allowedPermissions.length || canAny(allowedPermissions);

  // 3) FINAL decision
  if (!roleAllowed || !permissionAllowed) {
    return <Navigate to={getHomePath(roleId) || "/"} replace />;
  }

  return <Outlet />;
}
