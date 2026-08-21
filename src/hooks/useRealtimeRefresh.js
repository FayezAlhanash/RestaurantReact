import { useEffect, useRef } from "react";
import { REALTIME_UPDATED_EVENT } from "../services/realtime";

const EMPTY_TOPICS = [];

function eventMatchesTopic(realtimeEvent, topics) {
    if (!topics.length || !realtimeEvent.topic) return true;

    const eventTopics = [
        realtimeEvent.topic,
        ...(Array.isArray(realtimeEvent.topic_aliases)
            ? realtimeEvent.topic_aliases
            : []),
    ];

    return eventTopics.some((topic) => topics.includes(topic));
}

export default function useRealtimeRefresh(onRefresh, options = {}) {
    const onRefreshRef = useRef(onRefresh);
    const topicsRef = useRef(options.topics || EMPTY_TOPICS);

    useEffect(() => {
        onRefreshRef.current = onRefresh;
    }, [onRefresh]);

    useEffect(() => {
        topicsRef.current = options.topics || EMPTY_TOPICS;
    }, [options.topics]);

    useEffect(() => {
        const handleRealtimeUpdate = (event) => {
            const realtimeEvent = event.detail || {};
            const topics = topicsRef.current;

            if (!eventMatchesTopic(realtimeEvent, topics)) {
                return;
            }

            onRefreshRef.current?.(realtimeEvent);
        };

        window.addEventListener(REALTIME_UPDATED_EVENT, handleRealtimeUpdate);

        return () => {
            window.removeEventListener(REALTIME_UPDATED_EVENT, handleRealtimeUpdate);
        };
    }, []);
}
