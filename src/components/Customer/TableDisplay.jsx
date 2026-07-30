import axios from "axios";
import {
    CheckCircle2,
    Copy,
    ExternalLink,
    KeyRound,
    RefreshCw,
    Table2,
    Utensils,
    WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getStoredTableDeviceKey } from "../../utils/tableDeviceKeys";

const tableDeviceApi = axios.create({
    baseURL: "https://big4.me/api",
});

const getSessionToken = (data) =>
    data?.session_token ??
    data?.sessionToken ??
    data?.data?.session_token ??
    data?.data?.sessionToken ??
    data?.session?.session_token ??
    data?.session?.sessionToken ??
    data?.data?.session?.session_token ??
    data?.data?.session?.sessionToken ??
    "";

const getQrPath = (data, sessionToken) =>
    data?.qr_path ??
    data?.qrPath ??
    data?.data?.qr_path ??
    data?.data?.qrPath ??
    (sessionToken ? `/dine-in/${sessionToken}` : "");

const buildSessionUrl = (qrPath, sessionToken) => {
    const fallbackPath = sessionToken ? `/dine-in/${sessionToken}` : "";
    const nextPath = String(qrPath || fallbackPath).trim();

    if (!nextPath) return "";
    if (nextPath.startsWith("http://") || nextPath.startsWith("https://")) return nextPath;

    return `${window.location.origin}${nextPath.startsWith("/") ? nextPath : `/${nextPath}`}`;
};

