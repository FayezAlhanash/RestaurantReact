import { Pencil, Store, Trash2 } from "lucide-react";
import { getStorageImageUrl } from "../../utils/restaurant";
import { useTranslation } from "../../utils/i18n";

function RestaurantCard({ restaurant, onDelete, onEdit, cacheKey }) {
    const { t } = useTranslation();
    const imageUrl = getStorageImageUrl(
        restaurant.front_image,
        restaurant.updated_at || restaurant.front_image_updated_at || cacheKey
    );

    return (
        <article className="overflow-hidden rounded-[24px] border border-white/10 bg-[#202B2F] shadow-[0_18px_42px_rgba(0,0,0,0.22)] transition duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:border-[#EF4444]/40 hover:shadow-[0_24px_58px_rgba(0,0,0,0.3)]">
            <div className="relative h-56 overflow-hidden bg-[#0D1214]">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={restaurant.name}
                        className="h-full w-full object-cover transition duration-500 hover:scale-105"
                    />
                ) : (
                    <div className="grid h-full place-items-center text-[#EF4444]">
                        <Store size={48} />
                    </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />
                <span className="absolute bottom-4 left-4 rounded-full border border-[#FFD166]/30 bg-[#0D1214]/82 px-3 py-1 text-xs font-black uppercase tracking-wide text-[#FFD166] shadow-sm backdrop-blur">
                    {t("tax")} {Number(restaurant.tax_percentage || 0).toFixed(2)}%
                </span>
            </div>

            <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h2 className="truncate text-2xl font-black text-white">
                            {restaurant.name}
                        </h2>
                        <p className="mt-2 line-clamp-2 min-h-11 text-sm font-semibold leading-6 text-white/48">
                            {restaurant.description || t("noDescriptionYet")}
                        </p>
                    </div>
                </div>

                <div className="mt-5 flex gap-3">
                    <button
                        type="button"
                        onClick={() => onEdit(restaurant)}
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-[#FFD166]/45 bg-[#FFD166]/14 text-sm font-black text-[#FFD166] shadow-[0_12px_26px_rgba(255,209,102,0.12)] transition hover:scale-[1.03] hover:border-[#FFD166]/75 hover:bg-[#FFD166] hover:text-[#241815] hover:shadow-[0_16px_32px_rgba(255,209,102,0.24)]"
                    >
                        <Pencil size={16} />
                        {t("edit")}
                    </button>

                    <button
                        type="button"
                        onClick={() => onDelete(restaurant.id)}
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#B91C1C] text-sm font-black text-white shadow-[0_12px_26px_rgba(185,28,28,0.22)] transition hover:scale-[1.03] hover:bg-[#DC2626] hover:shadow-[0_16px_32px_rgba(220,38,38,0.30)]"
                    >
                        <Trash2 size={16} />
                        {t("delete")}
                    </button>
                </div>
            </div>
        </article>
    );
}

export default RestaurantCard;
