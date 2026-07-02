import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderPlus,
  UtensilsCrossed,
  Tags,
  Layers3,
  ListTree,
  Package,
  ChevronDown,
  ChevronRight,
  LogOut,
} from "lucide-react";

export default function ManagerSidebar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [foodOpen, setFoodOpen] = useState(false);

  return (
    <aside className="w-72 h-screen bg-white border-r flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b">
        <h1 className="text-3xl font-bold text-[#7F1D1D]">Big-4</h1>
        <p className="text-gray-500 text-sm">Restaurant Manager</p>
      </div>

      {/* Menu */}
      <div className="flex-1 p-4 space-y-2">

        <NavLink
          to="/manager/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition ${
              isActive
                ? "bg-[#7F1D1D] text-white"
                : "hover:bg-gray-100 text-gray-700"
            }`
          }
        >
          <LayoutDashboard size={20} />
          Dashboard
        </NavLink>

        {/* Add Menu */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-100 text-gray-700"
        >
          <div className="flex items-center gap-3">
            <FolderPlus size={20} />
            Add Menu
          </div>

          {menuOpen ? (
            <ChevronDown size={18} />
          ) : (
            <ChevronRight size={18} />
          )}
        </button>

        {menuOpen && (
          <div className="ml-6 space-y-1">

            <NavLink
              to="/manager/categories"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <Tags size={18} />
              Categories
            </NavLink>

            <NavLink
              to="/manager/modifier-groups"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <Layers3 size={18} />
              Modifier Groups
            </NavLink>

            <NavLink
              to="/manager/modifier-options"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <ListTree size={18} />
              Modifier Options
            </NavLink>

          </div>
        )}

        {/* Add Food */}
        <button
          onClick={() => setFoodOpen(!foodOpen)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-100 text-gray-700"
        >
          <div className="flex items-center gap-3">
            <UtensilsCrossed size={20} />
            Add Food
          </div>

          {foodOpen ? (
            <ChevronDown size={18} />
          ) : (
            <ChevronRight size={18} />
          )}
        </button>

        {foodOpen && (
          <div className="ml-6 space-y-1">

            <NavLink
              to="/manager/foods"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <UtensilsCrossed size={18} />
              Foods
            </NavLink>

            <NavLink
              to="/manager/ingredients"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <Package size={18} />
              Ingredients
            </NavLink>

          </div>
        )}
      </div>

      {/* Logout */}
      <div className="p-4 border-t">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50">
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
}
