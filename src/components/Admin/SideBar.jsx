import {
    CheckCircle2,
    LayoutDashboard,
    UtensilsCrossed,
    Users,
    UsersRound,
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
    MessageSquareText,
    BadgePercent,
    Globe2,
} from "lucide-react";

import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import api from "../../API/axios";
import BrandLogo from "../Shared/BrandLogo";
import PermissionToast from "../Shared/PermissionToast";
import { useTheme } from "../../context/ThemeContext";
import { ROLE_IDS, clearSession, getStoredUser, storeUser } from "../../utils/auth";
import {
    getAssignedPermissionKeys,
    normalizePermissionKey,
    getUserPermissions,
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
    const directRestaurantId =
        user?.restaurant_id ??
        user?.restaurant?.id ??
        user?.manager?.restaurant_id ??
        user?.manager?.restaurant?.id ??
        user?.employee?.restaurant_id ??
        user?.employee?.restaurant?.id;

    if (directRestaurantId) return directRestaurantId;

    const permissionRestaurant = [
        ...(Array.isArray(user?.user_permissions) ? user.user_permissions : []),
        ...(Array.isArray(user?.userPermissions) ? user.userPermissions : []),
        ...(Array.isArray(user?.permissions) ? user.permissions : []),
    ].find(
        (permission) =>
            permission?.pivot?.restaurant_id ||
            permission?.restaurant_id ||
            permission?.restaurant?.id
    );

    return (
        permissionRestaurant?.pivot?.restaurant_id ??
        permissionRestaurant?.restaurant_id ??
        permissionRestaurant?.restaurant?.id ??
        null
    );
}

