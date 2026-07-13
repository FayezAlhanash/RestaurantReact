import { Plus, Star } from "lucide-react";

const SAVED_MODIFIER_PRICES_STORAGE_KEY = "manager_menu_modifier_prices";

const getOptionId = (option) =>
    option?.id ??
    option?.modifier_option_id ??
    option?.modifierOptionId ??
    option?.option_id ??
    option?.optionId;

const getModifierGroupId = (group) =>
    group?.id ??
    group?.modifier_group_id ??
    group?.modifierGroupId ??
    group?.group_id ??
    group?.groupId;

const getFoodId = (item) => item?.food_id ?? item?.id;

const hasOwnPrice = (value) =>
    value?.price !== undefined ||
    value?.additional_price !== undefined ||
    value?.extra_price !== undefined ||
    value?.option_price !== undefined ||
    value?.additionalPrice !== undefined ||
    value?.extraPrice !== undefined ||
    value?.optionPrice !== undefined;

const hasReferencedOptionId = (value) =>
    value?.modifier_option_id !== undefined ||
    value?.modifierOptionId !== undefined ||
    value?.option_id !== undefined ||
    value?.optionId !== undefined;

const normalizePriceList = (value) => {
    if (Array.isArray(value)) return value;

    if (value && typeof value === "object") {
        if (hasReferencedOptionId(value) || hasOwnPrice(value)) return [value];

        return Object.entries(value).map(([optionId, optionPrice]) =>
            optionPrice && typeof optionPrice === "object"
                ? { option_id: optionId, ...optionPrice }
                : { option_id: optionId, price: optionPrice }
        );
    }

    return [];
};

const getGroupOptionPrices = (group) =>
    [
        group?.pivot?.options,
        group?.pivot?.modifier_options,
        group?.pivot?.modifierOptions,
        group?.option_prices,
        group?.optionPrices,
        group?.modifier_option_prices,
        group?.modifierOptionPrices,
    ].flatMap(normalizePriceList);

const getRelationPrice = (option) =>
    option?.pivot?.price ??
    option?.pivot?.additional_price ??
    option?.pivot?.extra_price ??
    option?.pivot?.option_price ??
    option?.pivot?.modifier_price ??
    option?.pivot?.additionalPrice ??
    option?.pivot?.extraPrice ??
    option?.pivot?.optionPrice ??
    option?.pivot?.modifierPrice ??
    option?.food_pivot?.price ??
    option?.food_pivot?.additional_price ??
    option?.food_pivot?.extra_price ??
    option?.food_pivot?.option_price ??
    option?.modifier_option_food?.price ??
    option?.modifier_option_food?.additional_price ??
    option?.modifier_option_food?.extra_price ??
    option?.modifier_option_food?.option_price ??
    option?.modifierOptionFood?.price ??
    option?.modifierOptionFood?.additionalPrice ??
    option?.modifierOptionFood?.extraPrice ??
    option?.modifierOptionFood?.optionPrice ??
    option?.food_modifier_option?.price ??
    option?.food_modifier_option?.additional_price ??
    option?.food_modifier_option?.extra_price ??
    option?.food_modifier_option?.option_price ??
    option?.foodModifierOption?.price ??
    option?.foodModifierOption?.additionalPrice ??
    option?.foodModifierOption?.extraPrice ??
    option?.foodModifierOption?.optionPrice ??
    option?.additional_price ??
    option?.extra_price ??
    option?.modifier_price ??
    option?.additionalPrice ??
    option?.extraPrice ??
    option?.modifierPrice ??
    option?.option_price ??
    option?.optionPrice ??
    option?.price;

const getReferencedOptionId = (value) =>
    value?.modifier_option_id ??
    value?.modifierOptionId ??
    value?.option_id ??
    value?.optionId ??
    value?.id;

const findNestedOptionPrice = (value, optionId, seen = new Set()) => {
    if (!value || typeof value !== "object" || seen.has(value)) return undefined;

    seen.add(value);

    if (String(getReferencedOptionId(value)) === String(optionId)) {
        const relationPrice = getRelationPrice(value);

        if (relationPrice !== undefined && relationPrice !== null) {
            return relationPrice;
        }
    }

    for (const child of Object.values(value)) {
        const price = findNestedOptionPrice(child, optionId, seen);

        if (price !== undefined && price !== null) {
            return price;
        }
    }

    return undefined;
};

