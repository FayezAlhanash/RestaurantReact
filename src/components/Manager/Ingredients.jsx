import { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Link,
  Loader2,
  Package,
  Save,
  Search,
  Store,
  Unlink,
  UtensilsCrossed,
} from "lucide-react";
import api from "../../API/axios";
import { ensureManagerRestaurantId, getResponseList } from "./managerHelpers";
import { getUserPermissions } from "../../utils/permissions";
import {
  nonNegativeNumberInputProps,
  toNonNegativeNumberValue,
} from "../../utils/nonNegativeNumberInput";
import { useTranslation } from "../../utils/i18n";
import { getRoleId, getStoredUser, ROLE_IDS } from "../../utils/auth";

const getFoodIngredientId = (item) =>
  item?.ingredient_id ?? item?.pivot?.ingredient_id ?? item?.id;

const getFoodIngredientQuantity = (item) =>
  item?.quantity ??
  item?.pivot?.quantity ??
  item?.food_ingredient?.quantity ??
  item?.foodIngredient?.quantity ??
  "";

const getEntityId = (entity) =>
  entity?.id ?? entity?.restaurant_id ?? entity?.restaurantId ?? null;

const getRestaurantName = (restaurant) =>
  restaurant?.name ||
  restaurant?.name_ar ||
  restaurant?.name_en ||
  `Restaurant #${getEntityId(restaurant)}`;

