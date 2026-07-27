import { BookOpen, CheckCircle2, ClipboardList, Headset, House, LogOut, Package, ReceiptText, Settings, Store, Table, TriangleAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { clearSession } from "../../utils/auth";
import BrandLogo from "../Shared/BrandLogo";

const navigation = [
    { id: "menu", label: "Menu", icon: House, permissions: ["manage_takeaway_orders"] },
    { id: "catalog", label: "Catalog", icon: BookOpen, permissions: ["manage_takeaway_orders"] },
    { id: "orders", label: "Orders", icon: ReceiptText, permissions: ["manage_takeaway_orders"] },
    { id: "serveOrders", label: "Dine-in", icon: CheckCircle2, permissions: ["serve_dine_in_orders"] },
    { id: "inventory", label: "Inventory", icon: Package, permissions: ["monitor_inventory"] },
    { id: "stockActions", label: "Stock", icon: ClipboardList, permissions: ["monitor_inventory"] },
    { id: "lowStock", label: "Low", icon: TriangleAlert, permissions: ["monitor_inventory"] },
    { id: "tables", label: "Tables", icon: Table, permissions: ["manage_tables"] },
    {
        id: "restaurants",
        label: "Restaurants",
        icon: Store,
        permissions: ["manage_restaurants"],
    },
    { id: "settings", label: "Settings", icon: Settings },
];

function RightSidebar({ activeView = "menu", onViewChange, permissions = [] }) {
    const navigate = useNavigate();
    const canShow = (requiredPermissions = []) =>
        !requiredPermissions.length ||
        requiredPermissions.some((permission) => permissions.includes(permission));

    const handleLogout = () => {
        clearSession();
        navigate("/", { replace: true });
    };

    return (
        <div className="flex h-dvh w-[92px] flex-col items-center border-r border-white/10 bg-[#101517] px-3 py-5 text-white">
            <BrandLogo className="h-14 w-14" rounded="rounded-[20px]" />

            <nav className="mt-10 flex w-full flex-1 flex-col gap-3">
                {navigation.filter((item) => canShow(item.permissions)).map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.label}
                            title={item.label}
                            onClick={() => onViewChange?.(item.id)}
                            className={`group flex w-full flex-col items-center gap-1 rounded-2xl py-3 text-[10px] font-bold transition ${
                                activeView === item.id
                                    ? "bg-[#7F1D1D] text-white shadow-[0_12px_24px_rgba(127,29,29,0.18)]"
                                    : "text-white/45 hover:bg-white/[0.07] hover:text-white"
                            }`}
                        >
                            <Icon size={22} strokeWidth={activeView === item.id ? 2.5 : 2} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            <div className="flex w-full flex-col gap-2 border-t border-white/10 pt-4">
                <button title="Support" className="grid h-11 w-full place-items-center rounded-2xl text-white/45 transition hover:bg-white/[0.07] hover:text-[#FFD166]">
                    <Headset size={22} />
                </button>
                <button onClick={handleLogout} title="Logout" className="grid h-11 w-full place-items-center rounded-2xl text-[#7F1D1D] transition hover:bg-[#7F1D1D]/12">
                    <LogOut size={22} />
                </button>
            </div>
        </div>
    );
}

export default RightSidebar;
