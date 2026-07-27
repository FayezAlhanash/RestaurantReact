import {
    BarChart3,
    CheckCircle2,
    CirclePlus,
    ClipboardList,
    FolderPlus,
    LogOut,
    MessageSquare,
    PackageCheck,
    ReceiptText,
    Store,
    Table,
    TriangleAlert,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { clearSession } from "../../utils/auth";
import { NavLink } from "react-router-dom";


function WarehouseSideBar({ onAdd, stats, permissions = [] }) {
    const navigate = useNavigate();
    const canShow = (requiredPermissions = []) =>
        !requiredPermissions.length ||
        requiredPermissions.some((permission) => permissions.includes(permission));

    const handleLogout = () => {
        clearSession();
        navigate("/", { replace: true });
    };

    return (
        <aside className="border-b border-[#E8D9D3] bg-white lg:flex lg:h-dvh lg:w-[290px] lg:shrink-0 lg:flex-col lg:justify-between lg:border-b-0 lg:border-r">
            <div className="p-4 lg:p-6">
                <div className="flex items-center justify-between gap-4 lg:block">
                    <div>
                        <h1 className="text-3xl font-black text-[#7F1D1D] lg:text-4xl">
                            Big-4
                        </h1>
                        <p className="text-sm font-medium text-[#94847D]">
                            Warehouse System
                        </p>
                    </div>

                    {onAdd && (
                        <button
                            onClick={onAdd}
                            className="flex shrink-0 items-center gap-2 rounded-2xl bg-[#7F1D1D] px-4 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(127,29,29,0.16)] transition hover:bg-[#681718] lg:hidden"
                        >
                            <CirclePlus size={18} />
                            Add
                        </button>
                    )}
                </div>

                <div className="mt-5 rounded-[24px] bg-gradient-to-br from-[#7F1D1D] to-[#4E1515] p-5 text-white shadow-[0_16px_40px_rgba(127,29,29,0.18)]">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">
                                Stock health
                            </p>
                            <h2 className="mt-1 text-2xl font-black">
                                {stats?.healthy || 0}/{stats?.total || 0}
                            </h2>
                        </div>
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/12">
                            <PackageCheck size={24} />
                        </div>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/15">
                        <div
                            className="h-full rounded-full bg-[#F7C948]"
                            style={{
                                width: `${stats?.total ? (stats.healthy / stats.total) * 100 : 0}%`,
                            }}
                        />
                    </div>

                    <p className="mt-3 text-xs font-medium text-white/70">
                        {stats?.lowStock || 0} ingredients need attention.
                    </p>
                </div>

                <nav className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-2 lg:overflow-visible lg:pb-0">

                    <NavLink
                        to="/warehouse/dashboard"
                        className={({ isActive }) =>
                            `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition lg:w-full
            ${isActive
                                ? "bg-[#F9ECEC] text-[#7F1D1D]"
                                : "text-[#74645E] hover:bg-[#F8F5F1] hover:text-[#7F1D1D]"
                            }`
                        }
                    >
                        <BarChart3 size={20} />
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/warehouse/low-stock"
                        className={({ isActive }) =>
                            `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition lg:w-full
            ${isActive
                                ? "bg-[#F9ECEC] text-[#7F1D1D]"
                                : "text-[#74645E] hover:bg-[#F8F5F1] hover:text-[#7F1D1D]"
                            }`
                        }
                    >
                        <TriangleAlert size={20} />
                        Low Stock
                    </NavLink>

                    <NavLink
                        to="/warehouse/actions"
                        className={({ isActive }) =>
                            `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition lg:w-full
            ${isActive
                                ? "bg-[#F9ECEC] text-[#7F1D1D]"
                                : "text-[#74645E] hover:bg-[#F8F5F1] hover:text-[#7F1D1D]"
                            }`
                        }
                    >
                        <ClipboardList size={20} />
                        Stock Actions
                    </NavLink>

                    <NavLink
                        to="/warehouse/chat"
                        className={({ isActive }) =>
                            `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition lg:w-full
            ${isActive
                                ? "bg-[#F9ECEC] text-[#7F1D1D]"
                                : "text-[#74645E] hover:bg-[#F8F5F1] hover:text-[#7F1D1D]"
                            }`
                        }
                    >
                        <MessageSquare size={20} />
                        Manager Chat
                    </NavLink>

                    {canShow(["manage_menu"]) && (
                        <NavLink
                            to="/warehouse/add-menu"
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition lg:w-full
            ${isActive
                                    ? "bg-[#F9ECEC] text-[#7F1D1D]"
                                    : "text-[#74645E] hover:bg-[#F8F5F1] hover:text-[#7F1D1D]"
                                }`
                            }
                        >
                            <FolderPlus size={20} />
                            Menu Builder
                        </NavLink>
                    )}

                    {canShow(["manage_takeaway_orders"]) && (
                        <NavLink
                            to="/warehouse/takeaway-orders"
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition lg:w-full
            ${isActive
                                    ? "bg-[#F9ECEC] text-[#7F1D1D]"
                                    : "text-[#74645E] hover:bg-[#F8F5F1] hover:text-[#7F1D1D]"
                                }`
                            }
                        >
                            <ReceiptText size={20} />
                            Cashier Dashboard
                        </NavLink>
                    )}

                    {canShow(["manage_kitchen_orders"]) && (
                        <NavLink
                            to="/warehouse/kitchen-orders"
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition lg:w-full
            ${isActive
                                    ? "bg-[#F9ECEC] text-[#7F1D1D]"
                                    : "text-[#74645E] hover:bg-[#F8F5F1] hover:text-[#7F1D1D]"
                                }`
                            }
                        >
                            <PackageCheck size={20} />
                            Kitchen Orders
                        </NavLink>
                    )}

                    {canShow(["serve_dine_in_orders"]) && (
                        <NavLink
                            to="/warehouse/dine-in-service"
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition lg:w-full
            ${isActive
                                    ? "bg-[#F9ECEC] text-[#7F1D1D]"
                                    : "text-[#74645E] hover:bg-[#F8F5F1] hover:text-[#7F1D1D]"
                                }`
                            }
                        >
                            <CheckCircle2 size={20} />
                            Dine-in Service
                        </NavLink>
                    )}

                    {canShow(["view_reports"]) && (
                        <NavLink
                            to="/warehouse/reports"
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition lg:w-full
            ${isActive
                                    ? "bg-[#F9ECEC] text-[#7F1D1D]"
                                    : "text-[#74645E] hover:bg-[#F8F5F1] hover:text-[#7F1D1D]"
                                }`
                            }
                        >
                            <BarChart3 size={20} />
                            Reports
                        </NavLink>
                    )}

                    {canShow(["manage_tables"]) && (
                        <NavLink
                            to="/warehouse/tables"
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition lg:w-full
            ${isActive
                                    ? "bg-[#F9ECEC] text-[#7F1D1D]"
                                    : "text-[#74645E] hover:bg-[#F8F5F1] hover:text-[#7F1D1D]"
                                }`
                            }
                        >
                            <Table size={20} />
                            Tables
                        </NavLink>
                    )}

                    {canShow(["manage_restaurants"]) && (
                        <NavLink
                            to="/warehouse/restaurants"
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition lg:w-full
            ${isActive
                                    ? "bg-[#F9ECEC] text-[#7F1D1D]"
                                    : "text-[#74645E] hover:bg-[#F8F5F1] hover:text-[#7F1D1D]"
                                }`
                            }
                        >
                            <Store size={20} />
                            Restaurants
                        </NavLink>
                    )}

                </nav>

                {onAdd && (
                    <button
                        onClick={onAdd}
                        className="mt-6 hidden w-full items-center justify-center gap-2 rounded-2xl bg-[#7F1D1D] px-4 py-4 font-extrabold text-white shadow-[0_10px_24px_rgba(127,29,29,0.16)] transition hover:bg-[#681718] lg:flex"
                    >
                        <CirclePlus size={20} />
                        Add Inventory
                    </button>
                )}
            </div>

            <div className="hidden border-t border-[#EFE5E1] p-5 lg:block">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-bold text-[#7F1D1D] transition hover:bg-[#F9ECEC]"
                >
                    <LogOut size={21} />
                    Logout
                </button>
            </div>
        </aside>
    );
}

export default WarehouseSideBar;
