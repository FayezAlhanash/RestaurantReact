import { useEffect, useRef, useState } from "react";
import api from "../../API/axios";
import {
    AUTH_CHANGED_EVENT,
    ORDERS_UPDATED_EVENT,
    REALTIME_UPDATED_EVENT,
    createEcho,
    hasRealtimeConfig,
} from "../../services/realtime";
import { getStoredToken } from "../../utils/auth";

const REALTIME_EVENT_NAME = ".realtime.updated";
const REALTIME_DEBOUNCE_MS = 300;

function normalizeChannelList(channels) {
    return Array.isArray(channels)
        ? channels.filter((channel) => typeof channel === "string" && channel.trim())
        : [];
}

function normalizeSubscriptions(payload) {
    const subscriptions = payload?.data || payload || {};

    return {
        event:
            subscriptions.event ||
            subscriptions.event_name ||
            subscriptions.eventName ||
            REALTIME_EVENT_NAME,
        privateChannels: [
            ...normalizeChannelList(subscriptions.private_channels),
            ...normalizeChannelList(subscriptions.privateChannels),
            ...normalizeChannelList(subscriptions.private),
        ],
        publicChannels: [
            ...normalizeChannelList(subscriptions.public_channels),
            ...normalizeChannelList(subscriptions.publicChannels),
            ...normalizeChannelList(subscriptions.channels),
            ...normalizeChannelList(subscriptions.public),
        ],
    };
}

export default function RealtimeManager() {
    const [token, setToken] = useState(() => getStoredToken());
    const echoRef = useRef(null);
    const debounceRef = useRef(null);
    const latestEventRef = useRef(null);

    useEffect(() => {
        const syncToken = () => {
            setToken(getStoredToken());
        };

        window.addEventListener(AUTH_CHANGED_EVENT, syncToken);
        window.addEventListener("storage", syncToken);
        window.addEventListener("focus", syncToken);

        return () => {
            window.removeEventListener(AUTH_CHANGED_EVENT, syncToken);
            window.removeEventListener("storage", syncToken);
            window.removeEventListener("focus", syncToken);
        };
    }, []);

    useEffect(() => {
        if (!token || !hasRealtimeConfig()) {
            echoRef.current?.disconnect();
            echoRef.current = null;
            return undefined;
        }

        let isActive = true;
        const echo = createEcho(token);
        const subscribedChannels = new Set();

        if (!echo) return undefined;

        echoRef.current = echo;
        window.Echo = echo;

        const emitRealtimeUpdate = (event) => {
            latestEventRef.current = event;
            window.clearTimeout(debounceRef.current);

            debounceRef.current = window.setTimeout(() => {
                const detail = latestEventRef.current || {};

                window.dispatchEvent(
                    new CustomEvent(REALTIME_UPDATED_EVENT, { detail })
                );
                window.dispatchEvent(
                    new CustomEvent(ORDERS_UPDATED_EVENT, { detail })
                );
            }, REALTIME_DEBOUNCE_MS);
        };

        const subscribe = async () => {
            try {
                const response = await api.get("/realtime/subscriptions");
                const subscriptions = normalizeSubscriptions(response.data);
                const eventName = subscriptions.event;

                subscriptions.privateChannels.forEach((channelName) => {
                    echo.private(channelName).listen(eventName, emitRealtimeUpdate);
                    subscribedChannels.add(channelName);
                });

                subscriptions.publicChannels.forEach((channelName) => {
                    echo.channel(channelName).listen(eventName, emitRealtimeUpdate);
                    subscribedChannels.add(channelName);
                });
            } catch (error) {
                if (!isActive) return;

                console.error(
                    "Could not start realtime subscriptions.",
                    error.response?.data || error
                );
            }
        };

        subscribe();

        return () => {
            isActive = false;
            window.clearTimeout(debounceRef.current);
            subscribedChannels.forEach((channelName) => {
                echo.leave(channelName);
            });
            echo.disconnect();

            if (echoRef.current === echo) {
                echoRef.current = null;
            }
            if (window.Echo === echo) {
                delete window.Echo;
            }
        };
    }, [token]);

    return null;
}
