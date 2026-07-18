import { Bell, Menu, Moon, PanelLeftClose, PanelLeftOpen, Search, Sun, UserRound } from "lucide-react";
import { getStoredUser } from "../../utils/auth";
import { useTheme } from "../../context/ThemeContext";

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

function TopBar({ onMenu, onToggleSidebar, isSidebarCollapsed = false, search = "", setSearch }) {
    const user = getStoredUser();
    const { isLight, toggleTheme } = useTheme();
    const userName = getUserName(user);
    const roleName = user?.role?.name || "Administrator";

    return (
        <div className="sticky top-0 z-30 border-b border-white/10 bg-[#101517]/92 px-3 py-3 backdrop-blur-xl sm:px-5 lg:px-8">
            <div className="flex min-h-14 items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={onMenu}
                    aria-label="Open menu"
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.07] text-white/70 shadow-sm transition hover:border-[#7F1D1D]/40 hover:bg-white/10 hover:text-white active:scale-95 lg:hidden"
                >
                    <Menu size={21} />
                </button>

                <button
                    type="button"
                    onClick={onToggleSidebar}
                    aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className="hidden h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.07] text-white/70 shadow-sm transition hover:border-[#FFD166]/35 hover:bg-white/10 hover:text-[#FFD166] active:scale-95 lg:grid"
                >
                    {isSidebarCollapsed ? <PanelLeftOpen size={21} /> : <PanelLeftClose size={21} />}
                </button>

                <label className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 shadow-sm transition focus-within:border-[#FFD166]/40 focus-within:ring-4 focus-within:ring-[#FFD166]/10 lg:max-w-[460px]">
                    <Search size={18} className="shrink-0 text-[#FFD166]" />
                    <input
                        type="text"
                        placeholder="Search dashboard..."
                        value={search}
                        onChange={(event) => setSearch?.(event.target.value)}
                        className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/42"
                    />
                </label>

                <div className="flex shrink-0 items-center gap-2">
                    <button
                        type="button"
                        onClick={toggleTheme}
                        aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
                        className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.07] text-[#FFD166] shadow-sm transition hover:border-[#FFD166]/35 hover:bg-white/10 active:scale-95"
                    >
                        {isLight ? <Moon size={19} /> : <Sun size={19} />}
                    </button>

                    <button
                        type="button"
                        aria-label="Notifications"
                        className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.07] text-white/70 shadow-sm transition hover:border-[#FFD166]/35 hover:bg-white/10 hover:text-[#FFD166] active:scale-95"
                    >
                        <Bell size={19} />
                    </button>

                    <div className="flex h-11 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.07] px-2.5 shadow-sm sm:min-w-[190px] sm:px-3">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#7F1D1D] text-xs font-black text-white">
                            {getInitials(userName) || <UserRound size={16} />}
                        </div>
                        <div className="hidden min-w-0 sm:block">
                            <p className="truncate text-sm font-black leading-4 text-white">
                                {userName}
                            </p>
                            <p className="truncate text-[11px] font-bold uppercase tracking-wide text-white/45">
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
