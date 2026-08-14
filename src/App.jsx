import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import KitchenLayout from "./components/Kitchen/KitchenLayout";
import KitchenDashboard from "./components/Kitchen/KitchenDashboard";
import Login from "./pages/Login";
import RolesLanding from "./pages/RolesLanding";
import Employee from "./components/Admin/Employee";
import EmployeeShifts from "./components/Admin/EmployeeShifts";
import AdminLayout from "./components/Admin/AdminLayout";
import MainContent from "./components/Admin/MainContent";
import RestaurantsManagements from "./components/Admin/RestaurantsManagements";
import EmployeesManagements from "./components/Admin/EmployeesManagements";
import RestaurantStaff from "./components/Admin/RestaurantStaff";
import RolesPermission from "./components/Admin/Roles&Permission";
import UserPermission from "./components/Admin/UserPermission";
import DeliveryReviews from "./components/Admin/DeliveryReviews";
import LoyaltySettings from "./components/Admin/LoyaltySettings";
import GlobalInvoices from "./components/Admin/GlobalInvoices";
import TablesManagements from "./components/Admin/TablesManagements";
import Cashier from "./components/Cashier/Cashier";
import CashierDashboard from "./components/Cashier/CashierDashboard";
import Warehouse from "./components/Warehouse/Warehouse";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import LowStock from "./components/Warehouse/LowStock";
import Chat from "./components/Warehouse/Chat";
import StockActions from "./components/Warehouse/StockAction";
import AddMenu from "./components/Manager/AddMenu";
import AddFood from "./components/Manager/AddFood";
import Ingredients from "./components/Manager/Ingredients";
import { ROLE_IDS } from "./utils/auth";
import WarehouseLayout from "./components/Warehouse/WarehouseLayout";

import ManagerLayout from "./components/Manager/ManagerLayout";
import ManagerDashboard from "./components/Manager/ManagerDashboard";
import DineInOrder from "./components/Customer/DineInOrder";
import TableDisplay from "./components/Customer/TableDisplay";
import TableDeviceSetup from "./components/Customer/TableDeviceSetup";
import WaiterDashboard from "./components/Waiter/WaiterDashboard";
import WaiterLayout from "./components/Waiter/WaiterLayout";
import WaiterHomeRedirect from "./components/Waiter/WaiterHomeRedirect";
import NoTasks from "./components/Shared/NoTasks";
import { ThemeProvider } from "./context/ThemeContext";
import api from "./API/axios";
import { getStoredToken } from "./utils/auth";
import NotificationManager from "./notifications/NotificationManager";
import RealtimeManager from "./components/Realtime/RealtimeManager";

const RESTAURANT_STAFF_PERMISSIONS = [
  "manage_restaurant_staff",
  "view_restaurant_staff",
  "list_staff_user_restaurant",
  "list_staff_users_restaurant",
  "List-staff-User-restaurant",
  "Manage Restaurant Staff",
];

const OPERATIONS_WORKSPACE_PERMISSIONS = [
  ...RESTAURANT_STAFF_PERMISSIONS,
  "manage_menu",
  "view_recipes",
  "manage_recipes",
  "monitor_inventory",
  "manage_takeaway_orders",
  "manage_kitchen_orders",
  "serve_dine_in_orders",
  "process_payments",
  "manage_tables",
  "manage_restaurants",
  "view_reports",
  "view_delivery_review",
  "manage_loyalty_settings",
  "view_invoices",
  "view_global_invoices",
  "manage_global_employee_shifts",
  "Manage Global Employee Shifts",
];

const GLOBAL_INVOICE_PERMISSIONS = [
  "view_global_invoices",
  "view_global_invoice",
  "global_invoice",
  "global_invoices",
];

const RESTAURANT_INVOICE_PERMISSIONS = [
  "view_invoices",
  "view_invoice",
  "View Invoices",
  "View Invoice",
];

const SESSION_CHECK_INTERVAL_MS = 15000;

