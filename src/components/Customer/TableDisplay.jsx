import axios from "axios";
import {
    KeyRound,
    Loader2,
    Maximize2,
    WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    getStoredTableDeviceKey,
    removeStoredTableDeviceKey,
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

const buildCustomerSessionPath = (sessionToken) =>
    sessionToken ? `/dine-in/${encodeURIComponent(sessionToken)}` : "";

const buildSessionUrl = (qrPath, sessionToken) => {
    const fallbackPath = buildCustomerSessionPath(sessionToken);
    const nextPath = String(qrPath || fallbackPath).trim();

    if (!nextPath) return "";

    try {
        const url = new URL(nextPath, window.location.origin);

        if (fallbackPath && url.pathname.startsWith("/api/")) {
            return `${window.location.origin}${fallbackPath}`;
        }

        if (nextPath.startsWith("http://") || nextPath.startsWith("https://")) {
            return url.toString();
        }
    } catch {
        // Fall back to path normalization below.
    }

    const normalizedPath = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;

    if (fallbackPath && normalizedPath.startsWith("/api/")) {
        return `${window.location.origin}${fallbackPath}`;
    }

    return `${window.location.origin}${normalizedPath}`;
};

const shouldResetInvalidDevice = (error) => {
    const status = error.response?.status;
    const message = String(error.response?.data?.message || "").toLowerCase();

    return (
        [400, 401, 403, 404, 422].includes(status) ||
        message.includes("required") ||
        message.includes("invalid") ||
        message.includes("not found") ||
        message.includes("device key")
    );
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
    const navigate = useNavigate();
    const screenRef = useRef(null);
    const [deviceKey, setDeviceKey] = useState("");
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [isFullscreen, setIsFullscreen] = useState(false);

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
                    Authorization: `Bearer ${nextDeviceKey}`,
                    "X-Table-Device-Key": nextDeviceKey,
                },
            });
            const nextSession = getActiveSession(response.data, tableId);

            setSession(nextSession);
            setMessage(nextSession.status === "active" ? "" : nextSession.message);
        } catch (error) {
            setSession(null);

            if (shouldResetInvalidDevice(error)) {
                try {
                    removeStoredTableDeviceKey(tableId);
                } catch {
                    // Redirecting to setup is still useful if local storage cleanup fails.
                }
                setDeviceKey("");
                navigate(`/table-setup?table_id=${encodeURIComponent(tableId)}`, { replace: true });
                return;
            }

            setMessage(
                error.response?.data?.message ||
                    "Could not check the table device session."
            );
        } finally {
            setIsLoading(false);
        }
    }, [navigate, tableId]);

    useEffect(() => {
        const timeoutId = window.setTimeout(refreshSession, 0);
        const intervalId = window.setInterval(refreshSession, 7000);

        return () => {
            window.clearTimeout(timeoutId);
            window.clearInterval(intervalId);
        };
    }, [refreshSession]);

    const isActive = session?.status === "active";

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(document.fullscreenElement === screenRef.current);
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);

        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, []);

    const enterFullscreen = async () => {
        if (!screenRef.current || document.fullscreenElement) return;

        try {
            await screenRef.current.requestFullscreen();
        } catch {
            setMessage("Fullscreen was blocked by the browser.");
        }
    };

    useEffect(() => {
        if (isLoading || deviceKey) return;

        navigate("/", { replace: true });
    }, [deviceKey, isLoading, navigate, tableId]);

    return (
        <main
            ref={screenRef}
            className="table-qr-display relative grid min-h-dvh place-items-center overflow-hidden bg-[#101517] p-4 text-white"
        >
            {isActive ? (
                <>
                    {!isFullscreen && (
                        <button
                            type="button"
                            onClick={enterFullscreen}
                            className="table-qr-display-control fixed right-4 top-4 z-10 grid h-12 w-12 place-items-center rounded-2xl border border-[#FFD166]/30 bg-[#101517]/80 text-[#FFD166] shadow-[0_14px_34px_rgba(0,0,0,0.24)] backdrop-blur transition hover:bg-[#172124]"
                            aria-label="Show QR fullscreen"
                            title="Fullscreen"
                        >
                            <Maximize2 size={21} />
                        </button>
                    )}

                    <div className="rounded-[clamp(1.25rem,3vmin,2.25rem)] bg-white p-[clamp(0.75rem,2.4vmin,1.6rem)] shadow-[0_30px_90px_rgba(0,0,0,0.38)]">
                        <img
                            src={session.qrImageUrl}
                            alt={`QR code for table ${session.tableNumber || tableId}`}
                            className="h-[min(82dvh,82dvw)] max-h-[820px] min-h-[260px] w-[min(82dvh,82dvw)] min-w-[260px] max-w-[820px]"
                        />
                    </div>
                </>
            ) : (
                <article className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#20272A] p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.30)]">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-[#FFD166]">
                        {isLoading ? (
                            <Loader2 size={28} className="animate-spin" />
                        ) : deviceKey ? (
                            <WifiOff size={28} />
                        ) : (
                            <KeyRound size={28} />
                        )}
                    </div>
                    <h2 className="mt-5 text-3xl font-black text-white">
                        {isLoading
                            ? "Checking QR"
                            : deviceKey
                                ? "No active QR"
                                : "Device key missing"}
                    </h2>
                    <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-6 text-white/55">
                        {message || "Waiting for an active table session."}
                    </p>
                </article>
            )}
        </main>
    );
}
