import { CalendarDays, Menu, PanelLeftClose, PanelLeftOpen, Sparkles } from "lucide-react";
import EmployeeProfileButton from "../Shared/EmployeeProfileButton";
import NotificationsButton from "../Shared/NotificationsButton";
import { getStoredUser } from "../../utils/auth";
import { useTranslation } from "../../utils/i18n";

function getFirstName(user) {
    const fullName =
        user?.name ||
        [user?.first_name, user?.father_name, user?.last_name]
            .filter(Boolean)
            .join(" ") ||
        user?.email ||
        "";

    return user?.first_name || String(fullName).split(" ").filter(Boolean)[0] || "there";
}

function TopBar({ onMenu, onToggleSidebar, isSidebarCollapsed = false }) {
    const { language, t } = useTranslation();
    const user = getStoredUser();
    const firstName = getFirstName(user);
    const roleName = user?.role?.name || "Team";
    const today = new Date().toLocaleDateString(language === "ar" ? "ar-SY" : undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
    });

    return (
        <div className="admin-topbar sticky top-0 z-[140] border-b border-[#FFD166]/18 bg-[#101010]/88 px-3 py-3 text-white shadow-[0_10px_30px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:px-5 lg:px-10">
            <div className="grid min-h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4">
                <div className="flex shrink-0 items-center gap-3">
                <button
                    type="button"
                    onClick={onMenu}
                    aria-label="Open menu"
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] border border-white/10 bg-white/[0.07] text-[#D7B52F] shadow-sm transition hover:border-[#FFD166]/35 hover:bg-white/10 hover:text-[#FFD166] active:scale-95 lg:hidden"
                >
                    <Menu size={21} />
                </button>

                <button
                    type="button"
                    onClick={onToggleSidebar}
                    aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className="hidden h-11 w-11 shrink-0 place-items-center rounded-[10px] border border-white/10 bg-white/[0.07] text-[#D7B52F] shadow-sm transition hover:border-[#FFD166]/35 hover:bg-white/10 hover:text-[#FFD166] active:scale-95 lg:grid"
                >
                    {isSidebarCollapsed ? <PanelLeftOpen size={21} /> : <PanelLeftClose size={21} />}
                </button>

                    <div className="topbar-context-pill hidden h-11 items-center gap-2 rounded-xl border px-3 text-sm font-black md:flex">
                        <CalendarDays size={17} />
                        <span>{today}</span>
                    </div>
                </div>

                <div className="topbar-welcome flex h-14 min-w-0 items-center justify-center overflow-hidden px-4 text-center">
                    <div
                        dir={language === "ar" ? "rtl" : "ltr"}
                        className="flex min-w-0 items-baseline justify-center gap-3"
                    >
                        <span className="topbar-welcome-word text-2xl font-black uppercase tracking-[0.12em] text-[#D7B52F] sm:text-3xl lg:text-4xl">
                            {t("welcome")}
                        </span>
                        <span className="topbar-welcome-name min-w-0 truncate text-3xl font-black text-white sm:text-4xl lg:text-5xl">
                            {firstName}
                        </span>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    <div className="topbar-context-pill hidden h-11 items-center gap-2 rounded-xl border px-3 text-sm font-black xl:flex">
                        <Sparkles size={17} />
                        <span className="capitalize">{roleName}</span>
                    </div>

                    <NotificationsButton />

                    <EmployeeProfileButton floatingPanel showShifts={false} />
                </div>
            </div>
        </div>
    );
}

export default TopBar;
