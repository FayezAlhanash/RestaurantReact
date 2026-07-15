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
