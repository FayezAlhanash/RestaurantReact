import {
    LayoutDashboard,
    TriangleAlert,
    CircleOff,
    MessageSquare,
    CirclePlus,
    LogOut,
} from "lucide-react";

function WarehouseSideBar({ onAdd }) {
    return (
        <div className="w-[260px] h-screen bg-white border-r flex flex-col justify-between py-6">

            {/* Top */}
            <div>

                {/* Logo */}
                <div className="px-6 mb-10">
                    <h1 className="text-4xl font-bold text-[#7F1D1D]">
                        Big-4
                    </h1>

                    <p className="text-gray-500 text-sm">
                        Food Court Systems
                    </p>
                </div>

                {/* Menu */}
                <div className="flex flex-col gap-3 px-4">

                    <button className="flex items-center gap-3 bg-yellow-400 text-black rounded-xl px-4 py-4 font-semibold">
                        <LayoutDashboard size={22} />
                        Dashboard
                    </button>

                    <button className="flex items-center gap-3 text-gray-700 hover:bg-gray-100 rounded-xl px-4 py-4 transition">
                        <TriangleAlert size={22} />
                        Low Stock
                    </button>

                    <button className="flex items-center gap-3 text-gray-700 hover:bg-gray-100 rounded-xl px-4 py-4 transition">
                        <CircleOff size={22} />
                        Out Of Stock
                    </button>

                    <button className="flex items-center gap-3 text-gray-700 hover:bg-gray-100 rounded-xl px-4 py-4 transition">
                        <MessageSquare size={22} />
                        Manager Chat
                    </button>

                </div>

                {/* Add Inventory */}
                <div className="px-4 mt-10">
                    <button
                        onClick={onAdd}
                        className="w-full bg-[#7F1D1D] hover:bg-[#661616] text-white rounded-xl py-4 flex items-center justify-center gap-2 font-semibold transition"
                    >            <CirclePlus size={22} />
                        Add Inventory
                    </button>
                </div>

            </div>

            {/* Logout */}
            <button className="flex items-center gap-3 text-[#7F1D1D] px-6 hover:translate-x-1 transition">
                <LogOut size={22} />
                Logout
            </button>

        </div>
    );
}

export default WarehouseSideBar;