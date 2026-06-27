import { Search, Bell } from "lucide-react";

function WarehouseTopBar() {
    return (
        <div className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[auto_1fr_auto] lg:px-8 lg:py-6">

            {/* Left */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#7F1D1D]">
                Inventory Dashboard
            </h1>

            {/* Center */}
            <div className="relative order-3 col-span-2 w-full lg:order-none lg:col-span-1 lg:mx-auto lg:max-w-[550px]">

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
            <div className="flex items-center gap-3 sm:gap-6">

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
