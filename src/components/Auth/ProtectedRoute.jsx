import { Navigate, Outlet } from "react-router-dom";
import { getHomePath, getRoleId, getStoredUser } from "../../utils/auth";

function ProtectedRoute({ allowedRoles }) {
    const token = localStorage.getItem("token");
    const roleId = getRoleId(getStoredUser());

    if (!token || !roleId) {
        return <Navigate to="/" replace />;
    }

    if (!allowedRoles.includes(roleId)) {
        return <Navigate to={getHomePath(roleId) || "/"} replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;
