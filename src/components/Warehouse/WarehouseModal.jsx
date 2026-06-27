import { useState, useEffect } from "react";
import { X } from "lucide-react";

function WarehouseModal({
    isOpen,
    onClose,
    onSave,
    ingredient,
}) {

    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [quantity, setQuantity] = useState("");
    const [unit, setUnit] = useState("");

    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect */

        if (ingredient) {
            setName(ingredient.name);
            setCategory(ingredient.category);
            setQuantity(ingredient.quantity);
            setUnit(ingredient.unit);
        } else {
            setName("");
            setCategory("");
            setQuantity("");
            setUnit("");
        }

        /* eslint-enable react-hooks/set-state-in-effect */
    }, [ingredient]);

    if (!isOpen) return null;

    return (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-3 sm:p-6">

            <div className="bg-white rounded-3xl w-full max-w-[650px] max-h-[calc(100dvh-1.5rem)] overflow-y-auto p-5 sm:p-8 shadow-xl">

                {/* Header */}
                <div className="flex justify-between items-center mb-8">

                    <h2 className="text-2xl sm:text-3xl font-bold text-[#7F1D1D]">

                        {ingredient ? "Edit Ingredient" : "Add Ingredient"}

                    </h2>

                    <button onClick={onClose}>
                        <X size={30} />
                    </button>

                </div>

                {/* Name */}

                <div className="mb-5">

                    <label className="block mb-2 font-semibold">

                        Ingredient Name

                    </label>

                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border rounded-xl px-4 py-3 outline-none"
                    />

                </div>

                {/* Category */}

                <div className="mb-5">

                    <label className="block mb-2 font-semibold">

                        Category

                    </label>

                    <input
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full border rounded-xl px-4 py-3 outline-none"
                    />

                </div>

                {/* Quantity */}

                <div className="mb-5">

                    <label className="block mb-2 font-semibold">

                        Quantity

                    </label>

                    <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full border rounded-xl px-4 py-3 outline-none"
                    />

                </div>

                {/* Unit */}

                <div className="mb-8">

                    <label className="block mb-2 font-semibold">

                        Unit

                    </label>

                    <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-full border rounded-xl px-4 py-3"
                    >

                        <option value="">Select Unit</option>

                        <option value="kg">Kg</option>
                        <option value="g">Gram</option>
                        <option value="L">Liter</option>
                        <option value="ml">ml</option>
                        <option value="pcs">Pieces</option>

                    </select>

                </div>

                {/* Buttons */}

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">

                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl bg-gray-200"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={() => {

                            onSave({
                                name,
                                category,
                                quantity,
                                unit,
                            });

                            onClose();

                        }}
                        className="px-6 py-3 rounded-xl bg-[#7F1D1D] text-white"
                    >
                        Save
                    </button>

                </div>

            </div>

        </div>

    );
}

export default WarehouseModal;