const getActiveSession = (data, tableId) => {
    const hasActiveSession =
        data?.has_active_session ??
        data?.hasActiveSession ??
        data?.data?.has_active_session ??
        data?.data?.hasActiveSession;
    const sessionToken = getSessionToken(data);

    if (hasActiveSession === false || hasActiveSession === 0 || hasActiveSession === "0") {
        return {
            status: "inactive",
            message: "No active session",
        };
    }

    if (!sessionToken) {
        return {
            status: "missing-token",
            message: "Active session, but no session token was returned.",
        };
    }

    const table = data?.table ?? data?.data?.table ?? {};
    const session = data?.session ?? data?.data?.session ?? {};
    const qrPath = getQrPath(data, sessionToken);
    const sessionUrl = buildSessionUrl(qrPath, sessionToken);

    return {
        status: "active",
        tableNumber:
            table?.table_number ??
            table?.tableNumber ??
            tableId,
        sessionId: session?.id ?? "",
        openedAt: session?.opened_at ?? session?.openedAt ?? "",
        sessionToken,
        sessionUrl,
        qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=420x420&margin=18&data=${encodeURIComponent(sessionUrl)}`,
    };
};

export default function TableDisplay() {
    const { tableId = "" } = useParams();
    const [deviceKey, setDeviceKey] = useState("");
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [isCopied, setIsCopied] = useState(false);

    const refreshSession = useCallback(async () => {
        const nextDeviceKey = getStoredTableDeviceKey(tableId);

        setDeviceKey(nextDeviceKey);
        setIsLoading(true);
        setMessage("");

        if (!nextDeviceKey) {
            setSession(null);
            setMessage("No device key is saved for this table on this browser.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await tableDeviceApi.get("/table-device/current-session", {
                headers: {
                    Accept: "application/json",
                    "X-Table-Device-Key": nextDeviceKey,
                },
            });
            const nextSession = getActiveSession(response.data, tableId);

            setSession(nextSession);
            setMessage(nextSession.status === "active" ? "" : nextSession.message);
        } catch (error) {
            setSession(null);
            setMessage(
                error.response?.data?.message ||
                    "Could not check the table device session."
            );
        } finally {
            setIsLoading(false);
        }
    }, [tableId]);

    useEffect(() => {
        const timeoutId = window.setTimeout(refreshSession, 0);
        const intervalId = window.setInterval(refreshSession, 7000);

        return () => {
            window.clearTimeout(timeoutId);
            window.clearInterval(intervalId);
        };
    }, [refreshSession]);

    const copySessionUrl = async () => {
        if (!session?.sessionUrl) return;

        try {
            await navigator.clipboard.writeText(session.sessionUrl);
            setIsCopied(true);
            window.setTimeout(() => setIsCopied(false), 1600);
        } catch {
            setMessage("The session link is visible, but the browser blocked copying.");
        }
    };

    const isActive = session?.status === "active";
    const isDisplayError =
        !isLoading &&
        !isActive &&
        (!deviceKey || !session || session.status === "missing-token");
    const errorCode = deviceKey
        ? "ERR_TABLE_DISPLAY_UNAVAILABLE"
        : "ERR_TABLE_DISPLAY_NOT_REGISTERED";

    if (isDisplayError) {
        return (
            <main className="min-h-dvh bg-[#202124] px-6 py-24 text-[#bdc1c6]">
                <section className="mx-auto w-full max-w-xl">
                    <div className="mb-7 text-[#9aa0a6]">
                        {deviceKey ? <WifiOff size={52} strokeWidth={1.7} /> : <KeyRound size={52} strokeWidth={1.7} />}
                    </div>
                    <h1 className="text-2xl font-normal text-[#e8eaed] sm:text-[28px]">
                        This site can't be reached
                    </h1>
                    <p className="mt-4 text-[15px] leading-6 text-[#bdc1c6]">
                        {message || "This table display cannot load its active session right now."}
                    </p>
                    <p className="mt-6 text-[15px] text-[#bdc1c6]">Try:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-7 text-[15px] leading-6 text-[#bdc1c6]">
                        <li>Checking the table display registration</li>
                        <li>Opening a table session from the waiter screen</li>
                        <li>Refreshing this page</li>
                    </ul>
                    <p className="mt-5 text-xs uppercase tracking-wide text-[#9aa0a6]">
                        {errorCode}
                    </p>
                    <button
                        type="button"
                        onClick={refreshSession}
                        className="mt-7 inline-flex h-9 items-center justify-center gap-2 rounded bg-[#8ab4f8] px-4 text-sm font-medium text-[#202124] transition hover:bg-[#a8c7fa]"
                    >
                        <RefreshCw size={15} />
                        Reload
                    </button>
                </section>
            </main>
        );
    }

    return (
        <main className="min-h-dvh bg-[radial-gradient(circle_at_82%_12%,rgba(127,29,29,0.22),transparent_30%),radial-gradient(circle_at_14%_20%,rgba(255,209,102,0.15),transparent_24%),linear-gradient(145deg,#101517_0%,#171D20_48%,#26181B_100%)] px-4 py-6 text-white sm:px-6">
            <section className="mx-auto flex min-h-[calc(100dvh-48px)] max-w-5xl flex-col">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
                    <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#7F1D1D] text-white shadow-[0_14px_30px_rgba(127,29,29,0.24)]">
                            <Utensils size={23} />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFD166]">
                                Big-4 table display
                            </p>
                            <h1 className="text-3xl font-black text-white">
                                Table {session?.tableNumber || tableId}
                            </h1>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={refreshSession}
                        disabled={isLoading}
                        className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#FFD166]/30 bg-[#FFD166]/10 px-4 text-sm font-black text-[#FFD166] transition hover:bg-[#FFD166]/18 disabled:opacity-60"
                    >
                        <RefreshCw size={17} />
                        {isLoading ? "Checking..." : "Refresh"}
                    </button>
                </header>

                <div className="grid flex-1 place-items-center py-8">
                    <article className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#20272A] p-5 text-center shadow-[0_24px_70px_rgba(0,0,0,0.30)] sm:p-8">
                        {isActive ? (
                            <>
                                <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-300">
                                    <CheckCircle2 size={17} />
                                    Active session {session.sessionId ? `#${session.sessionId}` : ""}
                                </p>

                                <div className="mx-auto mt-7 w-full max-w-[360px] rounded-[24px] border border-white/10 bg-white p-4">
                                    <img
                                        src={session.qrImageUrl}
                                        alt={`QR code for table ${session.tableNumber || tableId}`}
                                        className="h-auto w-full"
                                    />
                                </div>

                                <p className="mt-5 break-all rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-bold text-white/64">
                                    {session.sessionUrl}
                                </p>

                                <div className="mt-5 grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={copySessionUrl}
                                        className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#FFD166]/30 bg-[#FFD166]/10 text-sm font-black text-[#FFD166] transition hover:bg-[#FFD166]/18"
                                    >
                                        <Copy size={18} />
                                        {isCopied ? "Copied" : "Copy"}
                                    </button>
                                    <a
                                        href={session.sessionUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#FFD166] text-sm font-black text-[#151A1D] transition hover:bg-[#ffdc82]"
                                    >
                                        <ExternalLink size={18} />
                                        Open
                                    </a>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-[#FFD166]">
                                    {deviceKey ? <WifiOff size={28} /> : <KeyRound size={28} />}
                                </div>
                                <h2 className="mt-5 text-3xl font-black text-white">
                                    {deviceKey ? "No active QR" : "Device key missing"}
                                </h2>
                                <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-6 text-white/55">
                                    {message || "Waiting for an active table session."}
                                </p>
                            </>
                        )}
                    </article>
                </div>

                <footer className="flex items-center justify-center gap-2 border-t border-white/10 pt-5 text-xs font-bold text-white/40">
                    <Table2 size={15} />
                    Virtual table display for table {tableId}
                </footer>
            </section>
        </main>
    );
}
