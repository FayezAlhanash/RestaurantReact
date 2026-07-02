import { NavLink, useNavigate } from "react-router-dom";
import {
  ChefHat,
  Circle,
  X,
  FolderPlus,
  LayoutDashboard,
  LogOut,
  Sparkles,
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
  },
  {
    to: "/manager/add-food",
    label: "Food Library",
    description: "Dishes, filters, recipes",
    icon: UtensilsCrossed,
  },
];

function ManagerSidebar({ isOpen = false, onClose }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    onClose?.();
    navigate("/", { replace: true });
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[min(84vw,320px)] shrink-0 flex-col border-r border-stone-200 bg-[#f8f5ef] p-4 shadow-2xl shadow-stone-950/20 transition-transform duration-300 lg:sticky lg:top-0 lg:z-auto lg:w-80 lg:translate-x-0 lg:shadow-none ${
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

      <div className="relative overflow-hidden rounded-lg border border-[#7F1D1D]/20 bg-gradient-to-br from-[#7F1D1D] via-[#9F3434] to-[#DAB2A2] p-5 text-white shadow-xl shadow-[#7F1D1D]/20">
        <div className="absolute inset-x-0 top-0 h-1 bg-white/35" />
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-white/15 shadow-lg shadow-black/10 transition duration-200 hover:scale-110">
            <ChefHat size={25} />
          </div>

          <div>
            <h1 className="text-2xl font-black leading-none">Big-4</h1>
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-white/70">
              Manager Workspace
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-white/15 bg-white/15 p-3 backdrop-blur">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-emerald-100">
            <Circle size={8} fill="currentColor" />
            Live menu ops
          </div>
          <p className="mt-2 text-sm leading-5 text-white/75">
            Build, polish, and keep the menu ready for service.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <p className="px-3 text-xs font-black uppercase tracking-wide text-stone-400">
          Navigation
        </p>

        <nav className="mt-3 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-lg border px-3 py-3 transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    isActive
                      ? "border-[#7F1D1D]/20 bg-white text-stone-950 shadow-lg shadow-[#7F1D1D]/10"
                      : "border-transparent text-stone-600 hover:border-stone-200 hover:bg-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`absolute left-0 top-3 h-10 w-1 rounded-r-full transition duration-200 ${
                        isActive ? "bg-[#7F1D1D]" : "bg-transparent"
                      }`}
                    />
                    <span
                      className={`grid h-11 w-11 place-items-center rounded-lg transition duration-200 group-hover:scale-110 ${
                        isActive
                          ? "bg-[#7F1D1D] text-white shadow-lg shadow-[#7F1D1D]/20"
                          : "bg-stone-100 text-stone-500 group-hover:bg-[#f4e7dc] group-hover:text-[#7F1D1D]"
                      }`}
                    >
                      <Icon size={20} />
                    </span>

                    <span className="min-w-0">
                      <span className="block text-sm font-black">
                        {item.label}
                      </span>
                      <span
                        className={`block truncate text-xs font-semibold ${
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

      <div className="mt-auto space-y-3">
        <div className="overflow-hidden rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="mb-3 flex items-center gap-2 text-sm font-black">
            <Sparkles size={17} className="text-amber-600" />
            Next up
          </div>
          <p className="text-sm leading-6 text-amber-800">
            Modifier groups are visually prepared and ready for backend wiring.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-lg border border-rose-200 bg-white px-4 py-3 text-left text-rose-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50 hover:shadow-md active:translate-y-0"
        >
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-rose-50 text-rose-600 transition duration-200 group-hover:scale-110 group-hover:bg-rose-600 group-hover:text-white">
            <LogOut size={19} />
          </span>
          <span>
            <span className="block text-sm font-black">Logout</span>
            <span className="text-xs font-semibold text-rose-400">
              End manager session
            </span>
          </span>
        </button>
      </div>
    </aside>
  );
}

export default ManagerSidebar;
