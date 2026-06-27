import { Search, Bell } from "lucide-react";

function WarehouseTopBar() {
    return (
        <div className="flex items-center justify-between px-8 py-6">

            {/* Left */}
            <h1 className="text-4xl font-bold text-[#7F1D1D]">
                Inventory Dashboard
            </h1>

            {/* Center */}
            <div className="relative w-[550px]">

                <Search
                    size={22}
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                    type="text"
                    placeholder="Search ingredients, suppliers, or batches..."
                    className="
                        w-full
                        bg-white
                        rounded-full
                        py-4
                        pl-14
                        pr-5
                        shadow-sm
                        border
                        border-gray-200
                        outline-none
                        focus:border-[#7F1D1D]
                    "
                />

            </div>

            {/* Right */}
            <div className="flex items-center gap-6">

                <button className="relative cursor-pointer">

                    <Bell
                        size={26}
                        className="text-[#7F1D1D]"
                    />

                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full"></span>

                </button>

                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center font-semibold">
                    img
                </div>

            </div>

        </div>
    );
}

export default WarehouseTopBar;