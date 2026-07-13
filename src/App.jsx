import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import KitchenLayout from "./components/Kitchen/KitchenLayout";
import KitchenDashboard from "./components/Kitchen/KitchenDashboard";
import Login from "./pages/Login";
import Employee from "./components/Admin/Employee";
import AdminLayout from "./components/Admin/AdminLayout";
import MainContent from "./components/Admin/MainContent";
import RestaurantsManagements from "./components/Admin/RestaurantsManagements";
import EmployeesManagements from "./components/Admin/EmployeesManagements";
import RolesPermission from "./components/Admin/Roles&Permission";
import UserPermission from "./components/Admin/UserPermission";
import TablesManagements from "./components/Admin/TablesManagements";
import Cashier from "./components/Cashier/Cashier";
import Warehouse from "./components/Warehouse/Warehouse";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import LowStock from "./components/Warehouse/LowStock";
import Chat from "./components/Warehouse/Chat";
import StockActions from "./components/Warehouse/StockAction";
import AddMenu from "./components/Manager/AddMenu";
import AddFood from "./components/Manager/AddFood";
import { ROLE_IDS } from "./utils/auth";
import WarehouseLayout from "./components/Warehouse/WarehouseLayout";

import ManagerLayout from "./components/Manager/ManagerLayout";
import ManagerDashboard from "./components/Manager/ManagerDashboard";
import DineInOrder from "./components/Customer/DineInOrder";
import WaiterDashboard from "./components/Waiter/WaiterDashboard";

function App() {
  return (
    <BrowserRouter >

      <Routes>

        <Route path="/" element={<Login />} />

        {/* Customer QR ordering */}
        <Route path="/table/:tableId" element={<DineInOrder />} />
        <Route path="/tables/:tableId" element={<DineInOrder />} />
        <Route path="/dine-in/:tableId" element={<DineInOrder />} />

        {/* Cashier */}
        <Route element={<ProtectedRoute allowedRoles={[ROLE_IDS.CASHIER]} />}>
          <Route path="/cashier" element={<Cashier />} />
        </Route>

        {/* Waiter */}
        <Route element={<ProtectedRoute allowedRoles={[ROLE_IDS.WAITER]} />}>
          <Route path="/waiter" element={<WaiterDashboard />} />
        </Route>

        {/* Warehouse */}
        <Route element={<ProtectedRoute allowedRoles={[ROLE_IDS.WAREHOUSE_MANAGER]} />}>
          <Route element={<WarehouseLayout />}>
            <Route path="/warehouse" element={<Navigate to="/warehouse/dashboard" replace />} />
            <Route path="/warehouse/dashboard" element={<Warehouse />} />
            <Route path="/warehouse/low-stock" element={<LowStock />} />
            <Route path="/warehouse/actions" element={<StockActions />} />
            <Route path="/warehouse/chat" element={<Chat />} />
          </Route>
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute allowedRoles={[ROLE_IDS.ADMIN]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<MainContent />} />
            <Route element={<ProtectedRoute allowedPermissions={["manage_restaurants"]} />}>
              <Route path="/restaurants" element={<RestaurantsManagements />} />
            </Route>
            <Route element={<ProtectedRoute allowedPermissions={["manage_users"]} />}>
              <Route path="/employees" element={<EmployeesManagements />} />
              <Route path="/employee" element={<Employee />} />
            </Route>
            <Route element={<ProtectedRoute allowedPermissions={["manage_users", "manage_permissions"]} />}>
              <Route path="/user-permissions" element={<UserPermission />} />
            </Route>
            <Route element={<ProtectedRoute allowedPermissions={["manage_roles", "manage_permissions"]} />}>
              <Route path="/roles" element={<RolesPermission />} />
            </Route>
            <Route element={<ProtectedRoute allowedPermissions={["manage_tables"]} />}>
              <Route path="/tables" element={<TablesManagements />} />
            </Route>
          </Route>
        </Route>
{/* Kitchen */}
<Route
    element={
        <ProtectedRoute
            allowedRoles={[ROLE_IDS.KITCHEN]}
        />
    }
>
    <Route element={<KitchenLayout />}>

        <Route
            path="/kitchen"
            element={
                <Navigate
                    to="/kitchen/dashboard"
                    replace
                />
            }
        />

        <Route
            path="/kitchen/dashboard"
            element={<KitchenDashboard />}
        />

    </Route>
</Route>
        {/* Manager */}
        <Route element={<ProtectedRoute allowedRoles={[ROLE_IDS.MANAGER]} />}>
          <Route element={<ManagerLayout />}>

            <Route
              path="/manager"
              element={<Navigate to="/manager/dashboard" replace />}
            />

            <Route
              path="/manager/dashboard"
              element={<ManagerDashboard />}
            />

            <Route
              path="/manager/add-menu"
              element={<AddMenu />}
            />

            <Route
              path="/manager/add-food"
              element={<AddFood />}
            />

          </Route>
        </Route>

      </Routes>

    </BrowserRouter>
  );
}

export default App;
