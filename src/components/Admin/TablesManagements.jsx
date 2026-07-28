import { useEffect, useMemo, useState } from "react";
import {
    CheckCircle2,
    Copy,
    Eye,
    KeyRound,
    LayoutGrid,
    Loader2,
    Pencil,
    Plus,
    RotateCw,
    Search,
    Smartphone,
    Table2,
    Trash2,
    TriangleAlert,
    Utensils,
    X,
} from "lucide-react";
import AddTableModal from "./AddTableModal";
import api from "../../API/axios";
import { useTheme } from "../../context/ThemeContext";

const normalizeActiveValue = (value) =>
    value === true ||
    value === 1 ||
    value === "1" ||
    String(value).toLowerCase() === "true" ||
    String(value).toLowerCase() === "active";

const getDeviceFromResponse = (data) =>
    data?.device ??
    data?.data?.device ??
    data?.table_device ??
    data?.data?.table_device ??
    data?.data ??
    null;

const getDeviceKeyFromResponse = (data) =>
    data?.device_key ??
    data?.data?.device_key ??
    data?.device?.device_key ??
    data?.data?.device?.device_key ??
    data?.table_device?.device_key ??
    data?.data?.table_device?.device_key ??
    "";

const getStoredTableDevice = (tableId) => {
    try {
        return JSON.parse(localStorage.getItem(`table-device:${tableId}`) || "null");
    } catch {
        return null;
    }
};

const storeTableDevice = (tableId, value) => {
    try {
        localStorage.setItem(`table-device:${tableId}`, JSON.stringify(value));
    } catch {
        // Local storage can be disabled; the freshly returned key still stays visible.
    }
};

function StatCard({ icon: Icon, label, value, helper, tone, isLight }) {
    const tones = isLight ? {
        total: "border-sky-300/45 bg-sky-100/80 text-sky-700",
        pending: "border-[#7F1D1D]/45 bg-[#F9ECEC] text-[#7F1D1D]",
        active: "border-[#059669]/55 bg-[#C7F5D8] text-[#065F46]",
    } : {
        total: "border-sky-400/25 bg-sky-400/10 text-sky-300",
        pending: "border-[#7F1D1D]/65 bg-[#7F1D1D]/22 text-[#FFB4A8]",
        active: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    };
    const textColor = isLight ? "text-[#241815]" : "text-white";
    const mutedColor = isLight ? "text-[#6B5A52]" : "text-white/52";

    return (
        <div className={`rounded-[22px] border p-5 shadow-[0_18px_42px_rgba(127,29,29,0.10)] ring-1 ring-white/[0.03] transition hover:-translate-y-1 ${tones[tone]}`}>
            <div className="flex items-start justify-between gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-current/25 bg-current/10 shadow-sm">
                    <Icon size={22} />
                </div>
                <p className={`text-xs font-black uppercase tracking-[0.14em] ${tone === "pending" ? "text-current" : mutedColor}`}>
                    {label}
                </p>
            </div>
            <strong className={`mt-6 block text-5xl font-black leading-none tabular-nums ${textColor}`}>{value}</strong>
            <p className={`mt-2 text-sm font-semibold ${tone === "pending" ? "text-current" : mutedColor}`}>{helper}</p>
        </div>
    );
}

