export const FOOD_UNAVAILABLE_MESSAGE =
    "إحدى الوجبات في السلة لم تعد متوفرة. يرجى حذفها قبل تأكيد الطلب.";

export const FOOD_NOT_ORDERABLE_MESSAGE =
    "هذه الوجبة غير متوفرة حاليًا.";

export const MODIFIER_UNAVAILABLE_MESSAGE =
    "تمت إزالة خيار غير متوفر حالياً من الطلب.";

export const getFoodKey = (item) => {
    const foodId = item?.food_id ?? item?.foodId ?? item?.id;

    return foodId === undefined || foodId === null ? "" : String(foodId);
};

export const isFoodOrderable = (food) => food?.can_order !== false;

export const isModifierOptionOrderable = (option) => option?.can_order !== false;

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

export const normalizeModifierAvailabilityUpdate = (option) => ({
    modifier_option_id:
        option?.modifier_option_id ??
        option?.modifierOptionId ??
        option?.option_id ??
        option?.optionId ??
        option?.id,
    can_order:
        option?.can_order === undefined ? true : Boolean(option.can_order),
    unavailable_reason: option?.unavailable_reason ?? null,
});

const getModifierGroupList = (item) =>
    item?.modifierGroups ?? item?.modifier_groups ?? item?.groups ?? [];

const getModifierOptionList = (group) =>
    group?.options ?? group?.modifier_options ?? group?.modifierOptions ?? [];

const getModifierOptionId = (option) =>
    option?.id ??
    option?.modifier_option_id ??
    option?.modifierOptionId ??
    option?.option_id ??
    option?.optionId;

const mergeModifierGroups = (groups, availabilityByOptionId) =>
    groups.map((group) => {
        const optionKeys = ["options", "modifier_options", "modifierOptions"];
        const nextGroup = { ...group };

        optionKeys.forEach((key) => {
            if (!Array.isArray(group?.[key])) return;

            nextGroup[key] = group[key].map((option) => {
                const availability = availabilityByOptionId.get(
                    String(getModifierOptionId(option))
                );

                return availability
                    ? {
                          ...option,
                          can_order: availability.can_order,
                          unavailable_reason: availability.unavailable_reason,
                      }
                    : option;
            });
        });

        return nextGroup;
    });

export const applyModifierAvailabilityUpdates = (items, modifierOptions) => {
    const availabilityByOptionId = new Map(
        modifierOptions
            .map(normalizeModifierAvailabilityUpdate)
            .filter(
                (option) =>
                    option.modifier_option_id !== undefined &&
                    option.modifier_option_id !== null
            )
            .map((option) => [String(option.modifier_option_id), option])
    );

    if (!availabilityByOptionId.size) return items;

    return items.map((item) => {
        const groups = getModifierGroupList(item);

        if (!groups.length) return item;

        return {
            ...item,
            modifierGroups: mergeModifierGroups(groups, availabilityByOptionId),
        };
    });
};

export const removeUnavailableModifierSelections = (cartItems) =>
    cartItems.map((item) => {
        const optionAvailability = new Map(
            getModifierGroupList(item)
                .flatMap(getModifierOptionList)
                .map((option) => [String(getModifierOptionId(option)), option])
        );
        const selectedModifierOptions = (item.selectedModifierOptions ?? []).filter(
            (option) => {
                const currentOption =
                    optionAvailability.get(String(getModifierOptionId(option))) ??
                    option;

                return isModifierOptionOrderable(currentOption);
            }
        );

        return {
            ...item,
            selectedModifierOptions,
        };
    });
