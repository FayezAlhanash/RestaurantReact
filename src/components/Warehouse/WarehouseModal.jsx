import { useEffect, useState } from "react";
import { PackagePlus, X } from "lucide-react";

function WarehouseModal({ isOpen, onClose, onSave, ingredient }) {
    const [isVisible, setIsVisible] = useState(false);
    const [minQuantity, setMinQuantity] = useState("");
    const [name, setName] = useState("");
    const [quantity, setQuantity] = useState("");
    const [unit, setUnit] = useState("");

    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect */

        if (!isOpen) return undefined;

        setIsVisible(false);
        const frameId = window.requestAnimationFrame(() => {
            setIsVisible(true);
        });

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

        return () => window.cancelAnimationFrame(frameId);
    }, [ingredient, isOpen]);

    const closeSmoothly = () => {
        setIsVisible(false);
        window.setTimeout(onClose, 160);
    };

    const handleSave = () => {
        setIsVisible(false);
        window.setTimeout(() => {
            onSave({
                id: ingredient?.id,
                name,
                unit,
                current_quantity: Number(quantity),
                min_quantity: Number(minQuantity),
            });
        }, 120);
    };

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-[300] flex items-center justify-center bg-black/65 p-3 backdrop-blur-md transition-opacity duration-200 ease-out sm:p-6 ${
                isVisible ? "opacity-100" : "opacity-0"
            }`}
        >
            <div
                className={`cashier-scroll max-h-[calc(100dvh-1.5rem)] w-full max-w-[680px] overflow-y-auto rounded-[30px] border border-white/10 bg-[#12191C] text-white shadow-[0_34px_90px_rgba(0,0,0,0.55)] transition duration-200 ease-out will-change-transform ${
                    isVisible
                        ? "translate-y-0 scale-100 opacity-100"
                        : "translate-y-4 scale-[0.98] opacity-0"
                }`}
            >
                <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-5 sm:px-7">
                    <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#7F1D1D]/14 text-[#7F1D1D]">
                            <PackagePlus size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#FFD166]">
                                Inventory item
                            </p>
                            <h2 className="text-xl font-black text-white sm:text-2xl">
                                {ingredient ? "Edit Ingredient" : "Add Ingredient"}
                            </h2>
                        </div>
                    </div>

                    <button
                        onClick={closeSmoothly}
                        className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.07] text-white/65 transition hover:bg-[#7F1D1D] hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
                    <label className="sm:col-span-2">
                        <span className="mb-2 block text-sm font-extrabold text-white/82">
                            Ingredient Name
                        </span>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Example: Tomato"
                            className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-[#FFD166]/45 focus:ring-4 focus:ring-[#FFD166]/10"
                        />
                    </label>

                    <label>
                        <span className="mb-2 block text-sm font-extrabold text-white/82">
                            Current Quantity
                        </span>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="0"
                            className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-[#FFD166]/45 focus:ring-4 focus:ring-[#FFD166]/10"
                        />
                    </label>

                    <label>
                        <span className="mb-2 block text-sm font-extrabold text-white/82">
                            Minimum Quantity
                        </span>
                        <input
                            type="number"
                            value={minQuantity}
                            onChange={(e) => setMinQuantity(e.target.value)}
                            placeholder="0"
                            className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-[#FFD166]/45 focus:ring-4 focus:ring-[#FFD166]/10"
                        />
                    </label>

                    <label className="sm:col-span-2">
                        <span className="mb-2 block text-sm font-extrabold text-white/82">
                            Unit
                        </span>
                        <select
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            className="w-full rounded-2xl border border-white/10 bg-[#0F1517] px-4 py-3 text-white outline-none transition focus:border-[#FFD166]/45 focus:ring-4 focus:ring-[#FFD166]/10"
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

                <div className="flex flex-col-reverse gap-3 border-t border-white/[0.08] px-5 py-5 sm:flex-row sm:justify-end sm:px-7">
                    <button
                        onClick={closeSmoothly}
                        className="rounded-2xl border border-white/10 px-6 py-3 font-bold text-white/70 transition hover:bg-white/[0.07] hover:text-white"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSave}
                        className="rounded-2xl bg-[#7F1D1D] px-6 py-3 font-bold text-white shadow-[0_14px_28px_rgba(127,29,29,0.20)] transition hover:bg-[#681718]"
                    >
                        Save Ingredient
                    </button>
                </div>
            </div>
        </div>
    );
}

export default WarehouseModal;
