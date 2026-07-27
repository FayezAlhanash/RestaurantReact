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
    const [isVisible, setIsVisible] = useState(false);
    const [tableNumber, setTableNumber] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect */
        if (!isOpen) return;

        setIsVisible(false);
        const frameId = window.requestAnimationFrame(() => {
            setIsVisible(true);
        });

        if (!editData) {
            setTableNumber("");
            setIsActive(true);
            setError("");
        } else {
            setTableNumber(editData.table_number || "");
            setIsActive(normalizeActiveValue(editData.is_active));
            setError("");
        }
        /* eslint-enable react-hooks/set-state-in-effect */

        return () => window.cancelAnimationFrame(frameId);
    }, [isOpen, editData]);

    const closeSmoothly = () => {
        if (isSaving) return;

        setIsVisible(false);
        window.setTimeout(onClose, 160);
    };

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
            setIsVisible(false);
            window.setTimeout(onClose, 160);

        } catch (error) {
            setError(error.response?.data?.message || "Table could not be saved.");
            console.log("ERROR:", error.response?.data || error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm transition-opacity duration-200 ease-out ${
                isVisible ? "opacity-100" : "opacity-0"
            }`}
        >
            <div
                className={`w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/10 bg-[#182124] text-white shadow-2xl transition duration-200 ease-out will-change-transform ${
                    isVisible
                        ? "translate-y-0 scale-100 opacity-100"
                        : "translate-y-4 scale-[0.98] opacity-0"
                }`}
            >
                <div className="flex items-center justify-between border-b border-white/[0.08] bg-[radial-gradient(circle_at_100%_0%,rgba(127,29,29,0.16),transparent_34%),rgba(255,255,255,0.03)] px-5 py-5 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[linear-gradient(135deg,#9B2C2C_0%,#7F1D1D_48%,#4E1515_100%)] text-white shadow-[0_12px_28px_rgba(127,29,29,0.22)]">
                            <Table2 size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFD166]">
                                Floor plan
                            </p>
                            <h2 className="text-2xl font-black text-white">
                                {editData ? "Edit Table" : "Add New Table"}
                            </h2>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={closeSmoothly}
                        className="grid h-10 w-10 place-items-center rounded-2xl text-white/55 transition hover:bg-white/[0.06] hover:text-white"
                    >
                        <XCircle size={22} />
                    </button>
                </div>

                <div className="grid gap-0 md:grid-cols-[240px_1fr]">
                    <div className="border-b border-white/[0.08] bg-[#0D1214]/45 p-5 md:border-b-0 md:border-r md:border-white/[0.08]">
                        <div className={`relative flex h-64 flex-col items-center justify-center rounded-[26px] border bg-[#101A1D] shadow-sm ${
                            isActive ? "border-emerald-400/40" : "border-[#7F1D1D]/40"
                        }`}>
                            <span className={`absolute right-4 top-4 rounded-full border px-3 py-1 text-xs font-black ${
                                isActive
                                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                                    : "border-[#7F1D1D]/30 bg-[#7F1D1D]/10 text-[#7F1D1D]"
                            }`}>
                                {isActive ? "Active" : "Not Active"}
                            </span>

                            <div className={`grid h-20 w-20 place-items-center rounded-[24px] border ${
                                isActive
                                    ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                                    : "border-[#7F1D1D]/25 bg-[#7F1D1D]/10 text-[#7F1D1D]"
                            }`}>
                                <Table2 size={38} />
                            </div>
                            <p className="mt-6 text-3xl font-black text-white">
                                Table {tableNumber || "--"}
                            </p>
                            <p className="mt-2 text-sm font-semibold text-white/42">
                                Live preview
                            </p>
                        </div>
                    </div>

                    <div className="p-5 sm:p-6">
                        {error && (
                            <p className="mb-4 rounded-2xl border border-[#7F1D1D]/30 bg-[#7F1D1D]/10 px-4 py-3 text-sm font-bold text-[#7F1D1D]">
                                {error}
                            </p>
                        )}

                        <label className="block">
                            <span className="mb-2 block text-sm font-black text-white/65">
                                Table Number
                            </span>
                            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0D1214] px-4 py-3 shadow-inner transition focus-within:border-[#FFD166]/70 focus-within:ring-4 focus-within:ring-[#FFD166]/10">
                                <Hash size={19} className="shrink-0 text-[#FFD166]" />
                                <input
                                    value={tableNumber}
                                    onChange={(e) => setTableNumber(e.target.value)}
                                    className="min-w-0 flex-1 bg-transparent text-base font-bold text-white outline-none placeholder:text-white/30"
                                    placeholder="Example: 12"
                                />
                            </div>
                        </label>

                        <div className="mt-5">
                            <p className="mb-2 text-sm font-black text-white/65">
                                Table Status
                            </p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={() => setIsActive(true)}
                                    className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                                        isActive
                                            ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-300 shadow-sm"
                                            : "border-white/10 bg-[#0D1214] text-white/55 hover:bg-white/[0.04] hover:text-white"
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
                                            ? "border-[#7F1D1D]/35 bg-[#7F1D1D]/10 text-[#7F1D1D] shadow-sm"
                                            : "border-white/10 bg-[#0D1214] text-white/55 hover:bg-white/[0.04] hover:text-white"
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

                        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-white/[0.08] pt-5 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={closeSmoothly}
                                className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-black text-white/65 transition hover:bg-white/[0.05] hover:text-white"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSaving}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#9B2C2C_0%,#7F1D1D_48%,#4E1515_100%)] px-5 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(127,29,29,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
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
