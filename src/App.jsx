import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Employee from "./components/Admin/Employee";
import AdminLayout from "./components/Admin/AdminLayout";
import MainContent from "./components/Admin/MainContent";
import RestaurantsManagements from "./components/Admin/RestaurantsManagements";
import EmployeesManagements from "./components/Admin/EmployeesManagements";
import RolesPermission from "./components/Admin/Roles&Permission";
import TablesManagements from "./components/Admin/TablesManagements";

function App() {
  return (
    <BrowserRouter >

      <Routes>

        <Route path="/" element={<Login />} />

        <Route element={<AdminLayout />}>

          <Route path="/dashboard" element={<MainContent />} />

          <Route
            path="/restaurants"
            element={<RestaurantsManagements />}
          />

          <Route
            path="/employees"
            element={<EmployeesManagements />}
          />

          <Route
            path="/roles"
            element={<RolesPermission />}
          />
          <Route
           path="/employee"
            element={<Employee />}
             />

          <Route
            path="/tables"
            element={<TablesManagements />}
          />

        </Route>

      </Routes>

    </BrowserRouter>
  );
}

export default App;