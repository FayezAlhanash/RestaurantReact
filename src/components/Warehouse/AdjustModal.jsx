import { useState } from "react";
import api from "../../API/axios";
import { ensureCurrentRestaurantId } from "../../utils/restaurant";

function AdjustModal({ onClose, ingredient, onSuccess }) {
    const [newQuantity, setNewQuantity] = useState("");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async () => {
        if (isSubmitting) return;

        setIsSubmitting(true);
        setErrorMessage("");

        try {
            const restaurantId = await ensureCurrentRestaurantId();
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
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white p-5 sm:p-6 rounded-2xl w-full max-w-[400px] shadow-2xl">

                <h2 className="text-xl font-bold mb-4">
                    Adjust Stock
                </h2>

                <input
                    placeholder="New Quantity"
                    className="border p-3 w-full mb-3 rounded-xl outline-none focus:border-[#7F1D1D]"
                    disabled={isSubmitting}
                    onChange={(e) => setNewQuantity(e.target.value)}
                />

                <input
                    placeholder="Notes"
                    className="border p-3 w-full mb-3 rounded-xl outline-none focus:border-[#7F1D1D]"
                    disabled={isSubmitting}
                    onChange={(e) => setNotes(e.target.value)}
                />

                {errorMessage && (
                    <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                        {errorMessage}
                    </p>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-yellow-500 text-white w-full py-3 rounded-xl font-bold disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                    {isSubmitting ? "Please wait..." : "Save"}
                </button>

            </div>
        </div>
    );
}

export default AdjustModal;
