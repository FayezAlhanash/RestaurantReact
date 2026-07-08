import { getStoredUser } from "../../utils/auth";

export function getManagerRestaurantId() {
  const user = getStoredUser();
  return user?.restaurant_id ?? user?.restaurant?.id ?? null;
}

function getCategoryRestaurantId(category) {
  return category?.restaurant_id ?? category?.restaurant?.id ?? null;
}

export function getResponseList(data, keys = []) {
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;

  return [];
}

export function filterCategoriesByRestaurant(categories, restaurantId) {
  if (!restaurantId) return categories;

  const hasRestaurantScope = categories.some(
    (category) => getCategoryRestaurantId(category) != null
  );

  if (!hasRestaurantScope) return categories;

  return categories.filter(
    (category) => String(getCategoryRestaurantId(category)) === String(restaurantId)
  );
}
