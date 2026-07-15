import { Navigate } from "react-router-dom";
import { getUserPermissions } from "../../utils/permissions";

export default function WaiterHomeRedirect() {
    const permissions = getUserPermissions();

    if (
        permissions.includes("serve_dine_in_orders") ||
        permissions.includes("process_payments")
    ) {
        return <Navigate to="/waiter/service" replace />;
    }

    return <Navigate to="/" replace />;
}
