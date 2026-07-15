import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { CheckCircle2, LogOut, Utensils } from "lucide-react";
import { clearSession } from "../../utils/auth";
import { getUserPermissions } from "../../utils/permissions";

const navItems = [
    {
        to: "/waiter/service",
        label: "Dine-in Service",
        description: "Serve orders and collect cash",
        icon: CheckCircle2,
        permissions: ["serve_dine_in_orders", "process_payments"],
    },
];

export default function WaiterLayout() {
    const navigate = useNavigate();
    const permissions = getUserPermissions();
    const canShow = (requiredPermissions = []) =>
        !requiredPermissions.length ||
        requiredPermissions.some((permission) => permissions.includes(permission));

    const handleLogout = () => {
        clearSession();
        navigate("/", { replace: true });
    };

    return (
        <div className="min-h-dvh bg-[#f7efe4] font-[Raleway] text-[#211b18] lg:flex">
            <aside className="border-b border-[#e3d5c5] bg-white p-4 shadow-sm lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-80 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r lg:p-5">
                <div className="rounded-2xl bg-[#6b3528] p-4 text-white">
                    <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#d8a23a] text-[#241707]">
                            <Utensils size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black">Big-4</h1>
                            <p className="text-xs font-black uppercase tracking-wide text-white/65">
                                Waiter Workspace
                            </p>
                        </div>
                    </div>
                </div>

                <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
                    {navItems.filter((item) => canShow(item.permissions)).map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    `flex min-w-max items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition lg:min-w-0 ${
                                        isActive
                                            ? "bg-[#fff8ea] text-[#6b3528]"
                                            : "text-[#7b6a61] hover:bg-[#fff8ea] hover:text-[#6b3528]"
                                    }`
                                }
                            >
                                <Icon size={20} />
                                <span>
                                    <span className="block">{item.label}</span>
                                    <span className="hidden text-xs font-bold opacity-70 lg:block">
                                        {item.description}
                                    </span>
                                </span>
                            </NavLink>
                        );
                    })}
                </nav>

                <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-[#e3d5c5] bg-white px-4 py-3 text-sm font-black text-[#6b3528] transition hover:bg-[#fff8ea] lg:mt-auto"
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </aside>

            <main className="min-w-0 flex-1">
                <Outlet />
            </main>
        </div>
    );
}
