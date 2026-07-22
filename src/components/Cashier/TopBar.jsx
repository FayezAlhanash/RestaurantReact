import { Search, ShoppingBag } from "lucide-react";
import { useState } from "react";
import BrandLogo from "../Shared/BrandLogo";
import EmployeeProfileButton from "../Shared/EmployeeProfileButton";
import NotificationsButton from "../Shared/NotificationsButton";

function TopBar({ search, setSearch, cartCount }) {
    const [isSearchReady, setIsSearchReady] = useState(false);

    return (
        <header className="sticky top-0 z-[110] border-b border-white/10 bg-[#101517]/82 px-4 py-4 backdrop-blur-xl sm:px-6 xl:px-8">
            <div className="flex items-center gap-3 sm:gap-5">
                <BrandLogo className="h-11 w-11 lg:hidden" />

                <div className="relative min-w-0 flex-1">
                    <input
                        type="text"
                        name="username"
                        autoComplete="username"
                        tabIndex={-1}
                        aria-hidden="true"
                        className="hidden"
                    />
                    <input
                        type="password"
                        name="password"
                        autoComplete="current-password"
                        tabIndex={-1}
                        aria-hidden="true"
                        className="hidden"
                    />
                    <Search size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#FFD166]" />
                    <input
                        type="text"
                        name="big4_topbar_filter_cashier"
                        autoComplete="new-password"
                        autoCorrect="off"
                        spellCheck="false"
                        inputMode="search"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        readOnly={!isSearchReady}
                        onFocus={() => setIsSearchReady(true)}
                        onMouseDown={() => setIsSearchReady(true)}
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search dishes, drinks..."
                        className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.07] pl-12 pr-4 text-sm font-medium text-white shadow-sm outline-none transition placeholder:text-white/42 focus:border-[#FFD166]/45 focus:ring-4 focus:ring-[#FFD166]/10 sm:h-14 sm:text-base"
                    />
                </div>

                <div className="hidden sm:block">
                    <NotificationsButton />
                </div>

                <div className="relative z-[130] shrink-0 sm:hidden">
                    <EmployeeProfileButton compact floatingPanel />
                </div>

                <div className="relative z-[130] hidden shrink-0 border-l border-white/10 pl-5 sm:block">
                    <EmployeeProfileButton floatingPanel />
                </div>

                <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#F7C948] text-[#372B13] lg:hidden">
                    <ShoppingBag size={21} />
                    {cartCount > 0 && (
                        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#7F1D1D] px-1 text-[10px] font-bold text-white">
                            {cartCount}
                        </span>
                    )}
                </div>
            </div>
        </header>
    );
}

export default TopBar;
