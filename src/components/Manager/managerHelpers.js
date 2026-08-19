import { ensureCurrentRestaurantId, getCurrentRestaurantId } from "../../utils/restaurant";

export function getManagerRestaurantId() {
  return getCurrentRestaurantId();
}

export async function ensureManagerRestaurantId() {
  return ensureCurrentRestaurantId();
}

function getCategoryRestaurantId(category) {
  return category?.restaurant_id ?? category?.restaurant?.id ?? null;
}

export function getResponseList(data, keys = []) {
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(data?.[key]?.data)) return data[key].data;
  }

  if (Array.isArray(data?.data?.data)) return data.data.data;
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
