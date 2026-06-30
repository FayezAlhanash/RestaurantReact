import { useEffect, useState } from "react";
import { PackagePlus, X } from "lucide-react";

function WarehouseModal({ isOpen, onClose, onSave, ingredient }) {
    const [minQuantity, setMinQuantity] = useState("");
    const [name, setName] = useState("");
    const [quantity, setQuantity] = useState("");
    const [unit, setUnit] = useState("");

    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect */

        if (ingredient) {
            setName(ingredient.name);
            setQuantity(ingredient.current_quantity);
            setMinQuantity(ingredient.min_quantity);
            setUnit(ingredient.unit);
        } else {
            setName("");
            setQuantity("");
            setMinQuantity("");
            setUnit("");
        }

        /* eslint-enable react-hooks/set-state-in-effect */
    }, [ingredient]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm sm:p-6">
            <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-[680px] overflow-y-auto rounded-[30px] bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#EFE5E1] px-5 py-5 sm:px-7">
                    <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#F9ECEC] text-[#7F1D1D]">
                            <PackagePlus size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A08980]">
                                Inventory item
                            </p>
                            <h2 className="text-xl font-black text-[#7F1D1D] sm:text-2xl">
                                {ingredient ? "Edit Ingredient" : "Add Ingredient"}
                            </h2>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="grid h-10 w-10 place-items-center rounded-full bg-[#F8F5F1] text-[#6D5D56] transition hover:bg-[#F9ECEC] hover:text-[#7F1D1D]"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
                    <label className="sm:col-span-2">
                        <span className="mb-2 block text-sm font-extrabold">
                            Ingredient Name
                        </span>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Example: Tomato"
                            className="w-full rounded-2xl border border-[#E4D6CF] px-4 py-3 outline-none transition focus:border-[#7F1D1D] focus:ring-4 focus:ring-[#7F1D1D]/10"
                        />
                    </label>

                    <label>
                        <span className="mb-2 block text-sm font-extrabold">
                            Current Quantity
                        </span>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="0"
                            className="w-full rounded-2xl border border-[#E4D6CF] px-4 py-3 outline-none transition focus:border-[#7F1D1D] focus:ring-4 focus:ring-[#7F1D1D]/10"
                        />
                    </label>

                    <label>
                        <span className="mb-2 block text-sm font-extrabold">
                            Minimum Quantity
                        </span>
                        <input
                            type="number"
                            value={minQuantity}
                            onChange={(e) => setMinQuantity(e.target.value)}
                            placeholder="0"
                            className="w-full rounded-2xl border border-[#E4D6CF] px-4 py-3 outline-none transition focus:border-[#7F1D1D] focus:ring-4 focus:ring-[#7F1D1D]/10"
                        />
                    </label>

                    <label className="sm:col-span-2">
                        <span className="mb-2 block text-sm font-extrabold">
                            Unit
                        </span>
                        <select
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            className="w-full rounded-2xl border border-[#E4D6CF] bg-white px-4 py-3 outline-none transition focus:border-[#7F1D1D] focus:ring-4 focus:ring-[#7F1D1D]/10"
                        >
                            <option value="">Select Unit</option>
                            <option value="kg">Kg</option>
                            <option value="g">Gram</option>
                            <option value="L">Liter</option>
                            <option value="ml">ml</option>
                            <option value="pcs">Pieces</option>
                        </select>
                    </label>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-[#EFE5E1] px-5 py-5 sm:flex-row sm:justify-end sm:px-7">
                    <button
                        onClick={onClose}
                        className="rounded-2xl border border-[#E4D6CF] px-6 py-3 font-bold transition hover:bg-[#F8F5F1]"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={() => {
                            onSave({
                                id: ingredient?.id,
                                name,
                                unit,
                                current_quantity: Number(quantity),
                                min_quantity: Number(minQuantity),
                            });
                        }}
                        className="rounded-2xl bg-[#7F1D1D] px-6 py-3 font-bold text-white transition hover:bg-[#681718]"
                    >
                        Save Ingredient
                    </button>
                </div>
            </div>
        </div>
    );
}

export default WarehouseModal;
