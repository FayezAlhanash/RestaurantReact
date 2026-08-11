import { useCallback, useEffect, useState } from "react";
import { Building2, Check, ChevronDown, Clock3, PackageMinus, PackagePlus, Pencil, Search, Trash2 } from "lucide-react";
import RefillModal from "./RefillModal";
import WasteModal from "./WasteModal";
import AdjustModal from "./AdjustModal";
import StockOutModal from "./StockOutModal";
import api from "../../API/axios";
import { getStoredUser, ROLE_IDS } from "../../utils/auth";
import { getUserPermissions } from "../../utils/permissions";
import { ensureCurrentRestaurantId } from "../../utils/restaurant";
import { useTheme } from "../../context/ThemeContext";
import PermissionToast from "../Shared/PermissionToast";

const getList = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data?.data)) return data.data.data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.ingredients)) return data.ingredients;
    if (Array.isArray(data?.data?.ingredients)) return data.data.ingredients;
    return [];
};

const getPagination = (data) => {
    const source = data?.meta || data?.data?.meta || data?.pagination || data?.data;

    return {
        currentPage: Number(
            source?.current_page ??
                source?.currentPage ??
                data?.current_page ??
                data?.currentPage ??
                1
        ),
        lastPage: Number(
            source?.last_page ??
                source?.lastPage ??
                source?.total_pages ??
                source?.totalPages ??
                data?.last_page ??
                data?.lastPage ??
                1
        ),
    };
};

async function fetchAllRestaurantIngredients(restaurantId) {
    const firstResponse = await api.get(`/restaurants/${restaurantId}/ingredients`, {
        params: { page: 1, per_page: 100 },
    });
    const firstItems = getList(firstResponse.data);
    const pagination = getPagination(firstResponse.data);
    const pages = Math.max(1, pagination.lastPage);
    const remainingPages = Array.from(
        { length: Math.max(0, pages - 1) },
        (_, index) => index + 2
    );
    const remainingResponses = await Promise.all(
        remainingPages.map((pageNumber) =>
            api.get(`/restaurants/${restaurantId}/ingredients`, {
                params: { page: pageNumber, per_page: 100 },
            })
        )
    );

    return [
        ...firstItems,
        ...remainingResponses.flatMap((response) => getList(response.data)),
    ];
}

