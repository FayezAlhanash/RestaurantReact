import SearchIcon from '@mui/icons-material/Search';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import PublicIcon from '@mui/icons-material/Public';

function TopBar() {
    return (
        <div className="w-[78%] ml-6 mt-3 mb-6 flex items-center gap-4 font-['raleway']">

            {/* Search Input */}
            <div className="relative flex-1">

                <SearchIcon
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
                    sx={{ fontSize: 28 }}
                />

                <input
                    type="text"
                    placeholder="Search for menu items..."
                    className="cursor-context-menu
    w-full
    bg-white/90
    backdrop-blur-md
    border
    border-gray-200
    rounded-3xl
    py-4
    pl-14
    pr-5
    text-lg
    shadow-sm
    outline-none
    transition-all
    duration-300
    focus:border-[#7F1D1D]
    focus:shadow-lg
    focus:scale-[1.01]
    placeholder:text-gray-400
"
                />

            </div>

            {/* Search Button */}
            <button className="cursor-pointer
        bg-[#7F1D1D]
        hover:bg-[#6E1414]
        text-white
        px-8
        py-4
        rounded-3xl
        font-semibold
        shadow-md
        transition
    ">

                Search

            </button>

        </div>
    )
}

export default TopBar