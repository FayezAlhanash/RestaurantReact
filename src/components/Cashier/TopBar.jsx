import { Bell, Search, ShoppingBag } from "lucide-react";
import BrandLogo from "../Shared/BrandLogo";

function TopBar({ search, setSearch, cartCount }) {
    return (
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#101517]/82 px-4 py-4 backdrop-blur-xl sm:px-6 xl:px-8">
            <div className="flex items-center gap-3 sm:gap-5">
                <BrandLogo className="h-11 w-11 lg:hidden" />

                <div className="relative min-w-0 flex-1">
                    <Search size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#FFD166]" />
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search dishes, drinks..."
                        className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.07] pl-12 pr-4 text-sm font-medium text-white shadow-sm outline-none transition placeholder:text-white/42 focus:border-[#FFD166]/45 focus:ring-4 focus:ring-[#FFD166]/10 sm:h-14 sm:text-base"
                    />
                </div>

                <button aria-label="Notifications" className="hidden h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.07] text-white/65 transition hover:border-[#FFD166]/35 hover:text-[#FFD166] sm:grid">
                    <Bell size={21} />
                </button>

                <div className="hidden items-center gap-3 border-l border-white/10 pl-5 xl:flex">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#7F1D1D] font-bold text-white">FA</div>
                    <div>
                        <p className="text-sm font-bold">Fayez Ahmad</p>
                        <p className="text-xs text-white/50">Cashier · Shift A</p>
                    </div>
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
