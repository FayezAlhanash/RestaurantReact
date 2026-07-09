import { Store } from "lucide-react";

function CategoryTabs({ activeCategory, setActiveCategory, categories = [] }) {
    const tabs = [{ id: "all", name: "All" }, ...categories];

    return (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((category) => {
                const isActive = String(activeCategory) === String(category.id);

                return (
                    <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={`flex min-w-fit items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition sm:px-5 ${isActive
                                ? "border-[#F7C948] bg-[#F7C948] text-[#34270D] shadow-[0_8px_20px_rgba(247,201,72,0.25)]"
                                : "border-[#E7DCD6] bg-white text-[#6E5E58] hover:border-[#CDBBB3]"
                            }`}
                    >
                        <Store size={18} />
                        {category.name}
                    </button>
                );
            })}
        </div>
    );
}

export default CategoryTabs;
