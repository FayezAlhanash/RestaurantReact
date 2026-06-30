import { Plus, Star } from "lucide-react";

function MenuItemCard({ item, onOpen }) {
    return (
        <article className="group flex min-h-[330px] flex-col overflow-hidden rounded-[26px] border border-[#E7DCD6] bg-white shadow-[0_8px_30px_rgba(83,53,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(83,53,42,0.12)]">
            <div className="relative m-2.5 overflow-hidden rounded-[20px] bg-[#EDE5DF]">
                <img
                    src={`${item.image}?auto=format&fit=crop&w=800&q=80`}
                    alt={item.title}
                    className="h-44 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-48"
                />
                <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-[#5F504A] shadow-sm backdrop-blur">
                    <Star size={13} className="fill-[#F7C948] text-[#F7C948]" /> 4.8
                </span>
                <span className="absolute right-3 top-3 rounded-full bg-[#7F1D1D] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                    Popular
                </span>
            </div>

            <div className="flex flex-1 flex-col px-4 pb-4 pt-1">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h2 className="truncate text-lg font-extrabold text-[#2E2522]">{item.title}</h2>
                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#8A7972]">{item.description}</p>
                    </div>
                    <p className="shrink-0 text-xl font-extrabold text-[#7F1D1D]">${item.price.toFixed(2)}</p>
                </div>

                <button
                    onClick={onOpen}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7F1D1D] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#681718] active:scale-[0.98]"
                >
                    <Plus size={18} />
                    Add to order
                </button>
            </div>
        </article>
    );
}

export default MenuItemCard;
