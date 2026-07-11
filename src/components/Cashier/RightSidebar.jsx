import { BookOpen, Headset, House, LogOut, ReceiptText, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { clearSession } from "../../utils/auth";

const navigation = [
    { id: "menu", label: "Menu", icon: House },
    { id: "catalog", label: "Catalog", icon: BookOpen },
    { id: "orders", label: "Orders", icon: ReceiptText },
    { id: "settings", label: "Settings", icon: Settings },
];

function RightSidebar({ activeView = "menu", onViewChange }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        clearSession();
        navigate("/", { replace: true });
    };

    return (
        <div className="flex h-dvh w-[92px] flex-col items-center border-r border-[#E9DED8] bg-white px-3 py-5">
            <div className="grid h-14 w-14 place-items-center rounded-[20px] bg-[#7F1D1D] text-lg font-black text-white shadow-[0_10px_24px_rgba(127,29,29,0.2)]">
                B4
            </div>

            <nav className="mt-10 flex w-full flex-1 flex-col gap-3">
                {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.label}
                            title={item.label}
                            onClick={() => onViewChange?.(item.id)}
                            className={`group flex w-full flex-col items-center gap-1 rounded-2xl py-3 text-[10px] font-bold transition ${
                                activeView === item.id
                                    ? "bg-[#F9ECEC] text-[#7F1D1D]"
                                    : "text-[#9A8982] hover:bg-[#F8F4F1] hover:text-[#7F1D1D]"
                            }`}
                        >
                            <Icon size={22} strokeWidth={activeView === item.id ? 2.5 : 2} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            <div className="flex w-full flex-col gap-2 border-t border-[#EEE5E1] pt-4">
                <button title="Support" className="grid h-11 w-full place-items-center rounded-2xl text-[#8F7E77] transition hover:bg-[#F8F4F1] hover:text-[#7F1D1D]">
                    <Headset size={22} />
                </button>
                <button onClick={handleLogout} title="Logout" className="grid h-11 w-full place-items-center rounded-2xl text-[#7F1D1D] transition hover:bg-[#F9ECEC]">
                    <LogOut size={22} />
                </button>
            </div>
        </div>
    );
}

export default RightSidebar;
