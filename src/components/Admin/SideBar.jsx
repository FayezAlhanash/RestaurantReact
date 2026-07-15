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
    Package,
    TriangleAlert,
    X,
} from "lucide-react";

import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import api from "../../API/axios";
import { clearSession, getStoredUser, storeUser } from "../../utils/auth";
import {
    getProfileUserPermissions,
    getUserPermissions,
    toPermissionKeys,
} from "../../utils/permissions";

function SideBar({ isOpen, onClose }) {
    const navigate = useNavigate();
    const [permissions, setPermissions] = useState(() => getUserPermissions());

    const menu = [
        {
            icon: LayoutDashboard,
            title: "Dashboard",
            path: "/dashboard",
        },
        {
            icon: UtensilsCrossed,
            title: "Restaurants",
            path: "/restaurants",
            permissions: ["manage_restaurants"],
        },
        {
            icon: Users,
            title: "Employees",
            path: "/employee",
            permissions: ["manage_users"],
        },
        {
            icon: UserCog,
            title: "User Permissions",
            path: "/user-permissions",
            permissions: ["manage_permissions", "manage_users"],
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
            permissions: ["monitor_inventory"],
        },
        {
            icon: ClipboardList,
            title: "Stock Actions",
            path: "/stock-actions",
            permissions: ["monitor_inventory"],
        },
        {
            icon: TriangleAlert,
            title: "Low Stock",
            path: "/low-stock",
            permissions: ["monitor_inventory"],
        },
        {
            icon: ReceiptText,
            title: "Takeaway Orders",
            path: "/takeaway-orders",
            permissions: ["manage_takeaway_orders"],
        },
        {
            icon: CheckCircle2,
            title: "Dine-in Service",
            path: "/dine-in-service",
            permissions: ["serve_dine_in_orders", "process_payments"],
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
                if (nextPermissions.length) {
                    setPermissions(nextPermissions);
                }
            } catch (error) {
                console.log(error.response?.data || error);
            }
        };

        refreshPermissions();
    }, []);

    const canShow = (requiredPermissions = []) =>
        !requiredPermissions.length ||
        requiredPermissions.some((permission) => permissions.includes(permission));

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
                className={`fixed left-0 top-0 z-50 flex h-dvh w-[278px] flex-col border-r border-[#E2D6CF] bg-[#FFFDFB] shadow-[18px_0_45px_rgba(70,45,30,0.08)] transition-transform duration-300 lg:sticky lg:w-[292px] lg:translate-x-0 lg:shadow-none ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <button
                    type="button"
                    aria-label="Close menu"
                    onClick={onClose}
                    className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl text-[#7A6A64] transition hover:bg-[#F6F1EA] hover:text-[#7F1D1D] lg:hidden"
                >
                    <X size={20} />
                </button>

                <div className="border-b border-[#EDE3DD] px-5 py-6">
                    <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#7F1D1D] text-base font-black text-white shadow-[0_12px_24px_rgba(127,29,29,0.16)]">
                            B4
                        </div>
                        <div className="min-w-0">
                            <h1 className="truncate text-xl font-black tracking-normal text-[#241F1D]">
                                Big-4 Admin
                            </h1>
                            <p className="truncate text-xs font-bold uppercase tracking-[0.16em] text-[#9A7A70]">
                                Control center
                            </p>
                        </div>
                    </div>
                </div>

                <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
                    <p className="mb-3 px-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#B39D93]">
                        Manage
                    </p>

                    <div className="space-y-1.5">
                        {menu
                            .filter((item) => canShow(item.permissions))
                            .map((item) => {
                                const Icon = item.icon;

                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={onClose}
                                        className={({ isActive }) =>
                                            `group flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-black transition ${
                                                isActive
                                                    ? "bg-[#F9ECEC] text-[#7F1D1D] shadow-sm ring-1 ring-[#EBCBCB]"
                                                    : "text-[#675853] hover:bg-[#F8F3EF] hover:text-[#241F1D]"
                                            }`
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <span
                                                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition ${
                                                        isActive
                                                            ? "bg-[#7F1D1D] text-white"
                                                            : "bg-white text-[#8A7972] ring-1 ring-[#EFE5DF] group-hover:text-[#7F1D1D]"
                                                    }`}
                                                >
                                                    <Icon size={18} />
                                                </span>
                                                <span className="min-w-0 truncate">
                                                    {item.title}
                                                </span>
                                            </>
                                        )}
                                    </NavLink>
                                );
                            })}
                    </div>
                </nav>

                <div className="border-t border-[#EDE3DD] p-4">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-red-100 bg-red-50 text-sm font-black text-red-700 transition hover:border-red-200 hover:bg-red-100"
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

export default SideBar;