function StockActions() {
    const { isLight } = useTheme();
    const [action, setAction] = useState(null);
    const [page, setPage] = useState(1);
    const [perPage] = useState(5);
    const [selectedIngredient, setSelectedIngredient] = useState(null);
    const [ingredients, setIngredients] = useState([]);
    const [movements, setMovements] = useState([]);
    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
    const [isLoadingWarehouse, setIsLoadingWarehouse] = useState(false);
    const [permissionMessage, setPermissionMessage] = useState("");
    const [isIngredientPickerOpen, setIsIngredientPickerOpen] = useState(false);
    const [isIngredientPickerMounted, setIsIngredientPickerMounted] = useState(false);
    const [ingredientQuery, setIngredientQuery] = useState("");
    const permissions = getUserPermissions();
    const canManageInventory = permissions.includes("manage_inventory");
    const user = getStoredUser();
    const isAdmin = Number(user?.role_id ?? user?.role?.id) === ROLE_IDS.ADMIN;
    const getActiveRestaurantId = useCallback(async () => {
        if (isAdmin) return selectedRestaurantId || null;

        return ensureCurrentRestaurantId();
    }, [isAdmin, selectedRestaurantId]);
    const getIngredients = useCallback(async () => {
        const restaurantId = await getActiveRestaurantId();
        if (!restaurantId) {
            setIngredients([]);
            return;
        }

        setIsLoadingWarehouse(true);

        try {
            setIngredients(await fetchAllRestaurantIngredients(restaurantId));
        } finally {
            setIsLoadingWarehouse(false);
        }
    }, [getActiveRestaurantId]);

    const openAction = (type) => {
        if (!canManageInventory) {
            setPermissionMessage("You do not have permission to manage inventory.");
            return;
        }

        if (!selectedIngredient) {
            alert("Please select an ingredient first");
            return;
        }
        setAction(type);
    }; const getMovements = useCallback(async () => {
        const restaurantId = await getActiveRestaurantId();
        if (!restaurantId) {
            setMovements([]);
            return;
        }

        setIsLoadingWarehouse(true);
        const res = await api.get(`/restaurants/${restaurantId}/stock-movements`);
        setMovements(res.data.data);
        setIsLoadingWarehouse(false);
    }, [getActiveRestaurantId]);
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsIngredientPickerOpen(false);
        setIngredientQuery("");
        setSelectedIngredient(null);
        getIngredients();
        getMovements();
    }, [getIngredients, getMovements]);

    useEffect(() => {
        if (!isAdmin) return undefined;

        const fetchRestaurants = async () => {
            try {
                const res = await api.get("/restaurants");
                const restaurantList = res.data.restaurants || res.data.data || [];

                setRestaurants(restaurantList);
                setSelectedRestaurantId((current) =>
                    current || restaurantList[0]?.id || ""
                );
            } catch (error) {
                console.log(error.response?.data || error);
            }
        };

        fetchRestaurants();
    }, [isAdmin]);

    useEffect(() => {
        if (isIngredientPickerOpen) {
            const timeoutId = window.setTimeout(() => {
                setIsIngredientPickerMounted(true);
            }, 0);

            return () => window.clearTimeout(timeoutId);
        }

        const timeoutId = window.setTimeout(() => {
            setIsIngredientPickerMounted(false);
        }, 180);

        return () => window.clearTimeout(timeoutId);
    }, [isIngredientPickerOpen]);

    const refreshAfterAction = async () => {
        const restaurantId = await getActiveRestaurantId();
        if (!restaurantId) return;

        const previousIngredient = selectedIngredient;
        const nextIngredients = await fetchAllRestaurantIngredients(restaurantId);
        await getMovements();
        const updatedIngredient =
            nextIngredients.find(i => String(i.id) === String(previousIngredient?.id)) || null;

        setAction(null);
        setIngredients(nextIngredients);

        setSelectedIngredient(updatedIngredient);

        setAction(null);
    };
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;

    const paginatedMovements = movements.slice(startIndex, endIndex);
    const totalPages = Math.max(1, Math.ceil(movements.length / perPage));
    const selectedCurrentQuantity = Number(selectedIngredient?.current_quantity ?? 0);
    const selectedMinimumQuantity = Number(selectedIngredient?.min_quantity ?? 0);
    const isSelectedLowStock = selectedCurrentQuantity <= selectedMinimumQuantity;
    const ingredientPickerHelper = isLoadingWarehouse
        ? "Loading warehouse ingredients..."
        : selectedIngredient
            ? `${selectedIngredient.current_quantity} ${selectedIngredient.unit} available`
            : `${ingredients.length} ingredients available`;
    const visibleIngredients = ingredients.filter((ingredient) => {
        const query = ingredientQuery.trim().toLowerCase();

        if (!query) return true;

        return `${ingredient.name} ${ingredient.current_quantity} ${ingredient.unit}`
            .toLowerCase()
            .includes(query);
    });
    const actionCards = [
        {
            id: "refill",
            title: "Refill",
            description: "Add purchased stock to the selected ingredient.",
            icon: PackagePlus,
            activeClass:
                isLight
                    ? "border-emerald-400/55 bg-emerald-400/12 text-emerald-700 hover:bg-emerald-400/18"
                    : "border-emerald-400/45 bg-[linear-gradient(145deg,rgba(52,211,153,0.18),rgba(52,211,153,0.07))] text-emerald-200 hover:bg-emerald-400/20",
        },
        {
            id: "waste",
            title: "Waste",
            description: "Record damaged, expired, or discarded quantity.",
            icon: Trash2,
            iconClass: "text-[#7F1D1D]",
            activeClass:
                isLight
                    ? "border-[#7F1D1D]/45 bg-[#7F1D1D]/10 text-[#7F1D1D] hover:bg-[#7F1D1D]/14"
                    : "border-[#7F1D1D]/45 bg-[linear-gradient(145deg,rgba(127,29,29,0.18),rgba(127,29,29,0.07))] text-[#7F1D1D] hover:bg-[#7F1D1D]/20",
        },
        {
            id: "adjust",
            title: "Adjust",
            description: "Set the counted quantity after a manual check.",
            icon: Pencil,
            activeClass:
                isLight
                    ? "border-[#FFD166]/65 bg-[#FFD166]/12 text-[#8f5f00] hover:bg-[#FFD166]/18"
                    : "border-[#FFD166]/45 bg-[linear-gradient(145deg,rgba(255,209,102,0.18),rgba(255,209,102,0.07))] text-[#FFD166] hover:bg-[#FFD166]/20",
        },
    ];
    const getMovementStyle = (type = "") => {
        const normalizedType = String(type).toLowerCase();

        if (normalizedType.includes("waste")) {
            return {
                label: "Waste",
                className: "border-[#7F1D1D]/45 bg-[#7F1D1D]/14 text-[#7F1D1D]",
            };
        }

        if (normalizedType.includes("adjust")) {
            return {
                label: "Adjust",
                className: "border-[#FFD166]/45 bg-[#FFD166]/14 text-[#FFD166]",
            };
        }

        if (
            normalizedType.includes("stock-out") ||
            normalizedType.includes("stock_out") ||
            normalizedType.includes("stock out") ||
            normalizedType === "out"
        ) {
            return {
                label: "Stock Out",
                className: "border-sky-400/45 bg-sky-400/14 text-sky-300",
            };
        }

        return {
            label: "Refill",
            className: "border-emerald-400/45 bg-emerald-400/12 text-emerald-300",
        };
    };
     return (
        <div className="mx-auto max-w-5xl p-4 text-white sm:p-6">
            {isIngredientPickerMounted && (
                <button
                    type="button"
                    aria-label="Close ingredient picker"
                    onClick={() => setIsIngredientPickerOpen(false)}
                    className={`fixed inset-0 z-20 bg-black/35 backdrop-blur-sm transition-opacity duration-200 ease-out ${
                        isIngredientPickerOpen ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
                />
            )}

            {/* TITLE */}
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-[#FFD166]">
                Inventory control
            </p>
            <h1 className="mb-6 text-3xl font-black text-white sm:mb-8 sm:text-4xl">
                Stock Actions
            </h1>

            <PermissionToast
                message={permissionMessage}
                onClose={() => setPermissionMessage("")}
            />

            {isAdmin && (
                <div className={`mb-6 rounded-[24px] border p-4 ring-1 ring-white/[0.04] ${
                    isLight
                        ? "border-[#8F1D1D]/35 bg-[linear-gradient(135deg,#FFF2EC_0%,#FFFDF8_48%,#F3DCDC_100%)] shadow-[0_18px_38px_rgba(127,29,29,0.14)]"
                        : "border-[#FFD166]/30 bg-[linear-gradient(135deg,rgba(255,209,102,0.10),rgba(32,41,45,0.88))] shadow-[0_18px_38px_rgba(0,0,0,0.20)]"
                }`}>
                    <div className="flex items-center gap-3">
                        <div className={`grid h-11 w-11 place-items-center rounded-2xl border ${
                            isLight
                                ? "border-[#8F1D1D]/35 bg-[#F3DCDC] text-[#8F1D1D]"
                                : "border-[#FFD166]/35 bg-[#FFD166]/12 text-[#FFD166]"
                        }`}>
                            <Building2 size={21} />
                        </div>
                        <div>
                            <p className={`text-xs font-black uppercase tracking-[0.18em] ${isLight ? "text-[#8F1D1D]" : "text-[#FFD166]"}`}>
                                Admin warehouse view
                            </p>
                            <h3 className={`text-lg font-black ${isLight ? "text-[#241815]" : "text-white"}`}>
                                Choose restaurant warehouse
                            </h3>
                        </div>
                    </div>

                    {restaurants.length > 0 && (
                        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                            {restaurants.map((restaurant) => {
                                const active =
                                    String(selectedRestaurantId) === String(restaurant.id);

                                return (
                                    <button
                                        key={restaurant.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedRestaurantId(restaurant.id);
                                            setSelectedIngredient(null);
                                            setIngredientQuery("");
                                            setIsIngredientPickerOpen(false);
                                            setIngredients([]);
                                            setMovements([]);
                                            setIsLoadingWarehouse(true);
                                            setPage(1);
                                        }}
                                        className={`shrink-0 rounded-2xl border px-4 py-2 text-sm font-black transition ${
                                            active
                                                ? isLight
                                                    ? "brand-red-action-button border-[#8F1D1D]/70 bg-[#8F1D1D] text-white shadow-[0_12px_26px_rgba(127,29,29,0.18)]"
                                                    : "border-[#FFD166]/70 bg-[#FFD166]/16 text-[#FFD166] shadow-[0_12px_26px_rgba(255,209,102,0.12)]"
                                                : isLight
                                                    ? "border-[#8F1D1D]/22 bg-white/78 text-[#6B5A52] hover:border-[#8F1D1D]/45 hover:bg-[#F3DCDC] hover:text-[#8F1D1D]"
                                                    : "border-white/12 bg-[#0D1214]/70 text-white/68 hover:border-[#FFD166]/35 hover:bg-[#FFD166]/10 hover:text-white"
                                        }`}
                                    >
                                        #{restaurant.id} {restaurant.name}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* SELECT */}
            <div className={`relative z-30 mb-8 rounded-[30px] border border-[#3A4448] bg-[linear-gradient(145deg,rgba(27,37,40,0.92)_0%,rgba(21,29,32,0.86)_100%)] p-4 shadow-[0_20px_46px_rgba(0,0,0,0.24)] ring-1 ring-white/[0.04] backdrop-blur-sm sm:p-6 ${
                isIngredientPickerOpen ? "shadow-[0_30px_90px_rgba(0,0,0,0.42)]" : ""
            }`}>

                <div className="mb-4 flex flex-col gap-1">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#FFD166]">
                        Select Ingredient
                    </p>
                    <h2 className="text-xl font-black text-white">
                        Choose what you want to update
                    </h2>
                </div>

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => {
                            if (isLoadingWarehouse) return;
                            setIsIngredientPickerOpen((value) => !value);
                        }}
                        disabled={isLoadingWarehouse}
                        className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                            isIngredientPickerOpen
                                ? "border-[#FFD166]/55 ring-4 ring-[#FFD166]/10"
                                : "border-white/10 hover:border-[#FFD166]/30"
                        } bg-[#0F1517] disabled:cursor-wait disabled:opacity-70`}
                    >
                        <div className="min-w-0">
                            <p className="truncate text-lg font-black text-white">
                                {selectedIngredient
                                    ? selectedIngredient.name
                                    : "Choose ingredient..."}
                            </p>
                            <p className="mt-1 text-sm text-white/45">
                                {ingredientPickerHelper}
                            </p>
                        </div>
                        <ChevronDown
                            size={20}
                            className={`shrink-0 text-[#FFD166] transition ${
                                isIngredientPickerOpen ? "rotate-180" : ""
                            }`}
                        />
                    </button>

                    {isIngredientPickerMounted && (
                        <div
                            className={`absolute left-0 right-0 top-[calc(100%+0.65rem)] z-40 origin-top overflow-hidden rounded-[24px] border border-[#FFD166]/35 bg-[#1B282C] shadow-[0_30px_80px_rgba(0,0,0,0.62)] ring-1 ring-white/[0.06] transition duration-200 ease-out ${
                                isIngredientPickerOpen
                                    ? "translate-y-0 scale-100 opacity-100"
                                    : "pointer-events-none -translate-y-2 scale-[0.98] opacity-0"
                            }`}
                        >
                            <div className="border-b border-[#FFD166]/15 bg-[#202F33] p-3">
                                <div className="flex items-center gap-2 rounded-2xl border border-[#FFD166]/20 bg-[#0D1214] px-3 py-2.5">
                                    <Search size={17} className="text-[#FFD166]" />
                                    <input
                                        value={ingredientQuery}
                                        onChange={(event) => setIngredientQuery(event.target.value)}
                                        placeholder="Search ingredients..."
                                        className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/35"
                                    />
                                </div>
                            </div>

                            <div className={`cashier-scroll max-h-[430px] space-y-2 overflow-y-auto bg-[#162225] p-3 transition duration-200 ease-out ${
                                isIngredientPickerOpen ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
                            }`}>
                                {isLoadingWarehouse ? (
                                    <p className="px-3 py-10 text-center text-sm font-bold text-white/45">
                                        Loading ingredients...
                                    </p>
                                ) : visibleIngredients.length ? (
                                    visibleIngredients.map((ingredient) => {
                                        const current = Number(ingredient.current_quantity ?? 0);
                                        const minimum = Number(ingredient.min_quantity ?? 0);
                                        const isLow = current <= minimum;
                                        const isSelected =
                                            String(selectedIngredient?.id) === String(ingredient.id);

                                        return (
                                            <button
                                                key={ingredient.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedIngredient(ingredient);
                                                    setIsIngredientPickerOpen(false);
                                                    setIngredientQuery("");
                                                }}
                                                className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left shadow-[0_8px_18px_rgba(0,0,0,0.12)] transition duration-150 hover:scale-[1.01] ${
                                                    isSelected
                                                        ? "border-[#FFD166]/55 bg-[#FFD166]/14"
                                                        : "border-white/10 bg-[#0D1214] hover:border-[#FFD166]/30 hover:bg-[#202F33]"
                                                }`}
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate text-base font-black text-white">
                                                        {ingredient.name}
                                                    </p>
                                                    <p className="mt-1 text-sm font-bold text-[#FFD166]">
                                                        {current} {ingredient.unit}
                                                    </p>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-2">
                                                    <span
                                                        className={`rounded-full border px-3 py-1.5 text-xs font-black ${
                                                            isLow
                                                                ? "border-[#7F1D1D]/45 bg-[#7F1D1D]/14 text-[#7F1D1D]"
                                                                : "border-emerald-400/55 bg-emerald-400/14 text-emerald-200"
                                                        }`}
                                                    >
                                                        {isLow ? "Low" : "Good"}
                                                    </span>
                                                    {isSelected && (
                                                        <Check size={18} className="text-[#FFD166]" />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })
                                ) : (
                                    <p className="px-3 py-6 text-center text-sm font-bold text-white/45">
                                        No ingredients found.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* INFO */}
                {selectedIngredient && (
                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">

                        <div className={`rounded-2xl border p-5 ${
                            isLight ? "border-[#E7DCD6] bg-[#FFF9F2]" : "border-[#3C484C] bg-[#222C30]"
                        }`}>
                            <p className={`text-sm font-bold ${isLight ? "text-[#7A6A64]" : "text-white/45"}`}>Current</p>
                            <p className="text-2xl font-black text-[#FFD166]">
                                {selectedIngredient.current_quantity} {selectedIngredient.unit}
                            </p>
                        </div>

                        <div className={`rounded-2xl border p-5 ${
                            isLight ? "border-[#E7DCD6] bg-[#FFF9F2]" : "border-[#3C484C] bg-[#222C30]"
                        }`}>
                            <p className={`text-sm font-bold ${isLight ? "text-[#7A6A64]" : "text-white/45"}`}>Minimum</p>
                            <p className={`text-2xl font-black ${isLight ? "text-[#241815]" : "text-white"}`}>
                                {selectedIngredient.min_quantity} {selectedIngredient.unit}
                            </p>
                        </div>

                        <div className={`rounded-2xl border p-5 ${isSelectedLowStock ? "border-[#7F1D1D]/45 bg-[#7F1D1D]/12" : "border-emerald-400/45 bg-emerald-400/10"}`}>
                            <p className={`text-sm font-bold ${isLight ? "text-[#7A6A64]" : "text-white/45"}`}>Status</p>

                            <p className={`text-2xl font-black ${isSelectedLowStock
                                ? "text-[#7F1D1D]"
                                : isLight ? "text-emerald-500" : "text-emerald-300"
                                }`}>
                                {isSelectedLowStock
                                    ? "LOW STOCK"
                                    : "OK"}
                            </p>
                        </div>

                    </div>
                )}
            </div>

            {/* ACTIONS */}
            <div className="space-y-5">
                <button
                    type="button"
                    disabled={!selectedIngredient}
                    onClick={() => openAction("stock-out")}
                    className={`group flex w-full flex-col gap-4 rounded-[26px] border p-5 text-left shadow-[0_16px_34px_rgba(0,0,0,0.18)] transition sm:flex-row sm:items-center sm:justify-between ${
                        selectedIngredient
                            ? isLight
                                ? "border-sky-400/55 bg-sky-400/12 text-sky-700 hover:bg-sky-400/18"
                                : "border-sky-400/45 bg-[linear-gradient(145deg,rgba(56,189,248,0.20),rgba(56,189,248,0.08))] text-sky-200 hover:bg-sky-400/20"
                            : isLight
                                ? "cursor-not-allowed border-[#E7DCD6] bg-[#FFF9F2] text-[#8A7972]"
                                : "cursor-not-allowed border-white/10 bg-white/[0.045] text-white/35"
                    }`}
                >
                    <div className="flex min-w-0 items-start gap-4">
                        <div
                            className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl border ${
                                selectedIngredient
                                    ? "border-current/30 bg-black/14"
                                    : isLight
                                        ? "border-[#E7DCD6] bg-white"
                                        : "border-white/10 bg-white/[0.04]"
                            }`}
                        >
                            <PackageMinus size={28} />
                        </div>
                        <div className="min-w-0">
                            <h3 className={`text-xl font-black ${
                                isLight && selectedIngredient ? "!text-sky-700" : ""
                            }`}>
                                Stock Out
                            </h3>
                            <p className={`mt-2 max-w-2xl text-sm font-semibold leading-5 opacity-75 ${
                                isLight && selectedIngredient ? "!text-sky-700" : ""
                            }`}>
                                {selectedIngredient
                                    ? "Remove sold or transferred stock from the selected ingredient."
                                    : "Select an ingredient first."}
                            </p>
                        </div>
                    </div>
                    {!selectedIngredient && (
                        <span className={`w-fit rounded-full border px-2.5 py-1 text-xs font-black ${
                            isLight ? "border-[#E7DCD6] text-[#7A6A64]" : "border-white/10 text-white/35"
                        }`}>
                            Locked
                        </span>
                    )}
                </button>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    {actionCards.map((card) => {
                        const Icon = card.icon;
                        const isWaste = card.id === "waste";
                        const isRefill = card.id === "refill";

                        return (
                            <button
                                key={card.id}
                                disabled={!selectedIngredient}
                                onClick={() => openAction(card.id)}
                                className={`group rounded-[26px] border p-5 text-left shadow-[0_16px_34px_rgba(0,0,0,0.18)] transition ${
                                    selectedIngredient
                                        ? card.activeClass
                                        : isLight
                                            ? "cursor-not-allowed border-[#E7DCD6] bg-[#FFF9F2] text-[#8A7972]"
                                            : "cursor-not-allowed border-white/10 bg-white/[0.045] text-white/35"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div
                                        className={`grid h-14 w-14 place-items-center rounded-2xl border ${
                                            selectedIngredient
                                                ? "border-current/30 bg-black/14"
                                                : isLight
                                                    ? "border-[#E7DCD6] bg-white"
                                                    : "border-white/10 bg-white/[0.04]"
                                        }`}
                                    >
                                        <Icon size={28} className={selectedIngredient ? card.iconClass : ""} />
                                    </div>
                                    {!selectedIngredient && (
                                        <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${
                                            isLight ? "border-[#E7DCD6] text-[#7A6A64]" : "border-white/10 text-white/35"
                                        }`}>
                                            Locked
                                        </span>
                                    )}
                                </div>
                                <h3 className={`mt-4 text-xl font-black ${
                                    isLight && selectedIngredient
                                        ? isWaste
                                            ? "!text-[#7F1D1D]"
                                            : isRefill
                                                ? "!text-emerald-700"
                                                : "!text-[#8f5f00]"
                                        : ""
                                }`}>{card.title}</h3>
                                <p className={`mt-2 text-sm font-semibold leading-5 opacity-70 ${
                                    isLight && selectedIngredient
                                        ? isWaste
                                            ? "!text-[#7F1D1D]"
                                            : isRefill
                                                ? "!text-emerald-700"
                                                : "!text-[#8f5f00]"
                                        : ""
                                }`}>
                                    {selectedIngredient
                                        ? card.description
                                        : "Select an ingredient first."}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* MODALS */}
            {action === "refill" && (
                <RefillModal
                    ingredient={selectedIngredient}
                    restaurantId={selectedRestaurantId}
                    onSuccess={refreshAfterAction}
                    onClose={() => setAction(null)}
                />
            )}

            {action === "waste" && (
                <WasteModal
                    ingredient={selectedIngredient}
                    restaurantId={selectedRestaurantId}
                    onSuccess={refreshAfterAction}
                    onClose={() => setAction(null)}
                />
            )}

            {action === "adjust" && (
                <AdjustModal
                    ingredient={selectedIngredient}
                    restaurantId={selectedRestaurantId}
                    onSuccess={refreshAfterAction}
                    onClose={() => setAction(null)}
                />
            )}

            {action === "stock-out" && (
                <StockOutModal
                    ingredient={selectedIngredient}
                    restaurantId={selectedRestaurantId}
                    onSuccess={refreshAfterAction}
                    onClose={() => setAction(null)}
                />
            )}

            <div className="mt-10 rounded-[30px] border border-[#3A4448] bg-[linear-gradient(145deg,rgba(27,37,40,0.92)_0%,rgba(21,29,32,0.86)_100%)] p-4 shadow-[0_20px_46px_rgba(0,0,0,0.24)] ring-1 ring-white/[0.04] backdrop-blur-sm sm:p-6">

                <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#FFD166]">
                            Activity
                        </p>
                        <h2 className="text-2xl font-black text-white">
                            Stock Movements
                        </h2>
                    </div>
                    <p className="text-sm font-bold text-white/45">
                        {movements.length} recorded movements
                    </p>
                </div>

                <div className="space-y-4">

                    {paginatedMovements.map((m) => {
                        const style = getMovementStyle(m.type);

                        return (
                            <div
                                key={m.id}
                                className={`grid gap-4 rounded-2xl border p-4 shadow-[0_10px_22px_rgba(0,0,0,0.14)] sm:grid-cols-[1fr_auto_auto] sm:items-center ${
                                    isLight
                                        ? "border-[#E4CFC3] bg-[#FFF9F2] text-[#241815]"
                                        : "border-[#3C484C] bg-[#222C30] text-white"
                                }`}
                            >

                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className={`font-black ${isLight ? "text-[#241815]" : "text-white"}`}>
                                            {m.ingredient?.name || "Ingredient"}
                                        </p>
                                        <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${style.className}`}>
                                            {style.label}
                                        </span>
                                    </div>

                                    <p className={`mt-1 text-sm ${isLight ? "text-[#7A6A64]" : "text-white/50"}`}>
                                        {m.notes || "No notes added."}
                                    </p>
                                </div>

                                <div className={`rounded-2xl border px-4 py-2 text-left sm:text-center ${
                                    isLight ? "border-[#E7DCD6] bg-[#FBF4EC]" : "border-white/10 bg-[#0F1517]"
                                }`}>
                                    <p className="text-lg font-black text-[#FFD166]">
                                        {m.quantity}
                                    </p>
                                    <p className={`text-xs font-bold uppercase tracking-wide ${isLight ? "text-[#8A7972]" : "text-white/35"}`}>
                                        Quantity
                                    </p>
                                </div>

                                <div className={`flex items-center gap-2 text-sm font-bold sm:justify-end ${isLight ? "text-[#7A6A64]" : "text-white/45"}`}>
                                    <Clock3 size={16} />
                                    <span>{new Date(m.created_at).toLocaleString()}</span>
                                </div>
                            </div>
                        );
                    })}

                </div>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <button
                        onClick={() => setPage((p) => Math.max(p - 1, 1))}
                        className="rounded-xl border border-white/10 bg-white/[0.07] px-4 py-2 font-bold text-white/70 transition hover:bg-white/[0.10] hover:text-white"
                    >
                        Prev
                    </button>

                    {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setPage(i + 1)}
                            className={`px-4 py-2 rounded-xl ${page === i + 1
                                ? "bg-[#7F1D1D] text-white"
                                : "border border-white/10 bg-white/[0.07] text-white/70"
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}

                    <button
                        onClick={() =>
                            setPage((p) => Math.min(p + 1, totalPages))
                        }
                        className="rounded-xl border border-white/10 bg-white/[0.07] px-4 py-2 font-bold text-white/70 transition hover:bg-white/[0.10] hover:text-white"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}

export default StockActions;
