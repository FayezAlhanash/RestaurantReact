import { Store } from "lucide-react";

function CategoryTabs({ activeCategory, setActiveCategory, categories = [], variant = "light" }) {
    const tabs = [{ id: "all", name: "All" }, ...categories];
    const isDark = variant === "dark";

    return (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] sm:mb-6 [&::-webkit-scrollbar]:hidden">
            {tabs.map((category) => {
                const isActive = String(activeCategory) === String(category.id);

                return (
                    <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={`flex min-w-fit items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition sm:rounded-2xl sm:px-5 sm:py-3 sm:text-sm ${isActive
                                ? isDark
                                    ? "border-[#FFD166] bg-[#FFD166] text-[#151A1D] shadow-[0_8px_20px_rgba(255,209,102,0.20)]"
                                    : "border-[#F7C948] bg-[#F7C948] text-[#34270D] shadow-[0_8px_20px_rgba(247,201,72,0.25)]"
                                : isDark
                                    ? "border-white/10 bg-white/[0.07] text-white/70 hover:border-[#7F1D1D]/50 hover:bg-white/[0.10] hover:text-white"
                                    : "border-[#E7DCD6] bg-white text-[#6E5E58] hover:border-[#CDBBB3]"
                            }`}
                    >
                        <Store size={16} />
                        {category.name}
                    </button>
                );
            })}
        </div>
    );
}

export default CategoryTabs;