function SessionWatcher() {
  useEffect(() => {
    const isPublicPage = () =>
      window.location.pathname === "/" ||
      window.location.pathname === "/help" ||
      window.location.pathname === "/info" ||
      window.location.pathname === "/table-setup" ||
      window.location.pathname.startsWith("/table/") ||
      window.location.pathname.startsWith("/table-display/") ||
      window.location.pathname.startsWith("/tables/") ||
      window.location.pathname.startsWith("/dine-in/");

    const checkSession = () => {
      if (!getStoredToken() || isPublicPage()) return;

      api.get("/profile/permissions").catch(() => {
        // The axios response interceptor handles 401 by signing out.
      });
    };

    checkSession();

    const intervalId = window.setInterval(checkSession, SESSION_CHECK_INTERVAL_MS);
    const handleFocus = () => checkSession();
    const handleVisibilityChange = () => {
      if (!document.hidden) checkSession();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}

function App() {
  return (
    <ThemeProvider>
    <BrowserRouter >
      <SessionWatcher />
      <RealtimeManager />
      <NotificationManager />

      <Routes>

        <Route path="/" element={<Login />} />
        <Route path="/help" element={<Navigate to="/info" replace />} />
        <Route path="/info" element={<RolesLanding />} />

        {/* Table display and customer QR ordering */}
        <Route path="/table-setup" element={<TableDeviceSetup />} />
        <Route path="/table/:tableId" element={<TableDisplay />} />
        <Route path="/tables/:tableId" element={<DineInOrder />} />
        <Route path="/dine-in/:tableId" element={<DineInOrder />} />
        <Route path="/table-display/:tableId" element={<TableDisplay />} />

        {/* Cashier */}
        <Route element={<ProtectedRoute allowedRoles={[ROLE_IDS.CASHIER]} allowedPermissions={["manage_takeaway_orders"]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/cashier" element={<Cashier />} />
          </Route>
        </Route>

        {/* Waiter */}
        <Route element={<ProtectedRoute allowedRoles={[ROLE_IDS.WAITER]} allowedPermissions={["serve_dine_in_orders"]} />}>
          <Route element={<WaiterLayout />}>
            <Route path="/waiter" element={<WaiterHomeRedirect />} />
            <Route element={<ProtectedRoute allowedPermissions={["serve_dine_in_orders"]} />}>
              <Route
                path="/waiter/service"
                element={<WaiterDashboard embedded />}
              />
              <Route
                path="/waiter/serve-orders"
                element={<WaiterDashboard embedded />}
              />
              <Route
                path="/waiter/cash-payments"
                element={<WaiterDashboard embedded />}
              />
            </Route>
          </Route>
        </Route>

        {/* Warehouse */}
        <Route element={<ProtectedRoute allowedRoles={[ROLE_IDS.WAREHOUSE_MANAGER]} allowedPermissions={OPERATIONS_WORKSPACE_PERMISSIONS} />}>
          <Route element={<WarehouseLayout />}>
            <Route path="/warehouse" element={<Navigate to="/warehouse/dashboard" replace />} />
            <Route path="/warehouse/dashboard" element={<Warehouse />} />
            <Route path="/warehouse/low-stock" element={<LowStock />} />
            <Route path="/warehouse/actions" element={<StockActions />} />
            <Route path="/warehouse/chat" element={<Chat />} />
            <Route element={<ProtectedRoute allowedPermissions={["manage_menu"]} />}>
              <Route path="/warehouse/add-menu" element={<AddMenu />} />
            </Route>
            <Route element={<ProtectedRoute allowedPermissions={["manage_takeaway_orders"]} />}>
              <Route path="/warehouse/takeaway-orders" element={<CashierDashboard embedded />} />
            </Route>
            <Route element={<ProtectedRoute allowedPermissions={["manage_kitchen_orders"]} />}>
              <Route path="/warehouse/kitchen-orders" element={<KitchenDashboard />} />
            </Route>
            <Route element={<ProtectedRoute allowedPermissions={["serve_dine_in_orders"]} />}>
              <Route path="/warehouse/dine-in-service" element={<WaiterDashboard embedded />} />
            </Route>
            <Route element={<ProtectedRoute allowedPermissions={["view_reports"]} />}>
              <Route path="/warehouse/reports" element={<ManagerDashboard />} />
            </Route>
            <Route element={<ProtectedRoute allowedPermissions={["manage_tables"]} />}>
              <Route path="/warehouse/tables" element={<TablesManagements />} />
            </Route>
            <Route element={<ProtectedRoute allowedPermissions={["manage_restaurants"]} />}>
              <Route path="/warehouse/restaurants" element={<RestaurantsManagements />} />
            </Route>
          </Route>
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/no-tasks" element={<NoTasks />} />
            <Route element={<ProtectedRoute allowedRoles={[ROLE_IDS.ADMIN]} />}>
              <Route path="/dashboard" element={<MainContent />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={[ROLE_IDS.ADMIN]} />}>
              <Route element={<ProtectedRoute allowedPermissions={["manage_restaurants"]} />}>
                <Route path="/restaurants" element={<RestaurantsManagements />} />
              </Route>
            </Route>
            <Route element={<ProtectedRoute allowedPermissions={["manage_users"]} />}>
              <Route path="/employees" element={<EmployeesManagements />} />
              <Route path="/employee" element={<Employee />} />
            </Route>
            <Route element={<ProtectedRoute allowedPermissions={RESTAURANT_STAFF_PERMISSIONS} />}>
              <Route path="/restaurant-staff" element={<RestaurantStaff />} />
            </Route>
            <Route element={<ProtectedRoute allowedPermissions={["manage_employee_shifts", "Manage Employee Shifts", "manage_global_employee_shifts", "Manage Global Employee Shifts", "manage_users"]} />}>
              <Route path="/employee-shifts" element={<EmployeeShifts />} />
            </Route>
            <Route element={<ProtectedRoute allowedPermissions={["manage_permissions"]} />}>
              <Route path="/user-permissions" element={<UserPermission />} />
            </Route>
            <Route element={<ProtectedRoute allowedPermissions={["manage_roles", "manage_permissions"]} />}>
              <Route path="/roles" element={<RolesPermission />} />
            </Route>
            <Route element={<ProtectedRoute allowedPermissions={["manage_tables"]} />}>
              <Route path="/tables" element={<TablesManagements />} />
            </Route>
            <Route element={<ProtectedRoute allowedPermissions={["manage_menu"]} />}>
              <Route path="/add-menu" element={<AddMenu />} />
              <Route path="/add-food" element={<AddFood />} />
            </Route>
            <Route element={<ProtectedRoute allowedPermissions={["view_recipes", "manage_recipes"]} />}>
              <Route path="/ingredients" element={<Ingredients />} />
            </Route>
            <Route element={<ProtectedRoute allowedPermissions={["monitor_inventory", "manage_inventory"]} />}>
              <Route path="/inventory" element={<Warehouse />} />
              <Route path="/stock-actions" element={<StockActions />} />
              <Route path="/low-stock" element={<LowStock />} />
            </Route>
            <Route element={<ProtectedRoute allowedPermissions={["manage_takeaway_orders"]} />}>
              <Route path="/takeaway-orders" element={<CashierDashboard embedded />} />
            </Route>
            <Route element={<ProtectedRoute allowedPermissions={["manage_kitchen_orders"]} />}>
              <Route path="/kitchen-orders" element={<KitchenDashboard />} />
            </Route>
            <Route element={<ProtectedRoute allowedPermissions={["serve_dine_in_orders"]} />}>
              <Route path="/dine-in-service" element={<WaiterDashboard embedded />} />
            </Route>
            <Route element={<ProtectedRoute allowedPermissions={["view_reports", "view_global_reports"]} />}>
              <Route path="/reports" element={<ManagerDashboard />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={[ROLE_IDS.ADMIN]} allowedPermissions={GLOBAL_INVOICE_PERMISSIONS} />}>
              <Route path="/global-invoices" element={<GlobalInvoices />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={[ROLE_IDS.ADMIN]} allowedPermissions={RESTAURANT_INVOICE_PERMISSIONS} />}>
              <Route path="/invoices" element={<GlobalInvoices scope="adminRestaurant" />} />
            </Route>
            <Route element={<ProtectedRoute allowedPermissions={["view_delivery_review", "view_delivery_reviews", "view_deivery_review"]} />}>
              <Route path="/delivery-reviews" element={<DeliveryReviews />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={[ROLE_IDS.ADMIN]} allowedPermissions={["manage_global_loyalty_settings"]} />}>
              <Route path="/global-loyalty-settings" element={<LoyaltySettings scope="global" />} />
            </Route>
            <Route element={<ProtectedRoute allowedPermissions={["manage_loyalty_settings"]} />}>
              <Route path="/loyalty-settings" element={<LoyaltySettings scope="restaurant" />} />
            </Route>
          </Route>
        </Route>
{/* Kitchen */}
<Route
    element={
        <ProtectedRoute
            allowedRoles={[ROLE_IDS.KITCHEN]}
            allowedPermissions={OPERATIONS_WORKSPACE_PERMISSIONS}
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

        <Route element={<ProtectedRoute allowedPermissions={["manage_takeaway_orders"]} />}>
            <Route
                path="/kitchen/takeaway-orders"
                element={<CashierDashboard embedded />}
            />
        </Route>

        <Route element={<ProtectedRoute allowedPermissions={["serve_dine_in_orders"]} />}>
            <Route
                path="/kitchen/dine-in-service"
                element={<WaiterDashboard embedded />}
            />
        </Route>

        <Route element={<ProtectedRoute allowedPermissions={["manage_menu"]} />}>
            <Route
                path="/kitchen/add-menu"
                element={<AddMenu />}
            />
            <Route
                path="/kitchen/add-food"
                element={<AddFood />}
            />
        </Route>

        <Route element={<ProtectedRoute allowedPermissions={["view_recipes", "manage_recipes"]} />}>
            <Route
                path="/kitchen/ingredients"
                element={<Ingredients />}
            />
        </Route>

        <Route element={<ProtectedRoute allowedPermissions={["monitor_inventory"]} />}>
            <Route
                path="/kitchen/inventory"
                element={<Warehouse />}
            />
            <Route
                path="/kitchen/stock-actions"
                element={<StockActions />}
            />
            <Route
                path="/kitchen/low-stock"
                element={<LowStock />}
            />
        </Route>

        <Route element={<ProtectedRoute allowedPermissions={["view_reports"]} />}>
            <Route
                path="/kitchen/reports"
                element={<ManagerDashboard />}
            />
        </Route>

    </Route>
</Route>
        {/* Manager */}
        <Route element={<ProtectedRoute allowedRoles={[ROLE_IDS.MANAGER]} allowedPermissions={OPERATIONS_WORKSPACE_PERMISSIONS} />}>
          <Route element={<ManagerLayout />}>

            <Route
              path="/manager"
              element={<Navigate to="/manager/dashboard" replace />}
            />

            <Route
              path="/manager/dashboard"
              element={<ManagerDashboard />}
            />

            <Route element={<ProtectedRoute allowedPermissions={["manage_menu"]} />}>
              <Route
                path="/manager/add-menu"
                element={<AddMenu />}
              />
            </Route>

            <Route
              path="/manager/add-food"
              element={<AddFood />}
            />

            <Route element={<ProtectedRoute allowedPermissions={["view_recipes", "manage_recipes"]} />}>
              <Route
                path="/manager/ingredients"
                element={<Ingredients />}
              />
            </Route>

            <Route element={<ProtectedRoute allowedPermissions={["monitor_inventory"]} />}>
              <Route
                path="/manager/inventory"
                element={<Warehouse />}
              />
              <Route
                path="/manager/stock-actions"
                element={<StockActions />}
              />
              <Route
                path="/manager/low-stock"
                element={<LowStock />}
              />
            </Route>

            <Route element={<ProtectedRoute allowedPermissions={["manage_takeaway_orders"]} />}>
              <Route
                path="/manager/takeaway-orders"
                element={<CashierDashboard embedded />}
              />
            </Route>

            <Route element={<ProtectedRoute allowedPermissions={["manage_kitchen_orders"]} />}>
              <Route
                path="/manager/kitchen-orders"
                element={<KitchenDashboard />}
              />
            </Route>

            <Route element={<ProtectedRoute allowedPermissions={["serve_dine_in_orders"]} />}>
              <Route
                path="/manager/dine-in-service"
                element={<WaiterDashboard embedded />}
              />
            </Route>

            <Route element={<ProtectedRoute allowedPermissions={["manage_tables"]} />}>
              <Route
                path="/manager/tables"
                element={<TablesManagements />}
              />
            </Route>

            <Route element={<ProtectedRoute allowedPermissions={["manage_restaurants"]} />}>
              <Route
                path="/manager/restaurants"
                element={<RestaurantsManagements />}
              />
            </Route>

            <Route element={<ProtectedRoute allowedPermissions={["manage_loyalty_settings"]} />}>
              <Route
                path="/manager/loyalty-settings"
                element={<LoyaltySettings scope="restaurant" />}
              />
            </Route>

            <Route element={<ProtectedRoute allowedPermissions={RESTAURANT_INVOICE_PERMISSIONS} />}>
              <Route
                path="/manager/invoices"
                element={<GlobalInvoices scope="restaurant" />}
              />
            </Route>

            <Route element={<ProtectedRoute allowedPermissions={GLOBAL_INVOICE_PERMISSIONS} />}>
              <Route
                path="/manager/global-invoices"
                element={<GlobalInvoices />}
              />
            </Route>

          </Route>
        </Route>

      </Routes>

    </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
