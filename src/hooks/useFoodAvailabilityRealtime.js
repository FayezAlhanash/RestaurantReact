import { useEffect } from "react";
import { createEcho } from "../services/realtime";
import { getStoredToken } from "../utils/auth";

const REALTIME_EVENT_NAME = ".realtime.updated";

export default function useFoodAvailabilityRealtime(restaurantIds, onAvailabilityUpdate) {
    useEffect(() => {
        const uniqueRestaurantIds = Array.from(
            new Set(
                restaurantIds
                    .filter((restaurantId) => restaurantId !== undefined && restaurantId !== null)
                    .map(String)
                    .filter(Boolean)
            )
        );

        if (!uniqueRestaurantIds.length) return undefined;

        const echo = createEcho(getStoredToken() || "");

        if (!echo) return undefined;

        const channelNames = uniqueRestaurantIds.map(
            (restaurantId) => `restaurant-menu.${restaurantId}`
        );

        channelNames.forEach((channelName) => {
            echo.channel(channelName).listen(REALTIME_EVENT_NAME, (event) => {
                if (
                    event?.type !== "food_availability_updated" &&
                    event?.type !== "modifier_availability_updated"
                ) {
                    return;
                }

                onAvailabilityUpdate(event);
            });
        });

        return () => {
            channelNames.forEach((channelName) => {
                echo.leave(channelName);
            });

            echo.disconnect();
        };
    }, [onAvailabilityUpdate, restaurantIds]);
}
