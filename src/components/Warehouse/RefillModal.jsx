import { useState } from "react";
import api from "../../API/axios";

function RefillModal({ onClose, ingredient, onSuccess }) {

    const [quantity, setQuantity] = useState("");
    const [notes, setNotes] = useState("");

    const handleSubmit = async () => {
        await api.post(
            `/restaurants/1/ingredients/${ingredient.id}/stock-in`,
            {
                quantity: Number(quantity),
                notes
            }
        );
        await onSuccess();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">

            <div className="bg-white p-5 sm:p-6 rounded-2xl w-full max-w-[400px] shadow-2xl">

                <h2 className="text-xl font-bold mb-4">
                    Refill Stock
                </h2>

                <input
                    placeholder="Quantity"
                    className="border p-3 w-full mb-3 rounded-xl outline-none focus:border-[#7F1D1D]"
                    onChange={(e) => setQuantity(e.target.value)}
                />

                <input
                    placeholder="Notes"
                    className="border p-3 w-full mb-3 rounded-xl outline-none focus:border-[#7F1D1D]"
                    onChange={(e) => setNotes(e.target.value)}
                />

                <button
                    onClick={handleSubmit}
                    className="bg-green-500 text-white w-full py-3 rounded-xl font-bold"
                >
                    Save
                </button>

            </div>

        </div>
    );
}

export default RefillModal;
