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
            <div
                className="
    flex items-center gap-3 bg-[#eae6e6] px-4 py-2 rounded-2xl w-[450px]
    border-2 border-transparent
    focus-within:border-[#7f1d1d] focus-within:bg-white
    focus-within:shadow-[0_15px_35px_rgba(127,29,29,0.15)]
    transition-all duration-300
  "
            >
                <Search size={20} className="text-gray-500" />

                <input
                    type="text"
                    placeholder="Search..."
                    className="
      bg-transparent outline-none  px-2 py-1
      placeholder-gray-400 focus:placeholder-gray-600
      text-gray-700 font-medium
    "
                />

            </div>
            <button
                className="
      bg-[#7f1d1d] 
      text-white 
      px-4
      py-3
      rounded-xl
      hover:bg-[#a83838] 
      transition-colors 
      duration-200
      mr-110
    "
                onClick={() => {
                    // هنا تحط منطق البحث
                    alert('Search clicked!');
                }}
            >
                Search
            </button>

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