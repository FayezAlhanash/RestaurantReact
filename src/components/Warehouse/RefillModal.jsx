import { useState } from "react";
import { X } from "lucide-react";
import api from "../../API/axios";
import { ensureCurrentRestaurantId } from "../../utils/restaurant";
import {
    nonNegativeNumberInputProps,
    toNonNegativeNumberValue,
} from "../../utils/nonNegativeNumberInput";

function RefillModal({ onClose, ingredient, onSuccess, restaurantId: selectedRestaurantId }) {

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
                `/restaurants/${restaurantId}/ingredients/${ingredient.id}/stock-in`,
                {
                    quantity: Number(quantity),
                    notes
                }
            );
            await onSuccess();
            closeSmoothly(true);
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message ||
                    "Refill could not be saved. Please try again."
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
                        Refill Stock
                    </h2>
                    <button
                        type="button"
                        onClick={closeSmoothly}
                        disabled={isSubmitting}
                        aria-label="Close refill stock"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-emerald-600/25 !bg-emerald-50 !text-emerald-700 shadow-sm transition hover:border-emerald-600/55 hover:!bg-emerald-600 hover:!text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                <input
                    type="number"
                    {...nonNegativeNumberInputProps}
                    step="0.01"
                    placeholder="Quantity"
                    className="mb-3 w-full rounded-xl border border-white/10 bg-white/[0.06] p-3 text-white outline-none placeholder:text-white/35 focus:border-emerald-400/45 focus:ring-4 focus:ring-emerald-400/10"
                    disabled={isSubmitting}
                    value={quantity}
                    onChange={(e) => setQuantity(toNonNegativeNumberValue(e.target.value))}
                />

                <input
                    placeholder="Notes"
                    className="mb-3 w-full rounded-xl border border-white/10 bg-white/[0.06] p-3 text-white outline-none placeholder:text-white/35 focus:border-emerald-400/45 focus:ring-4 focus:ring-emerald-400/10"
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
                    className="w-full rounded-xl !bg-emerald-600 py-3 font-bold !text-white shadow-[0_14px_28px_rgba(16,185,129,0.20)] transition hover:!bg-emerald-500 disabled:cursor-not-allowed disabled:!bg-[#8EA69B] disabled:!text-white/70"
                >
                    {isSubmitting ? "Please wait..." : "Save"}
                </button>

            </div>

        </div>
    );
}

export default RefillModal;