export default function Ingredients() {
  const { language, t } = useTranslation();
  const { search = "" } = useOutletContext() ?? {};
  const isArabic = language === "ar";
  const isAdmin = getRoleId(getStoredUser()) === ROLE_IDS.ADMIN;
  const permissions = getUserPermissions();
  const canManageRecipes = permissions.includes("manage_recipes");
  const restaurantPickerRef = useRef(null);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [isRestaurantPickerOpen, setIsRestaurantPickerOpen] = useState(false);
  const [ingredients, setIngredients] = useState([]);
  const [foods, setFoods] = useState([]);
  const [foodIngredients, setFoodIngredients] = useState([]);
  const [selectedFoodId, setSelectedFoodId] = useState("");
  const [selectedIngredientId, setSelectedIngredientId] = useState("");
  const [recipeQuantity, setRecipeQuantity] = useState("");
  const [isSavingRecipe, setIsSavingRecipe] = useState(false);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [isFoodPickerOpen, setIsFoodPickerOpen] = useState(false);
  const [isIngredientPickerOpen, setIsIngredientPickerOpen] = useState(false);
  const [ingredientPickerSearch, setIngredientPickerSearch] = useState("");
  const [pendingQuantityEdits, setPendingQuantityEdits] = useState({});
  const [pendingDeleteIngredientId, setPendingDeleteIngredientId] =
    useState("");

  const getScopedRestaurantId = async () => {
    if (isAdmin) return selectedRestaurantId || "";

    return ensureManagerRestaurantId();
  };

  const fetchAdminRestaurants = async () => {
    if (!isAdmin) return;

    try {
      const response = await api.get("/restaurants");
      const restaurantList = getResponseList(response.data, ["restaurants"]);

      setRestaurants(restaurantList);
      setSelectedRestaurantId((currentRestaurantId) => {
        if (
          currentRestaurantId &&
          restaurantList.some(
            (restaurant) =>
              String(getEntityId(restaurant)) === String(currentRestaurantId),
          )
        ) {
          return currentRestaurantId;
        }

        return restaurantList[0] ? String(getEntityId(restaurantList[0])) : "";
      });
    } catch (error) {
      console.error(error.response?.data || error);
      setRestaurants([]);
      setSelectedRestaurantId("");
    }
  };

  const fetchIngredients = async () => {
    try {
      const restaurantId = await getScopedRestaurantId();
      if (!restaurantId) {
        setIngredients([]);
        return;
      }

      const res = await api.get(`/restaurants/${restaurantId}/ingredients`);

      setIngredients(getResponseList(res.data, ["ingredients"]));
    } catch (error) {
      console.error(error.response?.data || error);
    }
  };

  const fetchFoods = async () => {
    try {
      const restaurantId = await getScopedRestaurantId();
      if (!restaurantId) {
        setFoods([]);
        return;
      }

      const res = await api.get("/employee/food", {
        params: { restaurant_id: restaurantId },
      });

      setFoods(getResponseList(res.data, ["food", "foods"]));
    } catch (error) {
      console.error(error.response?.data || error);
    }
  };

  const fetchFoodIngredients = async (foodId = selectedFoodId) => {
    if (!foodId) {
      setFoodIngredients([]);
      return;
    }

    try {
      setLoadingRecipe(true);
      const restaurantId = await getScopedRestaurantId();
      if (!restaurantId) {
        setFoodIngredients([]);
        return;
      }

      const res = await api.get(
        `/restaurants/${restaurantId}/foods/${foodId}/ingredients`,
      );

      setFoodIngredients(getResponseList(res.data, ["ingredients"]));
    } catch (error) {
      console.error(error.response?.data || error);
      setFoodIngredients([]);
    } finally {
      setLoadingRecipe(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchAdminRestaurants();
      return;
    }

    fetchIngredients();
    fetchFoods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    if (!selectedRestaurantId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIngredients([]);
      setFoods([]);
      setFoodIngredients([]);
      return;
    }

    setSelectedFoodId("");
    setSelectedIngredientId("");
    setIngredientPickerSearch("");
    setRecipeQuantity("");
    setPendingQuantityEdits({});
    setPendingDeleteIngredientId("");
    fetchIngredients();
    fetchFoods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, selectedRestaurantId]);

  useEffect(() => {
    if (!isRestaurantPickerOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!restaurantPickerRef.current?.contains(event.target)) {
        setIsRestaurantPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isRestaurantPickerOpen]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFoodIngredients(selectedFoodId);
    setSelectedIngredientId("");
    setIngredientPickerSearch("");
    setRecipeQuantity("");
    setPendingQuantityEdits({});
    setPendingDeleteIngredientId("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFoodId]);

  const handleSaveRecipeIngredient = async () => {
    if (!canManageRecipes) return;

    if (
      !selectedFoodId ||
      !selectedIngredientId ||
      !recipeQuantity ||
      isSavingRecipe
    ) {
      return;
    }

    try {
      setIsSavingRecipe(true);
      const restaurantId = await getScopedRestaurantId();
      if (!restaurantId) return;

      const isLinked = foodIngredients.some(
        (item) =>
          String(getFoodIngredientId(item)) === String(selectedIngredientId),
      );

      if (isLinked) {
        await api.patch(
          `/restaurants/${restaurantId}/foods/${selectedFoodId}/ingredients/${selectedIngredientId}`,
          { quantity: Number(recipeQuantity) },
        );
      } else {
        const formData = new FormData();

        formData.append("ingredient_id", selectedIngredientId);
        formData.append("quantity", recipeQuantity);

        await api.post(
          `/restaurants/${restaurantId}/foods/${selectedFoodId}/ingredients`,
          formData,
        );
      }

      await fetchFoodIngredients();
      setSelectedIngredientId("");
      setRecipeQuantity("");
      setPendingQuantityEdits({});
      setPendingDeleteIngredientId("");
    } catch (error) {
      console.error(error.response?.data || error);
    } finally {
      setIsSavingRecipe(false);
    }
  };

  const handleEditRecipeQuantity = async (ingredientId, quantity) => {
    if (!canManageRecipes) return;

    try {
      const restaurantId = await getScopedRestaurantId();
      if (!restaurantId) return;

      await api.patch(
        `/restaurants/${restaurantId}/foods/${selectedFoodId}/ingredients/${ingredientId}`,
        { quantity: Number(quantity || 0) },
      );
      await fetchFoodIngredients();
      setPendingQuantityEdits((current) => {
        const next = { ...current };
        delete next[ingredientId];
        return next;
      });
    } catch (error) {
      console.error(error.response?.data || error);
    }
  };

  const handleDeleteRecipeIngredient = async (ingredientId) => {
    if (!canManageRecipes) return;

    try {
      const restaurantId = await getScopedRestaurantId();
      if (!restaurantId) return;

      await api.delete(
        `/restaurants/${restaurantId}/foods/${selectedFoodId}/ingredients/${ingredientId}`,
      );
      await fetchFoodIngredients();
      setPendingDeleteIngredientId("");
      setPendingQuantityEdits((current) => {
        const next = { ...current };
        delete next[ingredientId];
        return next;
      });
    } catch (error) {
      console.error(error.response?.data || error);
    }
  };

  const normalizedSearch = search.trim().toLowerCase();
  const selectedFood = foods.find(
    (food) => String(food.id) === String(selectedFoodId),
  );
  const selectedIngredient = ingredients.find(
    (ingredient) => String(ingredient.id) === String(selectedIngredientId),
  );
  const recipeIngredientIds = new Set(
    foodIngredients.map((item) => String(getFoodIngredientId(item))),
  );
  const filteredFoods = useMemo(() => {
    if (!normalizedSearch) return foods;

    return foods.filter((food) =>
      [food.name, food.category?.name]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(normalizedSearch),
        ),
    );
  }, [foods, normalizedSearch]);
  const normalizedIngredientPickerSearch = ingredientPickerSearch
    .trim()
    .toLowerCase();
  const filteredIngredients = useMemo(() => {
    if (!normalizedIngredientPickerSearch) return ingredients;

    return ingredients.filter((ingredient) =>
      [ingredient.name, ingredient.unit]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(normalizedIngredientPickerSearch),
        ),
    );
  }, [ingredients, normalizedIngredientPickerSearch]);

  const fieldClass =
    "w-full rounded-2xl border border-white/10 bg-[#0D1214] p-3.5 text-sm font-bold text-white outline-none transition duration-200 hover:border-[#FFD166]/35 focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10";
  const pickerButtonClass =
    "flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0D1214] px-4 py-3.5 text-left transition duration-200 hover:border-[#FFD166]/35 focus:outline-none focus:ring-4 focus:ring-[#FFD166]/10";
  const selectedRestaurant = restaurants.find(
    (restaurant) => String(getEntityId(restaurant)) === String(selectedRestaurantId),
  );
  const selectedRestaurantName = selectedRestaurant
    ? getRestaurantName(selectedRestaurant)
    : restaurants.length
      ? t("chooseRestaurant")
      : t("loadingRestaurants");
  const requiresRestaurantSelection = isAdmin && !selectedRestaurantId;

  return (
    <div className="space-y-6 p-4 text-white sm:p-6">
      <section className="relative z-30 overflow-visible rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(27,37,40,0.92)_0%,rgba(21,29,32,0.84)_55%,rgba(44,25,31,0.78)_100%)] p-5 shadow-[0_22px_55px_rgba(0,0,0,0.28)] ring-1 ring-white/[0.04] backdrop-blur-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-[#7F1D1D]/35 bg-[#7F1D1D]/12 text-[#7F1D1D] shadow-[0_14px_30px_rgba(127,29,29,0.12)]">
              <Link size={22} />
            </div>
            <div
              dir={isArabic ? "rtl" : "ltr"}
              className={isArabic ? "text-right" : "text-left"}
            >
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#FFD166]">
                {t("foodIngredients")}
              </p>
              <h1 className="mt-1 text-3xl font-black text-white sm:text-4xl">
                {t("linkIngredientsToFoods")}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                {t("recipePageDescription")}
              </p>
              {isAdmin && (
                <div
                  ref={restaurantPickerRef}
                  className={`relative z-40 mt-4 w-full max-w-md ${
                    isArabic ? "ml-auto" : ""
                  }`}
                >
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-[#FFD166]">
                    {t("restaurant")}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      restaurants.length &&
                      setIsRestaurantPickerOpen((current) => !current)
                    }
                    className={`flex h-12 w-full items-center justify-between gap-3 rounded-2xl border border-[#FFD166]/35 bg-[#0D1214] px-4 text-sm font-black text-white shadow-[0_14px_30px_rgba(0,0,0,0.18)] transition hover:border-[#FFD166]/70 focus:outline-none focus:ring-4 focus:ring-[#FFD166]/10 ${
                      isArabic ? "text-right" : "text-left"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Store size={17} className="shrink-0 text-[#FFD166]" />
                      <span className="min-w-0 truncate">{selectedRestaurantName}</span>
                    </span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-[#FFD166] transition ${
                        isRestaurantPickerOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isRestaurantPickerOpen && (
                    <div className="absolute left-0 top-[calc(100%+0.55rem)] z-[500] w-full overflow-hidden rounded-2xl border border-[#FFD166]/25 bg-[#0D1214] p-1.5 shadow-[0_24px_58px_rgba(0,0,0,0.45)] ring-1 ring-white/5">
                      {restaurants.length ? (
                        restaurants.map((restaurant) => {
                          const restaurantId = String(getEntityId(restaurant));
                          const isSelected =
                            restaurantId === String(selectedRestaurantId);

                          return (
                            <button
                              key={restaurantId}
                              type="button"
                              onClick={() => {
                                setSelectedRestaurantId(restaurantId);
                                setIsRestaurantPickerOpen(false);
                              }}
                              className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-black transition ${
                                isSelected
                                  ? "bg-[#FFD166] text-[#1B1510]"
                                  : "text-white/75 hover:bg-white/[0.07] hover:text-white"
                              }`}
                            >
                              <span className="min-w-0 truncate">
                                {getRestaurantName(restaurant)}
                              </span>
                              {isSelected && <Check size={16} />}
                            </button>
                          );
                        })
                      ) : (
                        <p className="px-3 py-3 text-sm font-black text-white/45">
                          {t("noRestaurantsAvailable")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
            <div className="rounded-2xl border border-sky-400/35 bg-sky-400/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-300">
                {t("foods")}
              </p>
              <strong className="mt-2 block text-3xl font-black text-white">
                {foods.length}
              </strong>
            </div>
            <div className="rounded-2xl border border-emerald-400/35 bg-emerald-400/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-300">
                {t("foodIngredients")}
              </p>
              <strong className="mt-2 block text-3xl font-black text-white">
                {ingredients.length}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-[420px_1fr]">
        <div className="relative z-20 rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(31,43,46,0.94),rgba(19,28,31,0.9))] shadow-[0_22px_55px_rgba(0,0,0,0.25)] ring-1 ring-white/[0.04] backdrop-blur-sm">
          <div className="border-b border-white/[0.08] bg-[radial-gradient(circle_at_92%_0%,rgba(127,29,29,0.18),transparent_34%),rgba(255,255,255,0.03)] p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[#7F1D1D]/30 bg-[#7F1D1D]/12 text-[#7F1D1D]">
                <UtensilsCrossed size={21} />
              </div>
              <div>
                <p className="text-sm font-bold text-white/45">{t("recipeSetup")}</p>
                <h2 className="text-xl font-black text-white">
                  {t("attachExistingIngredient")}
                </h2>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-5">
            {!canManageRecipes && (
              <div className="rounded-[24px] border border-[#FFD166]/45 bg-[linear-gradient(145deg,rgba(255,209,102,0.2),rgba(255,209,102,0.07))] p-4 shadow-[0_14px_32px_rgba(255,209,102,0.08)]">
                <div className="flex items-start gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#FFD166]/35 bg-[#FFD166]/14 text-[#FFD166]">
                    <AlertTriangle size={22} />
                  </span>
                  <div>
                    <p className="text-lg font-black text-[#FFD166]">
                      {t("viewOnlyMode")}
                    </p>
                    <p className="mt-1.5 text-sm font-extrabold leading-6 text-white/70">
                      {t("recipeViewOnlyHelp")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {normalizedSearch && (
              <div className="flex items-center gap-2 rounded-2xl border border-sky-400/30 bg-sky-400/10 px-3 py-2 text-sm font-bold text-sky-200">
                <Search size={16} />
                {filteredFoods.length} {t("results")}
              </div>
            )}

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                {t("foodItem")}
              </span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (requiresRestaurantSelection) return;
                    setIsIngredientPickerOpen(false);
                    setIsFoodPickerOpen((value) => !value);
                  }}
                  disabled={requiresRestaurantSelection}
                  className={`${pickerButtonClass} ${
                    isFoodPickerOpen
                      ? "border-[#FFD166]/65 ring-4 ring-[#FFD166]/10"
                      : ""
                  } disabled:cursor-not-allowed disabled:border-white/5 disabled:bg-white/[0.03] disabled:text-white/30`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-white">
                      {selectedFood?.name ||
                        (filteredFoods.length
                          ? t("selectFood")
                          : t("noFoodsFound"))}
                    </p>
                    <p className="mt-1 text-xs font-bold text-white/35">
                      {filteredFoods.length} {t("foods")}
                    </p>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-[#FFD166] transition ${
                      isFoodPickerOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isFoodPickerOpen && (
                  <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-[22px] border border-[#3A4448] bg-[#0D1214] shadow-[0_24px_56px_rgba(0,0,0,0.45)]">
                    <div className="cashier-scroll max-h-72 overflow-y-auto p-2">
                      {filteredFoods.length ? (
                        filteredFoods.map((food) => {
                          const isSelected =
                            String(food.id) === String(selectedFoodId);

                          return (
                            <button
                              key={food.id}
                              type="button"
                              onClick={() => {
                                setSelectedFoodId(food.id);
                                setIsFoodPickerOpen(false);
                              }}
                              className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left transition ${
                                isSelected
                                  ? "bg-[#FFD166]/14 text-[#FFD166]"
                                  : "text-white hover:bg-white/[0.06]"
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-black">
                                  {food.name}
                                </p>
                                {food.category?.name && (
                                  <p className="mt-0.5 truncate text-xs font-bold text-white/35">
                                    {food.category.name}
                                  </p>
                                )}
                              </div>
                              {isSelected && (
                                <Check
                                  size={17}
                                  className="shrink-0 text-[#FFD166]"
                                />
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <p className="px-3 py-8 text-center text-sm font-bold text-white/40">
                          {t("noFoodsFound")}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                {t("foodIngredients")}
              </span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (
                      requiresRestaurantSelection ||
                      !selectedFoodId ||
                      !canManageRecipes
                    ) {
                      return;
                    }
                    setIsFoodPickerOpen(false);
                    setIsIngredientPickerOpen((value) => !value);
                  }}
                  disabled={
                    requiresRestaurantSelection ||
                    !selectedFoodId ||
                    !canManageRecipes
                  }
                  className={`${pickerButtonClass} disabled:cursor-not-allowed disabled:border-white/5 disabled:bg-white/[0.03] disabled:text-white/30 ${
                    isIngredientPickerOpen
                      ? "border-[#FFD166]/65 ring-4 ring-[#FFD166]/10"
                      : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-white disabled:text-white/30">
                      {selectedIngredient?.name ||
                        (!selectedFoodId
                          ? t("selectFoodFirst")
                          : canManageRecipes
                            ? t("selectIngredient")
                            : t("noPermissionEdit"))}
                    </p>
                    <p className="mt-1 text-xs font-bold text-white/35">
                      {ingredients.length} {t("foodIngredients")}
                    </p>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-[#FFD166] transition ${
                      isIngredientPickerOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isIngredientPickerOpen && (
                  <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-[22px] border border-[#3A4448] bg-[#0D1214] shadow-[0_30px_70px_rgba(0,0,0,0.58)]">
                    <div className="border-b border-white/[0.08] bg-white/[0.03] p-3">
                      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 focus-within:border-[#FFD166]/55 focus-within:ring-4 focus-within:ring-[#FFD166]/10">
                        <Search size={16} className="shrink-0 text-[#FFD166]" />
                        <input
                          type="search"
                          value={ingredientPickerSearch}
                          onChange={(event) =>
                            setIngredientPickerSearch(event.target.value)
                          }
                          placeholder={t("searchIngredients")}
                          className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/32"
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between px-1 text-xs font-black uppercase tracking-[0.12em] text-white/38">
                        <span>{filteredIngredients.length} {t("shown")}</span>
                        <span>{ingredients.length} {t("total")}</span>
                      </div>
                    </div>

                    <div className="cashier-scroll max-h-[min(52vh,26rem)] overflow-y-auto p-2">
                      {filteredIngredients.length ? (
                        filteredIngredients.map((ingredient) => {
                          const isSelected =
                            String(ingredient.id) ===
                            String(selectedIngredientId);
                          const isLinked = recipeIngredientIds.has(
                            String(ingredient.id),
                          );

                          return (
                            <button
                              key={ingredient.id}
                              type="button"
                              onClick={() => {
                                setSelectedIngredientId(ingredient.id);
                                setIsIngredientPickerOpen(false);
                                setIngredientPickerSearch("");
                              }}
                              className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3.5 text-left transition ${
                                isSelected
                                  ? "bg-[#FFD166]/14 text-[#FFD166]"
                                  : "text-white hover:bg-white/[0.06]"
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-black">
                                  {ingredient.name}
                                </p>
                                <p className="mt-0.5 text-xs font-bold text-white/35">
                                  {ingredient.current_quantity ?? 0}{" "}
                                  {ingredient.unit}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                {isLinked && (
                                  <span className="rounded-full border border-emerald-400/35 bg-emerald-400/10 px-2 py-1 text-[11px] font-black uppercase text-emerald-300">
                                  {t("linked")}
                                  </span>
                                )}
                                {isSelected && (
                                  <Check size={17} className="text-[#FFD166]" />
                                )}
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <p className="px-3 py-8 text-center text-sm font-bold text-white/40">
                          {t("noIngredientsFound")}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                {t("quantity")}
              </span>
              <input
                type="number"
                {...nonNegativeNumberInputProps}
                step="0.01"
                value={recipeQuantity}
                onChange={(event) =>
                  setRecipeQuantity(
                    toNonNegativeNumberValue(event.target.value),
                  )
                }
                disabled={!selectedFoodId || !canManageRecipes}
                className={`${fieldClass} disabled:cursor-not-allowed disabled:border-white/5 disabled:bg-white/[0.03] disabled:text-white/30`}
                placeholder="2"
              />
            </label>

            <button
              type="button"
              onClick={handleSaveRecipeIngredient}
              disabled={
                requiresRestaurantSelection ||
                !selectedFoodId ||
                !selectedIngredientId ||
                !recipeQuantity ||
                !canManageRecipes ||
                isSavingRecipe
              }
              className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7F1D1D] px-4 py-3.5 text-sm font-black text-white shadow-[0_16px_34px_rgba(127,29,29,0.28)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#681718] disabled:cursor-not-allowed disabled:bg-[#7F1D1D]/45 disabled:text-white/65 disabled:shadow-none disabled:hover:translate-y-0"
            >
              {isSavingRecipe ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}
              {canManageRecipes ? t("confirmAdd") : t("viewOnly")}
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(28,39,42,0.94),rgba(18,27,30,0.9))] shadow-[0_22px_55px_rgba(0,0,0,0.25)] ring-1 ring-white/[0.04] backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] bg-[radial-gradient(circle_at_100%_0%,rgba(52,211,153,0.14),transparent_32%),rgba(255,255,255,0.03)] p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-emerald-400/35 bg-emerald-400/10 text-emerald-300">
                <Package size={21} />
              </div>
              <div>
                <p className="text-sm font-bold text-white/45">
                  {selectedFood ? selectedFood.name : t("noFoodSelected")}
                </p>
                <h2 className="text-2xl font-black text-white">
                  {t("linkedIngredients")}
                </h2>
              </div>
            </div>
            {loadingRecipe && (
              <Loader2 size={22} className="animate-spin text-[#FFD166]" />
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-[#0D1214]/80 text-sm font-black uppercase tracking-[0.14em] text-white/55">
                <tr>
                  <th className="px-5 py-4 text-left">{t("foodIngredients")}</th>
                  <th className="px-5 py-4 text-left">{t("quantity")}</th>
                  <th className="px-5 py-4 text-left">{t("unit")}</th>
                  <th className="px-5 py-4 text-right">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.07]">
                {!selectedFoodId || foodIngredients.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-5 py-14 text-center">
                      <div className="mx-auto max-w-md rounded-[28px] border border-white/10 bg-[#0D1214]/72 p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-[#FFD166]/35 bg-[#FFD166]/12 text-[#FFD166] shadow-[0_14px_30px_rgba(255,209,102,0.1)]">
                          <Link size={24} />
                        </div>
                        <h3 className="mt-4 text-2xl font-black text-white">
                          {selectedFoodId
                            ? t("noIngredientsLinked")
                            : t("selectFood")}
                        </h3>
                        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/50">
                          {selectedFoodId
                            ? t("recipeEmptyHelp")
                            : t("chooseFoodRecipeHelp")}
                        </p>
                        <div className="mt-5 grid gap-2 sm:grid-cols-2">
                          <div className="rounded-2xl border border-sky-400/20 bg-sky-400/8 px-3 py-3 text-left">
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-300">
                              {t("foods")}
                            </p>
                            <p className="mt-1 text-lg font-black text-white">
                              {foods.length}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/8 px-3 py-3 text-left">
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-300">
                              {t("foodIngredients")}
                            </p>
                            <p className="mt-1 text-lg font-black text-white">
                              {ingredients.length}
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  foodIngredients.map((ingredient) => {
                    const ingredientId = getFoodIngredientId(ingredient);
                    const currentQuantity =
                      getFoodIngredientQuantity(ingredient);
                    const pendingQuantity = pendingQuantityEdits[ingredientId];
                    const shownQuantity =
                      pendingQuantity === undefined
                        ? currentQuantity
                        : pendingQuantity;
                    const hasPendingQuantityEdit =
                      pendingQuantity !== undefined &&
                      String(pendingQuantity) !== String(currentQuantity);
                    const isDeletePending =
                      String(pendingDeleteIngredientId) ===
                      String(ingredientId);
                    const unit =
                      ingredient.unit ??
                      ingredients.find(
                        (item) => String(item.id) === String(ingredientId),
                      )?.unit ??
                      "-";

                    return (
                      <tr
                        key={ingredientId}
                        className="transition duration-200 hover:bg-white/[0.035]"
                      >
                        <td className="px-5 py-5">
                          <p className="text-lg font-black text-white">
                            {ingredient.name}
                          </p>
                          <p className="text-sm font-bold text-white/35">
                            ID #{ingredientId}
                          </p>
                        </td>
                        <td className="px-5 py-5">
                          <input
                            type="number"
                            {...nonNegativeNumberInputProps}
                            step="0.01"
                            value={shownQuantity}
                            onChange={(event) =>
                              setPendingQuantityEdits((current) => ({
                                ...current,
                                [ingredientId]: toNonNegativeNumberValue(
                                  event.target.value,
                                ),
                              }))
                            }
                            readOnly={!canManageRecipes}
                            className={`w-28 rounded-xl border px-3 py-2 text-sm font-black outline-none transition focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10 ${
                              canManageRecipes
                                ? "border-white/10 bg-[#0D1214] text-[#FFD166]"
                                : "cursor-not-allowed border-white/5 bg-white/[0.03] text-white/35"
                            }`}
                          />
                        </td>
                        <td className="px-5 py-5 text-base font-bold text-white/55">
                          {unit}
                        </td>
                        <td className="px-5 py-5">
                          <div className="flex justify-end gap-2">
                            {hasPendingQuantityEdit && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleEditRecipeQuantity(
                                    ingredientId,
                                    pendingQuantity,
                                  )
                                }
                                disabled={!canManageRecipes}
                                className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-400/35 bg-emerald-400/12 px-3 text-xs font-black text-emerald-200 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-35"
                              >
                                <Check size={15} />
                                {t("confirm")}
                              </button>
                            )}
                            {isDeletePending ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteRecipeIngredient(ingredientId)
                                  }
                                  disabled={!canManageRecipes}
                                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#FF6B6B]/45 bg-[#7F1D1D]/24 px-3 text-xs font-black text-[#FFB3B3] transition hover:bg-[#7F1D1D]/38 disabled:cursor-not-allowed disabled:opacity-35"
                                >
                                  <Check size={15} />
                                  {t("confirmDelete")}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPendingDeleteIngredientId("")
                                  }
                                  className="h-10 rounded-xl border border-white/10 bg-white/[0.06] px-3 text-xs font-black text-white/65 transition hover:bg-white/10 hover:text-white"
                                >
                                  {t("cancel")}
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                title={t("removeFromFood")}
                                onClick={() =>
                                  setPendingDeleteIngredientId(
                                    String(ingredientId),
                                  )
                                }
                                disabled={!canManageRecipes}
                                className="grid h-10 w-10 place-items-center rounded-xl border border-[#7F1D1D]/35 bg-[#7F1D1D]/10 text-[#7F1D1D] transition duration-200 hover:scale-110 hover:border-[#7F1D1D]/65 hover:bg-[#7F1D1D]/18 hover:text-white disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:scale-100"
                              >
                                <Unlink size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
