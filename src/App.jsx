import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Employee from "./components/Admin/Employee";
import AdminLayout from "./components/Admin/AdminLayout";
import MainContent from "./components/Admin/MainContent";
import RestaurantsManagements from "./components/Admin/RestaurantsManagements";
import EmployeesManagements from "./components/Admin/EmployeesManagements";
import RolesPermission from "./components/Admin/Roles&Permission";
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

function App() {
  return (
    <BrowserRouter >

      <Routes>

        <Route path="/" element={<Login />} />

        {/* Cashier */}
        <Route element={<ProtectedRoute allowedRoles={[ROLE_IDS.CASHIER]} />}>
          <Route path="/cashier" element={<Cashier />} />
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
            <Route path="/restaurants" element={<RestaurantsManagements />} />
            <Route path="/employees" element={<EmployeesManagements />} />
            <Route path="/roles" element={<RolesPermission />} />
            <Route path="/employee" element={<Employee />} />
            <Route path="/tables" element={<TablesManagements />} />
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
