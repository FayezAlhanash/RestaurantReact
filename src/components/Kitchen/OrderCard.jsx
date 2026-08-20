import { Bike, CheckCircle2, Clock3, Loader2, ShoppingBag, Utensils } from "lucide-react";

const orderTypeConfig = {
    delivery: {
        label: "Delivery",
        labelEn: "DELIVERY",
        icon: Bike,
        accent: "#275f9d",
        header: "from-[#244f83] to-[#1a3f6d]",
        badge: "bg-[#e8f1fb] text-[#183d69]",
    },
    takeaway: {
        label: "Takeaway",
        labelEn: "TAKEAWAY",
        icon: ShoppingBag,
        accent: "#9b7d06",
        header: "from-[#a88705] to-[#7a6306]",
        badge: "bg-[#f8edc4] text-[#5b4704]",
    },
    dine_in: {
        label: "Dine-In",
        labelEn: "DINE-IN",
        icon: Utensils,
        accent: "#8b0912",
        header: "from-[#960b15] to-[#6f0710]",
        badge: "bg-[#f8dfe1] text-[#6f0710]",
    },
};

function normalizeStatus(status) {
    const value = String(status || "pending")
        .toLowerCase()
        .replaceAll("-", "_")
        .replaceAll(" ", "_");

    if (["preparing", "in_progress", "in_preparation", "started"].includes(value)) {
        return "preparing";
    }

    if (["ready", "completed", "done"].includes(value)) {
        return "ready";
    }

    return "pending";
}

const statusLabels = {
    pending: "Waiting to Prepare",
    preparing: "Preparing",
    ready: "Ready",
};

const statusClasses = {
    pending: "bg-[#fff2cf] text-[#76550a]",
    preparing: "bg-[#dff1ff] text-[#174d77]",
    ready: "bg-[#dff7e7] text-[#176636]",
};

function canStartPreparing(status) {
    return normalizeStatus(status) === "pending";
}

function canMarkReady(status, waitingForPreparation) {
    return normalizeStatus(status) === "preparing" && !waitingForPreparation;
}

function formatItemCount(count) {
    return `${count} ${count === 1 ? "item" : "items"}`;
}

const sizeNoteTokens = new Set([
    "xs",
    "extra small",
    "small",
    "sm",
    "medium",
    "md",
    "large",
    "lg",
    "xl",
    "extra large",
]);

function normalizeNoteToken(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}

function getItemNoteSections(note) {
    const segments = String(note || "")
        .split("·")
        .map((segment) => segment.trim())
        .filter(Boolean);
    const details = [];
    const notes = [];

    segments.forEach((segment) => {
        if (segment.includes(":")) {
            details.push(segment);
            return;
        }

        if (sizeNoteTokens.has(normalizeNoteToken(segment))) {
            const hasSizeDetail = details.some(
                (detail) =>
                    normalizeNoteToken(detail.slice(0, detail.indexOf(":"))) ===
                    "size"
            );

            if (!hasSizeDetail) {
                details.push(`Size: ${segment}`);
            }

            return;
        }

        notes.push(segment);
    });

    return {
        details,
        notes,
    };
}

function renderDetail(detail) {
    const separatorIndex = detail.indexOf(":");

    if (separatorIndex === -1) return detail;

    const label = detail.slice(0, separatorIndex).trim();
    const value = detail.slice(separatorIndex + 1).trim();

    return (
        <>
            <span className="font-black text-[#3f3427]">{label}</span>
            {value && <span className="font-bold text-[#6b5d4e]">: {value}</span>}
        </>
    );
}

