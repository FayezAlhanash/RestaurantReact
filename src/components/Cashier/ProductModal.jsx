import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";

const SAVED_MODIFIER_PRICES_STORAGE_KEY = "manager_menu_modifier_prices";

function ProductModal({ isOpen, onClose, item, addToCart, variant = "light" }) {
    const [selectedSize, setSelectedSize] = useState("small");
    const [selectedModifiers, setSelectedModifiers] = useState({});
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState("");

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setQuantity(1);
        setSelectedSize("small");
        setSelectedModifiers({});
        setNotes("");
    }, [item]);

    const closeModal = () => {
        setQuantity(1);
        setSelectedSize("small");
        setSelectedModifiers({});
        setNotes("");
        onClose();
    };

    if (!isOpen) return null;

    const isDark = variant === "dark";

    const getOptionId = (option) => option?.id ?? option?.modifier_option_id ?? option?.modifierOptionId ?? option?.option_id ?? option?.optionId;
    const getModifierGroupId = (group) => group?.id ?? group?.modifier_group_id ?? group?.modifierGroupId ?? group?.group_id ?? group?.groupId;
    const getGroupMaxSelect = (group) => Math.max(1, Number(group?.pivot?.max_select ?? group?.max_select ?? group?.maxSelect ?? 1));
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
        (total, option) => total + option.price,
        0
    );
    const sizePrice = !hasModifiers && selectedSize === "large" ? 2 : 0;
    const unitPrice = basePrice + modifierPrice + sizePrice;
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

    return (
        <div className={`product-modal-overlay fixed inset-0 z-[300] flex items-center justify-center p-3 backdrop-blur-md sm:p-6 ${isDark ? "bg-black/65" : "bg-[#211715]/55"}`}>
            <div className={`product-modal-shell grid h-[calc(100dvh-1.5rem)] max-h-[760px] w-full max-w-[820px] overflow-hidden rounded-[28px] border shadow-2xl md:grid-cols-[0.86fr_1.14fr] ${
                isDark
                    ? "border-white/10 bg-[#12181B] text-white shadow-[0_34px_90px_rgba(0,0,0,0.55)]"
                    : "border-transparent bg-white text-[#2D2421]"
            }`}>
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
                                        isDark
                                            ? "border-white/10 bg-black/18"
                                            : "border-[#E7DCD6] bg-[#FBF8F6]"
                                    }`}
                                >
                                    <div className="mb-3 flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className={`text-xl font-black leading-6 ${isDark ? "text-[#FFD166]" : "text-[#B78312]"}`}>
                                                {group.name}
                                            </h3>
                                        </div>
                                        <span
                                            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${
                                                isGroupRequired(group)
                                                    ? isDark
                                                        ? "bg-[#7F1D1D]/18 text-[#7F1D1D]"
                                                        : "bg-[#F9ECEC] text-[#7F1D1D]"
                                                    : isDark
                                                        ? "bg-white/10 text-white/62"
                                                        : "bg-white text-[#8D7B74]"
                                            }`}
                                        >
                                            {isGroupRequired(group) ? "Required" : "Optional"}
                                            {getGroupMaxSelect(group) > 1 ? ` · ${getGroupMaxSelect(group)} max` : ""}
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

                                            return (
                                                <button
                                                    key={optionId}
                                                    type="button"
                                                    onClick={() => {
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
                                                    className={`product-modal-option ${isSelected ? "product-modal-option-selected" : ""} rounded-xl border px-3 py-2.5 text-left transition ${
                                                        isSelected
                                                            ? isDark
                                                                ? "border-[#7F1D1D] bg-[#7F1D1D]/18 text-white shadow-[0_12px_26px_rgba(127,29,29,0.12)]"
                                                                : "border-[#7F1D1D] bg-[#F9ECEC] text-[#7F1D1D]"
                                                            : isDark
                                                                ? "border-white/10 bg-white/[0.06] text-white/68 hover:border-[#FFD166]/45 hover:bg-white/[0.10] hover:text-white"
                                                                : "border-[#E7DCD6] text-[#77665F] hover:border-[#CBB9B1]"
                                                    }`}
                                                >
                                                    <span className="block text-[13px] font-extrabold">
                                                        {option.name}
                                                    </span>
                                                    {optionPrice > 0 && (
                                                        <span className={`mt-1 block text-sm font-black ${isDark ? "text-[#FFD166]" : "text-[#B78312]"}`}>
                                                            + ${optionPrice.toFixed(2)}
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
                        disabled={!allRequiredModifiersSelected}
                        onClick={() => {
                            if (!allRequiredModifiersSelected) return;

                            addToCart({
                                ...item,
                                price: unitPrice,
                                quantity,
                                size: hasModifiers ? "" : selectedSize,
                                notes: orderNotes,
                                selectedModifiers,
                                selectedModifierOptions,
                            });
                            closeModal();
                        }}
                        className={`product-modal-submit mx-4 mb-4 mt-3 flex shrink-0 items-center justify-between rounded-2xl px-4 py-3 text-sm font-extrabold text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:shadow-none sm:mx-5 ${
                            isDark
                                ? "bg-[#7F1D1D] shadow-[0_18px_34px_rgba(127,29,29,0.25)] hover:bg-[#681718] disabled:bg-white/15 disabled:text-white/35"
                                : "bg-[#7F1D1D] shadow-[0_10px_24px_rgba(127,29,29,0.2)] hover:bg-[#681718] disabled:bg-[#CBB9B1]"
                        }`}
                    >
                        <span className="flex items-center gap-2"><ShoppingBag size={19} /> Add to order</span>
                        <span>{isLoadingDetails ? "Loading..." : `$${(unitPrice * quantity).toFixed(2)}`}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProductModal;
