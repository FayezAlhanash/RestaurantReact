import {
    CheckCircle2,
    LayoutDashboard,
    UtensilsCrossed,
    Users,
    UserCog,
    ShieldCheck,
    Table,
    LogOut,
    ReceiptText,
    ClipboardList,
    ChefHat,
    CalendarDays,
    FolderPlus,
    Package,
    TriangleAlert,
    X,
    Store,
    Flame,
} from "lucide-react";

import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import api from "../../API/axios";
import BrandLogo from "../Shared/BrandLogo";
import { useTheme } from "../../context/ThemeContext";
import { ROLE_IDS, clearSession, getStoredUser, storeUser } from "../../utils/auth";
import {
    getProfileUserPermissions,
    getUserPermissions,
    toPermissionKeys,
} from "../../utils/permissions";

function getRestaurantLabel(user) {
    const restaurant =
        user?.restaurant ??
        user?.manager?.restaurant ??
        user?.employee?.restaurant ??
        null;
    const restaurantName =
        restaurant?.name ??
        user?.restaurant_name ??
        user?.restaurantName ??
        user?.manager?.restaurant_name ??
        user?.employee?.restaurant_name ??
        "";

    if (restaurantName) return restaurantName;

    return "";
}

function getRestaurantId(user) {
    return (
        user?.restaurant_id ??
        user?.restaurant?.id ??
        user?.manager?.restaurant_id ??
        user?.manager?.restaurant?.id ??
        user?.employee?.restaurant_id ??
        user?.employee?.restaurant?.id ??
        null
    );
}

