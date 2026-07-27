import { useState } from "react";
import { X } from "lucide-react";
import api from "../../API/axios";
import { ensureCurrentRestaurantId } from "../../utils/restaurant";

function WasteModal({ onClose, ingredient, onSuccess, restaurantId: selectedRestaurantId }) {
    const [quantity, setQuantity] = useState("");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [isClosing, setIsClosing] = useState(false);

    const closeSmoothly = (force = false) => {
        if ((!force && isSubmitting) || isClosing) return;

        setIsClosing(true);
        window.setTimeout(onClose, 180);
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;

        setIsSubmitting(true);
        setErrorMessage("");

        try {
            const restaurantId = selectedRestaurantId || (await ensureCurrentRestaurantId());
            if (!restaurantId) {
                setErrorMessage("Restaurant id was not found for this account.");
                return;
            }

            await api.post(
                `/restaurants/${restaurantId}/ingredients/${ingredient.id}/waste`,
                {
                    quantity: Number(quantity),
                    notes,
                }
            );
            await onSuccess();
            closeSmoothly(true);
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message ||
                    "Waste could not be saved. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`${isClosing ? "modal-backdrop-exit" : "modal-backdrop-enter"} fixed inset-0 z-[300] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md`}>
            <div className={`${isClosing ? "modal-panel-exit" : "modal-panel-enter"} w-full max-w-[400px] rounded-[24px] border border-white/10 bg-[#12191C] p-5 text-white shadow-[0_34px_90px_rgba(0,0,0,0.55)] sm:p-6`}>

                <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-xl font-black">
                        Waste Stock
                    </h2>
                    <button
                        type="button"
                        onClick={closeSmoothly}
                        disabled={isSubmitting}
                        aria-label="Close waste stock"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#7F1D1D]/25 !bg-[#FFF4EA] !text-[#7F1D1D] shadow-sm transition hover:border-[#7F1D1D]/55 hover:!bg-[#7F1D1D] hover:!text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                <input
                    placeholder="Quantity"
                    className="mb-3 w-full rounded-xl border border-white/10 bg-white/[0.06] p-3 text-white outline-none placeholder:text-white/35 focus:border-[#7F1D1D]/45 focus:ring-4 focus:ring-[#7F1D1D]/10"
                    disabled={isSubmitting}
                    onChange={(e) => setQuantity(e.target.value)}
                />

                <input
                    placeholder="Notes"
                    className="mb-3 w-full rounded-xl border border-white/10 bg-white/[0.06] p-3 text-white outline-none placeholder:text-white/35 focus:border-[#7F1D1D]/45 focus:ring-4 focus:ring-[#7F1D1D]/10"
                    disabled={isSubmitting}
                    onChange={(e) => setNotes(e.target.value)}
                />

                {errorMessage && (
                    <p className="mb-3 rounded-xl border border-[#7F1D1D]/25 bg-[#7F1D1D]/12 px-3 py-2 text-sm font-bold text-[#7F1D1D]">
                        {errorMessage}
                    </p>
                )}

                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="warehouse-waste-save-button w-full rounded-xl !bg-[#7F1D1D] py-3 font-bold !text-white shadow-[0_14px_28px_rgba(127,29,29,0.22)] transition hover:!bg-[#681718] disabled:cursor-not-allowed disabled:!bg-[#9C8A82] disabled:!text-white/70"
                >
                    {isSubmitting ? "Please wait..." : "Save"}
                </button>

            </div>
        </div>
    );
}

export default WasteModal;
