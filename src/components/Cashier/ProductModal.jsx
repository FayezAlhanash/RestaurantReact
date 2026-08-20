import {
    Check,
    ChevronDown,
    Clock3,
    Flame,
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
import {
    MODIFIER_UNAVAILABLE_MESSAGE,
    isFoodOrderable,
    isModifierOptionOrderable,
} from "../../utils/foodAvailability";

const SAVED_MODIFIER_PRICES_STORAGE_KEY = "manager_menu_modifier_prices";

const getAnyModifierOptionId = (option) =>
    option?.id ??
    option?.modifier_option_id ??
    option?.modifierOptionId ??
    option?.option_id ??
    option?.optionId;

const getAnyModifierGroups = (item) =>
    item?.modifierGroups ?? item?.modifier_groups ?? item?.groups ?? [];

const getAnyModifierOptions = (group) =>
    group?.options ?? group?.modifier_options ?? group?.modifierOptions ?? [];

const normalizeModifierText = (value = "") =>
    String(value)
        .trim()
        .toLowerCase()
        .replace(/[أإآ]/g, "ا")
        .replace(/ى/g, "ي")
        .replace(/ة/g, "ه")
        .replace(/[\u064B-\u065F\u0670]/g, "")
        .replace(/\s+/g, " ");

const toPriceNumber = (value, fallback = 0) => {
    if (value === undefined || value === null || value === "") return fallback;

    const numericValue =
        typeof value === "number"
            ? value
            : Number(String(value).replace(/[^\d.-]/g, ""));

    return Number.isFinite(numericValue) ? numericValue : fallback;
};

function ProductModal({ isOpen, onClose, item, addToCart, variant = "light" }) {
    const [selectedSize, setSelectedSize] = useState("small");
    const [selectedModifiers, setSelectedModifiers] = useState({});
    const [selectedModifierRecords, setSelectedModifierRecords] = useState({});
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState("");
    const [isClosing, setIsClosing] = useState(false);
    const [isAdded, setIsAdded] = useState(false);
    const [expandedModifierGroups, setExpandedModifierGroups] = useState({});
    const [modifierAvailabilityMessage, setModifierAvailabilityMessage] = useState("");
    const closeTimerRef = useRef(null);
    const addTimerRef = useRef(null);
    const itemResetKey = `${item?.restaurant_id ?? ""}:${item?.food_id ?? item?.id ?? ""}`;

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setQuantity(1);
        setSelectedSize("small");
        setSelectedModifiers({});
        setSelectedModifierRecords({});
        setExpandedModifierGroups({});
        setModifierAvailabilityMessage("");
        setNotes("");
    }, [itemResetKey]);

    useEffect(
        () => () => {
            window.clearTimeout(closeTimerRef.current);
            window.clearTimeout(addTimerRef.current);
        },
        []
    );

    useEffect(() => {
        if (!isOpen) return undefined;

        const scrollY = window.scrollY;
        const previousBodyStyles = {
            overflow: document.body.style.overflow,
            position: document.body.style.position,
            top: document.body.style.top,
            left: document.body.style.left,
            right: document.body.style.right,
            width: document.body.style.width,
        };
        const previousHtmlOverscroll = document.documentElement.style.overscrollBehavior;

        document.body.style.overflow = "hidden";
        document.body.style.position = "fixed";
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = "0";
        document.body.style.right = "0";
        document.body.style.width = "100%";
        document.documentElement.style.overscrollBehavior = "none";

        return () => {
            document.body.style.overflow = previousBodyStyles.overflow;
            document.body.style.position = previousBodyStyles.position;
            document.body.style.top = previousBodyStyles.top;
            document.body.style.left = previousBodyStyles.left;
            document.body.style.right = previousBodyStyles.right;
            document.body.style.width = previousBodyStyles.width;
            document.documentElement.style.overscrollBehavior = previousHtmlOverscroll;
            window.scrollTo(0, scrollY);
        };
    }, [isOpen]);

    const closeModal = () => {
        if (closeTimerRef.current) return;

        setIsClosing(true);
        closeTimerRef.current = window.setTimeout(() => {
            setQuantity(1);
            setSelectedSize("small");
            setSelectedModifiers({});
            setSelectedModifierRecords({});
            setExpandedModifierGroups({});
            setModifierAvailabilityMessage("");
            setNotes("");
            setIsAdded(false);
            setIsClosing(false);
            closeTimerRef.current = null;
            onClose();
        }, 220);
    };

    useEffect(() => {
        if (!isOpen) return;

        const availabilityByOptionId = new Map(
            getAnyModifierGroups(item)
                .flatMap(getAnyModifierOptions)
                .map((option) => [String(getAnyModifierOptionId(option)), option])
        );

        if (!availabilityByOptionId.size) return;

        const cleanupTimer = window.setTimeout(() => {
            setSelectedModifiers((current) => {
                let removedUnavailableOption = false;
                const nextModifiers = {};

                Object.entries(current).forEach(([groupId, value]) => {
                    const optionIds = Array.isArray(value)
                        ? value
                        : [value].filter(Boolean);
                    const availableOptionIds = optionIds.filter((optionId) => {
                        const option = availabilityByOptionId.get(String(optionId));
                        const canOrder = isModifierOptionOrderable(option);

                        if (!canOrder) removedUnavailableOption = true;
                        return canOrder;
                    });

                    if (Array.isArray(value)) {
                        if (availableOptionIds.length) {
                            nextModifiers[groupId] = availableOptionIds;
                        }
                        return;
                    }

                    if (availableOptionIds[0]) {
                        nextModifiers[groupId] = availableOptionIds[0];
                    }
                });

                if (removedUnavailableOption) {
                    setModifierAvailabilityMessage(MODIFIER_UNAVAILABLE_MESSAGE);
                    return nextModifiers;
                }

                return current;
            });
        }, 0);

        return () => window.clearTimeout(cleanupTimer);
    }, [isOpen, item]);

    if (!isOpen) return null;

    const isDark = variant === "dark";
    const isDineIn = variant === "dineIn" || variant === "dineInDark";
    const isDineInDark = variant === "dineInDark";

    const getOptionId = (option) => option?.id ?? option?.modifier_option_id ?? option?.modifierOptionId ?? option?.option_id ?? option?.optionId;
    const getModifierGroupId = (group) => group?.id ?? group?.modifier_group_id ?? group?.modifierGroupId ?? group?.group_id ?? group?.groupId;
    const isVariantGroup = (group) => {
        const groupName = normalizeModifierText(group?.name);
        const groupType = normalizeModifierText(
            group?.type ??
                group?.modifier_type ??
                group?.modifierType ??
                group?.display_type ??
                group?.displayType
        );

        return (
            Boolean(Number(group?.is_variant ?? group?.isVariant ?? 0)) ||
            ["variant", "variants", "size", "sizes"].includes(groupType) ||
            ["size", "sizes", "\u062d\u062c\u0645", "\u0627\u0644\u062d\u062c\u0645"].some((term) =>
                groupName.includes(term)
            ) ||
            (groupName.includes("\u0633\u0639\u0631") &&
                groupName.includes("\u0627\u0633\u0627\u0633\u064a") &&
                groupName.includes("\u0635\u0646\u0641"))
        );
    };
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
    const isBaseSizeOption = (option, group) => {
        const optionName = String(option?.name ?? "").trim().toLowerCase();
        const firstOptionId = getOptionId(group?.options?.[0]);
        const optionId = getOptionId(option);

        return (
            optionName.includes("small") ||
            optionName.includes("\u0635\u063a\u064a\u0631") ||
            (firstOptionId !== undefined && String(firstOptionId) === String(optionId))
        );
    };
    const getModifierOptionPrice = (option, group, { basePrice: itemBasePrice = 0 } = {}) => {
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
        const backendRelationPrice =
            getRelationPrice(groupPrice) ??
            findNestedOptionPrice(group, optionId) ??
            getRelationPrice(option);
        const relationPrice = isVariantGroup(group)
            ? backendRelationPrice
            : backendRelationPrice ?? getSavedModifierPrice(groupId, optionId);
        const optionPrice = toPriceNumber(relationPrice ?? option?.price, 0);

        if (!isVariantGroup(group)) return optionPrice;
        if (isBaseSizeOption(option, group)) return 0;

        return optionPrice > itemBasePrice ? optionPrice - itemBasePrice : optionPrice;
    };
    const getModifierOptionFinalPrice = (option, group, { basePrice: itemBasePrice = 0 } = {}) =>
        itemBasePrice + getModifierOptionPrice(option, group, { basePrice: itemBasePrice });
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
                                  price: getModifierOptionPrice(option, group, { basePrice }),
                                  finalPrice: getModifierOptionFinalPrice(option, group, { basePrice }),
                                  isVariant: isVariantGroup(group),
                                  can_order:
                                      option.can_order === undefined
                                          ? true
                                          : Boolean(option.can_order),
                                  unavailable_reason: option.unavailable_reason ?? null,
                              }
                            : null;
                    })
                    .filter(Boolean);
            });
    const imageUrl =
        item?.image ||
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=85";
    const basePrice = toPriceNumber(item?.price, 0);
    const modifierGroups = (item?.modifierGroups ?? [])
        .map((group) => ({
            ...group,
            options: group.options ?? group.modifier_options ?? group.modifierOptions ?? [],
        }))
        .filter((group) => group.options.length);
    const hasModifiers = modifierGroups.length > 0;
    const isLoadingDetails = Boolean(item?.isLoadingDetails);
    const canOrder = isFoodOrderable(item);
    const hasVariantGroups = modifierGroups.some(isVariantGroup);
    const selectedModifierOptions = Object.values(selectedModifierRecords).flat();
    const selectedPriceSummary = selectedModifierOptions.reduce(
        (summary, group) => {
            if (group.isVariant) {
                summary.variantPrice = toPriceNumber(group.finalPrice, basePrice);
                return summary;
            }

            summary.addOnPrice += toPriceNumber(group.price, 0);

            return summary;
        },
        { variantPrice: null, addOnPrice: 0 },
    );
    const selectedVariantOption = selectedModifierOptions.find((option) => option.isVariant);
    const canSelectNonVariantModifiers = !hasVariantGroups || Boolean(selectedVariantOption);
    const sizePrice = !hasModifiers && selectedSize === "large" ? 2 : 0;
    const unitPrice =
        (selectedPriceSummary.variantPrice ?? basePrice + sizePrice) +
        selectedPriceSummary.addOnPrice;
    const changeModalQuantity = (amount) =>
        setQuantity((value) => Math.max(1, toPriceNumber(value, 1) + amount));
    const buildSelectedModifierRecord = (
        group,
        option,
        { displayPrice, optionPrice },
    ) => {
        const groupId = getModifierGroupId(group);
        const isVariant = isVariantGroup(group);

        return {
            groupId,
            modifier_group_id: groupId,
            groupName: group.name,
            id: getOptionId(option),
            modifier_option_id: getOptionId(option),
            name: option.name,
            price: isVariant
                ? getModifierOptionPrice(option, group, { basePrice })
                : optionPrice,
            finalPrice: displayPrice,
            isVariant,
            can_order:
                option.can_order === undefined ? true : Boolean(option.can_order),
            unavailable_reason: option.unavailable_reason ?? null,
        };
    };
    const updateSelectedModifierRecord = (
        group,
        option,
        { isSelected, displayPrice, optionPrice },
    ) => {
        const groupId = getModifierGroupId(group);
        const optionId = getOptionId(option);
        const maxSelect = getGroupMaxSelect(group);

        setSelectedModifierRecords((current) => {
            if (maxSelect <= 1) {
                if (isSelected && !isGroupRequired(group)) {
                    const nextRecords = { ...current };
                    delete nextRecords[groupId];
                    return nextRecords;
                }

                return {
                    ...current,
                    [groupId]: [
                        buildSelectedModifierRecord(group, option, {
                            displayPrice,
                            optionPrice,
                        }),
                    ],
                };
            }

            const currentRecords = current[groupId] ?? [];
            const alreadySelected = currentRecords.some(
                (record) => String(record.modifier_option_id) === String(optionId),
            );
            const nextRecords = alreadySelected
                ? currentRecords.filter(
                      (record) =>
                          String(record.modifier_option_id) !== String(optionId),
                  )
                : [
                      ...currentRecords,
                      buildSelectedModifierRecord(group, option, {
                          displayPrice,
                          optionPrice,
                      }),
                  ].slice(0, maxSelect);

            return {
                ...current,
                [groupId]: nextRecords,
            };
        });
    };
    const allRequiredModifiersSelected =
        !isLoadingDetails &&
        (!hasModifiers ||
            modifierGroups.every((group) => {
            if (!isGroupRequired(group)) return true;

            const selectedOptionIds = selectedModifiers[getModifierGroupId(group)];
            const availableSelectedOptionIds = (Array.isArray(selectedOptionIds)
                ? selectedOptionIds
                : [selectedOptionIds].filter(Boolean)
            ).filter((optionId) =>
                group.options.some(
                    (option) =>
                        String(getOptionId(option)) === String(optionId) &&
                        isModifierOptionOrderable(option)
                )
            );

            return availableSelectedOptionIds.length > 0;
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
        if (!canOrder || !allRequiredModifiersSelected || isAdded || isClosing) return;

        const wasAdded = addToCart({
            ...item,
            price: unitPrice,
            quantity,
            size: hasModifiers ? "" : selectedSize,
            notes: orderNotes,
            selectedModifiers,
            selectedModifierOptions,
        });
        if (wasAdded === false) return;

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
            <div className={`product-modal-overlay fixed inset-0 z-[300] flex items-start justify-center overscroll-contain p-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-md sm:items-center sm:p-6 ${
                isDineInDark ? "bg-black/72" : "bg-[#211715]/55"
            } ${isClosing ? "modal-backdrop-exit" : "modal-backdrop-enter"}`}>
                <div className={`product-modal-shell flex h-[calc(100dvh-1rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] max-h-[820px] w-full max-w-[520px] flex-col overflow-hidden rounded-[24px] border shadow-[0_34px_90px_rgba(0,0,0,0.48)] sm:h-[calc(100dvh-1.5rem)] sm:rounded-[30px] ${
                    isDineInDark
                        ? "border-white/10 bg-[#12181B] text-white"
                        : "border-[#E4CFC3] bg-[#FFF9F2] text-[#241815]"
                } ${isClosing ? "dine-in-product-panel-exit" : "dine-in-product-panel-enter"}`}>
                    <div className={`relative shrink-0 overflow-hidden ${
                        isDineInDark ? "bg-[#101517]" : "bg-[#F3E5D9]"
                    }`}>
                        <div className={`absolute inset-0 ${
                            isDineInDark
                                ? "bg-[radial-gradient(circle_at_18%_12%,rgba(255,209,102,0.16),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(127,29,29,0.34),transparent_26%),linear-gradient(145deg,#101517_0%,#171D20_52%,#26181B_100%)]"
                                : "bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.58),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(127,29,29,0.16),transparent_25%),linear-gradient(145deg,#FFF4DA_0%,#F3E5D9_56%,#E4CFC3_100%)]"
                        }`} />
                        <div className="relative z-10 flex items-center px-4 pt-2 sm:px-5 sm:pt-5">
                            <button
                                type="button"
                                onClick={closeModal}
                                aria-label="Close product"
                                className={`grid h-8 w-8 place-items-center rounded-full shadow-[0_10px_24px_rgba(127,29,29,0.16)] transition active:scale-95 sm:h-10 sm:w-10 ${
                                    isDineInDark
                                        ? "border border-white/10 bg-white/10 text-white hover:bg-[#7F1D1D]"
                                        : "bg-white/88 text-[#241815] hover:bg-white"
                                }`}
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <div className="relative z-10 px-5 pb-3 pt-0 text-center sm:px-7 sm:pb-6 sm:pt-4">
                            <p className={`text-xs font-black uppercase tracking-[0.18em] ${
                                isDineInDark ? "text-[#FFD166]" : "text-[#9A6400]"
                            }`}>
                                {item?.restaurantName || "Big-4 Menu"}
                            </p>
                            <h2 className={`mx-auto mt-1 line-clamp-2 max-w-[360px] text-[22px] font-black leading-[1.06] sm:mt-2 sm:text-[34px] ${
                                isDineInDark ? "text-white" : "text-[#241815]"
                            }`}>
                                {item?.title}
                            </h2>
                            <div className={`mx-auto mt-2 h-20 w-20 overflow-hidden rounded-full border-[5px] shadow-[0_14px_28px_rgba(127,29,29,0.20)] sm:mt-4 sm:h-40 sm:w-40 sm:border-[7px] ${
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
                        </div>
                    </div>

                    <div className={`relative flex min-h-0 flex-1 flex-col ${
                        isDineInDark ? "bg-[#12181B]" : "bg-[#FFF9F2]"
                    }`}>
                        <div className="product-modal-scroll min-h-0 flex-1 touch-pan-y overscroll-contain overflow-y-auto px-4 pb-3 pt-2 sm:px-5 sm:pb-4 sm:pt-4">
                            <div className="mb-2 flex items-center justify-between gap-3 sm:mb-4">
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
                                        Price
                                    </p>
                                    <p className={`text-2xl font-black ${
                                        isDineInDark ? "text-[#FFD166]" : "text-[#7F1D1D]"
                                    }`}>
                                        ${basePrice.toFixed(2)}
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

                            <div className="mt-2 grid grid-cols-3 gap-2 sm:mt-4">
                                <div className={`rounded-[14px] px-2 py-2 text-center sm:rounded-[18px] sm:px-3 sm:py-3 ${
                                    isDineInDark ? "border border-white/10 bg-white/[0.07]" : "bg-[#FFF4DA]"
                                }`}>
                                    <Clock3 className={`mx-auto ${
                                        isDineInDark ? "text-[#FFD166]" : "text-[#9A6400]"
                                    }`} size={18} />
                                    <p className={`mt-0.5 text-[10px] font-bold sm:mt-1 sm:text-[11px] ${
                                        isDineInDark ? "text-white/52" : "text-[#7A6258]"
                                    }`}>Prep</p>
                                    <p className={`text-sm font-black ${
                                        isDineInDark ? "text-white" : "text-[#241815]"
                                    }`}>
                                        {preparationTime ? `${preparationTime}m` : "Fresh"}
                                    </p>
                                </div>
                                <div className={`rounded-[14px] px-2 py-2 text-center sm:rounded-[18px] sm:px-3 sm:py-3 ${
                                    isDineInDark ? "border border-[#7F1D1D]/35 bg-[#7F1D1D]/16" : "bg-[#F9ECEC]"
                                }`}>
                                    <Flame className={`mx-auto ${
                                        isDineInDark ? "text-[#FFD166]" : "text-[#7F1D1D]"
                                    }`} size={18} />
                                    <p className={`mt-0.5 text-[10px] font-bold sm:mt-1 sm:text-[11px] ${
                                        isDineInDark ? "text-white/52" : "text-[#7A6258]"
                                    }`}>Energy</p>
                                    <p className={`text-sm font-black ${
                                        isDineInDark ? "text-white" : "text-[#241815]"
                                    }`}>
                                        {calories ? `${calories}` : "Chef"}
                                    </p>
                                </div>
                                <div className={`rounded-[14px] px-2 py-2 text-center sm:rounded-[18px] sm:px-3 sm:py-3 ${
                                    isDineInDark ? "border border-white/10 bg-[#0D1113]" : "bg-[#F7F2EF]"
                                }`}>
                                    <Utensils className={`mx-auto ${
                                        isDineInDark ? "text-[#FFD166]" : "text-[#7F1D1D]"
                                    }`} size={18} />
                                    <p className={`mt-0.5 text-[10px] font-bold sm:mt-1 sm:text-[11px] ${
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

                            {!canOrder && (
                                <p className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-black ${
                                    isDineInDark
                                        ? "border-[#FF6B6B]/35 bg-[#7F1D1D]/24 text-[#FFD6D6]"
                                        : "border-[#F3B0B0] bg-[#FFF0F0] text-[#7F1D1D]"
                                }`}>
                                    Unavailable
                                </p>
                            )}

                            {modifierAvailabilityMessage && (
                                <p className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-black ${
                                    isDineInDark
                                        ? "border-[#FF6B6B]/35 bg-[#7F1D1D]/24 text-[#FFD6D6]"
                                        : "border-[#F3B0B0] bg-[#FFF0F0] text-[#7F1D1D]"
                                }`}>
                                    {modifierAvailabilityMessage}
                                </p>
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
                                    {modifierGroups.map((group) => {
                                        const groupId = getModifierGroupId(group);
                                        const isVariant = isVariantGroup(group);
                                        const isExpanded = isVariant || expandedModifierGroups[groupId];

                                        return (
                                        <div
                                            key={groupId}
                                            className={`rounded-[22px] border p-3 shadow-[0_10px_24px_rgba(127,29,29,0.07)] ${
                                                isDineInDark
                                                    ? isVariant
                                                        ? "border-[#FFD166]/30 bg-[#FFD166]/8"
                                                        : "border-white/10 bg-white/[0.07]"
                                                    : isVariant
                                                        ? "border-[#D8A22D]/45 bg-[#FFF9E8]"
                                                        : "border-[#E4CFC3] bg-white"
                                            } ${
                                                !isVariant && !canSelectNonVariantModifiers
                                                    ? "opacity-55"
                                                    : ""
                                            }`}
                                        >
                                            <div
                                                role={!isVariant ? "button" : undefined}
                                                tabIndex={!isVariant ? 0 : undefined}
                                                onClick={() => {
                                                    if (isVariant) return;

                                                    setExpandedModifierGroups((current) => ({
                                                        ...current,
                                                        [groupId]: !current[groupId],
                                                    }));
                                                }}
                                                onKeyDown={(event) => {
                                                    if (isVariant || (event.key !== "Enter" && event.key !== " ")) return;

                                                    event.preventDefault();
                                                    setExpandedModifierGroups((current) => ({
                                                        ...current,
                                                        [groupId]: !current[groupId],
                                                    }));
                                                }}
                                                className={`flex items-start justify-between gap-3 ${
                                                    !isVariant ? "cursor-pointer rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#FFD166]/35" : ""
                                                }`}
                                            >
                                                <div className="min-w-0">
                                                    <h3 className={`flex items-center gap-2 text-base font-black leading-6 ${
                                                        isDineInDark ? "text-[#FFD166]" : "text-[#7F1D1D]"
                                                    }`}>
                                                        {!isVariant && (
                                                            <ChevronDown
                                                                size={18}
                                                                className={`shrink-0 transition-transform ${
                                                                    isExpanded ? "rotate-180" : ""
                                                                }`}
                                                            />
                                                        )}
                                                        {group.name}
                                                    </h3>
                                                    {isVariant && (
                                                        <p className={`mt-1 text-xs font-bold ${
                                                            isDineInDark ? "text-white/55" : "text-[#7A6258]"
                                                        }`}>
                                                            Select one size. The amount includes the base item price.
                                                        </p>
                                                    )}
                                                    {!isVariant && !canSelectNonVariantModifiers && (
                                                        <p className={`mt-1 text-xs font-bold ${
                                                            isDineInDark ? "text-white/45" : "text-[#8A7761]"
                                                        }`}>
                                                            Choose a size first.
                                                        </p>
                                                    )}
                                                </div>
                                                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${
                                                    isDineInDark
                                                        ? isVariant
                                                            ? "border border-[#FFD166]/30 bg-[#FFD166]/14 text-[#FFD166]"
                                                            : isGroupRequired(group)
                                                                ? "bg-[#7F1D1D]/24 text-[#FFD6D6]"
                                                                : "bg-white/10 text-white/62"
                                                        : isVariant
                                                            ? "bg-[#FFF0C4] text-[#9A6400]"
                                                            : isGroupRequired(group)
                                                                ? "bg-[#F9ECEC] text-[#7F1D1D]"
                                                                : "bg-[#F7F2EF] text-[#7A6258]"
                                                }`}>
                                                    {isVariant
                                                        ? "Final prices"
                                                        : isGroupRequired(group)
                                                            ? "Required"
                                                            : "Optional"}
                                                    {!isVariant && getGroupMaxSelect(group) > 1 ? ` · ${getGroupMaxSelect(group)} max` : ""}
                                                </span>
                                            </div>
                                            <div
                                                className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out ${
                                                    isExpanded
                                                        ? "grid-rows-[1fr] opacity-100"
                                                        : "grid-rows-[0fr] opacity-0"
                                                }`}
                                            >
                                                <div className="min-h-0 overflow-hidden">
                                                    <div className="flex flex-wrap gap-2 pt-3">
                                                        {group.options.map((option) => {
                                                            const optionId = getOptionId(option);
                                                            const selectedOptionIds = Array.isArray(selectedModifiers[groupId])
                                                                ? selectedModifiers[groupId]
                                                                : [selectedModifiers[groupId]].filter(Boolean);
                                                            const isSelected = selectedOptionIds.some(
                                                                (selectedOptionId) => String(selectedOptionId) === String(optionId)
                                                            );
                                                            const optionPrice = getModifierOptionPrice(option, group, { basePrice });
                                                            const isVariant = isVariantGroup(group);
                                                            const displayPrice = isVariant
                                                                ? getModifierOptionFinalPrice(option, group, { basePrice })
                                                                : optionPrice;
                                                            const isUnavailable = !isModifierOptionOrderable(option);
                                                            const isDisabled =
                                                                isUnavailable ||
                                                                (!isVariant && !canSelectNonVariantModifiers);

                                                            return (
                                                                <button
                                                                    key={optionId}
                                                                    type="button"
                                                                    disabled={isDisabled}
                                                                    onClick={() => {
                                                                        if (isDisabled) return;
                                                                        updateSelectedModifierRecord(group, option, {
                                                                            isSelected,
                                                                            displayPrice,
                                                                            optionPrice,
                                                                        });

                                                                        setSelectedModifiers((current) => {
                                                                            const maxSelect = getGroupMaxSelect(group);

                                                                            if (maxSelect <= 1) {
                                                                                if (isSelected && !isGroupRequired(group)) {
                                                                                    const nextModifiers = { ...current };
                                                                                    delete nextModifiers[groupId];
                                                                                    return nextModifiers;
                                                                                }

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
                                                                            {isVariant ? `$${displayPrice.toFixed(2)}` : `+ $${optionPrice.toFixed(2)}`}
                                                                        </span>
                                                                    )}
                                                                    {isUnavailable && (
                                                                        <span className="basis-full text-[11px] font-black text-[#FCA5A5]">
                                                                            غير متوفر حالياً
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        );
                                    })}
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
                                                    {size === "small" ? "Regular portion" : "+ $2.00"}
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

                        <div className={`grid shrink-0 grid-cols-[96px_minmax(0,1fr)] gap-2 border-t p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-[0_-18px_34px_rgba(127,29,29,0.08)] backdrop-blur sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-3 sm:p-4 ${
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
                                    onClick={() => changeModalQuantity(-1)}
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
                                    onClick={() => changeModalQuantity(1)}
                                    className="grid h-8 w-8 place-items-center rounded-full bg-[#7F1D1D] text-white transition hover:bg-[#681718] active:scale-95"
                                    aria-label="Increase quantity"
                                >
                                    <Plus size={15} />
                                </button>
                            </div>
                            <button
                                disabled={!canOrder || !allRequiredModifiersSelected || isAdded || isClosing}
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
                                    <span className="truncate">
                                        {isAdded ? "Added" : canOrder ? "Add to order" : "Unavailable"}
                                    </span>
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
        <div className={`product-modal-overlay fixed inset-0 z-[300] flex items-center justify-center overscroll-contain p-3 backdrop-blur-md sm:p-6 ${isDark ? "bg-black/65" : "bg-[#211715]/55"} ${isClosing ? "modal-backdrop-exit" : "modal-backdrop-enter"}`}>
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

                    <div className="product-modal-scroll min-h-0 flex-1 touch-pan-y overscroll-contain overflow-y-auto p-4 sm:p-5">
                    <p className={`text-xs font-bold uppercase tracking-[0.18em] ${isDark ? "text-[#FFD166]" : "text-[#A28F87]"}`}>Customize item</p>
                    <h2 className={`mt-2 pr-12 text-2xl font-black ${isDark ? "text-white" : "text-[#2D2421]"}`}>{item?.title}</h2>
                    <p className={`mt-2 text-base font-semibold leading-7 ${isDark ? "text-white/68" : "text-[#6F5C54]"}`}>{item?.description}</p>
                    {!canOrder && (
                        <p className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-black ${
                            isDark
                                ? "border-[#FF6B6B]/35 bg-[#7F1D1D]/24 text-[#FFD6D6]"
                                : "border-[#F3B0B0] bg-[#FFF0F0] text-[#7F1D1D]"
                        }`}>
                            Unavailable
                        </p>
                    )}

                    {modifierAvailabilityMessage && (
                        <p className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-black ${
                            isDark
                                ? "border-[#FF6B6B]/35 bg-[#7F1D1D]/24 text-[#FFD6D6]"
                                : "border-[#F3B0B0] bg-[#FFF0F0] text-[#7F1D1D]"
                        }`}>
                            {modifierAvailabilityMessage}
                        </p>
                    )}

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
                            {modifierGroups.map((group) => {
                                const groupId = getModifierGroupId(group);
                                const isVariant = isVariantGroup(group);
                                const isExpanded = isVariant || expandedModifierGroups[groupId];

                                return (
                                <div
                                    key={groupId}
                                    className={`product-modal-group rounded-2xl border p-3 ${
                                        isVariant
                                            ? isDark
                                                ? "border-[#FFD166]/35 bg-[#FFD166]/8"
                                                : "border-[#D8A23A]/45 bg-[#FFF9E8]"
                                            : isDark
                                            ? "border-white/10 bg-black/18"
                                            : "border-[#E7DCD6] bg-[#FBF8F6]"
                                    } ${
                                        !isVariant && !canSelectNonVariantModifiers
                                            ? "opacity-55"
                                            : ""
                                    }`}
                                >
                                    <div
                                        role={!isVariant ? "button" : undefined}
                                        tabIndex={!isVariant ? 0 : undefined}
                                        onClick={() => {
                                            if (isVariant) return;

                                            setExpandedModifierGroups((current) => ({
                                                ...current,
                                                [groupId]: !current[groupId],
                                            }));
                                        }}
                                        onKeyDown={(event) => {
                                            if (isVariant || (event.key !== "Enter" && event.key !== " ")) return;

                                            event.preventDefault();
                                            setExpandedModifierGroups((current) => ({
                                                ...current,
                                                [groupId]: !current[groupId],
                                            }));
                                        }}
                                        className={`flex items-start justify-between gap-3 ${
                                            !isVariant ? "cursor-pointer rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#FFD166]/35" : ""
                                        }`}
                                    >
                                        <div className="min-w-0">
                                            <h3 className={`flex items-center gap-2 text-xl font-black leading-6 ${isDark ? "text-[#FFD166]" : "text-[#B78312]"}`}>
                                                {!isVariant && (
                                                    <ChevronDown
                                                        size={18}
                                                        className={`shrink-0 transition-transform ${
                                                            isExpanded ? "rotate-180" : ""
                                                        }`}
                                                    />
                                                )}
                                                {group.name}
                                            </h3>
                                            {isVariant && (
                                                <p className={`mt-1 text-xs font-bold ${isDark ? "text-white/55" : "text-[#7A6258]"}`}>
                                                    Select one size. The shown amount includes the base item price.
                                                </p>
                                            )}
                                            {!isVariant && !canSelectNonVariantModifiers && (
                                                <p className={`mt-1 text-xs font-bold ${isDark ? "text-white/45" : "text-[#8D7B74]"}`}>
                                                    Choose a size first.
                                                </p>
                                            )}
                                        </div>
                                        <span
                                            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${
                                                isVariant
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
                                            {isVariant
                                                ? "Final prices"
                                                : isGroupRequired(group)
                                                    ? "Required"
                                                    : "Optional"}
                                            {!isVariant && getGroupMaxSelect(group) > 1 ? ` · ${getGroupMaxSelect(group)} max` : ""}
                                        </span>
                                    </div>
                                    <div
                                        className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out ${
                                            isExpanded
                                                ? "grid-rows-[1fr] opacity-100"
                                                : "grid-rows-[0fr] opacity-0"
                                        }`}
                                    >
                                        <div className="min-h-0 overflow-hidden">
                                            <div className="grid grid-cols-2 gap-2.5 pt-3">
                                                {group.options.map((option) => {
                                                    const optionId = getOptionId(option);
                                                    const selectedOptionIds = Array.isArray(selectedModifiers[groupId])
                                                        ? selectedModifiers[groupId]
                                                        : [selectedModifiers[groupId]].filter(Boolean);
                                                    const isSelected = selectedOptionIds.some(
                                                        (selectedOptionId) => String(selectedOptionId) === String(optionId)
                                                    );
                                                    const optionPrice = getModifierOptionPrice(option, group, { basePrice });
                                                    const displayPrice = isVariant
                                                        ? getModifierOptionFinalPrice(option, group, { basePrice })
                                                        : optionPrice;
                                                    const isUnavailable = !isModifierOptionOrderable(option);
                                                    const isDisabled =
                                                        isUnavailable ||
                                                        (!isVariant && !canSelectNonVariantModifiers);

                                                    return (
                                                        <button
                                                            key={optionId}
                                                            type="button"
                                                            disabled={isDisabled}
                                                            onClick={() => {
                                                                if (isDisabled) return;
                                                                updateSelectedModifierRecord(group, option, {
                                                                    isSelected,
                                                                    displayPrice,
                                                                    optionPrice,
                                                                });

                                                                setSelectedModifiers((current) => {
                                                                    const maxSelect = getGroupMaxSelect(group);

                                                                    if (maxSelect <= 1) {
                                                                        if (isSelected && !isGroupRequired(group)) {
                                                                            const nextModifiers = { ...current };
                                                                            delete nextModifiers[groupId];
                                                                            return nextModifiers;
                                                                        }

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
                                                                        {isSelected ? "Selected" : "Final price"}
                                                                    </span>
                                                                )}
                                                            </span>
                                                            {(isVariant || optionPrice > 0) && (
                                                                <span className={`mt-2 block text-2xl font-black leading-none ${isDark ? "text-[#FFD166]" : "text-[#B78312]"}`}>
                                                                    {isVariant ? `$${displayPrice.toFixed(2)}` : `+ $${optionPrice.toFixed(2)}`}
                                                                </span>
                                                            )}
                                                            {isUnavailable && (
                                                                <span className="mt-2 block text-xs font-black text-[#B91C1C]">
                                                                    غير متوفر حالياً
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
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
                                        <span className="mt-0.5 block text-xs opacity-70">{size === "small" ? "Regular portion" : "+ $2.00"}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className={`mt-5 flex items-center justify-between rounded-2xl border p-3 shadow-[0_12px_26px_rgba(0,0,0,0.12)] ${
                        isDark
                            ? "border-[#FFD166]/18 bg-[#1D2528]"
                            : "border-[#E7DCD6] bg-[#FFF9F2]"
                    }`}>
                        <div>
                            <p className={`text-base font-black ${isDark ? "text-white" : "text-[#241815]"}`}>
                                Quantity
                            </p>
                            <p className={`text-xs font-bold ${isDark ? "text-[#FFD166]/80" : "text-[#7F1D1D]/70"}`}>
                                How many?
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => changeModalQuantity(-1)}
                                className={`grid h-10 w-10 place-items-center rounded-xl border text-[#FFD166] shadow-sm transition active:scale-95 ${
                                    isDark
                                        ? "border-white/10 bg-white/10 hover:bg-white/15"
                                        : "border-[#E7DCD6] bg-white hover:bg-[#FFF0C4]"
                                }`}
                                aria-label="Decrease quantity"
                            >
                                <Minus size={17} />
                            </button>
                            <span className={`w-8 text-center text-xl font-black ${isDark ? "text-white" : "text-[#241815]"}`}>
                                {quantity}
                            </span>
                            <button
                                type="button"
                                onClick={() => changeModalQuantity(1)}
                                className="grid h-10 w-10 place-items-center rounded-xl bg-[#7F1D1D] text-white shadow-[0_10px_22px_rgba(127,29,29,0.25)] transition hover:bg-[#681718] active:scale-95"
                                aria-label="Increase quantity"
                            >
                                <Plus size={17} />
                            </button>
                        </div>
                    </div>

                    <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Special instructions (optional)" rows={2} className={`mt-3 w-full resize-none rounded-2xl border p-4 text-sm font-bold outline-none transition ${
                        isDark
                            ? "border-white/14 bg-[#1D2528] text-white placeholder:text-white/62 focus:border-[#FFD166]/45 focus:ring-4 focus:ring-[#FFD166]/12"
                            : "border-[#E7DCD6] bg-[#FFF9F2] text-[#241815] placeholder:text-[#7A6258] focus:border-[#7F1D1D] focus:ring-4 focus:ring-[#7F1D1D]/10"
                    }`} />
                    </div>

                    <button
                        disabled={!canOrder || !allRequiredModifiersSelected || isAdded || isClosing}
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
                            {isAdded ? "Added" : canOrder ? "Add to order" : "Unavailable"}
                        </span>
                        <span>{isLoadingDetails ? "Loading..." : `$${(unitPrice * quantity).toFixed(2)}`}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProductModal;