export default function OrderCard({
    order,
    onStartPreparing,
    onReady,
    pendingAction = "",
    className = "",
}) {
    const type = orderTypeConfig[order.type] || orderTypeConfig.dine_in;
    const TypeIcon = type.icon;
    const normalizedStatus = normalizeStatus(order.status);
    const waitingForPreparation = Boolean(order.waiting_for_preparation);
    const statusLabel = waitingForPreparation
        ? "Waiting for Preparation"
        : statusLabels[normalizedStatus];
    const isStarting = pendingAction === "start";
    const isMarkingReady = pendingAction === "ready";
    const isUpdating = Boolean(pendingAction);

    return (
        <article
            className={`group flex h-[590px] min-w-0 flex-col overflow-hidden rounded-2xl bg-[#efe5d4] shadow-[0_18px_36px_rgba(0,0,0,0.26)] ring-1 ring-white/10 transition duration-200 hover:z-10 hover:-translate-y-1 hover:scale-[1.015] hover:shadow-[0_24px_46px_rgba(0,0,0,0.34)] ${className}`}
        >
            <header className={`bg-gradient-to-l ${type.header} px-5 py-4 text-white`}>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="flex items-center gap-2 rounded-full bg-white/16 px-3 py-2 text-sm font-black justify-self-start">
                        <Clock3 size={17} strokeWidth={2.5} />
                        <span>{order.time}</span>
                    </div>

                    <div className="text-center">
                        <p className="text-[42px] font-black leading-none tracking-normal text-[#efe5d4]">
                            {order.id}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 justify-self-end text-left">
                        <p className="text-base font-black leading-none">
                            {type.label}
                        </p>
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/16">
                            <TypeIcon size={24} strokeWidth={2.5} />
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex min-h-0 flex-1 flex-col px-5 pb-4 pt-4 text-left">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-extrabold uppercase tracking-wide text-[#8a7c69]">
                            Items
                    </span>

                    <span className={`rounded-full px-3 py-2 text-sm font-black ${type.badge}`}>
                        {formatItemCount(order.items.length)}
                    </span>

                    <span className={`rounded-full px-4 py-2 text-sm font-black ${statusClasses[normalizedStatus]}`}>
                        {statusLabel}
                    </span>
                </div>

                <div className="kitchen-order-scroll mt-3 min-h-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto pl-2 pr-1">
                    {order.items.map((item) => {
                        const { details, notes } = getItemNoteSections(item.note);

                        return (
                            <div
                                key={item.id}
                                className="min-w-0 rounded-xl border border-[#dacdbb] bg-[#f7efdf] px-4 py-3 shadow-[0_1px_0_rgba(255,255,255,0.55)_inset] transition duration-200 hover:-translate-y-0.5 hover:border-[#c7b79f] hover:bg-[#fff6e8] hover:shadow-[0_10px_18px_rgba(72,52,29,0.12)]"
                            >
                                <div className="flex min-w-0 items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="break-words text-[25px] font-black leading-8 text-[#17110a]">
                                            {item.name}
                                        </p>
                                        {details.length > 0 && (
                                            <div className="mt-2 rounded-lg bg-[#efe5d4] px-3 py-2 text-lg font-extrabold leading-7 text-[#5f5345]">
                                                {details.map((detail) => (
                                                    <p key={detail} className="break-words">
                                                        {renderDetail(detail)}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                        {notes.length > 0 && (
                                            <div className="mt-2 rounded-lg border border-[#c7b79f] bg-[#efe5d4] px-3 py-2">
                                                <p className="text-[11px] font-black uppercase leading-4 tracking-wide text-[#8b0912]">
                                                    Note
                                                </p>
                                                <p className="break-words text-lg font-black leading-7 text-[#3f3427]">
                                                    {notes.join(" · ")}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <span
                                        className="flex h-10 min-w-12 shrink-0 items-center justify-center rounded-full px-3 text-xl font-black text-white shadow-sm"
                                        style={{ backgroundColor: type.accent }}
                                    >
                                        {item.quantity}x
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <footer className="border-t border-[#ddd0be] bg-[#e8ddca] px-5 pb-5 pt-4">
                <div className="grid">
                    {canStartPreparing(order.status) && onStartPreparing && (
                        <button
                            type="button"
                            onClick={() => onStartPreparing(order.id)}
                            disabled={isUpdating}
                            className="flex h-16 items-center justify-center gap-2 rounded-xl border border-[#cbbba5] bg-[#f7efdf] text-base font-black text-[#5f4d34] shadow-sm transition hover:bg-[#fff6e8] active:scale-[0.99] disabled:cursor-wait disabled:opacity-75 disabled:hover:bg-[#f7efdf]"
                        >
                            {isStarting && <Loader2 size={21} className="animate-spin" />}
                            {isStarting ? "Please wait..." : "Start Preparing"}
                        </button>
                    )}

                    {canMarkReady(order.status, waitingForPreparation) && (
                        <button
                            type="button"
                            onClick={() => onReady?.(order.id)}
                            disabled={isUpdating}
                            className="flex h-16 items-center justify-center gap-2 rounded-xl bg-[#770812] text-base font-black uppercase tracking-normal text-white shadow-[0_10px_18px_rgba(119,8,18,0.28)] transition hover:bg-[#65070f] active:scale-[0.99] disabled:cursor-wait disabled:opacity-75 disabled:hover:bg-[#770812]"
                        >
                            {isMarkingReady ? (
                                <Loader2 size={22} className="animate-spin" />
                            ) : (
                                <CheckCircle2 size={22} strokeWidth={2.5} />
                            )}
                            {isMarkingReady ? (
                                "Please wait..."
                            ) : (
                                <>
                                    Ready
                                </>
                            )}
                        </button>
                    )}
                </div>
            </footer>
        </article>
    );
}
