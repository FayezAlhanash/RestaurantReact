import axios from "axios";
import {
    CheckCircle2,
    KeyRound,
    Loader2,
    Save,
    Smartphone,
    Table2,
    Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    getStoredTableDeviceKey,
    removeStoredTableDeviceKey,
    saveStoredTableDeviceKey,
} from "../../utils/tableDeviceKeys";
import { getAppLanguage } from "../../utils/language";

const tableDeviceApi = axios.create({
    baseURL: "https://big4.me/api",
});

tableDeviceApi.interceptors.request.use((config) => {
    config.headers = config.headers || {};
    config.headers.Accept = config.headers.Accept || "application/json";
    config.headers["Accept-Language"] = config.headers["Accept-Language"] || getAppLanguage();

    return config;
});

const normalizeDeviceKey = (value) => String(value || "").trim();

const getResponseTableId = (data) =>
    data?.table_id ??
    data?.tableId ??
    data?.table?.id ??
    data?.data?.table_id ??
    data?.data?.tableId ??
    data?.data?.table?.id ??
    data?.device?.table_id ??
    data?.device?.tableId ??
    data?.data?.device?.table_id ??
    data?.data?.device?.tableId ??
    data?.table_device?.table_id ??
    data?.table_device?.tableId ??
    data?.data?.table_device?.table_id ??
    data?.data?.table_device?.tableId ??
    "";

