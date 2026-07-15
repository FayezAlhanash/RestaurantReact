import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
    BarChart3,
    CheckCircle2,
    ClipboardList,
    Flame,
    LayoutDashboard,
    LogOut,
    Menu,
    Package,
    Tags,
    TriangleAlert,
    Utensils,
    UtensilsCrossed,
    X,
} from "lucide-react";
import api from "../../API/axios";
import { clearSession, getStoredUser, storeUser } from "../../utils/auth";
import {
    getProfileUserPermissions,
    getUserPermissions,
    toPermissionKeys,
} from "../../utils/permissions";

const navItems = [
    {
        to: "/kitchen/dashboard",
        label: "Kitchen Queue",
        description: "Active preparation orders",
        icon: LayoutDashboard,
        permissions: ["manage_kitchen_orders"],
    },
    {
        to: "/kitchen/takeaway-orders",
        label: "Takeaway Orders",
        description: "Menu, catalog, orders",
        icon: ClipboardList,
        permissions: ["manage_takeaway_orders"],
    },
    {
        to: "/kitchen/dine-in-service",
        label: "Dine-in Service",
        description: "Serve orders and cash",
        icon: CheckCircle2,
        permissions: ["serve_dine_in_orders", "process_payments"],
    },
    {
        to: "/kitchen/add-menu",
        label: "Menu Builder",
        description: "Categories and modifiers",
        icon: Tags,
        permissions: ["manage_menu"],
    },
    {
        to: "/kitchen/add-food",
        label: "Food Library",
        description: "Dishes and menu items",
        icon: UtensilsCrossed,
        permissions: ["manage_menu"],
    },
    {
        to: "/kitchen/ingredients",
        label: "Recipes",
        description: "Food ingredient links",
        icon: Package,
        permissions: ["view_recipes", "manage_recipes"],
    },
    {
        to: "/kitchen/inventory",
        label: "Inventory",
        description: "Ingredients and levels",
        icon: Package,
        permissions: ["monitor_inventory"],
    },
    {
        to: "/kitchen/stock-actions",
        label: "Stock Actions",
        description: "Refill, adjust, waste",
        icon: ClipboardList,
        permissions: ["monitor_inventory"],
    },
    {
        to: "/kitchen/low-stock",
        label: "Low Stock",
        description: "Inventory alerts",
        icon: TriangleAlert,
        permissions: ["monitor_inventory"],
    },
    {
        to: "/kitchen/reports",
        label: "Reports",
        description: "Restaurant performance",
        icon: BarChart3,
        permissions: ["view_reports"],
    },
];

function KitchenSidebar({ isOpen, onClose, permissions = [] }) {
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
            className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(84vw,310px)] shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-[#20262b] p-4 text-[#f5f1eb] shadow-2xl shadow-black/30 transition-transform duration-300 lg:w-80 ${
                isOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
            <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl bg-white/8 text-white transition hover:bg-white/14"
                aria-label="Close kitchen navigation"
            >
                <X size={18} />
            </button>

            <div className="rounded-2xl border border-white/10 bg-[#2b3238] p-4 shadow-xl shadow-black/10">
                <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#7f0710] text-white shadow-lg">
                        <Utensils size={24} />
                    </div>
                    <div className="min-w-0">
                        <h1 className="truncate text-xl font-black">Big-4</h1>
                        <p className="mt-1 text-xs font-extrabold uppercase tracking-wide text-[#bbb4aa]">
                            Kitchen Workspace
                        </p>
                    </div>
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-white/6 p-3">
                    <div className="flex items-center gap-2 text-sm font-black text-[#ffe3cc]">
                        <Flame size={18} />
                        Live prep
                    </div>
                    <p className="mt-1.5 text-sm leading-5 text-[#bbb4aa]">
                        Queue and inventory tasks stay close.
                    </p>
                </div>
            </div>

            <nav className="mt-5 space-y-2">
                {navItems.filter((item) => canShow(item.permissions)).map((item) => {
                    const Icon = item.icon;

                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={onClose}
                            className={({ isActive }) =>
                                `group flex items-center gap-3 rounded-2xl border px-3 py-3 transition ${
                                    isActive
                                        ? "border-[#f8ded8]/20 bg-[#7f0710] text-white shadow-lg shadow-black/15"
                                        : "border-transparent text-[#d5cec4] hover:border-white/10 hover:bg-white/7 hover:text-white"
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <span
                                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition ${
                                            isActive
                                                ? "bg-white/14 text-white"
                                                : "bg-[#2b3238] text-[#bbb4aa] group-hover:text-white"
                                        }`}
                                    >
                                        <Icon size={20} />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-sm font-black">
                                            {item.label}
                                        </span>
                                        <span
                                            className={`block truncate text-xs font-bold ${
                                                isActive ? "text-[#f8ded8]" : "text-[#8f968f]"
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

            <button
                type="button"
                onClick={handleLogout}
                className="mt-auto flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-[#2b3238] px-4 py-3 text-sm font-black text-[#f8ded8] transition hover:bg-[#363c42]"
            >
                <LogOut size={19} />
                Logout
            </button>
        </aside>
    );
}

export default function KitchenLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [permissions, setPermissions] = useState(() => getUserPermissions());
    const location = useLocation();
    const isQueuePage =
        location.pathname === "/kitchen" ||
        location.pathname === "/kitchen/dashboard";

    useEffect(() => {
        const refreshProfile = async () => {
            const user = getStoredUser();

            if (!user) return;

            try {
                const res = await api.get("/profile/permissions");
                const nextPermissions = toPermissionKeys(
                    getProfileUserPermissions(res.data)
                );

                storeUser(user, res.data);
                setPermissions(nextPermissions);
            } catch (error) {
                console.log(error.response?.data || error);
            }
        };

        refreshProfile();

        const handleFocus = () => refreshProfile();
        const handleVisibilityChange = () => {
            if (!document.hidden) refreshProfile();
        };

        window.addEventListener("focus", handleFocus);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    return (
        <div className="min-h-dvh bg-[#1f2326] font-[Raleway] text-[#f5f1eb]">
            {isSidebarOpen && (
                <button
                    type="button"
                    aria-label="Close kitchen navigation"
                    onClick={() => setIsSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm"
                />
            )}

            <KitchenSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                permissions={permissions}
            />

            <div
                className={`min-w-0 flex-1 ${
                    isQueuePage
                        ? ""
                        : "bg-[#f5f2ec] text-stone-950"
                }`}
            >
                <button
                    type="button"
                    onClick={() => setIsSidebarOpen((current) => !current)}
                    className="fixed left-4 top-4 z-40 grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-[#2b3238] text-white shadow-lg transition hover:bg-[#363c42]"
                    aria-label={
                        isSidebarOpen ? "Close kitchen navigation" : "Open kitchen navigation"
                    }
                >
                    {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>

                {isQueuePage ? (
                    <Outlet />
                ) : (
                    <main className="min-h-dvh px-4 py-6 pt-16 text-stone-950 md:px-6 lg:pt-6">
                        <Outlet context={{ search: "" }} />
                    </main>
                )}
            </div>
        </div>
    );
}
