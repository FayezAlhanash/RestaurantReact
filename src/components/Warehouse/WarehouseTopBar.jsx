import { Bell, Search, ShieldCheck } from "lucide-react";

function WarehouseTopBar({ search, setSearch }) {
    return (
        <header className="sticky top-0 z-20 border-b border-[#E8D9D3]/80 bg-[#F8F5F1]/90 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-[#A08980]">
                        Warehouse control
                    </p>
                    <h1 className="text-2xl font-black text-[#7F1D1D] sm:text-3xl lg:text-4xl">
                        Inventory Dashboard
                    </h1>
                </div>

                <div className="flex min-w-0 items-center gap-3">
                    <div className="relative min-w-0 flex-1 xl:w-[520px] xl:flex-none">
                        <Search
                            size={20}
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A99A93]"
                        />

                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search ingredients..."
                            className="h-12 w-full rounded-2xl border border-[#E4D6CF] bg-white pl-12 pr-4 text-sm font-medium shadow-sm outline-none transition focus:border-[#7F1D1D] focus:ring-4 focus:ring-[#7F1D1D]/10 sm:h-14"
                        />
                    </div>

                    <button className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#E4D6CF] bg-white text-[#7F1D1D] shadow-sm transition hover:border-[#7F1D1D] sm:h-14 sm:w-14">
                        <Bell size={22} />
                        <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-red-600" />
                    </button>

                    <div className="hidden items-center gap-3 rounded-2xl border border-[#E4D6CF] bg-white px-4 py-3 shadow-sm lg:flex">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#F9F4F2] text-[#7F1D1D]">
                            <ShieldCheck size={21} />
                        </div>
                        <div>
                            <p className="text-sm font-extrabold">Warehouse Manager</p>
                            <p className="text-xs text-[#8E7D76]">Live inventory</p>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default WarehouseTopBar;
