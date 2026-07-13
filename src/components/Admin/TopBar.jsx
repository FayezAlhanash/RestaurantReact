import { Bell, Menu, Search, UserRound } from "lucide-react";
import { getStoredUser } from "../../utils/auth";

function getUserName(user) {
    return (
        user?.name ||
        [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
        user?.email ||
        "Admin"
    );
}

function getInitials(name) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
}

function TopBar({ onMenu }) {
    const user = getStoredUser();
    const userName = getUserName(user);
    const roleName = user?.role?.name || "Administrator";

    return (
        <div className="sticky top-0 z-30 border-b border-[#E7DCD6]/80 bg-[#F6F1EA]/95 px-3 py-3 backdrop-blur sm:px-5 lg:px-8">
            <div className="flex min-h-14 items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={onMenu}
                    aria-label="Open menu"
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#E2D6CF] bg-white text-[#5F514C] shadow-sm transition hover:border-[#7F1D1D]/30 hover:text-[#7F1D1D] lg:hidden"
                >
                    <Menu size={21} />
                </button>

                <label className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-xl border border-[#E2D6CF] bg-white px-4 shadow-sm transition focus-within:border-[#7F1D1D]/40 focus-within:ring-4 focus-within:ring-[#7F1D1D]/10 lg:max-w-[460px]">
                    <Search size={18} className="shrink-0 text-[#8A7972]" />
                    <input
                        type="text"
                        placeholder="Search dashboard..."
                        className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#241F1D] outline-none placeholder:text-[#A79791]"
                    />
                </label>

                <div className="flex shrink-0 items-center gap-2">
                    <button
                        type="button"
                        aria-label="Notifications"
                        className="grid h-11 w-11 place-items-center rounded-xl border border-[#E2D6CF] bg-white text-[#5F514C] shadow-sm transition hover:border-[#7F1D1D]/30 hover:text-[#7F1D1D]"
                    >
                        <Bell size={19} />
                    </button>

                    <div className="flex h-11 items-center gap-3 rounded-xl border border-[#E2D6CF] bg-white px-2.5 shadow-sm sm:min-w-[190px] sm:px-3">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#7F1D1D] text-xs font-black text-white">
                            {getInitials(userName) || <UserRound size={16} />}
                        </div>
                        <div className="hidden min-w-0 sm:block">
                            <p className="truncate text-sm font-black leading-4 text-[#241F1D]">
                                {userName}
                            </p>
                            <p className="truncate text-[11px] font-bold uppercase tracking-wide text-[#9A7A70]">
                                {roleName}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TopBar;