function SideBar({
    isOpen,
    onClose,
    isCollapsed = false,
    width = 320,
    isResizing = false,
    onResizeStart,
    onResizeReset,
}) {
    const { isLight } = useTheme();
    const navigate = useNavigate();
    const [sessionUser, setSessionUser] = useState(() => getStoredUser());
    const [permissions, setPermissions] = useState(() => getUserPermissions());
    const [assignedPermissions, setAssignedPermissions] = useState(() =>
        getAssignedPermissionKeys(getStoredUser())
    );
    const [permissionMessage, setPermissionMessage] = useState("");
    const [restaurantName, setRestaurantName] = useState(() =>
        getRestaurantLabel(getStoredUser())
    );
    const isAdmin = Number(sessionUser?.role_id ?? sessionUser?.role?.id) === ROLE_IDS.ADMIN;
    const isManager = Number(sessionUser?.role_id ?? sessionUser?.role?.id) === ROLE_IDS.MANAGER;
    const restaurantId = getRestaurantId(sessionUser);
    const roleName = sessionUser?.role?.name || "Workspace";
    const restaurantLabel = restaurantName || getRestaurantLabel(sessionUser);
    const workspaceLabel = restaurantLabel
        ? `${roleName} · ${restaurantLabel}`
        : roleName;
    const restaurantStaffPermissions = [
        "manage_restaurant_staff",
        "view_restaurant_staff",
        "list_staff_user_restaurant",
        "list_staff_users_restaurant",
        "List-staff-User-restaurant",
        "Manage Restaurant Staff",
    ];

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
            permissions: ["manage_restaurants"],
            adminOnly: true,
        },
        {
            icon: Users,
            title: "Employees",
            path: "/employee",
            permissions: ["manage_users"],
        },
        {
            icon: UsersRound,
            title: "Restaurant Staff",
            path: "/restaurant-staff",
            permissions: restaurantStaffPermissions,
        },
        {
            icon: CalendarDays,
            title: "Manage Employee Shifts",
            path: "/employee-shifts",
            permissions: [
                "manage_employee_shifts",
                "Manage Employee Shifts",
                "manage_global_employee_shifts",
                "Manage Global Employee Shifts",
            ],
            restaurantScopedPermissions: [
                "manage_employee_shifts",
                "Manage Employee Shifts",
            ],
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
            permissions: ["serve_dine_in_orders"],
        },
        {
            icon: LayoutDashboard,
            title: "Reports",
            path: "/reports",
            permissions: ["view_reports", "view_global_reports"],
        },
        {
            icon: ReceiptText,
            title: isAdmin ? "Global Invoices" : "View Global Invoice",
            path: isAdmin ? "/global-invoices" : "/manager/global-invoices",
            permissions: [
                "view_global_invoices",
                "view_global_invoice",
                "global_invoice",
                "global_invoices",
                "View Global Invoices",
                "View Global Invoice",
            ],
        },
        {
            icon: ReceiptText,
            title: "View Invoices",
            path: isAdmin ? "/invoices" : "/manager/invoices",
            permissions: [
                "view_invoices",
                "view_invoice",
                "View Invoices",
                "View Invoice",
            ],
            managerOnly: !isAdmin,
        },
        {
            icon: MessageSquareText,
            title: "Delivery Reviews",
            path: "/delivery-reviews",
            permissions: ["view_delivery_review", "view_delivery_reviews", "view_deivery_review"],
        },
        {
            icon: Globe2,
            title: "Global Loyalty Settings",
            path: "/global-loyalty-settings",
            permissions: ["manage_global_loyalty_settings"],
            adminOnly: true,
        },
        {
            icon: BadgePercent,
            title: "Loyalty Settings",
            path: "/loyalty-settings",
            permissions: ["manage_loyalty_settings"],
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

                storeUser(user, res.data);
                const nextUser = getStoredUser() || user;
                setSessionUser(nextUser);
                setRestaurantName(getRestaurantLabel(nextUser));
                setPermissions(getUserPermissions());
                setAssignedPermissions(getAssignedPermissionKeys(nextUser));
            } catch (error) {
                console.log(error.response?.data || error);
            }
        };

        refreshPermissions();

        const handleFocus = () => refreshPermissions();
        const handleVisibilityChange = () => {
            if (!document.hidden) refreshPermissions();
        };

        window.addEventListener("focus", handleFocus);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
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

    const hasPermission = (permissionList, permission) => {
        const normalizedPermission = normalizePermissionKey(permission);

        return permissionList.some(
            (assignedPermission) =>
                normalizePermissionKey(assignedPermission) === normalizedPermission
        );
    };
    const canShow = (requiredPermissions = []) =>
        !requiredPermissions.length ||
        requiredPermissions.some((permission) =>
            hasPermission(permissions, permission)
        );
    const isAssigned = (requiredPermissions = []) =>
        !requiredPermissions.length ||
        requiredPermissions.some((permission) =>
            hasPermission(assignedPermissions, permission)
        );
    const canShowMenuItem = (item) => {
        const restaurantScopedPermissions = item.restaurantScopedPermissions || [];
        const availablePermissions = restaurantId || isAdmin
            ? item.permissions
            : item.permissions?.filter(
                  (permission) =>
                      !restaurantScopedPermissions.some(
                          (scopedPermission) =>
                              normalizePermissionKey(scopedPermission) ===
                              normalizePermissionKey(permission)
                      )
              );

        return (
            (!item.adminOnly || isAdmin) &&
            (!item.managerOnly || isManager) &&
            (!item.requiresRestaurant || restaurantId) &&
            (canShow(availablePermissions) || isAssigned(availablePermissions))
        );
    };
    const isBlockedByAdmin = (item) =>
        item.permissions?.length &&
        !canShow(item.permissions) &&
        isAssigned(item.permissions);
    const handleMenuClick = (event, item) => {
        if (!isBlockedByAdmin(item)) {
            onClose?.();
            return;
        }

        event.preventDefault();
        setPermissionMessage("An admin removed this task from your account.");
        onClose?.();
    };
    const visibleMenu = menu.filter((item) =>
        canShowMenuItem(item)
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

            <PermissionToast
                message={permissionMessage}
                onClose={() => setPermissionMessage("")}
            />

            <aside
                style={{ "--sidebar-width": isCollapsed ? "92px" : `${width}px` }}
                className={`fixed left-0 top-0 z-50 flex h-dvh w-[286px] flex-col border-r border-white/10 bg-[#1f1f1f] shadow-[18px_0_45px_rgba(0,0,0,0.28)] ${isResizing ? "transition-transform" : "transition-[width,transform] duration-300"} lg:sticky lg:w-[var(--sidebar-width)] lg:translate-x-0 lg:shadow-none ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                {!isCollapsed && (
                    <button
                        type="button"
                        aria-label="Resize sidebar"
                        title="Drag to resize sidebar. Double-click to reset."
                        onPointerDown={onResizeStart}
                        onDoubleClick={onResizeReset}
                        className={`absolute -right-1.5 top-0 z-20 hidden h-full w-3 cursor-ew-resize touch-none items-center justify-center lg:flex ${
                            isResizing ? "bg-[#D7B52F]/16" : "bg-transparent"
                        }`}
                    >
                        <span
                            className={`h-16 w-1 rounded-full transition ${
                                isResizing
                                    ? "bg-[#D7B52F]"
                                    : isLight
                                        ? "bg-[#D8A22D]/35 hover:bg-[#D8A22D]/75"
                                        : "bg-white/12 hover:bg-[#D7B52F]/75"
                            }`}
                        />
                    </button>
                )}

                <button
                    type="button"
                    aria-label="Close menu"
                    onClick={onClose}
                    className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl text-white/60 transition hover:bg-white/10 hover:text-white active:scale-95 lg:hidden"
                >
                    <X size={20} />
                </button>

                <div className={`${isCollapsed ? "lg:px-3" : ""} px-5 pb-3 pt-7`}>
                    <div className={`flex items-center gap-3.5 ${isCollapsed ? "lg:justify-center" : ""}`}>
                        <BrandLogo className="h-[52px] w-[52px]" rounded="rounded-[7px]" />
                        <div className={`min-w-0 ${isCollapsed ? "lg:hidden" : ""}`}>
                            <h1
                                className={`truncate pb-0.5 font-merriweather text-3xl font-black leading-none ${
                                    isLight ? "text-[#D8A22D]" : "text-[#f2d35b]"
                                }`}
                            >
                                Big-4
                            </h1>
                            <p
                                className={`mt-1 truncate text-xs font-black uppercase tracking-[0.18em] ${
                                    isLight ? "text-[#2F2520]" : "text-white"
                                }`}
                            >
                                Restaurant System
                            </p>
                        </div>
                    </div>
                </div>

                <div
                    className={`mx-5 mt-5 overflow-hidden rounded-2xl border px-3 py-3 shadow-[0_14px_30px_rgba(0,0,0,0.10)] ${
                        isLight
                            ? "border-[#E8D8C8] border-l-[#D8A22D] border-l-4 bg-white/58 shadow-[0_14px_30px_rgba(70,45,30,0.07)]"
                            : "border-[#2D2924] border-l-[#d7b52f] border-l-4 bg-[#151515] ring-1 ring-white/[0.06]"
                    } ${isCollapsed ? "lg:hidden" : ""}`}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${
                                isLight
                                    ? "border-[#E8C567]/45 bg-[#FFF4DA] text-[#8F5F00]"
                                    : "border-[#d7b52f]/20 bg-[#d7b52f]/12 text-[#d7b52f]"
                            }`}
                        >
                            <Flame size={18} />
                        </div>
                        <div className="min-w-0 leading-tight">
                            <p
                                className={`truncate text-sm font-black capitalize ${
                                    isLight ? "text-[#241815]" : "text-white"
                                }`}
                            >
                                {workspaceLabel}
                            </p>
                            <p
                                className={`mt-1 text-[11px] font-bold uppercase tracking-wide ${
                                    isLight ? "text-[#7A6A64]" : "text-white/45"
                                }`}
                            >
                                {visibleMenu.length} sections
                            </p>
                        </div>
                    </div>
                </div>

                <nav className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-8">
                    <div className={`mb-4 flex items-center justify-between px-0 ${isCollapsed ? "lg:hidden" : ""}`}>
                        <p className="text-[12px] font-semibold uppercase tracking-[0.34em] text-[#81786d]">
                            Workspace
                        </p>
                        <span className="rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1 text-[11px] font-black text-[#d7b52f] shadow-sm">
                            {visibleMenu.length}
                        </span>
                    </div>

                    <div className="space-y-2.5">
                        {visibleMenu.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={(event) => handleMenuClick(event, item)}
                                        title={isCollapsed ? item.title : undefined}
                                        className={({ isActive }) =>
                                            `group relative flex h-[50px] items-center gap-3 rounded-[8px] border px-4 text-sm font-semibold transition duration-200 active:scale-[0.99] ${isCollapsed ? "lg:justify-center lg:px-0" : ""} ${
                                                isActive
                                                    ? isLight
                                                        ? "border-[#d7b52f]/45 bg-[#d7b52f] !text-[#16120a] shadow-[0_12px_26px_rgba(215,181,47,0.12)]"
                                                        : "border-[#d7b52f] bg-[#d7b52f] !text-[#16120a] shadow-[0_12px_26px_rgba(215,181,47,0.16)]"
                                                    : isLight
                                                        ? "border-transparent !text-[#6B5A52] hover:border-[#7F1D1D]/25 hover:bg-[#FFF4EA] hover:!text-[#241815]"
                                                        : "border-transparent !text-[#e6dfd4] hover:border-white/10 hover:bg-white/[0.06] hover:!text-white"
                                            }`
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <span
                                                    className="hidden"
                                                />
                                                <span
                                                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-md transition ${
                                                        isActive
                                                            ? "bg-transparent text-[#16120a]"
                                                            : isLight
                                                                ? "bg-[#FFF9F2] text-[#B17400] ring-1 ring-[#E4CFC3] group-hover:bg-[#FFF4EA] group-hover:text-[#8f5f00]"
                                                                : "bg-transparent text-[#e1d6c6] group-hover:text-[#d7b52f]"
                                                    }`}
                                                >
                                                    <Icon size={18} />
                                                </span>
                                                <span
                                                    className={`min-w-0 truncate ${
                                                        isActive
                                                            ? "!text-[#16120a]"
                                                            : isLight ? "!text-[#6B5A52] group-hover:!text-[#241815]" : "!text-[#e6dfd4] group-hover:!text-white"
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

                <div className={`border-t border-white/10 bg-transparent p-5 ${isCollapsed ? "lg:px-3" : ""}`}>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className={`admin-logout-button flex h-14 w-full items-center justify-center gap-3 rounded-[8px] border border-[#7F1D1D] bg-[#7F1D1D] text-sm font-black tracking-[0.12em] !text-white shadow-[0_12px_26px_rgba(127,29,29,0.28)] transition hover:-translate-y-0.5 hover:bg-[#681718] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${isCollapsed ? "lg:px-0" : ""}`}
                        title={isCollapsed ? "Logout" : undefined}
                    >
                        <LogOut size={18} className="!text-white" />
                        <span className={`${isCollapsed ? "lg:hidden" : ""} !text-white`}>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

export default SideBar;
