import {
    Check,
    Clock3,
    Flame,
    Heart,
    Leaf,
    MessageSquare,
    Minus,
    Plus,
    ShoppingBag,
    Star,
    Utensils,
    X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const SAVED_MODIFIER_PRICES_STORAGE_KEY = "manager_menu_modifier_prices";

function ProductModal({ isOpen, onClose, item, addToCart, variant = "light" }) {
    const [selectedSize, setSelectedSize] = useState("small");
    const [selectedModifiers, setSelectedModifiers] = useState({});
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState("");
    const [isClosing, setIsClosing] = useState(false);
    const [isAdded, setIsAdded] = useState(false);
    const closeTimerRef = useRef(null);
    const addTimerRef = useRef(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setQuantity(1);
        setSelectedSize("small");
        setSelectedModifiers({});
        setNotes("");
    }, [item]);

    useEffect(
        () => () => {
            window.clearTimeout(closeTimerRef.current);
            window.clearTimeout(addTimerRef.current);
        },
        []
    );

    const closeModal = () => {
        if (closeTimerRef.current) return;

        setIsClosing(true);
        closeTimerRef.current = window.setTimeout(() => {
            setQuantity(1);
            setSelectedSize("small");
            setSelectedModifiers({});
            setNotes("");
            setIsAdded(false);
            setIsClosing(false);
            closeTimerRef.current = null;
            onClose();
        }, 220);
    };

    if (!isOpen) return null;

    const isDark = variant === "dark";
    const isDineIn = variant === "dineIn" || variant === "dineInDark";
    const isDineInDark = variant === "dineInDark";

    const getOptionId = (option) => option?.id ?? option?.modifier_option_id ?? option?.modifierOptionId ?? option?.option_id ?? option?.optionId;
    const getModifierGroupId = (group) => group?.id ?? group?.modifier_group_id ?? group?.modifierGroupId ?? group?.group_id ?? group?.groupId;
    const isVariantGroup = (group) =>
        Boolean(Number(group?.is_variant ?? group?.isVariant ?? 0)) ||
        ["size", "sizes", "\u062d\u062c\u0645", "\u0627\u0644\u062d\u062c\u0645"].some((term) =>
            String(group?.name ?? "").toLowerCase().includes(term)
        );
    const getGroupMaxSelect = (group) =>
        isVariantGroup(group)
            ? 1
            : Math.max(1, Number(group?.pivot?.max_select ?? group?.max_select ?? group?.maxSelect ?? 1));
    const isGroupRequired = (group) => {
        const required = group?.pivot?.required ?? group?.required;

        return required === undefined || required === null ? true : Boolean(Number(required));
    };
    const getFoodId = () => item?.food_id ?? item?.id;
    const getSavedModifierPrice = (groupId, optionId) => {
        try {
            const savedPrices = JSON.parse(
                window.localStorage.getItem(SAVED_MODIFIER_PRICES_STORAGE_KEY) || "{}"
            );
            const savedPrice =
                savedPrices[`${getFoodId()}:${groupId}:${optionId}`] ??
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
        ]
            .flatMap(normalizePriceList);
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
    const getModifierOptionPrice = (option, group) => {
        const groupId = getModifierGroupId(group);
        const optionId = getOptionId(option);
        const savedPrice = getSavedModifierPrice(groupId, optionId);
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
            savedPrice ??
            getRelationPrice(groupPrice) ??
            findNestedOptionPrice(group, optionId) ??
            getRelationPrice(option);
        return Number(relationPrice ?? option?.price ?? 0);
    };
    const getSelectedModifierOptions = () =>
        modifierGroups
            .flatMap((group) => {
                const groupId = getModifierGroupId(group);
                const selectedOptionIds = Array.isArray(selectedModifiers[groupId])
                    ? selectedModifiers[groupId]
                    : [selectedModifiers[groupId]].filter(Boolean);

                return selectedOptionIds
                    .map((optionId) => {
                        const option = group.options?.find(
                            (currentOption) => String(getOptionId(currentOption)) === String(optionId)
                        );

                        return option
                              ? {
                                  groupId,
                                  modifier_group_id: groupId,
                                  groupName: group.name,
                                  id: getOptionId(option),
                                  modifier_option_id: getOptionId(option),
                                  name: option.name,
                                  price: getModifierOptionPrice(option, group),
                                  isVariant: isVariantGroup(group),
                              }
                            : null;
                    })
                    .filter(Boolean);
            });
    const imageUrl =
        item?.image ||
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=85";
    const basePrice = Number(item?.price ?? 0);
    const modifierGroups = (item?.modifierGroups ?? [])
        .map((group) => ({
            ...group,
            options: group.options ?? group.modifier_options ?? group.modifierOptions ?? [],
        }))
        .filter((group) => group.options.length);
    const hasModifiers = modifierGroups.length > 0;
    const isLoadingDetails = Boolean(item?.isLoadingDetails);
    const selectedModifierOptions = getSelectedModifierOptions();
    const modifierPrice = selectedModifierOptions.reduce(
        (total, option) => total + (option.isVariant ? 0 : option.price),
        0
    );
    const selectedVariantOption = selectedModifierOptions.find((option) => option.isVariant);
    const hasVariantGroups = modifierGroups.some(isVariantGroup);
    const canSelectNonVariantModifiers = !hasVariantGroups || Boolean(selectedVariantOption);
    const sizePrice = !hasModifiers && selectedSize === "large" ? 2 : 0;
    const variantPrice = selectedVariantOption ? selectedVariantOption.price : basePrice;
    const unitPrice = (selectedVariantOption ? variantPrice : basePrice + sizePrice) + modifierPrice;
    const allRequiredModifiersSelected =
        !isLoadingDetails &&
        (!hasModifiers ||
            modifierGroups.every((group) => {
            if (!isGroupRequired(group)) return true;

            const selectedOptionIds = selectedModifiers[getModifierGroupId(group)];

            return Array.isArray(selectedOptionIds)
                ? selectedOptionIds.length > 0
                : Boolean(selectedOptionIds);
            }));
    const modifierNotes = modifierGroups
        .flatMap((group) => {
            const groupId = getModifierGroupId(group);
            const selectedOptionIds = Array.isArray(selectedModifiers[groupId])
                ? selectedModifiers[groupId]
                : [selectedModifiers[groupId]].filter(Boolean);

            return selectedOptionIds
                .map((optionId) => {
                    const option = group.options?.find(
                        (currentOption) => String(getOptionId(currentOption)) === String(optionId)
                    );

                    return option ? `${group.name}: ${option.name}` : "";
                })
                .filter(Boolean);
        })
        .filter(Boolean);
    const orderNotes = [...modifierNotes, notes]
        .filter(Boolean)
        .join(" · ");
    const addCurrentItemToCart = () => {
        if (!allRequiredModifiersSelected || isAdded || isClosing) return;

        addToCart({
            ...item,
            price: unitPrice,
            quantity,
            size: hasModifiers ? "" : selectedSize,
            notes: orderNotes,
            selectedModifiers,
            selectedModifierOptions,
        });
        setIsAdded(true);
        addTimerRef.current = window.setTimeout(closeModal, 420);
    };
    const getIngredientName = (ingredient) =>
        ingredient?.name ??
        ingredient?.ingredient?.name ??
        ingredient?.food_ingredient?.name ??
        ingredient?.foodIngredient?.name ??
        ingredient?.title ??
        "";
    const ingredientSource = [
        item?.ingredients,
        item?.foodIngredients,
        item?.food_ingredients,
        item?.recipeIngredients,
        item?.recipe_ingredients,
    ].find(Array.isArray);
    const ingredientChips = (ingredientSource ?? [])
        .map(getIngredientName)
        .filter(Boolean);
    const detailChips = [
        ...ingredientChips,
        item?.categoryName,
        ...modifierGroups.slice(0, 3).map((group) => group.name),
    ]
        .filter(Boolean)
        .filter((chip, index, chips) => chips.indexOf(chip) === index)
        .slice(0, 7);
    const preparationTime = item?.preparation_time ?? item?.preparationTime;
    const calories = item?.calories;

    if (isDineIn) {
        return (
            <div className={`product-modal-overlay fixed inset-0 z-[300] flex items-center justify-center p-3 backdrop-blur-md sm:p-6 ${
                isDineInDark ? "bg-black/72" : "bg-[#211715]/55"
            } ${isClosing ? "modal-backdrop-exit" : "modal-backdrop-enter"}`}>
                <div className={`product-modal-shell grid h-[calc(100dvh-1.5rem)] max-h-[820px] w-full max-w-[520px] overflow-hidden rounded-[30px] border shadow-[0_34px_90px_rgba(0,0,0,0.48)] ${
                    isDineInDark
                        ? "border-white/10 bg-[#12181B] text-white"
                        : "border-[#E4CFC3] bg-[#FFF9F2] text-[#241815]"
                } ${isClosing ? "dine-in-product-panel-exit" : "dine-in-product-panel-enter"}`}>
                    <div className={`relative min-h-0 overflow-hidden ${
                        isDineInDark ? "bg-[#101517]" : "bg-[#F3E5D9]"
                    }`}>
                        <div className={`absolute inset-0 ${
                            isDineInDark
                                ? "bg-[radial-gradient(circle_at_18%_12%,rgba(255,209,102,0.16),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(127,29,29,0.34),transparent_26%),linear-gradient(145deg,#101517_0%,#171D20_52%,#26181B_100%)]"
                                : "bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.58),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(127,29,29,0.16),transparent_25%),linear-gradient(145deg,#FFF4DA_0%,#F3E5D9_56%,#E4CFC3_100%)]"
                        }`} />
                        <div className="relative z-10 flex items-center justify-between px-4 pt-4 sm:px-5 sm:pt-5">
                            <button
                                type="button"
                                onClick={closeModal}
                                aria-label="Close product"
                                className={`grid h-10 w-10 place-items-center rounded-full shadow-[0_10px_24px_rgba(127,29,29,0.16)] transition active:scale-95 ${
                                    isDineInDark
                                        ? "border border-white/10 bg-white/10 text-white hover:bg-[#7F1D1D]"
                                        : "bg-white/88 text-[#241815] hover:bg-white"
                                }`}
                            >
                                <X size={19} />
                            </button>
                            <button
                                type="button"
                                aria-label="Favorite"
                                className={`grid h-10 w-10 place-items-center rounded-full shadow-[0_10px_24px_rgba(127,29,29,0.16)] transition active:scale-95 ${
                                    isDineInDark
                                        ? "border border-white/10 bg-white/10 text-[#FFD166] hover:bg-[#7F1D1D] hover:text-white"
                                        : "bg-white/88 text-[#7F1D1D] hover:bg-white"
                                }`}
                            >
                                <Heart size={19} />
                            </button>
                        </div>

                        <div className="relative z-10 px-5 pb-16 pt-4 text-center sm:px-7 sm:pb-20">
                            <p className={`text-xs font-black uppercase tracking-[0.18em] ${
                                isDineInDark ? "text-[#FFD166]" : "text-[#9A6400]"
                            }`}>
                                {item?.restaurantName || "Big-4 Menu"}
                            </p>
                            <h2 className={`mx-auto mt-2 max-w-[360px] text-3xl font-black leading-[1.08] sm:text-[34px] ${
                                isDineInDark ? "text-white" : "text-[#241815]"
                            }`}>
                                {item?.title}
                            </h2>
                        </div>
                    </div>

                    <div className={`relative flex min-h-0 flex-1 flex-col ${
                        isDineInDark ? "bg-[#12181B]" : "bg-[#FFF9F2]"
                    }`}>
                        <div className={`pointer-events-none absolute left-1/2 top-0 z-20 h-36 w-36 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-[7px] shadow-[0_22px_42px_rgba(127,29,29,0.24)] sm:h-40 sm:w-40 ${
                            isDineInDark
                                ? "border-[#12181B] bg-[#0D1113]"
                                : "border-[#FFF9F2] bg-[#241815]"
                        }`}>
                            <img
                                src={imageUrl}
                                alt={item?.title}
                                className="h-full w-full object-cover"
                            />
                        </div>

                        <div className="product-modal-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-20 sm:px-5 sm:pt-24">
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <div className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-black shadow-[0_8px_22px_rgba(127,29,29,0.08)] ${
                                    isDineInDark
                                        ? "border border-white/10 bg-white/10 text-white"
                                        : "bg-white text-[#241815]"
                                }`}>
                                    <Star size={15} className="fill-[#F0B429] text-[#F0B429]" />
                                    4.8
                                </div>
                                <div className="text-right">
                                    <p className={`text-xs font-bold uppercase ${
                                        isDineInDark ? "text-white/55" : "text-[#7A6258]"
                                    }`}>
                                        Total
                                    </p>
                                    <p className={`text-2xl font-black ${
                                        isDineInDark ? "text-[#FFD166]" : "text-[#7F1D1D]"
                                    }`}>
                                        ${(unitPrice * quantity).toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            {item?.description && (
                                <p className={`rounded-[20px] px-4 py-3 text-sm font-semibold leading-6 shadow-[0_10px_24px_rgba(127,29,29,0.07)] ${
                                    isDineInDark
                                        ? "border border-white/10 bg-white/[0.07] text-white/66"
                                        : "bg-white text-[#6F5C54]"
                                }`}>
                                    {item.description}
                                </p>
                            )}

                            <div className="mt-4 grid grid-cols-3 gap-2">
                                <div className={`rounded-[18px] px-3 py-3 text-center ${
                                    isDineInDark ? "border border-white/10 bg-white/[0.07]" : "bg-[#FFF4DA]"
                                }`}>
                                    <Clock3 className={`mx-auto ${
                                        isDineInDark ? "text-[#FFD166]" : "text-[#9A6400]"
                                    }`} size={18} />
                                    <p className={`mt-1 text-[11px] font-bold ${
                                        isDineInDark ? "text-white/52" : "text-[#7A6258]"
                                    }`}>Prep</p>
                                    <p className={`text-sm font-black ${
                                        isDineInDark ? "text-white" : "text-[#241815]"
                                    }`}>
                                        {preparationTime ? `${preparationTime}m` : "Fresh"}
                                    </p>
                                </div>
                                <div className={`rounded-[18px] px-3 py-3 text-center ${
                                    isDineInDark ? "border border-[#7F1D1D]/35 bg-[#7F1D1D]/16" : "bg-[#F9ECEC]"
                                }`}>
                                    <Flame className={`mx-auto ${
                                        isDineInDark ? "text-[#FFD166]" : "text-[#7F1D1D]"
                                    }`} size={18} />
                                    <p className={`mt-1 text-[11px] font-bold ${
                                        isDineInDark ? "text-white/52" : "text-[#7A6258]"
                                    }`}>Energy</p>
                                    <p className={`text-sm font-black ${
                                        isDineInDark ? "text-white" : "text-[#241815]"
                                    }`}>
                                        {calories ? `${calories}` : "Chef"}
                                    </p>
                                </div>
                                <div className={`rounded-[18px] px-3 py-3 text-center ${
                                    isDineInDark ? "border border-white/10 bg-[#0D1113]" : "bg-[#F7F2EF]"
                                }`}>
                                    <Utensils className={`mx-auto ${
                                        isDineInDark ? "text-[#FFD166]" : "text-[#7F1D1D]"
                                    }`} size={18} />
                                    <p className={`mt-1 text-[11px] font-bold ${
                                        isDineInDark ? "text-white/52" : "text-[#7A6258]"
                                    }`}>Type</p>
                                    <p className={`truncate text-sm font-black ${
                                        isDineInDark ? "text-white" : "text-[#241815]"
                                    }`}>
                                        {item?.categoryName || "Menu"}
                                    </p>
                                </div>
                            </div>

                            {!!detailChips.length && (
                                <div className="mt-5">
                                    <div className="mb-2 flex items-center justify-between">
                                        <h3 className={`text-sm font-black ${
                                            isDineInDark ? "text-white" : "text-[#241815]"
                                        }`}>Ingredients</h3>
                                        <Leaf size={17} className={isDineInDark ? "text-[#FFD166]" : "text-[#7F1D1D]"} />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {detailChips.map((chip) => (
                                            <span
                                                key={chip}
                                                className={`rounded-full px-3 py-2 text-xs font-black shadow-[0_8px_18px_rgba(127,29,29,0.06)] ${
                                                    isDineInDark
                                                        ? "border border-white/10 bg-white/[0.07] text-white/68"
                                                        : "bg-white text-[#6F5C54]"
                                                }`}
                                            >
                                                {chip}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {isLoadingDetails ? (
                                <div className={`mt-5 rounded-[20px] border p-4 text-sm font-extrabold ${
                                    isDineInDark
                                        ? "border-white/10 bg-white/[0.07] text-white/62"
                                        : "border-[#E4CFC3] bg-white text-[#6F5C54]"
                                }`}>
                                    Loading options...
                                </div>
                            ) : hasModifiers ? (
                                <div className="mt-5 space-y-4">
                                    {modifierGroups.map((group) => (
                                        <div
                                            key={getModifierGroupId(group)}
                                            className={`rounded-[22px] border p-3 shadow-[0_10px_24px_rgba(127,29,29,0.07)] ${
                                                isDineInDark
                                                    ? isVariantGroup(group)
                                                        ? "border-[#FFD166]/30 bg-[#FFD166]/8"
                                                        : "border-white/10 bg-white/[0.07]"
                                                    : isVariantGroup(group)
                                                        ? "border-[#D8A22D]/45 bg-[#FFF9E8]"
                                                        : "border-[#E4CFC3] bg-white"
                                            } ${
                                                !isVariantGroup(group) && !canSelectNonVariantModifiers
                                                    ? "opacity-55"
                                                    : ""
                                            }`}
                                        >
                                            <div className="mb-3 flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <h3 className={`text-base font-black leading-6 ${
                                                        isDineInDark ? "text-[#FFD166]" : "text-[#7F1D1D]"
                                                    }`}>
                                                        {group.name}
                                                    </h3>
                                                    {isVariantGroup(group) && (
                                                        <p className={`mt-1 text-xs font-bold ${
                                                            isDineInDark ? "text-white/55" : "text-[#7A6258]"
                                                        }`}>
                                                            Select one size. The amount is the final item price.
                                                        </p>
                                                    )}
                                                    {!isVariantGroup(group) && !canSelectNonVariantModifiers && (
                                                        <p className={`mt-1 text-xs font-bold ${
                                                            isDineInDark ? "text-white/45" : "text-[#8A7761]"
                                                        }`}>
                                                            Choose a size first.
                                                        </p>
                                                    )}
                                                </div>
                                                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${
                                                    isDineInDark
                                                        ? isVariantGroup(group)
                                                            ? "border border-[#FFD166]/30 bg-[#FFD166]/14 text-[#FFD166]"
                                                            : isGroupRequired(group)
                                                                ? "bg-[#7F1D1D]/24 text-[#FFD6D6]"
                                                                : "bg-white/10 text-white/62"
                                                        : isVariantGroup(group)
                                                            ? "bg-[#FFF0C4] text-[#9A6400]"
                                                            : isGroupRequired(group)
                                                                ? "bg-[#F9ECEC] text-[#7F1D1D]"
                                                                : "bg-[#F7F2EF] text-[#7A6258]"
                                                }`}>
                                                    {isVariantGroup(group)
                                                        ? "Full prices"
                                                        : isGroupRequired(group)
                                                            ? "Required"
                                                            : "Optional"}
                                                    {!isVariantGroup(group) && getGroupMaxSelect(group) > 1 ? ` · ${getGroupMaxSelect(group)} max` : ""}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {group.options.map((option) => {
                                                    const groupId = getModifierGroupId(group);
                                                    const optionId = getOptionId(option);
                                                    const selectedOptionIds = Array.isArray(selectedModifiers[groupId])
                                                        ? selectedModifiers[groupId]
                                                        : [selectedModifiers[groupId]].filter(Boolean);
                                                    const isSelected = selectedOptionIds.some(
                                                        (selectedOptionId) => String(selectedOptionId) === String(optionId)
                                                    );
                                                    const optionPrice = getModifierOptionPrice(option, group);
                                                    const isVariant = isVariantGroup(group);
                                                    const isDisabled = !isVariant && !canSelectNonVariantModifiers;

                                                    return (
                                                        <button
                                                            key={optionId}
                                                            type="button"
                                                            disabled={isDisabled}
                                                            onClick={() => {
                                                                if (isDisabled) return;

                                                                setSelectedModifiers((current) => {
                                                                    const maxSelect = getGroupMaxSelect(group);

                                                                    if (maxSelect <= 1) {
                                                                        return {
                                                                            ...current,
                                                                            [groupId]: optionId,
                                                                        };
                                                                    }

                                                                    const currentOptionIds = Array.isArray(current[groupId])
                                                                        ? current[groupId]
                                                                        : [current[groupId]].filter(Boolean);
                                                                    const alreadySelected = currentOptionIds.some(
                                                                        (selectedOptionId) => String(selectedOptionId) === String(optionId)
                                                                    );
                                                                    const nextOptionIds = alreadySelected
                                                                        ? currentOptionIds.filter(
                                                                              (selectedOptionId) => String(selectedOptionId) !== String(optionId)
                                                                          )
                                                                        : [...currentOptionIds, optionId].slice(0, maxSelect);

                                                                    return {
                                                                        ...current,
                                                                        [groupId]: nextOptionIds,
                                                                    };
                                                                });
                                                            }}
                                                            className={`flex min-h-11 items-center gap-2 rounded-full border px-3 py-2 text-left text-xs font-black transition disabled:cursor-not-allowed ${
                                                                isDineInDark
                                                                    ? isDisabled
                                                                        ? "border-white/8 bg-white/[0.035] text-white/28"
                                                                        : isSelected
                                                                            ? "border-[#7F1D1D] bg-[#7F1D1D] text-white shadow-[0_10px_20px_rgba(127,29,29,0.24)]"
                                                                            : "border-white/10 bg-[#0D1113] text-white/68 hover:border-[#FFD166]/45 hover:bg-white/[0.10]"
                                                                    : isDisabled
                                                                        ? "border-[#E4CFC3] bg-[#F1E7DF] text-[#A28F87]"
                                                                        : isSelected
                                                                            ? "border-[#7F1D1D] bg-[#7F1D1D] text-white shadow-[0_10px_20px_rgba(127,29,29,0.18)]"
                                                                            : "border-[#E4CFC3] bg-[#FFF9F2] text-[#6F5C54] hover:border-[#7F1D1D]"
                                                            }`}
                                                        >
                                                            {isSelected && <Check size={14} />}
                                                            <span>{option.name}</span>
                                                            {(isVariant || optionPrice > 0) && (
                                                                <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                                                                    isSelected
                                                                        ? "bg-white/18 text-white"
                                                                        : isDineInDark
                                                                            ? "bg-white/10 text-[#FFD166]"
                                                                            : "bg-white text-[#7F1D1D]"
                                                                }`}>
                                                                    {isVariant ? `$${optionPrice.toFixed(2)}` : `+ $${optionPrice.toFixed(2)}`}
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-5">
                                    <div className="mb-2 flex items-center justify-between">
                                        <h3 className={`text-sm font-black ${
                                            isDineInDark ? "text-white" : "text-[#241815]"
                                        }`}>Choose size</h3>
                                        <span className={`text-xs font-bold ${
                                            isDineInDark ? "text-white/55" : "text-[#7A6258]"
                                        }`}>Required</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        {["small", "large"].map((size) => (
                                            <button
                                                key={size}
                                                type="button"
                                                onClick={() => setSelectedSize(size)}
                                                className={`rounded-[18px] border px-3 py-3 text-left transition ${
                                                    isDineInDark
                                                        ? selectedSize === size
                                                            ? "border-[#7F1D1D] bg-[#7F1D1D]/24 text-white ring-2 ring-[#7F1D1D]/20"
                                                            : "border-white/10 bg-white/[0.07] text-white/66 hover:border-[#FFD166]/45"
                                                        : selectedSize === size
                                                            ? "border-[#7F1D1D] bg-[#F9ECEC] text-[#7F1D1D] ring-2 ring-[#7F1D1D]/12"
                                                            : "border-[#E4CFC3] bg-white text-[#6F5C54] hover:border-[#7F1D1D]"
                                                }`}
                                            >
                                                <span className="block text-sm font-black capitalize">{size}</span>
                                                <span className="mt-0.5 block text-xs font-bold opacity-70">
                                                    {size === "small" ? "Regular serving" : "+ $2.00"}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className={`mt-5 rounded-[22px] p-3 shadow-[0_10px_24px_rgba(127,29,29,0.07)] ${
                                isDineInDark
                                    ? "border border-white/10 bg-white/[0.07]"
                                    : "bg-white"
                            }`}>
                                <label className={`mb-2 flex items-center gap-2 text-sm font-black ${
                                    isDineInDark ? "text-white" : "text-[#241815]"
                                }`}>
                                    <MessageSquare size={16} className={isDineInDark ? "text-[#FFD166]" : "text-[#7F1D1D]"} />
                                    Special instructions
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(event) => setNotes(event.target.value)}
                                    placeholder="No onions, extra sauce..."
                                    rows={2}
                                    className={`w-full resize-none rounded-[16px] border p-3 text-sm font-semibold outline-none transition ${
                                        isDineInDark
                                            ? "border-white/10 bg-[#0D1113] text-white placeholder:text-white/38 focus:border-[#7F1D1D] focus:ring-4 focus:ring-[#7F1D1D]/15"
                                            : "border-[#E4CFC3] bg-[#FFF9F2] text-[#241815] placeholder:text-[#A28F87] focus:border-[#7F1D1D] focus:ring-4 focus:ring-[#7F1D1D]/10"
                                    }`}
                                />
                            </div>
                        </div>

                        <div className={`grid shrink-0 grid-cols-[112px_minmax(0,1fr)] gap-3 border-t p-4 shadow-[0_-18px_34px_rgba(127,29,29,0.08)] backdrop-blur ${
                            isDineInDark
                                ? "border-white/10 bg-[#12181B]/96"
                                : "border-[#E4CFC3] bg-[#FFF9F2]/96"
                        }`}>
                            <div className={`flex items-center justify-between rounded-full px-2 py-2 shadow-[0_8px_18px_rgba(127,29,29,0.08)] ${
                                isDineInDark
                                    ? "border border-white/10 bg-white/[0.07]"
                                    : "bg-white"
                            }`}>
                                <button
                                    type="button"
                                    onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                                    className={`grid h-8 w-8 place-items-center rounded-full transition active:scale-95 ${
                                        isDineInDark
                                            ? "bg-white/10 text-[#FFD166]"
                                            : "bg-[#F9ECEC] text-[#7F1D1D]"
                                    }`}
                                    aria-label="Decrease quantity"
                                >
                                    <Minus size={15} />
                                </button>
                                <span className={`w-6 text-center text-lg font-black ${
                                    isDineInDark ? "text-white" : "text-[#241815]"
                                }`}>
                                    {quantity}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setQuantity((value) => value + 1)}
                                    className="grid h-8 w-8 place-items-center rounded-full bg-[#7F1D1D] text-white transition hover:bg-[#681718] active:scale-95"
                                    aria-label="Increase quantity"
                                >
                                    <Plus size={15} />
                                </button>
                            </div>
                            <button
                                disabled={!allRequiredModifiersSelected || isAdded || isClosing}
                                onClick={addCurrentItemToCart}
                                className={`flex min-w-0 items-center justify-between gap-2 rounded-full bg-[#7F1D1D] px-4 py-3 text-sm font-black text-white shadow-[0_16px_28px_rgba(127,29,29,0.24)] transition hover:bg-[#681718] active:scale-[0.99] disabled:cursor-not-allowed disabled:shadow-none ${
                                    isAdded
                                        ? "bg-[#7F1D1D] ring-4 ring-[#FFD166]/20 hover:bg-[#7F1D1D]"
                                        : isDineInDark
                                        ? "disabled:bg-white/15 disabled:text-white/35"
                                        : "disabled:bg-[#E5D7CE] disabled:text-[#7A6258]"
                                }`}
                            >
                                <span className="flex min-w-0 items-center gap-2">
                                    {isAdded ? (
                                        <Check className="shrink-0" size={18} />
                                    ) : (
                                        <ShoppingBag className="shrink-0" size={18} />
                                    )}
                                    <span className="truncate">{isAdded ? "Added" : "Add to order"}</span>
                                </span>
                                <span className="shrink-0">
                                    {isLoadingDetails ? "Loading..." : `$${(unitPrice * quantity).toFixed(2)}`}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`product-modal-overlay fixed inset-0 z-[300] flex items-center justify-center p-3 backdrop-blur-md sm:p-6 ${isDark ? "bg-black/65" : "bg-[#211715]/55"} ${isClosing ? "modal-backdrop-exit" : "modal-backdrop-enter"}`}>
            <div className={`product-modal-shell grid h-[calc(100dvh-1.5rem)] max-h-[760px] w-full max-w-[820px] overflow-hidden rounded-[28px] border shadow-2xl md:grid-cols-[0.86fr_1.14fr] ${
                isDark
                    ? "border-white/10 bg-[#12181B] text-white shadow-[0_34px_90px_rgba(0,0,0,0.55)]"
                    : "border-transparent bg-white text-[#2D2421]"
            } ${isClosing ? "modal-panel-exit" : "modal-panel-enter"}`}>
                <div className={`product-modal-media relative hidden min-h-0 overflow-hidden ${isDark ? "bg-[#0D1113]" : "bg-[#EDE5DF]"} md:block`}>
                    <img src={imageUrl} alt={item?.title} className="absolute inset-0 h-full w-full object-cover" />
                    <div className={`absolute inset-0 ${isDark ? "bg-gradient-to-t from-[#0D1113] via-[#0D1113]/15 to-black/15" : "bg-gradient-to-t from-black/45 via-transparent to-transparent"}`} />
                    <span className={`absolute bottom-5 left-5 rounded-full px-3 py-1.5 text-xs font-extrabold ${isDark ? "bg-[#FFD166] text-[#151A1D]" : "bg-[#F7C948] text-[#382B10]"}`}>Freshly prepared</span>
                </div>

                <div className={`product-modal-content relative flex min-h-0 flex-col overflow-hidden ${isDark ? "bg-[radial-gradient(circle_at_top_right,rgba(127,29,29,0.16),transparent_34%)]" : ""}`}>
                    <button onClick={closeModal} aria-label="Close product" className={`absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full transition ${
                        isDark
                            ? "border border-white/10 bg-white/10 text-white/70 hover:bg-[#7F1D1D] hover:text-white"
                            : "bg-[#F7F2EF] text-[#695A54] hover:bg-[#F2E7E3] hover:text-[#7F1D1D]"
                    }`}>
                        <X size={20} />
                    </button>

                    <div className="product-modal-scroll min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                    <p className={`text-xs font-bold uppercase tracking-[0.18em] ${isDark ? "text-[#FFD166]" : "text-[#A28F87]"}`}>Customize item</p>
                    <h2 className={`mt-2 pr-12 text-2xl font-black ${isDark ? "text-white" : "text-[#2D2421]"}`}>{item?.title}</h2>
                    <p className={`mt-2 text-base font-semibold leading-7 ${isDark ? "text-white/68" : "text-[#6F5C54]"}`}>{item?.description}</p>

                    {isLoadingDetails ? (
                        <div className={`mt-5 rounded-2xl border p-4 text-sm font-extrabold ${
                            isDark
                                ? "border-white/10 bg-white/[0.06] text-white/62"
                                : "border-[#E7DCD6] bg-[#FBF8F6] text-[#77665F]"
                        }`}>
                            Loading options...
                        </div>
                    ) : hasModifiers ? (
                        <div className="mt-5 space-y-4">
                            {modifierGroups.map((group) => (
                                <div
                                    key={getModifierGroupId(group)}
                                    className={`product-modal-group rounded-2xl border p-3 ${
                                        isVariantGroup(group)
                                            ? isDark
                                                ? "border-[#FFD166]/35 bg-[#FFD166]/8"
                                                : "border-[#D8A23A]/45 bg-[#FFF9E8]"
                                            : isDark
                                            ? "border-white/10 bg-black/18"
                                            : "border-[#E7DCD6] bg-[#FBF8F6]"
                                    } ${
                                        !isVariantGroup(group) && !canSelectNonVariantModifiers
                                            ? "opacity-55"
                                            : ""
                                    }`}
                                >
                                    <div className="mb-3 flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className={`text-xl font-black leading-6 ${isDark ? "text-[#FFD166]" : "text-[#B78312]"}`}>
                                                {group.name}
                                            </h3>
                                            {isVariantGroup(group) && (
                                                <p className={`mt-1 text-xs font-bold ${isDark ? "text-white/55" : "text-[#7A6258]"}`}>
                                                    Select one size. The shown amount is the final item price.
                                                </p>
                                            )}
                                            {!isVariantGroup(group) && !canSelectNonVariantModifiers && (
                                                <p className={`mt-1 text-xs font-bold ${isDark ? "text-white/45" : "text-[#8D7B74]"}`}>
                                                    Choose a size first.
                                                </p>
                                            )}
                                        </div>
                                        <span
                                            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${
                                                isVariantGroup(group)
                                                    ? isDark
                                                        ? "border border-[#FFD166]/30 bg-[#FFD166]/14 text-[#FFD166]"
                                                        : "border border-[#D8A23A]/35 bg-[#FFF0C4] text-[#9A6400]"
                                                    : isGroupRequired(group)
                                                    ? isDark
                                                        ? "bg-[#7F1D1D]/18 text-[#7F1D1D]"
                                                        : "bg-[#F9ECEC] text-[#7F1D1D]"
                                                    : isDark
                                                        ? "bg-white/10 text-white/62"
                                                        : "bg-white text-[#8D7B74]"
                                            }`}
                                        >
                                            {isVariantGroup(group)
                                                ? "Full prices"
                                                : isGroupRequired(group)
                                                    ? "Required"
                                                    : "Optional"}
                                            {!isVariantGroup(group) && getGroupMaxSelect(group) > 1 ? ` · ${getGroupMaxSelect(group)} max` : ""}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        {group.options.map((option) => {
                                            const groupId = getModifierGroupId(group);
                                            const optionId = getOptionId(option);
                                            const selectedOptionIds = Array.isArray(selectedModifiers[groupId])
                                                ? selectedModifiers[groupId]
                                                : [selectedModifiers[groupId]].filter(Boolean);
                                            const isSelected = selectedOptionIds.some(
                                                (selectedOptionId) => String(selectedOptionId) === String(optionId)
                                            );
                                            const optionPrice = getModifierOptionPrice(option, group);
                                            const isVariant = isVariantGroup(group);
                                            const isDisabled = !isVariant && !canSelectNonVariantModifiers;

                                            return (
                                                <button
                                                    key={optionId}
                                                    type="button"
                                                    disabled={isDisabled}
                                                    onClick={() => {
                                                        if (isDisabled) return;

                                                        setSelectedModifiers((current) => {
                                                            const maxSelect = getGroupMaxSelect(group);

                                                            if (maxSelect <= 1) {
                                                                return {
                                                                    ...current,
                                                                    [groupId]: optionId,
                                                                };
                                                            }

                                                            const currentOptionIds = Array.isArray(current[groupId])
                                                                ? current[groupId]
                                                                : [current[groupId]].filter(Boolean);
                                                            const alreadySelected = currentOptionIds.some(
                                                                (selectedOptionId) => String(selectedOptionId) === String(optionId)
                                                            );
                                                            const nextOptionIds = alreadySelected
                                                                ? currentOptionIds.filter(
                                                                      (selectedOptionId) => String(selectedOptionId) !== String(optionId)
                                                                  )
                                                                : [...currentOptionIds, optionId].slice(0, maxSelect);

                                                            return {
                                                                ...current,
                                                                [groupId]: nextOptionIds,
                                                            };
                                                        });
                                                    }}
                                                    className={`product-modal-option ${isSelected ? "product-modal-option-selected" : ""} rounded-xl border px-3 py-2.5 text-left transition disabled:cursor-not-allowed ${
                                                        isDisabled
                                                            ? isDark
                                                                ? "border-white/8 bg-white/[0.035] text-white/28"
                                                                : "border-[#E7DCD6] bg-[#F4EEE9] text-[#9C8B84]"
                                                            :
                                                        isSelected
                                                            ? isVariant
                                                                ? isDark
                                                                    ? "border-[#FFD166] bg-[#FFD166]/16 text-white shadow-[0_12px_26px_rgba(255,209,102,0.12)] ring-2 ring-[#FFD166]/20"
                                                                    : "border-[#D8A23A] bg-[#FFF0C4] text-[#241707] shadow-[0_12px_26px_rgba(216,162,58,0.12)] ring-2 ring-[#D8A23A]/20"
                                                                : isDark
                                                                ? "border-[#7F1D1D] bg-[#7F1D1D]/18 text-white shadow-[0_12px_26px_rgba(127,29,29,0.12)]"
                                                                : "border-[#7F1D1D] bg-[#F9ECEC] text-[#7F1D1D]"
                                                            : isVariant
                                                                ? isDark
                                                                    ? "border-[#FFD166]/20 bg-[#1D2528] text-white hover:border-[#FFD166]/55 hover:bg-[#FFD166]/10"
                                                                    : "border-[#E1C06B] bg-white text-[#5E4422] hover:border-[#D8A23A]"
                                                                : isDark
                                                                ? "border-white/10 bg-white/[0.06] text-white/68 hover:border-[#FFD166]/45 hover:bg-white/[0.10] hover:text-white"
                                                                : "border-[#E7DCD6] text-[#77665F] hover:border-[#CBB9B1]"
                                                    }`}
                                                >
                                                    <span className="flex items-start justify-between gap-3">
                                                        <span className="min-w-0 text-[13px] font-extrabold">
                                                            {option.name}
                                                        </span>
                                                        {isVariant && (
                                                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${
                                                                isDark ? "bg-[#FFD166] text-[#151A1D]" : "bg-[#7F1D1D] text-white"
                                                            }`}>
                                                                {isSelected ? "Selected" : "Full price"}
                                                            </span>
                                                        )}
                                                    </span>
                                                    {(isVariant || optionPrice > 0) && (
                                                        <span className={`mt-2 block text-2xl font-black leading-none ${isDark ? "text-[#FFD166]" : "text-[#B78312]"}`}>
                                                            {isVariant ? `$${optionPrice.toFixed(2)}` : `+ $${optionPrice.toFixed(2)}`}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-5">
                            <div className="mb-2 flex items-center justify-between">
                                <h3 className="text-sm font-extrabold">Choose size</h3>
                                <span className={`text-xs ${isDark ? "text-white/45" : "text-[#A08D85]"}`}>Required</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                                {["small", "large"].map((size) => (
                                    <button
                                        key={size}
                                        type="button"
                                        onClick={() => setSelectedSize(size)}
                                        className={`rounded-xl border px-3 py-2.5 text-left transition ${
                                            selectedSize === size
                                                ? isDark
                                                    ? "border-[#7F1D1D] bg-[#7F1D1D]/18 text-white"
                                                    : "border-[#7F1D1D] bg-[#F9ECEC] text-[#7F1D1D]"
                                                : isDark
                                                    ? "border-white/10 bg-white/[0.06] text-white/68 hover:border-[#FFD166]/45 hover:bg-white/[0.10] hover:text-white"
                                                    : "border-[#E7DCD6] text-[#77665F] hover:border-[#CBB9B1]"
                                        }`}
                                    >
                                        <span className="block text-sm font-extrabold capitalize">{size}</span>
                                        <span className="mt-0.5 block text-xs opacity-70">{size === "small" ? "Regular serving" : "+ $2.00"}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className={`mt-5 flex items-center justify-between rounded-2xl p-3 ${isDark ? "border border-white/10 bg-white/[0.07]" : "bg-[#F8F4F1]"}`}>
                        <div>
                            <p className="text-sm font-extrabold">Quantity</p>
                            <p className={`text-xs ${isDark ? "text-white/45" : "text-[#998780]"}`}>How many?</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setQuantity((value) => Math.max(1, value - 1))} className={`grid h-8 w-8 place-items-center rounded-xl shadow-sm ${isDark ? "bg-white/10 text-[#FFD166]" : "bg-white text-[#7F1D1D]"}`}><Minus size={15} /></button>
                            <span className="w-5 text-center font-black">{quantity}</span>
                            <button onClick={() => setQuantity((value) => value + 1)} className={`grid h-8 w-8 place-items-center rounded-xl text-white shadow-sm ${isDark ? "bg-[#7F1D1D]" : "bg-[#7F1D1D]"}`}><Plus size={15} /></button>
                        </div>
                    </div>

                    <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Special instructions (optional)" rows={2} className={`mt-3 w-full resize-none rounded-2xl border p-3 text-sm outline-none transition ${
                        isDark
                            ? "border-white/10 bg-white/[0.06] text-white placeholder:text-white/38 focus:border-[#7F1D1D] focus:ring-4 focus:ring-[#7F1D1D]/15"
                            : "border-[#E7DCD6] bg-white placeholder:text-[#AA9A94] focus:border-[#7F1D1D] focus:ring-4 focus:ring-[#7F1D1D]/10"
                    }`} />
                    </div>

                    <button
                        disabled={!allRequiredModifiersSelected || isAdded || isClosing}
                        onClick={addCurrentItemToCart}
                        className={`product-modal-submit mx-4 mb-4 mt-3 flex shrink-0 items-center justify-between rounded-2xl px-4 py-3 text-sm font-extrabold text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:shadow-none sm:mx-5 ${
                            isAdded
                                ? "bg-[#7F1D1D] shadow-[0_18px_34px_rgba(127,29,29,0.25)] ring-4 ring-[#FFD166]/20 hover:bg-[#7F1D1D]"
                                : isDark
                                ? "bg-[#7F1D1D] shadow-[0_18px_34px_rgba(127,29,29,0.25)] hover:bg-[#681718] disabled:bg-white/15 disabled:text-white/35"
                                : "bg-[#7F1D1D] shadow-[0_10px_24px_rgba(127,29,29,0.2)] hover:bg-[#681718] disabled:bg-[#CBB9B1]"
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            {isAdded ? <Check size={19} /> : <ShoppingBag size={19} />}
                            {isAdded ? "Added" : "Add to order"}
                        </span>
                        <span>{isLoadingDetails ? "Loading..." : `$${(unitPrice * quantity).toFixed(2)}`}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProductModal;
