export const FOOD_UNAVAILABLE_MESSAGE =
    "إحدى الوجبات في السلة لم تعد متوفرة. يرجى حذفها قبل تأكيد الطلب.";

export const FOOD_NOT_ORDERABLE_MESSAGE =
    "هذه الوجبة غير متوفرة حاليًا.";

export const getFoodKey = (item) => {
    const foodId = item?.food_id ?? item?.foodId ?? item?.id;

    return foodId === undefined || foodId === null ? "" : String(foodId);
};

export const isFoodOrderable = (food) => food?.can_order !== false;

export const normalizeFoodAvailability = (food) => ({
    can_order: food?.can_order === undefined ? true : Boolean(food.can_order),
    unavailable_reason: food?.unavailable_reason ?? null,
    out_of_stock_ingredients: Array.isArray(food?.out_of_stock_ingredients)
        ? food.out_of_stock_ingredients
        : [],
});

export const mergeFoodAvailability = (food, availability) => ({
    ...food,
    can_order:
        availability?.can_order === undefined
            ? food?.can_order
            : Boolean(availability.can_order),
    unavailable_reason:
        availability?.unavailable_reason === undefined
            ? food?.unavailable_reason
            : availability.unavailable_reason,
    out_of_stock_ingredients:
        availability?.out_of_stock_ingredients === undefined
            ? food?.out_of_stock_ingredients
            : availability.out_of_stock_ingredients,
});

export const normalizeFoodAvailabilityUpdate = (food) => ({
    food_id: food?.food_id ?? food?.foodId ?? food?.id,
    ...normalizeFoodAvailability(food),
});

export const applyFoodAvailabilityUpdates = (items, foods) => {
    const availabilityByFoodId = new Map(
        foods
            .map(normalizeFoodAvailabilityUpdate)
            .filter((food) => food.food_id !== undefined && food.food_id !== null)
            .map((food) => [String(food.food_id), food])
    );

    if (!availabilityByFoodId.size) return items;

    return items.map((item) => {
        const availability = availabilityByFoodId.get(getFoodKey(item));

        return availability ? mergeFoodAvailability(item, availability) : item;
    });
};

export const hasUnavailableCartItems = (cartItems) =>
    cartItems.some((item) => !isFoodOrderable(item));