function SideBar({ isOpen, onClose, isCollapsed = false }) {
    const { isLight } = useTheme();
    const navigate = useNavigate();
    const [sessionUser, setSessionUser] = useState(() => getStoredUser());
    const [permissions, setPermissions] = useState(() => getUserPermissions());
    const [restaurantName, setRestaurantName] = useState(() =>
        getRestaurantLabel(getStoredUser())
    );
    const isAdmin = Number(sessionUser?.role_id ?? sessionUser?.role?.id) === ROLE_IDS.ADMIN;
    const roleName = sessionUser?.role?.name || "Workspace";
    const restaurantLabel = restaurantName || getRestaurantLabel(sessionUser);
    const workspaceLabel = restaurantLabel
        ? `${roleName} · ${restaurantLabel}`
        : roleName;

    const menu = [
        {
            icon: LayoutDashboard,
            title: "Dashboard",
            path: "/dashboard",
            adminOnly: true,
        },
        {
            icon: FolderPlus,
            title: "Menu Builder",
            path: "/add-menu",
            permissions: ["manage_menu"],
        },
        {
            icon: UtensilsCrossed,
            title: "Food Library",
            path: "/add-food",
            permissions: ["manage_menu"],
        },
        {
            icon: Package,
            title: "Recipes",
            path: "/ingredients",
            permissions: ["view_recipes", "manage_recipes"],
        },
        {
            icon: Store,
            title: "Restaurants",
            path: "/restaurants",
            permissions: ["manage_restaurants", "monitor_restaurant"],
            adminOnly: true,
        },
        {
            icon: Users,
            title: "Employees",
            path: "/employee",
            permissions: ["manage_users"],
        },
        {
            icon: CalendarDays,
            title: "Manage Employee Shifts",
            path: "/employee-shifts",
            permissions: ["manage_employee_shifts", "manage_users"],
        },
        {
            icon: UserCog,
            title: "User Permissions",
            path: "/user-permissions",
            permissions: ["manage_permissions"],
        },
        {
            icon: ShieldCheck,
            title: "Roles",
            path: "/roles",
            permissions: ["manage_roles", "manage_permissions"],
        },
        {
            icon: Table,
            title: "Tables",
            path: "/tables",
            permissions: ["manage_tables"],
        },
        {
            icon: Package,
            title: "Inventory",
            path: "/inventory",
            permissions: ["monitor_inventory", "manage_inventory"],
        },
        {
            icon: ClipboardList,
            title: "Stock Actions",
            path: "/stock-actions",
            permissions: ["monitor_inventory", "manage_inventory"],
        },
        {
            icon: TriangleAlert,
            title: "Low Stock",
            path: "/low-stock",
            permissions: ["monitor_inventory", "manage_inventory"],
        },
        {
            icon: ReceiptText,
            title: "Cashier Dashboard",
            path: "/takeaway-orders",
            permissions: ["manage_takeaway_orders"],
        },
        {
            icon: ChefHat,
            title: "Kitchen Orders",
            path: "/kitchen-orders",
            permissions: ["manage_kitchen_orders"],
        },
        {
            icon: CheckCircle2,
            title: "Dine-in Service",
            path: "/dine-in-service",
            permissions: ["serve_dine_in_orders", "process_payments"],
        },
        {
            icon: LayoutDashboard,
            title: "Reports",
            path: "/reports",
            permissions: ["view_reports", "view_global_reports"],
        },
    ];

    const handleLogout = () => {
        clearSession();
        navigate("/", { replace: true });
    };

    useEffect(() => {
        const refreshPermissions = async () => {
            const user = getStoredUser();

            if (!user) return;

            try {
                const res = await api.get("/profile/permissions");
                const userPermissions = getProfileUserPermissions(res.data);
                const nextPermissions = toPermissionKeys(userPermissions);

                storeUser(user, res.data);
                const nextUser = getStoredUser() || user;
                setSessionUser(nextUser);
                setRestaurantName(getRestaurantLabel(nextUser));
                setPermissions(nextPermissions);
            } catch (error) {
                console.log(error.response?.data || error);
            }
        };

        refreshPermissions();
    }, []);

    useEffect(() => {
        const restaurantId = getRestaurantId(sessionUser);

        if (restaurantLabel || !restaurantId) return;

        const fetchRestaurantName = async () => {
            try {
                const res = await api.get(`/restaurants/${restaurantId}`);
                const restaurant =
                    res.data?.restaurant ??
                    res.data?.data?.restaurant ??
                    res.data?.data ??
                    res.data;
                const name = restaurant?.name;

                if (name) {
                    setRestaurantName(name);
                    setSessionUser((currentUser) => ({
                        ...currentUser,
                        restaurant: {
                            ...(currentUser?.restaurant || {}),
                            ...restaurant,
                            id: restaurant?.id ?? restaurantId,
                            name,
                        },
                        restaurant_id: restaurant?.id ?? restaurantId,
                    }));
                }
            } catch (error) {
                console.log(error.response?.data || error);
            }
        };

        fetchRestaurantName();
    }, [restaurantLabel, sessionUser]);

    const canShow = (requiredPermissions = []) =>
        !requiredPermissions.length ||
        requiredPermissions.some((permission) => permissions.includes(permission));
    const visibleMenu = menu.filter((item) =>
        (!item.adminOnly || isAdmin) && canShow(item.permissions)
    );

    return (
        <>
            {isOpen && (
                <button
                    type="button"
                    aria-label="Close menu"
                    onClick={onClose}
                    className="fixed inset-0 z-40 bg-[#241F1D]/35 backdrop-blur-[2px] lg:hidden"
                />
            )}

            <aside
                className={`fixed left-0 top-0 z-50 flex h-dvh w-[286px] flex-col border-r border-white/10 bg-[#101517] shadow-[18px_0_45px_rgba(0,0,0,0.28)] transition-[width,transform] duration-300 lg:sticky ${isCollapsed ? "lg:w-[92px]" : "lg:w-[300px]"} lg:translate-x-0 lg:shadow-none ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <button
                    type="button"
                    aria-label="Close menu"
                    onClick={onClose}
                    className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl text-white/60 transition hover:bg-white/10 hover:text-white active:scale-95 lg:hidden"
                >
                    <X size={20} />
                </button>

                <div className={`${isCollapsed ? "lg:px-3" : ""} px-4 pb-3 pt-5`}>
                    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(185,28,28,0.24),transparent_34%),linear-gradient(135deg,#171D20,#26181B)] text-white shadow-[0_18px_42px_rgba(0,0,0,0.24)] transition hover:scale-[1.02]">
                        <div className="absolute inset-x-0 top-0 h-1 bg-[#7F1D1D]" />

                        <div className={`${isCollapsed ? "lg:px-2 lg:pb-3 lg:pt-5" : ""} px-4 pb-4 pt-5`}>
                            <div className={`flex items-center gap-3 ${isCollapsed ? "lg:justify-center" : ""}`}>
                                <BrandLogo className="h-11 w-11" />
                                <div className={`min-w-0 ${isCollapsed ? "lg:hidden" : ""}`}>
                                    <h1 className="truncate pb-0.5 text-2xl font-black leading-tight">
                                        Big-4
                                    </h1>
                                    <p className="mt-1 truncate text-[11px] font-black uppercase tracking-[0.16em] text-white/55">
                                        Restaurant ops
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className={`border-t border-white/10 bg-white/[0.06] px-4 py-3 ${isCollapsed ? "lg:hidden" : ""}`}>
                            <div className="flex items-center justify-between gap-3 text-sm">
                                <div className="min-w-0 leading-tight">
                                    <p className="truncate font-black capitalize text-white">
                                        {workspaceLabel}
                                    </p>
                                    <p className="mt-1 text-xs font-bold text-white/50">
                                        {visibleMenu.length} available sections
                                    </p>
                                </div>
                                <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-[#FFD166] ring-1 ring-white/10">
                                    <Flame size={17} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-2">
                    <div className={`mb-3 flex items-center justify-between px-3 ${isCollapsed ? "lg:hidden" : ""}`}>
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#FFD166]/80">
                            Workspace
                        </p>
                        <span className="rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1 text-[11px] font-black text-[#FFD166] shadow-sm">
                            {visibleMenu.length}
                        </span>
                    </div>

                    <div className="space-y-2">
                        {visibleMenu.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={onClose}
                                        title={isCollapsed ? item.title : undefined}
                                        className={({ isActive }) =>
                                            `group relative flex h-12 items-center gap-3 rounded-xl border px-3 text-sm font-black transition duration-200 hover:scale-[1.03] active:scale-[0.99] ${isCollapsed ? "lg:justify-center lg:px-0" : ""} ${
                                                isActive
                                                    ? isLight
                                                        ? "border-[#7F1D1D]/40 bg-[#7F1D1D]/10 !text-[#241815] shadow-[0_12px_26px_rgba(127,29,29,0.12)]"
                                                        : "border-[#7F1D1D]/40 bg-[#7F1D1D]/16 !text-white shadow-[0_12px_26px_rgba(127,29,29,0.16)]"
                                                    : isLight
                                                        ? "border-transparent !text-[#6B5A52] hover:border-[#7F1D1D]/25 hover:bg-[#FFF4EA] hover:!text-[#241815]"
                                                        : "border-transparent !text-white hover:border-white/10 hover:bg-white/[0.07] hover:!text-white"
                                            }`
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <span
                                                    className={`absolute left-0 top-3 h-6 w-1 rounded-r-full transition ${
                                                        isActive ? "bg-[#7F1D1D]" : "bg-transparent"
                                                    }`}
                                                />
                                                <span
                                                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-md transition ${
                                                        isActive
                                                            ? "bg-[#7F1D1D] text-white shadow-sm"
                                                            : isLight
                                                                ? "bg-[#FFF9F2] text-[#B17400] ring-1 ring-[#E4CFC3] group-hover:bg-[#FFF4EA] group-hover:text-[#8f5f00]"
                                                                : "bg-white/[0.06] text-white/45 ring-1 ring-white/10 group-hover:bg-white/10 group-hover:text-[#FFD166]"
                                                    }`}
                                                >
                                                    <Icon size={18} />
                                                </span>
                                                <span
                                                    className={`min-w-0 truncate ${
                                                        isActive
                                                            ? isLight ? "!text-[#241815]" : "!text-white"
                                                            : isLight ? "!text-[#6B5A52] group-hover:!text-[#241815]" : "!text-white/90 group-hover:!text-white"
                                                    } ${isCollapsed ? "lg:hidden" : ""}`}
                                                >
                                                    {item.title}
                                                </span>
                                            </>
                                        )}
                                    </NavLink>
                                );
                            })}

                        {!visibleMenu.length && (
                            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.05] p-5 text-center shadow-sm">
                                <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[#7F1D1D]/18 text-[#7F1D1D]">
                                    <ShieldCheck size={20} />
                                </div>
                                <p className="mt-3 text-sm font-black text-white">
                                    No tasks yet
                                </p>
                                <p className="mt-1 text-xs font-semibold leading-5 text-white/50">
                                    Assigned permissions will appear here automatically.
                                </p>
                            </div>
                        )}
                    </div>
                </nav>

                <div className={`border-t border-white/10 bg-white/[0.03] p-4 ${isCollapsed ? "lg:px-3" : ""}`}>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className={`flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#7F1D1D]/70 bg-[#7F1D1D] text-sm font-black text-white shadow-[0_12px_26px_rgba(127,29,29,0.30)] transition hover:-translate-y-0.5 hover:scale-[1.03] hover:border-[#681718] hover:bg-[#681718] hover:shadow-[0_16px_32px_rgba(127,29,29,0.34)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${isCollapsed ? "lg:px-0" : ""}`}
                        title={isCollapsed ? "Logout" : undefined}
                    >
                        <LogOut size={18} />
                        <span className={isCollapsed ? "lg:hidden" : ""}>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

export default SideBar;
