import { useState, useEffect } from "react";
import { PackagePlus, Trash2, Pencil } from "lucide-react";
import RefillModal from "./RefillModal";
import WasteModal from "./WasteModal";
import AdjustModal from "./AdjustModal";
import api from "../../API/axios";

function StockActions() {
    const [action, setAction] = useState(null);
    const [page, setPage] = useState(1);
    const [perPage] = useState(5);
    const [selectedIngredient, setSelectedIngredient] = useState(null);
    const [ingredients, setIngredients] = useState([]);
    const [movements, setMovements] = useState([]);
    const getIngredients = async () => {
        const res = await api.get("/restaurants/1/ingredients");
        setIngredients(res.data.data);
    };

    const openAction = (type) => {
        if (!selectedIngredient) {
            alert("Please select an ingredient first");
            return;
        }
        setAction(type);
    }; const getMovements = async () => {
        const res = await api.get("/restaurants/1/stock-movements");
        setMovements(res.data.data);
    };
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        getIngredients();
        getMovements();   // 🔥 جديد
    }, []);

    const refreshAfterAction = async () => {
        const res = await api.get("/restaurants/1/ingredients");
        await getIngredients();
        await getMovements();   // 🔥 مهم
        setAction(null);
        setIngredients(res.data.data);

        // 🔥 أهم سطر
        setSelectedIngredient(prev =>
            res.data.data.find(i => i.id === prev?.id) || null
        );

        setAction(null);
    };
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;

    const paginatedMovements = movements.slice(startIndex, endIndex);
    const totalPages = Math.max(1, Math.ceil(movements.length / perPage));
    const selectedCurrentQuantity = Number(selectedIngredient?.current_quantity ?? 0);
    const selectedMinimumQuantity = Number(selectedIngredient?.min_quantity ?? 0);
    const isSelectedLowStock = selectedCurrentQuantity <= selectedMinimumQuantity;
     return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto">

            {/* TITLE */}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#7F1D1D] mb-6 sm:mb-8">
                Stock Actions
            </h1>

            {/* SELECT */}
            <div className="bg-white shadow-md rounded-2xl p-4 sm:p-6 mb-8 border">

                <label className="block mb-3 font-semibold text-gray-700">
                    Select Ingredient
                </label>

                <select
                    className="w-full p-3 border rounded-xl"
                    value={selectedIngredient?.id || ""}
                    onChange={(e) => {
                        const ing = ingredients.find(i => i.id == e.target.value);
                        setSelectedIngredient(ing);
                    }}
                >
                    <option value="">Choose ingredient...</option>
                    {ingredients.map(i => (
                        <option key={i.id} value={i.id}>
                            {i.name} ({i.current_quantity} {i.unit})
                        </option>
                    ))}
                </select>

                {/* INFO */}
                {selectedIngredient && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">

                        <div className="p-5 rounded-xl border bg-gray-50">
                            <p className="text-sm text-gray-500">Current</p>
                            <p className="text-2xl font-bold text-[#7F1D1D]">
                                {selectedIngredient.current_quantity} {selectedIngredient.unit}
                            </p>
                        </div>

                        <div className="p-5 rounded-xl border bg-gray-50">
                            <p className="text-sm text-gray-500">Minimum</p>
                            <p className="text-2xl font-bold">
                                {selectedIngredient.min_quantity} {selectedIngredient.unit}
                            </p>
                        </div>

                        <div className="p-5 rounded-xl border bg-gray-50">
                            <p className="text-sm text-gray-500">Status</p>

                            <p className={`text-2xl font-bold ${isSelectedLowStock
                                ? "text-red-600"
                                : "text-green-600"
                                }`}>
                                {isSelectedLowStock
                                    ? "LOW STOCK"
                                    : "OK"}
                            </p>
                        </div>

                    </div>
                )}
            </div>

            {/* ACTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* REFILL */}
                <button
                    disabled={!selectedIngredient}
                    onClick={() => openAction("refill")}
                    className={`p-6 rounded-2xl shadow transition
                        ${selectedIngredient
                            ? "bg-green-500 hover:bg-green-600 text-white"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                >
                    <PackagePlus className="mx-auto" size={40} />
                    <p className="mt-3 font-semibold">Refill</p>
                </button>

                {/* WASTE */}
                <button
                    disabled={!selectedIngredient}
                    onClick={() => openAction("waste")}
                    className={`p-6 rounded-2xl shadow transition
                        ${selectedIngredient
                            ? "bg-red-500 hover:bg-red-600 text-white"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                >
                    <Trash2 className="mx-auto" size={40} />
                    <p className="mt-3 font-semibold">Waste</p>
                </button>

                {/* ADJUST */}
                <button
                    disabled={!selectedIngredient}
                    onClick={() => openAction("adjust")}
                    className={`p-6 rounded-2xl shadow transition
                        ${selectedIngredient
                            ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                >
                    <Pencil className="mx-auto" size={40} />
                    <p className="mt-3 font-semibold">Adjust</p>
                </button>

            </div>

            {/* MODALS */}
            {action === "refill" && (
                <RefillModal
                    ingredient={selectedIngredient}
                    onSuccess={refreshAfterAction}
                    onClose={() => setAction(null)}
                />
            )}

            {action === "waste" && (
                <WasteModal
                    ingredient={selectedIngredient}
                    onSuccess={refreshAfterAction}
                    onClose={() => setAction(null)}
                />
            )}

            {action === "adjust" && (
                <AdjustModal
                    ingredient={selectedIngredient}
                    onSuccess={refreshAfterAction}
                    onClose={() => setAction(null)}
                />
            )}

            <div className="mt-10 bg-white p-4 sm:p-6 rounded-2xl shadow-md border">

                <h2 className="text-2xl font-bold mb-6 text-[#7F1D1D]">
                    Stock Movements
                </h2>

                <div className="space-y-4">

                    {paginatedMovements.map((m) => (
                        <div
                            key={m.id}
                            className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center p-4 border rounded-xl"
                        >

                            {/* LEFT */}
                            <div>
                                <p className="font-semibold">
                                    {m.ingredient?.name}
                                </p>

                                <p className="text-sm text-gray-500">
                                    {m.notes}
                                </p>
                            </div>

                            {/* MIDDLE */}
                            <div className="text-left sm:text-center">
                                <p className="font-bold">
                                    {m.quantity}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {m.type}
                                </p>
                            </div>

                            {/* RIGHT */}
                            <div className="text-left sm:text-right text-sm text-gray-500">
                                {new Date(m.created_at).toLocaleString()}
                            </div>

                        </div>
                    ))}

                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                    <button
                        onClick={() => setPage((p) => Math.max(p - 1, 1))}
                        className="px-4 py-2 bg-gray-200 rounded-xl"
                    >
                        Prev
                    </button>

                    {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setPage(i + 1)}
                            className={`px-4 py-2 rounded-xl ${page === i + 1
                                ? "bg-[#7F1D1D] text-white"
                                : "bg-gray-200"
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}

                    <button
                        onClick={() =>
                            setPage((p) => Math.min(p + 1, totalPages))
                        }
                        className="px-4 py-2 bg-gray-200 rounded-xl"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}

export default StockActions;
