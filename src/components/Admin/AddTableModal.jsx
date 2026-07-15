import api from "../../API/axios";
import { useState, useEffect } from "react";
import { CheckCircle2, Hash, Loader2, Save, Table2, XCircle } from "lucide-react";

const normalizeActiveValue = (value) =>
    value === true ||
    value === 1 ||
    value === "1" ||
    String(value).toLowerCase() === "true" ||
    String(value).toLowerCase() === "active";

const getCreatedTable = (data) =>
    data?.table ??
    data?.data?.table ??
    data?.data ??
    data?.created_table ??
    data?.createdTable ??
    null;

function AddTableModal({ isOpen, onClose, refresh, editData }) {
    const [tableNumber, setTableNumber] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect */
        if (!isOpen) return;

        if (!editData) {
            setTableNumber("");
            setIsActive(true);
            setError("");
            return;
        }

        setTableNumber(editData.table_number || "");
        setIsActive(normalizeActiveValue(editData.is_active));
        setError("");
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [isOpen, editData]);

    const handleSubmit = async () => {
        if (isSaving) return;

        try {
            if (!tableNumber.trim()) {
                setError("Table number is required.");
                return;
            }

            setError("");
            setIsSaving(true);

            const formData = new FormData();
            formData.append("table_number", tableNumber.trim());
            formData.append("is_active", isActive ? "1" : "0");

            if (editData) {
                await api.post(`/tables/${editData.id}`, formData);
            } else {
                const response = await api.post("/tables", formData);
                const createdTable = getCreatedTable(response.data);

                if (!isActive) {
                    const refreshedTables = await refresh();
                    const createdId =
                        createdTable?.id ??
                        refreshedTables
                            .slice()
                            .reverse()
                            .find(
                                (table) =>
                                    String(table.table_number) ===
                                    String(tableNumber.trim())
                            )?.id;

                    if (createdId) {
                        const inactiveFormData = new FormData();
                        inactiveFormData.append("table_number", tableNumber.trim());
                        inactiveFormData.append("is_active", "0");

                        await api.post(`/tables/${createdId}`, inactiveFormData);
                    }
                }
            }

            await refresh();
            onClose();

        } catch (error) {
            setError(error.response?.data?.message || "Table could not be saved.");
            console.log("ERROR:", error.response?.data || error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#241F1D]/45 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-stone-950/20">
                <div className="flex items-center justify-between border-b border-[#EFE3DD] bg-gradient-to-r from-[#FFF7F2] via-white to-[#F8F1EC] px-5 py-5 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#7F1D1D] text-white shadow-[0_12px_28px_rgba(127,29,29,0.18)]">
                            <Table2 size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9A7A70]">
                                Floor plan
                            </p>
                            <h2 className="text-2xl font-black text-[#241F1D]">
                                {editData ? "Edit Table" : "Add New Table"}
                            </h2>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="grid h-10 w-10 place-items-center rounded-2xl text-[#7A6A64] transition hover:bg-[#F9ECEC] hover:text-[#7F1D1D]"
                    >
                        <XCircle size={22} />
                    </button>
                </div>

                <div className="grid gap-0 md:grid-cols-[240px_1fr]">
                    <div className="border-b border-[#EFE3DD] bg-[#F8F5F1] p-5 md:border-b-0 md:border-r">
                        <div className={`relative flex h-64 flex-col items-center justify-center rounded-[26px] border-4 bg-white shadow-sm ${
                            isActive ? "border-emerald-400" : "border-rose-300"
                        }`}>
                            <span className={`absolute right-0 top-0 rounded-bl-2xl rounded-tr-[21px] px-3 py-1 text-xs font-black text-white ${
                                isActive ? "bg-emerald-600" : "bg-rose-600"
                            }`}>
                                {isActive ? "Active" : "Not Active"}
                            </span>

                            <div className="grid h-20 w-20 place-items-center rounded-full bg-[#F1EEE9] text-[#241F1D]">
                                <Table2 size={38} />
                            </div>
                            <p className="mt-6 text-3xl font-black text-[#241F1D]">
                                Table {tableNumber || "--"}
                            </p>
                            <p className="mt-2 text-sm font-semibold text-[#8C7B74]">
                                Live preview
                            </p>
                        </div>
                    </div>

                    <div className="p-5 sm:p-6">
                        {error && (
                            <p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                                {error}
                            </p>
                        )}

                        <label className="block">
                            <span className="mb-2 block text-sm font-black text-[#4A403D]">
                                Table Number
                            </span>
                            <div className="flex items-center gap-3 rounded-2xl border border-[#E4D6CF] bg-white px-4 py-3 shadow-sm transition focus-within:border-[#7F1D1D] focus-within:ring-4 focus-within:ring-[#7F1D1D]/10">
                                <Hash size={19} className="shrink-0 text-[#A08980]" />
                                <input
                                    value={tableNumber}
                                    onChange={(e) => setTableNumber(e.target.value)}
                                    className="min-w-0 flex-1 bg-transparent text-base font-bold text-[#241F1D] outline-none placeholder:text-[#B39D93]"
                                    placeholder="Example: 12"
                                />
                            </div>
                        </label>

                        <div className="mt-5">
                            <p className="mb-2 text-sm font-black text-[#4A403D]">
                                Table Status
                            </p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={() => setIsActive(true)}
                                    className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                                        isActive
                                            ? "border-emerald-300 bg-emerald-50 text-emerald-900 shadow-sm"
                                            : "border-[#E4D6CF] bg-white text-[#6D5D56] hover:bg-[#F8F5F1]"
                                    }`}
                                >
                                    <CheckCircle2 size={22} />
                                    <span>
                                        <span className="block text-sm font-black">Active</span>
                                        <span className="text-xs font-semibold opacity-70">
                                            Available on floor plan
                                        </span>
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setIsActive(false)}
                                    className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                                        !isActive
                                            ? "border-rose-300 bg-rose-50 text-rose-900 shadow-sm"
                                            : "border-[#E4D6CF] bg-white text-[#6D5D56] hover:bg-[#F8F5F1]"
                                    }`}
                                >
                                    <XCircle size={22} />
                                    <span>
                                        <span className="block text-sm font-black">Not Active</span>
                                        <span className="text-xs font-semibold opacity-70">
                                            Hidden or unavailable
                                        </span>
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-2xl border border-[#E4D6CF] bg-white px-5 py-3 text-sm font-black text-[#6D5D56] transition hover:bg-[#F8F5F1] hover:text-[#241F1D]"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSaving}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#7F1D1D] px-5 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(127,29,29,0.18)] transition hover:bg-[#681718] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSaving ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <Save size={18} />
                                )}
                                {editData ? "Update Table" : "Save Table"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddTableModal;
