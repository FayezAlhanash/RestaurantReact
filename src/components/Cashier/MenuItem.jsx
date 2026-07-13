import { Plus, Star } from "lucide-react";

function MenuItemCard({ item, onOpen }) {
    const imageUrl =
        item.image ||
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";

    return (
        <article className="group flex min-h-[300px] flex-col overflow-hidden rounded-2xl border border-[#E7DCD6] bg-white shadow-[0_8px_30px_rgba(83,53,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(83,53,42,0.12)] sm:min-h-[330px] sm:rounded-[26px]">
            <div className="relative m-2 overflow-hidden rounded-2xl bg-[#EDE5DF] sm:m-2.5 sm:rounded-[20px]">
                <img
                    src={imageUrl}
                    alt={item.title}
                    className="h-40 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-48"
                />
                <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-[#5F504A] shadow-sm backdrop-blur">
                    <Star size={13} className="fill-[#F7C948] text-[#F7C948]" /> 4.8
                </span>
                <span className="absolute right-3 top-3 rounded-full bg-[#7F1D1D] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                    Popular
                </span>
            </div>

            <div className="flex flex-1 flex-col px-3 pb-3 pt-1 sm:px-4 sm:pb-4">
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                    <div className="min-w-0 flex-1">
                        <h2 className="truncate text-lg font-extrabold text-[#2E2522]">{item.title}</h2>
                        <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-[#5F504A]">{item.description}</p>
                    </div>
                    <p className="shrink-0 text-xl font-extrabold text-[#7F1D1D]">${Number(item.price ?? 0).toFixed(2)}</p>
                </div>

                <button
                    onClick={onOpen}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7F1D1D] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#681718] active:scale-[0.98] sm:mt-5"
                >
                    <Plus size={18} />
                    Add to order
                </button>
            </div>
        </article>
    );
}

export default MenuItemCard;
