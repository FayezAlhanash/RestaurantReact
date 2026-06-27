import { Bell, Menu, Search } from "lucide-react";

function TopBar({ onMenu }) {
    return (
        <div
            className="
    min-h-16
    bg-white
    px-3 sm:px-5 lg:px-8 py-3

    flex
    items-center
    justify-between
  "
        >
            <button onClick={onMenu} aria-label="Open menu" className="shrink-0 rounded-xl p-2 hover:bg-gray-100 lg:hidden"><Menu /></button>
            <div className="flex min-w-0 flex-1 items-center gap-2 lg:flex-none">
                <div
                    className="
        flex items-center gap-3
        bg-[#eae6e6]
        px-4 py-2
        rounded-2xl
        w-full lg:w-[450px]
        border-2 border-transparent
        focus-within:border-[#7f1d1d]
    "
                >
                    <Search size={20} className="text-gray-500" />

                    <input
                        type="text"
                        placeholder="Search..."
                    className="min-w-0 bg-transparent outline-none px-2 py-1 w-full"
                    />
                </div>

                <button
                    className="
        bg-[#7f1d1d]
        text-white
        px-4 py-3
        rounded-xl
        hover:bg-[#581919]
         transition-all duration-300 hover:scale-105 hover:shadow-xl
        "
                >
                    <span className="hidden sm:inline">Search</span><Search className="sm:hidden" size={18} />
                </button>
            </div>
            <div className="ml-2 flex items-center gap-2 sm:gap-5">
                <Bell />

                <button
                    className="
                    bg-[#7f1d1d]
                    text-white
                    px-3 sm:px-6
                    py-3
                    rounded-full
                "
                >
                    <span className="hidden sm:inline">Admin Panel</span><span className="sm:hidden">Admin</span>
                </button>
            </div>
        </div>
    );
}

export default TopBar;
