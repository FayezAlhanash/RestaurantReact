import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

function PermissionToast({ message, onClose, duration = 3000 }) {
    useEffect(() => {
        if (!message) return undefined;

        const timeoutId = window.setTimeout(onClose, duration);

        return () => window.clearTimeout(timeoutId);
    }, [duration, message, onClose]);

    if (!message) return null;

    return (
        <div
            role="alert"
            className="permission-toast fixed left-1/2 top-24 z-[80] w-[min(92vw,460px)] -translate-x-1/2 overflow-hidden rounded-[22px] border border-[#FFD166]/35 bg-[#151A1D]/95 p-1 text-white shadow-[0_26px_70px_rgba(0,0,0,0.36)] ring-1 ring-white/10 backdrop-blur-xl"
        >
            <div className="flex items-start gap-3 rounded-[18px] border border-[#7F1D1D]/25 bg-[linear-gradient(135deg,rgba(127,29,29,0.28),rgba(255,209,102,0.10))] px-4 py-3.5">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[#FFD166]/35 bg-[#FFD166]/14 text-[#FFD166] shadow-[0_10px_24px_rgba(255,209,102,0.10)]">
                    <AlertTriangle size={20} />
                </div>

                <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#FFD166]">
                        Permission needed
                    </p>
                    <p className="mt-1 text-sm font-extrabold leading-5 text-white">
                        {message}
                    </p>
                </div>

                <button
                    type="button"
                    aria-label="Close permission message"
                    onClick={onClose}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-white/70 transition hover:border-[#FFD166]/30 hover:bg-[#FFD166]/12 hover:text-white"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}

export default PermissionToast;
