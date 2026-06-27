import api from "../../API/axios";
import { useState, useEffect } from "react";

function AddTableModal({ isOpen, onClose, refresh, editData }) {
    const [tableNumber, setTableNumber] = useState("");
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        if (!isOpen) return;

        if (!editData) {
            setTableNumber("");
            setIsActive(true);
            return;
        }

        setTableNumber(editData.table_number || "");
        setIsActive(Number(editData.is_active) === 1);
    }, [isOpen, editData]);

    const handleSubmit = async () => {
        try {
            if (!tableNumber.trim()) {
                alert("Table number required");
                return;
            }

            const payload = {
                table_number: tableNumber,
                is_active: isActive ? 1 : 0
            };

            if (editData) {
                await api.post(`/tables/${editData.id}`, payload);
            } else {
                await api.post("/tables", payload);
            }

            refresh();
            onClose();

        } catch (error) {
            console.log("ERROR:", error.response?.data || error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white w-[400px] p-6 rounded-2xl">

                <h2 className="text-xl font-bold mb-4">
                    {editData ? "Edit Table" : "Add Table"}
                </h2>

                <input
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full border p-3 rounded-xl"
                    placeholder="Table Number"
                />

                <select
                    value={isActive ? "true" : "false"}
                    onChange={(e) => setIsActive(e.target.value === "true")}
                    className="w-full border p-3 rounded-xl mt-3"
                >
                    <option value="true">Active</option>
                    <option value="false">Not Active</option>
                </select>

                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose}>Cancel</button>

                    <button
                        onClick={handleSubmit}
                        className="bg-red-900 text-white px-4 py-2 rounded-xl"
                    >
                        {editData ? "Update" : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AddTableModal;