import { Bike, CheckCircle2, Clock3, ShoppingBag, Utensils } from "lucide-react";

const orderTypeConfig = {
    delivery: {
        label: "توصيل",
        labelEn: "DELIVERY",
        icon: Bike,
        accent: "#275f9d",
        header: "from-[#244f83] to-[#1a3f6d]",
        badge: "bg-[#e8f1fb] text-[#183d69]",
    },
    takeaway: {
        label: "سفري",
        labelEn: "TAKEAWAY",
        icon: ShoppingBag,
        accent: "#9b7d06",
        header: "from-[#a88705] to-[#7a6306]",
        badge: "bg-[#f8edc4] text-[#5b4704]",
    },
    dine_in: {
        label: "محلي",
        labelEn: "DINE-IN",
        icon: Utensils,
        accent: "#8b0912",
        header: "from-[#960b15] to-[#6f0710]",
        badge: "bg-[#f8dfe1] text-[#6f0710]",
    },
};

function isPreparingStatus(status) {
    return ["preparing", "in_progress", "in_preparation", "started"].includes(
        String(status || "").toLowerCase()
    );
}

export default function OrderCard({
    order,
    onStartPreparing,
    onReady,
    className = "",
}) {
    const type = orderTypeConfig[order.type] || orderTypeConfig.dine_in;
    const TypeIcon = type.icon;
    const isPreparing = isPreparingStatus(order.status);

    return (
        <article
            className={`group flex h-[590px] min-w-0 flex-col overflow-hidden rounded-2xl bg-[#efe5d4] shadow-[0_18px_36px_rgba(0,0,0,0.26)] ring-1 ring-white/10 transition duration-200 hover:z-10 hover:-translate-y-1 hover:scale-[1.015] hover:shadow-[0_24px_46px_rgba(0,0,0,0.34)] ${className}`}
        >
            <header className={`bg-gradient-to-l ${type.header} px-5 py-4 text-white`}>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 rounded-full bg-white/16 px-3 py-2 text-sm font-black">
                        <Clock3 size={17} strokeWidth={2.5} />
                        <span>{order.time}</span>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                        <div>
                            <p className="text-lg font-black leading-none">
                                {type.label}
                            </p>
                            <p className="mt-1 text-xs font-extrabold tracking-wide text-white/72">
                                {type.labelEn}
                            </p>
                        </div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/16">
                            <TypeIcon size={24} strokeWidth={2.5} />
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex min-h-0 flex-1 flex-col px-5 pb-4 pt-5 text-right" dir="rtl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-extrabold text-[#8a7c69]">
                            رقم الطلب
                        </p>
                        <h2 className="mt-1 text-[48px] font-black leading-none tracking-normal text-[#780812]">
                            #{order.id}
                        </h2>
                    </div>

                    <span className={`rounded-full px-3 py-2 text-sm font-black ${type.badge}`}>
                        {order.items.length} أصناف
                    </span>
                </div>

                <div className="kitchen-order-scroll mt-5 min-h-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto pl-2 pr-1">
                    {order.items.map((item) => (
                        <div
                            key={item.id}
                            className="min-w-0 rounded-xl border border-[#dacdbb] bg-[#f7efdf] px-4 py-3 shadow-[0_1px_0_rgba(255,255,255,0.55)_inset] transition duration-200 hover:-translate-y-0.5 hover:border-[#c7b79f] hover:bg-[#fff6e8] hover:shadow-[0_10px_18px_rgba(72,52,29,0.12)]"
                        >
                            <div className="flex min-w-0 items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="break-words text-[24px] font-black leading-8 text-[#17110a]">
                                        {item.name}
                                    </p>
                                    {item.note && (
                                        <p className="mt-2 rounded-lg bg-[#eadfce] px-3 py-2 text-lg font-extrabold leading-7 text-[#5f5345]">
                                            {item.note}
                                        </p>
                                    )}
                                </div>

                                <span
                                    className="flex h-11 min-w-14 shrink-0 items-center justify-center rounded-full text-2xl font-black text-white shadow-sm"
                                    style={{ backgroundColor: type.accent }}
                                >
                                    {item.quantity}x
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <footer className="border-t border-[#ddd0be] bg-[#e8ddca] px-5 pb-5 pt-4">
                <div className={onStartPreparing ? "grid grid-cols-2 gap-3" : "grid"}>
                    {onStartPreparing && (
                        <button
                            type="button"
                            onClick={() => onStartPreparing(order.id)}
                            disabled={isPreparing}
                            className="flex h-16 items-center justify-center rounded-xl border border-[#cbbba5] bg-[#f7efdf] text-base font-black text-[#5f4d34] shadow-sm transition hover:bg-[#fff6e8] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
                        >
                            {isPreparing ? "قيد التحضير" : "بدء التحضير"}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => onReady?.(order.id)}
                        className="flex h-16 items-center justify-center gap-2 rounded-xl bg-[#770812] text-base font-black uppercase tracking-normal text-white shadow-[0_10px_18px_rgba(119,8,18,0.28)] transition hover:bg-[#65070f] active:scale-[0.99]"
                    >
                        <CheckCircle2 size={22} strokeWidth={2.5} />
                        READY
                    </button>
                </div>
            </footer>
        </article>
    );
}
