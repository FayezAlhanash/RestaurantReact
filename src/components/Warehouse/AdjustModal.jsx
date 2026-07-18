import { useState } from "react";
import api from "../../API/axios";
import { ensureCurrentRestaurantId } from "../../utils/restaurant";

function AdjustModal({ onClose, ingredient, onSuccess, restaurantId: selectedRestaurantId }) {
    const [newQuantity, setNewQuantity] = useState("");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

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
                `/restaurants/${restaurantId}/ingredients/${ingredient.id}/adjust-stock`,
                {
                    new_quantity: Number(newQuantity),
                    notes,
                }
            );
            await onSuccess();
            onClose();
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message ||
                    "Adjustment could not be saved. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-md">
            <div className="w-full max-w-[400px] rounded-[24px] border border-white/10 bg-[#12191C] p-5 text-white shadow-[0_34px_90px_rgba(0,0,0,0.55)] sm:p-6">

                <h2 className="mb-4 text-xl font-black">
                    Adjust Stock
                </h2>

                <input
                    placeholder="New Quantity"
                    className="mb-3 w-full rounded-xl border border-white/10 bg-white/[0.06] p-3 text-white outline-none placeholder:text-white/35 focus:border-[#FFD166]/45 focus:ring-4 focus:ring-[#FFD166]/10"
                    disabled={isSubmitting}
                    onChange={(e) => setNewQuantity(e.target.value)}
                />

                <input
                    placeholder="Notes"
                    className="mb-3 w-full rounded-xl border border-white/10 bg-white/[0.06] p-3 text-white outline-none placeholder:text-white/35 focus:border-[#FFD166]/45 focus:ring-4 focus:ring-[#FFD166]/10"
                    disabled={isSubmitting}
                    onChange={(e) => setNotes(e.target.value)}
                />

                {errorMessage && (
                    <p className="mb-3 rounded-xl border border-[#7F1D1D]/25 bg-[#7F1D1D]/12 px-3 py-2 text-sm font-bold text-[#7F1D1D]">
                        {errorMessage}
                    </p>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full rounded-xl bg-[#FFD166] py-3 font-bold text-[#151A1D] transition hover:bg-[#ffdc82] disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/35"
                >
                    {isSubmitting ? "Please wait..." : "Save"}
                </button>

            </div>
        </div>
    );
}

export default AdjustModal;
