import { NavLink, useNavigate } from "react-router-dom";
import {
  ChefHat,
  Circle,
  X,
  FolderPlus,
  LayoutDashboard,
  LogOut,
  Package,
  ClipboardList,
  ReceiptText,
  Sparkles,
  Store,
  Table,
  TriangleAlert,
  UtensilsCrossed,
} from "lucide-react";
import { clearSession } from "../../utils/auth";

const navItems = [
  {
    to: "/manager/dashboard",
    label: "Dashboard",
    description: "Overview and quick actions",
    icon: LayoutDashboard,
  },
  {
    to: "/manager/add-menu",
    label: "Menu Builder",
    description: "Categories and modifiers",
    icon: FolderPlus,
    permissions: ["manage_menu"],
  },
  {
    to: "/manager/add-food",
    label: "Food Library",
    description: "Dishes, filters, recipes",
    icon: UtensilsCrossed,
  },
  {
    to: "/manager/ingredients",
    label: "Recipes",
    description: "Food ingredient links",
    icon: Package,
    permissions: ["view_recipes", "manage_recipes"],
  },
  {
    to: "/manager/inventory",
    label: "Inventory",
    description: "Ingredients and stock levels",
    icon: Package,
    permissions: ["monitor_inventory"],
  },
  {
    to: "/manager/stock-actions",
    label: "Stock Actions",
    description: "Refill, adjust, waste",
    icon: ClipboardList,
    permissions: ["monitor_inventory"],
  },
  {
    to: "/manager/low-stock",
    label: "Low Stock",
    description: "Inventory alerts",
    icon: TriangleAlert,
    permissions: ["monitor_inventory"],
  },
  {
    to: "/manager/takeaway-orders",
    label: "Cashier Dashboard",
    description: "Menu, catalog, orders",
    icon: ReceiptText,
    permissions: ["manage_takeaway_orders"],
  },
  {
    to: "/manager/invoices",
    label: "View Invoices",
    description: "Restaurant invoice ledger",
    icon: ReceiptText,
    permissions: [
      "view_invoices",
      "view_invoice",
      "View Invoices",
      "View Invoice",
    ],
  },
  {
    to: "/manager/global-invoices",
    label: "View Global Invoice",
    description: "Global invoice task",
    icon: ReceiptText,
    permissions: [
      "view_global_invoices",
      "view_global_invoice",
      "View Global Invoices",
      "View Global Invoice",
    ],
  },
  {
    to: "/manager/kitchen-orders",
    label: "Kitchen Orders",
    description: "Queue and preparation",
    icon: ChefHat,
    permissions: ["manage_kitchen_orders"],
  },
  {
    to: "/manager/dine-in-service",
    label: "Dine-in Service",
    description: "Serve orders and cash",
    icon: ChefHat,
    permissions: ["serve_dine_in_orders"],
  },
  {
    to: "/manager/tables",
    label: "Tables",
    description: "Floor plan and table status",
    icon: Table,
    permissions: ["manage_tables"],
  },
  {
    to: "/manager/restaurants",
    label: "Restaurants",
    description: "Branches and restaurant profiles",
    icon: Store,
    permissions: ["manage_restaurants"],
  },
];

function ManagerSidebar({ isOpen = false, onClose, permissions = [] }) {
  const navigate = useNavigate();
  const canShow = (requiredPermissions = []) =>
    !requiredPermissions.length ||
    requiredPermissions.some((permission) => permissions.includes(permission));

  const handleLogout = () => {
    clearSession();
    onClose?.();
    navigate("/", { replace: true });
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(84vw,320px)] shrink-0 flex-col overflow-y-auto overscroll-contain border-r border-stone-200 bg-[#f8f5ef] p-3 shadow-2xl shadow-stone-950/20 transition-transform duration-300 sm:p-4 lg:sticky lg:top-0 lg:z-auto lg:w-80 lg:translate-x-0 lg:shadow-none ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-lg bg-white/85 text-[#7F1D1D] shadow-sm transition duration-200 hover:scale-110 lg:hidden"
      >
        <X size={18} />
      </button>

      <div className="relative shrink-0 overflow-hidden rounded-lg border border-[#7F1D1D]/20 bg-gradient-to-br from-[#7F1D1D] via-[#9F3434] to-[#DAB2A2] p-4 text-white shadow-xl shadow-[#7F1D1D]/20">
        <div className="absolute inset-x-0 top-0 h-1 bg-white/35" />
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white/15 shadow-lg shadow-black/10 transition duration-200 hover:scale-110">
            <ChefHat size={23} />
          </div>

          <div className="min-w-0">
            <h1 className="text-xl font-black leading-none">Big-4</h1>
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-white/70">
              Manager Workspace
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-white/15 bg-white/15 p-2.5 backdrop-blur">
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-emerald-100">
            <Circle size={8} fill="currentColor" />
            Live menu ops
          </div>
          <p className="mt-1.5 text-sm leading-5 text-white/75">
            Build, polish, and keep the menu ready for service.
          </p>
        </div>
      </div>

      <div className="mt-5 shrink-0">
        <p className="px-3 text-xs font-black uppercase tracking-wide text-stone-400">
          Navigation
        </p>

        <nav className="mt-3 space-y-2">
          {navItems.filter((item) => canShow(item.permissions)).map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-lg border px-3 py-2.5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    isActive
                      ? "border-[#7F1D1D]/20 bg-white text-stone-950 shadow-lg shadow-[#7F1D1D]/10"
                      : "border-transparent text-stone-600 hover:border-stone-200 hover:bg-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`absolute left-0 top-2.5 h-10 w-1 rounded-r-full transition duration-200 ${
                        isActive ? "bg-[#7F1D1D]" : "bg-transparent"
                      }`}
                    />
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg transition duration-200 group-hover:scale-110 ${
                        isActive
                          ? "bg-[#7F1D1D] text-white shadow-lg shadow-[#7F1D1D]/20"
                          : "bg-stone-100 text-stone-500 group-hover:bg-[#f4e7dc] group-hover:text-[#7F1D1D]"
                      }`}
                    >
                      <Icon size={20} />
                    </span>

                    <span className="min-w-0">
                      <span className="block text-base font-black">
                        {item.label}
                      </span>
                      <span
                        className={`block truncate text-sm font-semibold ${
                          isActive ? "text-stone-500" : "text-stone-400"
                        }`}
                      >
                        {item.description}
                      </span>
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="mt-5 space-y-3 lg:mt-auto lg:pt-5">
        <div className="overflow-hidden rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-950 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="mb-2 flex items-center gap-2 text-sm font-black">
            <Sparkles size={18} className="text-amber-600" />
            Next up
          </div>
          <p className="text-sm leading-6 text-amber-800">
            Modifier groups are visually prepared and ready for backend wiring.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-lg border border-rose-200 bg-white px-3 py-2.5 text-left text-rose-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50 hover:shadow-md active:translate-y-0"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-rose-50 text-rose-600 transition duration-200 group-hover:scale-110 group-hover:bg-rose-600 group-hover:text-white">
            <LogOut size={19} />
          </span>
          <span>
            <span className="block text-base font-black">Logout</span>
            <span className="text-sm font-semibold text-rose-400">
              End manager session
            </span>
          </span>
        </button>
      </div>
    </aside>
  );
}

export default ManagerSidebar;
