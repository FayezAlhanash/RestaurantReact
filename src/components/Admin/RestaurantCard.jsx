import { Pencil, Store, Trash2 } from "lucide-react";

function getImageUrl(path) {
    if (!path) return "";

    if (path.startsWith("http")) {
        return path.replace("https://", "http://");
    }

    return `http://46.101.112.67:8000/storage/${path}`;
}

function RestaurantCard({ restaurant, onDelete, onEdit }) {
    const imageUrl = getImageUrl(restaurant.front_image);

    return (
        <article className="overflow-hidden rounded-[24px] border border-white/10 bg-[#202B2F] shadow-[0_18px_42px_rgba(0,0,0,0.22)] transition duration-200 hover:-translate-y-1 hover:border-[#7F1D1D]/35 hover:shadow-[0_24px_58px_rgba(0,0,0,0.3)]">
            <div className="relative h-56 overflow-hidden bg-[#0D1214]">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={restaurant.name}
                        className="h-full w-full object-cover transition duration-500 hover:scale-105"
                    />
                ) : (
                    <div className="grid h-full place-items-center text-[#7F1D1D]">
                        <Store size={48} />
                    </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />
                <span className="absolute bottom-4 left-4 rounded-full border border-[#FFD166]/30 bg-[#0D1214]/82 px-3 py-1 text-xs font-black uppercase tracking-wide text-[#FFD166] shadow-sm backdrop-blur">
                    Tax {Number(restaurant.tax_percentage || 0).toFixed(2)}%
                </span>
            </div>

            <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h2 className="truncate text-2xl font-black text-white">
                            {restaurant.name}
                        </h2>
                        <p className="mt-2 line-clamp-2 min-h-11 text-sm font-semibold leading-6 text-white/48">
                            {restaurant.description || "No description yet."}
                        </p>
                    </div>
                </div>

                <div className="mt-5 flex gap-3">
                    <button
                        type="button"
                        onClick={() => onEdit(restaurant)}
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-sky-400/30 bg-sky-400/12 text-sm font-black text-sky-200 transition hover:bg-sky-400/18"
                    >
                        <Pencil size={16} />
                        Edit
                    </button>

                    <button
                        type="button"
                        onClick={() => onDelete(restaurant.id)}
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#7F1D1D] text-sm font-black text-white transition hover:bg-[#681718]"
                    >
                        <Trash2 size={16} />
                        Delete
                    </button>
                </div>
            </div>
        </article>
    );
}

export default RestaurantCard;