export default function TableDeviceSetup() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const initialDeviceKey = normalizeDeviceKey(
        searchParams.get("device_key") || searchParams.get("deviceKey") || ""
    );
    const initialTableId = initialDeviceKey
        ? String(searchParams.get("table_id") || searchParams.get("tableId") || "")
        : "";
    const isTableIdLocked = Boolean(initialTableId && initialDeviceKey);
    const hasSetupPayload = Boolean(initialTableId && initialDeviceKey);

    const [tableId, setTableId] = useState(initialTableId);
    const [deviceKey, setDeviceKey] = useState(initialDeviceKey);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isPairing, setIsPairing] = useState(false);

    const savedDeviceKey = getStoredTableDeviceKey(tableId);
    const canPair = tableId.trim() && normalizeDeviceKey(deviceKey);
    const displayUrl = useMemo(() => {
        const normalizedTableId = tableId.trim();

        return normalizedTableId ? `/table/${encodeURIComponent(normalizedTableId)}` : "";
    }, [tableId]);

    useEffect(() => {
        if (hasSetupPayload) return;

        navigate("/", { replace: true });
    }, [hasSetupPayload, navigate]);

    const pairDevice = async () => {
        const normalizedTableId = tableId.trim();
        const normalizedDeviceKey = normalizeDeviceKey(deviceKey);

        if (!normalizedTableId || !normalizedDeviceKey) {
            setError("Table ID and device key are required.");
            return false;
        }

        setIsPairing(true);
        setMessage("");

        try {
            const response = await tableDeviceApi.get("/table-device/current-session", {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${normalizedDeviceKey}`,
                    "X-Table-Device-Key": normalizedDeviceKey,
                },
            });
            const responseTableId = getResponseTableId(response.data);

            if (responseTableId && String(responseTableId) !== String(normalizedTableId)) {
                setError("This device key belongs to another table.");
                return false;
            }

            saveStoredTableDeviceKey(normalizedTableId, normalizedDeviceKey);
            setError("");
            setMessage("Device paired on this browser.");
            return true;
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Device key could not be validated for this table."
            );
            return false;
        } finally {
            setIsPairing(false);
        }
    };

    const handlePair = async () => {
        if ((await pairDevice()) && displayUrl) {
            window.setTimeout(() => navigate(displayUrl), 300);
        }
    };

    const clearCurrentDevice = () => {
        const normalizedTableId = tableId.trim();

        if (!normalizedTableId) return;

        try {
            removeStoredTableDeviceKey(normalizedTableId);
            setMessage("Saved key removed from this browser.");
            setError("");
        } catch {
            setError("This browser blocked clearing the saved table device key.");
        }
    };

    return (
        <main className="table-device-setup min-h-dvh bg-[radial-gradient(circle_at_82%_12%,rgba(127,29,29,0.22),transparent_30%),radial-gradient(circle_at_14%_20%,rgba(255,209,102,0.15),transparent_24%),linear-gradient(145deg,#101517_0%,#171D20_48%,#26181B_100%)] px-4 py-6 text-white sm:px-6">
            <section className="mx-auto flex min-h-[calc(100dvh-48px)] max-w-3xl flex-col">
                <header className="flex items-center gap-3 border-b border-white/10 pb-5">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#7F1D1D] text-white shadow-[0_14px_30px_rgba(127,29,29,0.24)]">
                        <Smartphone size={23} />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFD166]">
                            Big-4 table setup
                        </p>
                        <h1 className="text-3xl font-black text-white">Pair table display</h1>
                    </div>
                </header>

                <div className="grid flex-1 place-items-center py-8">
                    <article className="w-full rounded-[28px] border border-white/10 bg-[#20272A] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.30)] sm:p-8">
                        {message && (
                            <p className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-300">
                                {message}
                            </p>
                        )}
                        {error && (
                            <p className="mb-4 rounded-2xl border border-[#7F1D1D]/30 bg-[#7F1D1D]/12 px-4 py-3 text-sm font-black text-[#FFB4A8]">
                                {error}
                            </p>
                        )}

                        <div className="grid gap-4">
                            <label className="block">
                                <span className="mb-2 block text-sm font-black text-white/65">
                                    Table ID
                                </span>
                                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#101517] px-4 py-3 shadow-inner transition focus-within:border-[#FFD166]/70 focus-within:ring-4 focus-within:ring-[#FFD166]/10">
                                    <Table2 size={19} className="shrink-0 text-[#FFD166]" />
                                    <input
                                        value={tableId}
                                        onChange={(event) => {
                                            if (!isTableIdLocked) setTableId(event.target.value);
                                        }}
                                        readOnly={isTableIdLocked}
                                        aria-readonly={isTableIdLocked}
                                        className={`min-w-0 flex-1 bg-transparent text-base font-bold outline-none placeholder:text-white/30 ${
                                            isTableIdLocked ? "cursor-not-allowed text-white/70" : "text-white"
                                        }`}
                                        placeholder="1"
                                    />
                                    {isTableIdLocked && (
                                        <span className="shrink-0 rounded-xl border border-[#FFD166]/25 bg-[#FFD166]/10 px-3 py-1 text-xs font-black text-[#FFD166]">
                                            Locked
                                        </span>
                                    )}
                                </div>
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-sm font-black text-white/65">
                                    Device Key
                                </span>
                                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#101517] px-4 py-3 shadow-inner transition focus-within:border-[#FFD166]/70 focus-within:ring-4 focus-within:ring-[#FFD166]/10">
                                    <KeyRound size={19} className="shrink-0 text-[#FFD166]" />
                                    <input
                                        value={deviceKey}
                                        onChange={(event) => setDeviceKey(event.target.value)}
                                        className="min-w-0 flex-1 bg-transparent text-base font-bold text-white outline-none placeholder:text-white/30"
                                        placeholder="TDEV-..."
                                    />
                                </div>
                            </label>
                        </div>

                        {savedDeviceKey && (
                            <p className="mt-5 break-all rounded-2xl border border-[#FFD166]/25 bg-[#FFD166]/10 px-4 py-3 text-xs font-bold leading-5 text-[#FFD166]">
                                Saved key for this table: {savedDeviceKey}
                            </p>
                        )}

                        <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                            <button
                                type="button"
                                onClick={handlePair}
                                disabled={!canPair || isPairing}
                                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#FFD166] px-5 text-sm font-black text-[#151A1D] shadow-[0_14px_28px_rgba(255,209,102,0.16)] transition hover:bg-[#ffdc82] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isPairing ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {isPairing ? "Checking..." : "Confirm Pairing"}
                            </button>
                            <button
                                type="button"
                                onClick={clearCurrentDevice}
                                disabled={!tableId.trim()}
                                className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#7F1D1D]/35 bg-[#7F1D1D]/12 px-5 text-sm font-black text-[#FFB4A8] transition hover:bg-[#7F1D1D]/18 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Trash2 size={18} />
                                Clear
                            </button>
                            {savedDeviceKey && displayUrl && (
                                <button
                                    type="button"
                                    onClick={() => navigate(displayUrl)}
                                    className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-5 text-sm font-black text-emerald-300 transition hover:bg-emerald-400/18"
                                >
                                    <CheckCircle2 size={18} />
                                    Display
                                </button>
                            )}
                        </div>
                    </article>
                </div>
            </section>
        </main>
    );
}
