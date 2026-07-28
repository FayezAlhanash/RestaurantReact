import { useEffect, useRef, useState } from "react";
import { Package, Pencil, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

function WarehouseCard({ item, onEdit, onDelete, revealDelay = 0 }) {
    const { isLight } = useTheme();
    const cardRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const current = Number(item.current_quantity || 0);
    const minimum = Number(item.min_quantity || 0);
    const isLow = current <= minimum;
    const progress = minimum > 0 ? Math.min((current / minimum) * 100, 160) : 100;
    const healthyIconClass = isLight
        ? "bg-[#EAF6EF] text-[#2F7D55]"
        : "bg-emerald-400/12 text-emerald-300";
    const healthyBadgeClass = isLight
        ? "border-[#9FD8B7] bg-[#EAF6EF] text-[#2F7D55]"
        : "border-emerald-400/45 bg-emerald-400/14 text-emerald-300";
    const healthyBarClass = isLight ? "bg-[#3C9A6B]" : "bg-emerald-400";

    useEffect(() => {
        const card = cardRef.current;

        if (!card) return undefined;

        if (
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ||
            !("IntersectionObserver" in window)
        ) {
            setIsVisible(true);
            return undefined;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return;

                setIsVisible(true);
                observer.unobserve(entry.target);
            },
            {
                root: null,
                rootMargin: "0px 0px -10% 0px",
                threshold: 0.16,
            }
        );

        observer.observe(card);

        return () => observer.disconnect();
    }, []);

    return (
        <article
            ref={cardRef}
            style={{ transitionDelay: isVisible ? `${Math.min(revealDelay, 180)}ms` : "0ms" }}
            className={`rounded-[24px] border p-4 shadow-[0_16px_34px_rgba(0,0,0,0.20)] ring-1 transition duration-700 ease-out hover:-translate-y-0.5 sm:p-5 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        } ${
            isLight
                ? "border-[#E4CFC3] bg-[#FFF9F2] text-[#241815] ring-[#7F1D1D]/5 hover:border-[#D8B8AA] hover:bg-white hover:shadow-[0_24px_48px_rgba(127,29,29,0.12)]"
                : "border-[#3C484C] bg-[#222C30] text-white ring-white/[0.045] hover:border-[#FFD166]/32 hover:bg-[#273236] hover:shadow-[0_24px_48px_rgba(0,0,0,0.28)]"
        }`}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                    <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${isLow ? "bg-[#7F1D1D]/14 text-[#7F1D1D]" : healthyIconClass}`}>
                        <Package size={26} />
                    </div>

                    <div className="min-w-0">
                        <h3 className={`truncate text-lg font-black ${isLight ? "text-[#241815]" : "text-white"}`}>
                            {item.name}
                        </h3>
                        <p className={`mt-1 text-sm font-medium ${isLight ? "text-[#7A6A64]" : "text-white/50"}`}>
                            Minimum: {minimum} {item.unit}
                        </p>
                    </div>
                </div>

                <span className={`flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2 text-base font-black shadow-sm ${isLow ? "border-[#7F1D1D]/45 bg-[#7F1D1D]/16 text-[#7F1D1D]" : healthyBadgeClass}`}>
                    {isLow ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
                    {isLow ? "Low" : "Good"}
                </span>
            </div>

            <div className={`mt-5 rounded-2xl border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] ${
                isLight ? "border-[#E7DCD6] bg-[#FBF4EC]" : "border-[#3A4448] bg-[#162022]"
            }`}>
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <p className={`text-xs font-bold uppercase tracking-[0.16em] ${isLight ? "text-[#8A7972]" : "text-white/45"}`}>
                            Available
                        </p>
                        <p className="mt-1 text-3xl font-black text-[#FFD166]">
                            {current}
                            <span className={`ml-1 text-sm font-bold ${isLight ? "text-[#7A6A64]" : "text-white/50"}`}>
                                {item.unit}
                            </span>
                        </p>
                    </div>

                    {(onEdit || onDelete) && (
                        <div className="flex gap-2">
                            {onEdit && (
                                <button
                                    onClick={() => onEdit(item)}
                                    aria-label={`Edit ${item.name}`}
                                    className="grid h-10 w-10 place-items-center rounded-xl border border-[#FFD166]/35 text-[#FFD166] transition hover:bg-[#FFD166] hover:text-[#151A1D]"
                                >
                                    <Pencil size={17} />
                                </button>
                            )}

                            {onDelete && (
                                <button
                                    onClick={() => onDelete(item)}
                                    aria-label={`Delete ${item.name}`}
                                    className="grid h-10 w-10 place-items-center rounded-xl border border-[#7F1D1D]/35 text-[#7F1D1D] transition hover:bg-[#7F1D1D] hover:text-white"
                                >
                                    <Trash2 size={17} />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className={`mt-4 h-2.5 overflow-hidden rounded-full ${isLight ? "bg-[#EADBD2]" : "bg-[#2E393D]"}`}>
                    <div
                        className={`h-full rounded-full ${isLow ? "bg-[#7F1D1D]" : healthyBarClass}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>
            </div>
        </article>
    );
}

export default WarehouseCard;
