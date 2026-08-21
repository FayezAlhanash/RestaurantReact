import Echo from "laravel-echo";
import Pusher from "pusher-js";

export const REALTIME_UPDATED_EVENT = "big4:realtime-updated";
export const ORDERS_UPDATED_EVENT = "big4:orders-updated";
export const AUTH_CHANGED_EVENT = "big4:auth-changed";

const DEFAULT_REVERB_PORT = 443;
const PLACEHOLDER_APP_KEY = "PUT_REVERB_APP_KEY_HERE";
const DEFAULT_AUTH_ENDPOINT = "https://big4.me/api/broadcasting/auth";

window.Pusher = Pusher;

export function hasRealtimeConfig() {
    const appKey = import.meta.env.VITE_REVERB_APP_KEY;

    return Boolean(appKey && appKey !== PLACEHOLDER_APP_KEY);
}

export function createEcho(token = "") {
    if (!hasRealtimeConfig()) return null;

    const port = Number(import.meta.env.VITE_REVERB_PORT || DEFAULT_REVERB_PORT);
    const scheme = import.meta.env.VITE_REVERB_SCHEME || "https";
    const isSecure = scheme === "https";
    const transports = isSecure ? ["wss"] : ["ws"];

    return new Echo({
        broadcaster: "reverb",
        key: import.meta.env.VITE_REVERB_APP_KEY,

        wsHost: import.meta.env.VITE_REVERB_HOST,
        wsPort: port,
        wssPort: port,

        forceTLS: isSecure,
        enabledTransports: transports,

        authEndpoint:
            import.meta.env.VITE_BROADCAST_AUTH_ENDPOINT || DEFAULT_AUTH_ENDPOINT,

        auth: {
            headers: {
                Accept: "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        },
    });
}
