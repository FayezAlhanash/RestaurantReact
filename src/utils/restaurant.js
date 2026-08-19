import api from "../API/axios";
import { getStoredUser, storeUser } from "./auth";

export function getCurrentRestaurantId() {
    const user = getStoredUser();

    const directRestaurantId =
        user?.restaurant_id ??
        user?.restaurant?.id ??
        user?.manager?.restaurant_id ??
        user?.manager?.restaurant?.id ??
        user?.employee?.restaurant_id ??
        user?.employee?.restaurant?.id;

    if (directRestaurantId) return directRestaurantId;

    const permissionRestaurant = user?.user_permissions?.find(
        (permission) =>
            permission?.pivot?.restaurant_id ||
            permission?.restaurant_id ||
            permission?.restaurant?.id
    );

    return (
        permissionRestaurant?.pivot?.restaurant_id ??
        permissionRestaurant?.restaurant_id ??
        permissionRestaurant?.restaurant?.id ??
        null
    );
}

export async function ensureCurrentRestaurantId() {
    const restaurantId = getCurrentRestaurantId();

    if (restaurantId) return restaurantId;

    const user = getStoredUser();

    if (!user) return null;

    const res = await api.get("/profile/permissions");
    storeUser(user, res.data);

    return getCurrentRestaurantId();
}

export function getStorageImageUrl(path, cacheKey = "") {
    if (!path) return "";

    const cleanPath = String(path).replace(/^\/+/, "");
    const normalizedPath = cleanPath
        .replace(/^https?:\/\/46\.101\.112\.67:8000\/storage\//, "https://big4.me/storage/")
        .replace(/^https?:\/\/big4\.me\/storage\//, "https://big4.me/storage/");

    let url = normalizedPath;

    if (!normalizedPath.startsWith("http://") && !normalizedPath.startsWith("https://")) {
        url = normalizedPath.startsWith("storage/")
            ? `https://big4.me/${normalizedPath}`
            : `https://big4.me/storage/${normalizedPath}`;
    }

    if (!cacheKey) return url;

    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}v=${encodeURIComponent(cacheKey)}`;
}
