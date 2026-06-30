import { Package, Pencil, Trash2, TrendingDown, TrendingUp } from "lucide-react";

function WarehouseCard({ item, onEdit, onDelete }) {
    const current = Number(item.current_quantity || 0);
    const minimum = Number(item.min_quantity || 0);
    const isLow = current <= minimum;
    const progress = minimum > 0 ? Math.min((current / minimum) * 100, 160) : 100;

    return (
        <article className="rounded-[24px] border border-[#E8D9D3] bg-[#FDFBF9] p-4 transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(83,53,42,0.08)] sm:p-5">
            <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                    <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${isLow ? "bg-[#FFF6D8] text-[#84630A]" : "bg-[#F9ECEC] text-[#7F1D1D]"}`}>
                        <Package size={26} />
                    </div>

                    <div className="min-w-0">
                        <h3 className="truncate text-lg font-black text-[#2B2320]">
                            {item.name}
                        </h3>
                        <p className="mt-1 text-sm font-medium text-[#8C7B74]">
                            Minimum: {minimum} {item.unit}
                        </p>
                    </div>
                </div>

                <span className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold ${isLow ? "bg-[#FFF6D8] text-[#84630A]" : "bg-[#EEF9EA] text-[#2E7D32]"}`}>
                    {isLow ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                    {isLow ? "Low" : "Good"}
                </span>
            </div>

            <div className="mt-5 rounded-2xl bg-white p-4">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A08980]">
                            Available
                        </p>
                        <p className="mt-1 text-3xl font-black text-[#7F1D1D]">
                            {current}
                            <span className="ml-1 text-sm font-bold text-[#8C7B74]">
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
                                    className="grid h-10 w-10 place-items-center rounded-xl border border-yellow-300 text-yellow-600 transition hover:bg-yellow-400 hover:text-white"
                                >
                                    <Pencil size={17} />
                                </button>
                            )}

                            {onDelete && (
                                <button
                                    onClick={() => onDelete(item)}
                                    aria-label={`Delete ${item.name}`}
                                    className="grid h-10 w-10 place-items-center rounded-xl border border-red-200 text-red-600 transition hover:bg-red-600 hover:text-white"
                                >
                                    <Trash2 size={17} />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#EFE5E1]">
                    <div
                        className={`h-full rounded-full ${isLow ? "bg-[#F7C948]" : "bg-[#7F1D1D]"}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>
            </div>
        </article>
    );
}

export default WarehouseCard;