function TableDeviceModal({ isOpen, table, onClose }) {
    const [isVisible, setIsVisible] = useState(false);
    const [deviceName, setDeviceName] = useState("");
    const [deviceKey, setDeviceKey] = useState("");
    const [deviceDetails, setDeviceDetails] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect */
        if (!isOpen || !table) return;

        const storedDevice = getStoredTableDevice(table.id);
        const initialDevice =
            table.device ??
            table.table_device ??
            table.display_device ??
            table.active_device ??
            storedDevice?.device ??
            null;
        const initialDeviceKey =
            table.device_key ??
            initialDevice?.device_key ??
            storedDevice?.device_key ??
            "";

        setIsVisible(false);
        const frameId = window.requestAnimationFrame(() => {
            setIsVisible(true);
        });

        setDeviceName(
            initialDevice?.device_name ||
                storedDevice?.device?.device_name ||
                `Table ${table.table_number} Screen`
        );
        setDeviceKey(initialDeviceKey);
        setDeviceDetails(initialDevice);
        setError("");
        setMessage("");
        setIsCopied(false);

        return () => window.cancelAnimationFrame(frameId);
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [isOpen, table]);

    const closeSmoothly = () => {
        if (isSaving) return;

        setIsVisible(false);
        window.setTimeout(onClose, 160);
    };

    const registerDevice = async () => {
        if (!table || isSaving) return;

        const normalizedDeviceName = deviceName.trim();

        if (!normalizedDeviceName) {
            setError("Device name is required.");
            return;
        }

        try {
            setError("");
            setMessage("");
            setIsSaving(true);

            const formData = new FormData();
            formData.append("device_name", normalizedDeviceName);

            const response = await api.post(
                `/tables/${table.id}/device/register`,
                formData
            );
            const nextDevice = getDeviceFromResponse(response.data);
            const nextDeviceKey = getDeviceKeyFromResponse(response.data);

            setDeviceDetails(nextDevice);
            setDeviceKey(nextDeviceKey);
            setIsCopied(false);

            storeTableDevice(table.id, {
                device: nextDevice,
                device_key: nextDeviceKey,
                saved_at: new Date().toISOString(),
            });
            setMessage(response.data?.message || "Table device registered successfully.");
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Table device could not be registered."
            );
            console.log(error.response?.data || error);
        } finally {
            setIsSaving(false);
        }
    };

    const revokeDevice = async () => {
        if (!table || isSaving) return;

        try {
            setError("");
            setMessage("");
            setIsSaving(true);

            const response = await api.delete(`/tables/${table.id}/device`);

            setDeviceDetails(null);
            setDeviceKey("");
            setIsCopied(false);
            localStorage.removeItem(`table-device:${table.id}`);
            setMessage(response.data?.message || "Table device revoked successfully.");
        } catch (error) {
            setError(error.response?.data?.message || "Table device could not be revoked.");
            console.log(error.response?.data || error);
        } finally {
            setIsSaving(false);
        }
    };

    const copyDeviceKey = async () => {
        if (!deviceKey) return;

        try {
            await navigator.clipboard.writeText(deviceKey);
            setIsCopied(true);
            window.setTimeout(() => setIsCopied(false), 1600);
        } catch {
            setError("Device key is ready, but the browser blocked copying.");
        }
    };

    if (!isOpen || !table) return null;

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
                            <Smartphone size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFD166]">
                                Table device
                            </p>
                            <h2 className="text-2xl font-black text-white">
                                Table {table.table_number}
                            </h2>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={closeSmoothly}
                        className="grid h-10 w-10 place-items-center rounded-2xl text-white/55 transition hover:bg-white/[0.06] hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="grid gap-0 md:grid-cols-[240px_1fr]">
                    <div className="border-b border-white/[0.08] bg-[#0D1214]/45 p-5 md:border-b-0 md:border-r md:border-white/[0.08]">
                        <div className="relative flex h-64 flex-col items-center justify-center rounded-[26px] border border-[#FFD166]/35 bg-[#101A1D] shadow-sm">
                            <span className="absolute right-4 top-4 rounded-full border border-[#FFD166]/30 bg-[#FFD166]/10 px-3 py-1 text-xs font-black text-[#FFD166]">
                                Display
                            </span>

                            <div className="grid h-20 w-20 place-items-center rounded-[24px] border border-[#FFD166]/25 bg-[#FFD166]/10 text-[#FFD166]">
                                <Smartphone size={38} />
                            </div>
                            <p className="mt-6 text-2xl font-black text-white">
                                {deviceDetails?.device_name || deviceName}
                            </p>
                            <p className="mt-2 text-sm font-semibold text-white/42">
                                Device for table #{table.id}
                            </p>
                        </div>
                    </div>

                    <div className="p-5 sm:p-6">
                        {error && (
                            <p className="mb-4 rounded-2xl border border-[#7F1D1D]/30 bg-[#7F1D1D]/10 px-4 py-3 text-sm font-bold text-[#FFB4A8]">
                                {error}
                            </p>
                        )}
                        {message && (
                            <p className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-300">
                                {message}
                            </p>
                        )}

                        <label className="block">
                            <span className="mb-2 block text-sm font-black text-white/65">
                                Device Name
                            </span>
                            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0D1214] px-4 py-3 shadow-inner transition focus-within:border-[#FFD166]/70 focus-within:ring-4 focus-within:ring-[#FFD166]/10">
                                <Smartphone size={19} className="shrink-0 text-[#FFD166]" />
                                <input
                                    value={deviceName}
                                    onChange={(event) => setDeviceName(event.target.value)}
                                    className="min-w-0 flex-1 bg-transparent text-base font-bold text-white outline-none placeholder:text-white/30"
                                    placeholder="Table 1 Screen"
                                />
                            </div>
                        </label>

                        <div className="mt-5 rounded-2xl border border-white/10 bg-[#0D1214] p-4">
                            <div className="flex items-center gap-2 text-sm font-black text-white/65">
                                <KeyRound size={17} className="text-[#FFD166]" />
                                Device Key
                            </div>
                            {deviceKey ? (
                                <div className="mt-3 flex items-stretch gap-2">
                                    <code className="min-w-0 flex-1 break-all rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs font-bold leading-5 text-white/78">
                                        {deviceKey}
                                    </code>
                                    <button
                                        type="button"
                                        onClick={copyDeviceKey}
                                        title="Copy device key"
                                        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#FFD166]/30 bg-[#FFD166]/10 text-[#FFD166] transition hover:bg-[#FFD166]/18"
                                    >
                                        {isCopied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                                    </button>
                                </div>
                            ) : (
                                <p className="mt-3 text-sm font-semibold leading-6 text-white/42">
                                    Register this table display to generate its stable device key.
                                </p>
                            )}
                        </div>

                        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-white/[0.08] pt-5 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={closeSmoothly}
                                className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-black text-white/65 transition hover:bg-white/[0.05] hover:text-white"
                            >
                                Close
                            </button>

                            <button
                                type="button"
                                onClick={revokeDevice}
                                disabled={isSaving}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#7F1D1D]/45 bg-[#7F1D1D]/14 px-5 py-3 text-sm font-black text-[#FFB4A8] transition hover:bg-[#7F1D1D]/22 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSaving ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <Trash2 size={18} />
                                )}
                                Revoke Device
                            </button>

                            <button
                                type="button"
                                onClick={registerDevice}
                                disabled={isSaving}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#9B2C2C_0%,#7F1D1D_48%,#4E1515_100%)] px-5 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(127,29,29,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSaving ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <RotateCw size={18} />
                                )}
                                Register / Replace
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TablesManagements() {
    const { isLight } = useTheme();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [editTable, setEditTable] = useState(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [deviceTable, setDeviceTable] = useState(null);
    const [isDeviceOpen, setIsDeviceOpen] = useState(false);
    const [search, setSearch] = useState("");

    const getTables = async () => {
        try {
            const res = await api.get("/tables");
            const fixed = (res.data.tables || []).map((table) => ({
                ...table,
                is_active: normalizeActiveValue(table.is_active) ? 1 : 0,
            }));

            setTables(fixed);

            return fixed;
        } catch (error) {
            console.log(error);
            return [];
        }
    };

    const deleteTable = async (id) => {
        try {
            await api.delete(`/tables/${id}`);
            getTables();
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        getTables();
    }, []);

    const query = search.trim().toLowerCase();
    const filteredTables = useMemo(() => {
        if (!query) return tables;

        return tables.filter((table) =>
            [`table ${table.table_number}`, table.table_number, Number(table.is_active) === 1 ? "active" : "not active"]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query))
        );
    }, [query, tables]);

    const activeTables = tables.filter((table) => Number(table.is_active) === 1).length;
    const inactiveTables = tables.length - activeTables;

    return (
        <div className={`min-h-full px-4 py-6 sm:px-6 lg:px-7 ${isLight ? "bg-transparent text-[#241815]" : "bg-[linear-gradient(145deg,#0A1012_0%,#111A1D_52%,#24171A_100%)] text-white"}`}>
            <section className={`overflow-hidden rounded-[28px] border shadow-[0_24px_70px_rgba(127,29,29,0.12)] ring-1 ring-white/[0.04] ${isLight ? "border-[#E4CFC3] bg-[#FFF9F2]" : "border-white/10 bg-[linear-gradient(135deg,rgba(22,31,34,0.96)_0%,rgba(32,43,47,0.92)_58%,rgba(49,28,34,0.92)_100%)]"}`}>
                <div className={`flex flex-col gap-5 border-b p-5 lg:flex-row lg:items-center lg:justify-between ${isLight ? "border-[#E4CFC3]" : "border-white/[0.08]"}`}>
                    <div className="flex items-start gap-4">
                        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#9B2C2C_0%,#7F1D1D_48%,#4E1515_100%)] text-white shadow-[0_14px_30px_rgba(127,29,29,0.24)] ring-1 ring-white/10">
                            <LayoutGrid size={27} />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFD166]">
                                Floor plan
                            </p>
                            <h1 className={`mt-1 text-4xl font-black ${isLight ? "text-[#241815]" : "text-white"}`}>
                                Tables Management
                            </h1>
                            <p className={`mt-2 max-w-2xl text-sm font-medium leading-6 ${isLight ? "text-[#6B5A52]" : "text-white/58"}`}>
                                Manage restaurant tables, availability, and floor-plan visibility
                                from one polished workspace.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#9B2C2C_0%,#7F1D1D_48%,#4E1515_100%)] px-5 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(127,29,29,0.26)] transition hover:-translate-y-0.5 hover:brightness-110"
                    >
                        <Plus size={18} />
                        Add Table
                    </button>
                </div>

                <div className="grid gap-4 p-5 lg:grid-cols-3">
                    <StatCard
                        icon={Table2}
                        label="Total"
                        value={tables.length}
                        helper="Restaurant tables"
                        tone="total"
                        isLight={isLight}
                    />
                    <StatCard
                        icon={TriangleAlert}
                        label="Not Active"
                        value={inactiveTables}
                        helper="Hidden or unavailable"
                        tone="pending"
                        isLight={isLight}
                    />
                    <StatCard
                        icon={CheckCircle2}
                        label="Available"
                        value={activeTables}
                        helper="Active on floor plan"
                        tone="active"
                        isLight={isLight}
                    />
                </div>
            </section>

            <section className={`mt-6 overflow-hidden rounded-[28px] border shadow-[0_22px_55px_rgba(127,29,29,0.10)] ring-1 ring-white/[0.03] ${isLight ? "border-[#E4CFC3] bg-[#FFF9F2]" : "border-white/10 bg-[#1B282C]"}`}>
                <div className={`flex flex-col gap-4 border-b p-5 lg:flex-row lg:items-center lg:justify-between ${isLight ? "border-[#E4CFC3] bg-[#FFFDF9]" : "border-white/[0.08] bg-white/[0.025]"}`}>
                    <div>
                        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#FFD166]">
                            Floor Plan Visualizer
                        </p>
                        <h2 className={`mt-1 text-3xl font-black ${isLight ? "text-[#241815]" : "text-white"}`}>
                            {filteredTables.length} table{filteredTables.length === 1 ? "" : "s"}
                        </h2>
                    </div>

                    <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-inner lg:w-[360px] ${isLight ? "border-[#E4CFC3] bg-white" : "border-white/10 bg-[#0D1214]"}`}>
                        <Search size={18} className="shrink-0 text-[#FFD166]" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search tables..."
                            className={`min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none ${isLight ? "text-[#241815] placeholder:text-[#8A7972]" : "text-white placeholder:text-white/35"}`}
                        />
                    </div>
                </div>

                <div className="grid gap-5 p-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {filteredTables.map((table) => {
                        const isActive = Number(table.is_active) === 1;

                        return (
                            <article
                                key={table.id}
                                className={`group relative min-h-[280px] overflow-hidden rounded-[28px] border p-5 ring-1 ring-white/[0.03] transition hover:-translate-y-1 ${
                                    isActive
                                        ? isLight
                                            ? "border-[#059669]/45 hover:border-[#047857]/65"
                                            : "border-emerald-400/35 hover:border-emerald-400/55"
                                        : "border-[#7F1D1D]/35 hover:border-[#7F1D1D]/55"
                                } ${isLight
                                    ? "bg-white shadow-[0_16px_34px_rgba(127,29,29,0.08)] hover:shadow-[0_24px_58px_rgba(127,29,29,0.12)]"
                                    : "bg-[#101A1D] shadow-[0_16px_34px_rgba(0,0,0,0.22)] hover:shadow-[0_24px_58px_rgba(0,0,0,0.34)]"
                                }`}
                            >
                                <div className={`absolute inset-x-0 top-0 h-1 ${isActive ? (isLight ? "bg-[#059669]" : "bg-emerald-400") : "bg-[#7F1D1D]"}`} />
                                <span
                                    className={`absolute right-4 top-4 rounded-full border px-3 py-1 text-xs font-black ${
                                        isActive
                                            ? isLight
                                                ? "border-[#059669]/35 bg-[#D1FAE5] text-[#047857]"
                                                : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                                            : "border-[#7F1D1D]/30 bg-[#7F1D1D]/10 text-[#7F1D1D]"
                                    }`}
                                >
                                    {isActive ? "Active" : "Not Active"}
                                </span>

                                <div className="mt-8 flex justify-center">
                                    <div className={`grid h-24 w-24 place-items-center rounded-[28px] border transition group-hover:scale-105 ${
                                        isActive
                                            ? isLight
                                                ? "border-[#059669]/30 bg-[#D1FAE5] text-[#059669]"
                                                : "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                                            : "border-[#7F1D1D]/25 bg-[#7F1D1D]/10 text-[#7F1D1D]"
                                    }`}>
                                        <Utensils size={40} />
                                    </div>
                                </div>

                                <h3 className={`mt-6 text-center text-3xl font-black ${isLight ? "text-[#241815]" : "text-white"}`}>
                                    Table {table.table_number}
                                </h3>
                                <p className={`mt-2 text-center text-sm font-semibold ${isLight ? "text-[#8A7972]" : "text-white/42"}`}>
                                    ID #{table.id}
                                </p>

                                <div className={`mt-8 border-t pt-4 ${isLight ? "border-[#E4CFC3]" : "border-white/[0.08]"}`}>
                                    <div className="flex justify-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedTable(table);
                                                setIsViewOpen(true);
                                            }}
                                            title="View table"
                                            className="grid h-10 w-10 place-items-center rounded-xl border border-sky-400/30 bg-sky-400/10 text-sky-300 transition hover:scale-110 hover:bg-sky-400/18"
                                        >
                                            <Eye size={18} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDeviceTable(table);
                                                setIsDeviceOpen(true);
                                            }}
                                            title="Register table device"
                                            className="grid h-10 w-10 place-items-center rounded-xl border border-[#FFD166]/30 bg-[#FFD166]/10 text-[#FFD166] transition hover:scale-110 hover:bg-[#FFD166]/18"
                                        >
                                            <Smartphone size={18} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditTable(table);
                                                setIsEditOpen(true);
                                            }}
                                            title="Edit table"
                                            className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white/65 transition hover:scale-110 hover:bg-white/[0.08] hover:text-white"
                                        >
                                            <Pencil size={18} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => deleteTable(table.id)}
                                            title="Delete table"
                                            className="grid h-10 w-10 place-items-center rounded-xl border border-[#7F1D1D]/30 bg-[#7F1D1D]/10 text-[#7F1D1D] transition hover:scale-110 hover:bg-[#7F1D1D]/18"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}

                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className={`group min-h-[280px] rounded-[28px] border border-dashed border-[#FFD166]/45 p-5 text-[#FFD166] transition hover:-translate-y-1 hover:border-[#FFD166]/70 ${isLight ? "bg-[#FFFDF9] shadow-[0_16px_34px_rgba(127,29,29,0.08)] hover:bg-[#FFF4EA] hover:shadow-[0_24px_58px_rgba(127,29,29,0.12)]" : "bg-[#101A1D] shadow-[0_16px_34px_rgba(0,0,0,0.18)] hover:bg-[#142125] hover:shadow-[0_24px_58px_rgba(0,0,0,0.30)]"}`}
                    >
                        <div className="flex h-full flex-col items-center justify-center">
                            <div className="grid h-20 w-20 place-items-center rounded-[26px] border border-dashed border-[#FFD166]/40 bg-[#FFD166]/10 text-[#FFD166] transition group-hover:scale-105 group-hover:border-[#FFD166]">
                                <Plus size={32} />
                            </div>
                            <p className={`mt-6 text-xl font-black ${isLight ? "text-[#241815]" : "text-white"}`}>New Table</p>
                            <p className={`mt-2 text-sm font-semibold ${isLight ? "text-[#8A7972]" : "text-white/45"}`}>
                                Add another floor-plan spot
                            </p>
                        </div>
                    </button>
                </div>
            </section>

            <AddTableModal
                isOpen={isModalOpen || isEditOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setIsEditOpen(false);
                    setEditTable(null);
                }}
                editData={editTable}
                refresh={getTables}
            />

            <TableDeviceModal
                isOpen={isDeviceOpen}
                table={deviceTable}
                onClose={() => {
                    setIsDeviceOpen(false);
                    setDeviceTable(null);
                }}
            />

            {isViewOpen && selectedTable && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#182124] p-6 text-white shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFD166]">
                                    Table details
                                </p>
                                <h2 className="mt-1 text-2xl font-black text-white">
                                    Table {selectedTable.table_number}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsViewOpen(false)}
                                className="grid h-10 w-10 place-items-center rounded-2xl text-white/55 transition hover:bg-white/[0.06] hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mt-5 rounded-2xl border border-white/10 bg-[#0D1214] p-4">
                            <div className="flex justify-between text-sm font-bold text-white/55">
                                <span>Number</span>
                                <span className="text-white">
                                    {selectedTable.table_number}
                                </span>
                            </div>
                            <div className="mt-3 flex justify-between text-sm font-bold text-white/55">
                                <span>Status</span>
                                <span
                                    className={
                                        Number(selectedTable.is_active) === 1
                                            ? "text-emerald-700"
                                            : "text-[#7F1D1D]"
                                    }
                                >
                                    {Number(selectedTable.is_active) === 1 ? "Active" : "Not Active"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TablesManagements;