const getSavedModifierPrice = (item, groupId, optionId) => {
    if (typeof window === "undefined") return undefined;

    try {
        const savedPrices = JSON.parse(
            window.localStorage.getItem(SAVED_MODIFIER_PRICES_STORAGE_KEY) || "{}"
        );
        const foodId = getFoodId(item);
        const savedPrice =
            savedPrices[`${foodId}:${groupId}:${optionId}`] ??
            Object.entries(savedPrices).find(
                ([key]) =>
                    key.endsWith(`:${groupId}:${optionId}`) ||
                    key.endsWith(`:${optionId}`)
            )?.[1];

        return savedPrice === undefined || savedPrice === "" ? undefined : savedPrice;
    } catch {
        return undefined;
    }
};

const getModifierOptionPrice = (item, option, group) => {
    const groupId = getModifierGroupId(group);
    const optionId = getOptionId(option);
    const groupPrice = getGroupOptionPrices(group).find(
        (priceItem) =>
            String(
                priceItem?.modifier_option_id ??
                    priceItem?.modifierOptionId ??
                    priceItem?.option_id ??
                    priceItem?.optionId ??
                    priceItem?.id
            ) === String(optionId)
    );
    const relationPrice =
        getSavedModifierPrice(item, groupId, optionId) ??
        getRelationPrice(groupPrice) ??
        findNestedOptionPrice(group, optionId) ??
        getRelationPrice(option);

    return Number(relationPrice ?? option?.price ?? 0);
};

const getSizeModifierOptions = (item) => {
    const modifierGroups = (item?.modifierGroups ?? [])
        .map((group) => ({
            ...group,
            options: group.options ?? group.modifier_options ?? group.modifierOptions ?? [],
        }))
        .filter((group) => group.options.length);
    const sizeGroup = modifierGroups.find((group) => {
        const name = String(group?.name ?? "").toLowerCase();

        return name.includes("size") || name.includes("حجم");
    });

    if (!sizeGroup) return [];

    const basePrice = Number(item?.price ?? 0);

    return sizeGroup.options.map((option) => ({
        id: getOptionId(option),
        name: option.name,
        price: basePrice + getModifierOptionPrice(item, option, sizeGroup),
    }));
};

function MenuItemCard({ item, onOpen }) {
    const imageUrl =
        item.image ||
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
    const sizePrices = getSizeModifierOptions(item);
    const hasSizePrices = sizePrices.length > 0;
    const displayPrice = hasSizePrices
        ? Math.min(...sizePrices.map((option) => option.price))
        : Number(item.price ?? 0);

    return (
        <article className="group flex min-h-[300px] flex-col overflow-hidden rounded-2xl border border-[#E7DCD6] bg-white shadow-[0_8px_30px_rgba(83,53,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(83,53,42,0.12)] sm:min-h-[330px] sm:rounded-[26px]">
            <div className="relative m-2 overflow-hidden rounded-2xl bg-[#EDE5DF] sm:m-2.5 sm:rounded-[20px]">
                <img
                    src={imageUrl}
                    alt={item.title}
                    className="h-40 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-48"
                />
                <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-[#5F504A] shadow-sm backdrop-blur">
                    <Star size={13} className="fill-[#F7C948] text-[#F7C948]" /> 4.8
                </span>
                <span className="absolute right-3 top-3 rounded-full bg-[#7F1D1D] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                    Popular
                </span>
            </div>

            <div className="flex flex-1 flex-col px-3 pb-3 pt-1 sm:px-4 sm:pb-4">
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                    <div className="min-w-0 flex-1">
                        <h2 className="truncate text-lg font-extrabold text-[#2E2522]">{item.title}</h2>
                        <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-[#5F504A]">{item.description}</p>
                    </div>
                    <p className="shrink-0 text-xl font-extrabold text-[#7F1D1D]">
                        {hasSizePrices ? "From " : ""}${displayPrice.toFixed(2)}
                    </p>
                </div>

                <button
                    onClick={onOpen}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7F1D1D] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#681718] active:scale-[0.98] sm:mt-5"
                >
                    <Plus size={18} />
                    Add to order
                </button>
            </div>
        </article>
    );
}

export default MenuItemCard;
