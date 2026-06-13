import { Bell, Search } from "lucide-react";

function TopBar() {
    return (
        <div
            className="
    h-16
    bg-white
    px-8

    flex
    items-center
    justify-between
  "
        >
            <div className="flex items-center gap-2">
                <div
                    className="
        flex items-center gap-3
        bg-[#eae6e6]
        px-4 py-2
        rounded-2xl
        w-[450px]
        border-2 border-transparent
        focus-within:border-[#7f1d1d]
    "
                >
                    <Search size={20} className="text-gray-500" />

                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-transparent outline-none px-2 py-1 w-full"
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
                    Search
                </button>
            </div>
            <div className="flex items-center gap-5">
                <Bell />

                <button
                    className="
                    bg-[#7f1d1d]
                    text-white
                    px-6
                    py-3
                    rounded-full
                "
                >
                    Admin Panel
                </button>
            </div>
        </div>
    );
}

export default TopBar;