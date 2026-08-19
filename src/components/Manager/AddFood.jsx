import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Edit3,
  ImagePlus,
  ListFilter,
  Loader2,
  PackagePlus,
  Plus,
  Salad,
  Store,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import FoodModal from "./FoodModal";
import api from "../../API/axios";
import AttachIngredientModal from "./AttachIngredientModal";
import {
  ensureManagerRestaurantId,
  filterCategoriesByRestaurant,
  getResponseList,
} from "./managerHelpers";
import {
  TRANSLATION_MODE_MANUAL,
  appendIfFilled,
  appendTranslationFields,
  getApiErrorMessage,
} from "../../utils/translationPayload";
import { getUserPermissions } from "../../utils/permissions";
import { getRoleId, getStoredUser, ROLE_IDS } from "../../utils/auth";
import { useTranslation } from "../../utils/i18n";

const getFoodImageUrl = (image) => {
  if (!image) return "";
  if (image.startsWith("http://") || image.startsWith("https://")) return image;

  const cleanPath = image.replace(/^\/+/, "");

  if (cleanPath.startsWith("storage/")) {
    return `https://big4.me/${cleanPath}`;
  }

  return `https://big4.me/storage/${cleanPath}`;
};

const foodListRequests = [
  { endpoint: "/food", params: {}, omitFirstPageParam: true },
  { endpoint: "/food", params: { include_unavailable: 1, includeUnavailable: 1 } },
  {
    endpoint: "/employee/food",
    params: { include_unavailable: 1, includeUnavailable: 1 },
    restaurantParam: "Restaurant_id",
  },
  { endpoint: "/food", params: { is_available: 0 } },
  {
    endpoint: "/employee/food",
    params: { is_available: 0 },
    restaurantParam: "Restaurant_id",
  },
];

const toBooleanValue = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  const normalizedValue = String(value).trim().toLowerCase();

  if (["0", "false", "no", "off"].includes(normalizedValue)) return false;
  if (["1", "true", "yes", "on"].includes(normalizedValue)) return true;

  return Boolean(value);
};

const isAdminUser = () => getRoleId(getStoredUser()) === ROLE_IDS.ADMIN;

const getFoodList = (data) => getResponseList(data, ["food", "foods"]);

const getEntityId = (entity) => entity?.id ?? entity?.restaurant_id ?? entity?.restaurantId ?? null;

const getRestaurantScopeId = (item) =>
  item?.restaurant_id ?? item?.restaurantId ?? item?.restaurant?.id ?? null;

const getFoodName = (food) =>
  food?.name ?? food?.name_en ?? food?.name_ar ?? food?.title ?? "";

const getFoodKey = (food) =>
  [
    getRestaurantScopeId(food),
    food?.id,
    getFoodName(food).trim().toLowerCase(),
    food?.category_id ?? food?.category?.id,
  ]
    .filter((value) => value !== undefined && value !== null && value !== "")
    .join("|");

const withRestaurantContext = (items, restaurant) =>
  items.map((item) => ({
    ...item,
    is_available: toBooleanValue(
      item?.is_available ?? item?.available ?? item?.can_order,
      true
    ),
    is_diet: toBooleanValue(item?.is_diet, false),
    restaurant_id: item?.restaurant_id ?? item?.restaurantId ?? restaurant?.id,
    restaurant: item?.restaurant ?? restaurant,
  }));

const mergeFoodRecords = (items) => {
  const foodsByKey = new Map();

  items.forEach((item) => {
    const key = getFoodKey(item);
    if (!key) return;

    const currentItem = foodsByKey.get(key);
    if (!currentItem) {
      foodsByKey.set(key, item);
      return;
    }

    foodsByKey.set(key, {
      ...item,
      ...currentItem,
      is_available: currentItem.is_available === false ? false : item.is_available,
      is_diet: currentItem.is_diet || item.is_diet,
      restaurant: currentItem.restaurant ?? item.restaurant,
      category: currentItem.category ?? item.category,
    });
  });

  return Array.from(foodsByKey.values());
};

const getPagination = (data) => {
  const paginatedSource =
    ["food", "foods", "data"].map((key) => data?.[key]).find((value) => value?.data) ||
    data;
  const source =
    paginatedSource?.meta ||
    paginatedSource?.pagination ||
    paginatedSource?.data?.meta ||
    paginatedSource?.data ||
    paginatedSource ||
    {};
  const links = paginatedSource?.links || paginatedSource?.data?.links || {};

  const currentPage = Number(
    source.current_page ?? source.currentPage ?? paginatedSource?.current_page ?? 1
  );
  const lastPage = Number(
    source.last_page ??
      source.lastPage ??
      source.total_pages ??
      paginatedSource?.last_page ??
      currentPage
  );
  const total = Number(source.total ?? paginatedSource?.total ?? 0);
  const perPage = Number(source.per_page ?? source.perPage ?? paginatedSource?.per_page ?? 0);

  return {
    currentPage: Number.isFinite(currentPage) && currentPage > 0 ? currentPage : 1,
    lastPage: Number.isFinite(lastPage) && lastPage > 0 ? lastPage : 1,
    total: Number.isFinite(total) ? total : 0,
    perPage: Number.isFinite(perPage) ? perPage : 0,
    hasNext:
      Boolean(links.next || source.next_page_url || paginatedSource?.next_page_url) ||
      currentPage < lastPage,
    hasPrev:
      Boolean(
        links.prev ||
          links.previous ||
          source.prev_page_url ||
          paginatedSource?.prev_page_url
      ) ||
      currentPage > 1,
  };
};

export default function AddFood() {
  const { t } = useTranslation();
  const { search = "" } = useOutletContext() ?? {};
  const isAdmin = isAdminUser();
  const restaurantPickerRef = useRef(null);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [isRestaurantPickerOpen, setIsRestaurantPickerOpen] = useState(false);
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [openFoodModal, setOpenFoodModal] = useState(false);
  const [openIngredientModal, setOpenIngredientModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [editingFood, setEditingFood] = useState(null);
  const [deleteFood, setDeleteFood] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [permissions, setPermissions] = useState(() => getUserPermissions());
  const [isSavingFood, setIsSavingFood] = useState(false);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [foodErrorMessage, setFoodErrorMessage] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dietFilter, setDietFilter] = useState("all");

  const fetchRestaurantsForAdmin = async () => {
    if (!isAdmin) return [];

    const response = await api.get("/restaurants");
    return getResponseList(response.data, ["restaurants"]);
  };

  const getSelectedRestaurant = () =>
    restaurants.find(
      (restaurant) => String(getEntityId(restaurant)) === String(selectedRestaurantId)
    );

  const getAdminRestaurantId = () => selectedRestaurantId || "";

  const getRestaurantName = (restaurant) =>
    restaurant?.name || restaurant?.name_ar || restaurant?.name_en || `Restaurant #${getEntityId(restaurant)}`;

  const fetchAdminRestaurants = async () => {
    try {
      const restaurantList = await fetchRestaurantsForAdmin();

      setRestaurants(restaurantList);
      setSelectedRestaurantId((currentRestaurantId) => {
        if (
          currentRestaurantId &&
          restaurantList.some(
            (restaurant) => String(getEntityId(restaurant)) === String(currentRestaurantId)
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

  const fetchCategories = async () => {
    try {
      const restaurantId = await ensureManagerRestaurantId();
      const scopedRestaurantId = isAdmin ? getAdminRestaurantId() : restaurantId;

      if (!scopedRestaurantId) {
        setCategories([]);
        return;
      }

      const res = await api.get("/employee/categories", {
        params: { restaurant_id: scopedRestaurantId },
      });
      const categoryList = getResponseList(res.data, ["categories"]);

      setCategories(
        filterCategoriesByRestaurant(
          withRestaurantContext(categoryList, getSelectedRestaurant()),
          scopedRestaurantId
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFoodPage = async (request, scopedRestaurantId, page = 1) =>
    api.get(request.endpoint, {
      params: {
        [request.restaurantParam ?? "restaurant_id"]: scopedRestaurantId,
        ...(request.omitFirstPageParam && page === 1 ? {} : { page }),
        ...request.params,
      },
    });

  const fetchFoodsFromRequest = async (request, scopedRestaurantId) => {
    const res = await fetchFoodPage(request, scopedRestaurantId);
    const pagination = getPagination(res.data);
    const firstPageFoods = getFoodList(res.data);

    if (pagination.lastPage <= 1) return firstPageFoods;

    const remainingResponses = await Promise.allSettled(
      Array.from({ length: pagination.lastPage - 1 }, (_, index) => index + 2).map(
        (pageNumber) => fetchFoodPage(request, scopedRestaurantId, pageNumber)
      )
    );

    const remainingFoods = remainingResponses.flatMap((result) =>
      result.status === "fulfilled" ? getFoodList(result.value.data) : []
    );

    return [...firstPageFoods, ...remainingFoods];
  };

  const fetchFoods = async () => {
    try {
      const restaurantId = await ensureManagerRestaurantId();
      const scopedRestaurantId = isAdmin ? getAdminRestaurantId() : restaurantId;

      if (!scopedRestaurantId) {
        setFoods([]);
        return;
      }

      const foodResponses = await Promise.allSettled(
        foodListRequests.map((request) =>
          fetchFoodsFromRequest(request, scopedRestaurantId)
        )
      );

      const loadedFoods = foodResponses.flatMap((result) =>
        result.status === "fulfilled" ? result.value : []
      );
      const failedResponses = foodResponses.filter((result) => result.status === "rejected");

      failedResponses.forEach((result) => console.error(result.reason?.response?.data || result.reason));

      if (!loadedFoods.length && failedResponses.length === foodResponses.length) {
        throw failedResponses[0].reason;
      }

      setFoods(mergeFoodRecords(withRestaurantContext(loadedFoods, getSelectedRestaurant())));
    } catch (err) {
      console.error(err.response?.data || err);
      setFoods([]);
    }
  };

  const fetchIngredients = async () => {
    try {
      const restaurantId = await ensureManagerRestaurantId();
      const scopedRestaurantId = isAdmin ? getAdminRestaurantId() : restaurantId;

      if (!scopedRestaurantId) {
        setIngredients([]);
        return;
      }

      const res = await api.get(`/restaurants/${scopedRestaurantId}/ingredients`);

      setIngredients(
        withRestaurantContext(getResponseList(res.data, ["ingredients"]), getSelectedRestaurant())
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleAttachIngredients = async (recipe) => {
    if (!permissions.includes("manage_recipes")) return;

    try {
      const restaurantId = await ensureManagerRestaurantId();
      const scopedRestaurantId = restaurantId ?? getRestaurantScopeId(selectedFood);
      const foodId = recipe.food_id ?? selectedFood?.id;

      if (!foodId || !scopedRestaurantId) return;

      for (const ingredient of recipe.ingredients) {
        const formData = new FormData();

        formData.append("ingredient_id", ingredient.ingredient_id);
        formData.append("quantity", ingredient.quantity);

        await api.post(
          `/restaurants/${scopedRestaurantId}/foods/${foodId}/ingredients`,
          formData
        );
      }

      setOpenIngredientModal(false);
    } catch (err) {
      console.error(err.response?.data || err);
    }
  };

  const handleSaveFood = async (food) => {
    const isEditing = Boolean(editingFood);

    try {
      setIsSavingFood(true);
      setFoodErrorMessage("");
      const formData = new FormData();

      formData.append("category_id", food.category_id);
      appendTranslationFields(formData, food, ["name", "description"]);
      formData.append("price", food.price);
      appendIfFilled(formData, "preparation_time", food.preparation_time);
      appendIfFilled(formData, "preparation_batch_size", food.preparation_batch_size);
      appendIfFilled(formData, "calories", food.calories);
      appendIfFilled(formData, "protein", food.protein);
      appendIfFilled(formData, "carbs", food.carbs);
      appendIfFilled(formData, "fats", food.fats);
      formData.append("is_diet", food.is_diet ? 1 : 0);
      formData.append("is_available", food.is_available ? 1 : 0);

      const selectedCategory = categories.find(
        (category) => String(category.id) === String(food.category_id)
      );
      const restaurantId = isAdmin
        ? getAdminRestaurantId() || getRestaurantScopeId(selectedCategory) || getRestaurantScopeId(editingFood)
        : await ensureManagerRestaurantId();

      if (!restaurantId) {
        throw new Error("Restaurant id is required for this food.");
      }

      if (
        food.translation_mode === TRANSLATION_MODE_MANUAL &&
        ((food.description_ar?.trim() && !food.description_en?.trim()) ||
          (!food.description_ar?.trim() && food.description_en?.trim()))
      ) {
        throw new Error("Arabic and English descriptions must be filled together.");
      }

      formData.append("restaurant_id", restaurantId);

      if (food.image) {
        formData.append("image", food.image);
      }

      const response = isEditing
        ? await api.post(`/food/${editingFood.id}`, formData)
        : await api.post("/food", formData);

      await fetchFoods();

      const savedFood = response.data.food ?? response.data;

      setSelectedFood({
        ...savedFood,
        restaurant_id: getRestaurantScopeId(savedFood) ?? restaurantId,
        restaurant: savedFood?.restaurant ?? getSelectedRestaurant(),
      });
      setEditingFood(null);
      setOpenFoodModal(false);

      if (!isEditing && permissions.includes("manage_recipes")) {
        setOpenIngredientModal(true);
      }
    } catch (err) {
      console.error(err.response?.data || err);
      setFoodErrorMessage(getApiErrorMessage(err, err.message || "Could not save food."));
    } finally {
      setIsSavingFood(false);
    }
  };

  const handleOpenAddFood = () => {
    if (isAdmin && !selectedRestaurantId) {
      setFoodErrorMessage("Choose a restaurant before adding food.");
      return;
    }

    setEditingFood(null);
    setFoodErrorMessage("");
    setOpenFoodModal(true);
  };

  const handleOpenEditFood = (food) => {
    setEditingFood(food);
    setFoodErrorMessage("");
    setOpenFoodModal(true);
  };

  const handleCloseFoodModal = () => {
    setOpenFoodModal(false);
    setEditingFood(null);
    setFoodErrorMessage("");
  };

  const handleDeleteFood = async () => {
    if (!deleteFood) return;

    try {
      await api.delete(`/food/${deleteFood.id}`);
      await fetchFoods();
      setDeleteFood(null);
    } catch (err) {
      console.error(err.response?.data || err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPermissions(getUserPermissions());
    if (isAdmin) {
      fetchAdminRestaurants();
      return;
    }

    fetchCategories();
    fetchFoods();
    fetchIngredients();
  }, []);

  useEffect(() => {
    if (isAdmin && !selectedRestaurantId) return;

    const loadRestaurantData = async () => {
      setIsLoadingMenu(true);
      setFoods([]);
      setCategories([]);
      setIngredients([]);
      setCategoryFilter("all");
      setStatusFilter("all");
      setDietFilter("all");

      try {
        await Promise.all([fetchCategories(), fetchFoods(), fetchIngredients()]);
      } finally {
        setIsLoadingMenu(false);
      }
    };

    loadRestaurantData();
  }, [selectedRestaurantId]);

  const foodTotal = foods.length;
  const availableCount = foods.filter((food) => food.is_available).length;
  const dietCount = foods.filter((food) => food.is_diet).length;
  const categoryFilterOptions = [
    { id: "all", label: t("all") },
    ...categories.map((category) => ({
      id: String(category.id),
      label: category.name,
    })),
  ];
  const normalizedSearch = search.trim().toLowerCase();
  const filteredFoods = foods.filter((food) => {
    const matchesSearch =
      !normalizedSearch ||
      [
        food.name,
        food.description,
        food.category?.name,
        food.price,
        food.preparation_time,
        food.preparation_batch_size,
        food.is_available ? "available" : "unavailable",
        food.is_diet ? "diet" : "",
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));

    const matchesCategory =
      categoryFilter === "all" || String(food.category_id ?? food.category?.id) === categoryFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "available" && food.is_available) ||
      (statusFilter === "unavailable" && !food.is_available);

    const matchesDiet =
      dietFilter === "all" ||
      (dietFilter === "diet" && food.is_diet) ||
      (dietFilter === "regular" && !food.is_diet);

    return matchesSearch && matchesCategory && matchesStatus && matchesDiet;
  });
  const hasActiveFilters =
    categoryFilter !== "all" || statusFilter !== "all" || dietFilter !== "all";
  const activeFilterCount = [categoryFilter, statusFilter, dietFilter].filter(
    (value) => value !== "all"
  ).length;
  const getCategoryCount = (optionId) =>
    optionId === "all"
      ? foodTotal
      : foods.filter((food) => String(food.category_id ?? food.category?.id) === optionId)
          .length;
  const availabilityFilterOptions = [
    { id: "all", label: t("all"), count: foodTotal },
    { id: "available", label: t("available"), count: availableCount },
    {
      id: "unavailable",
      label: t("unavailable"),
      count: foods.length - availableCount,
    },
  ];
  const dietFilterOptions = [
    { id: "all", label: t("all"), count: foodTotal },
    { id: "diet", label: t("diet"), count: dietCount },
    { id: "regular", label: t("regular"), count: foods.length - dietCount },
  ];

  const clearFilters = () => {
    setCategoryFilter("all");
    setStatusFilter("all");
    setDietFilter("all");
  };

  const selectedRestaurant = getSelectedRestaurant();
  const selectedRestaurantName = selectedRestaurant
    ? getRestaurantName(selectedRestaurant)
    : restaurants.length
      ? t("chooseRestaurant")
      : t("noRestaurantsAvailable");

  return (
    <div className="space-y-6 p-4 text-white sm:p-6">
      <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(27,37,40,0.92)_0%,rgba(21,29,32,0.84)_55%,rgba(44,25,31,0.78)_100%)] p-5 shadow-[0_22px_55px_rgba(0,0,0,0.28)] ring-1 ring-white/[0.04] backdrop-blur-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#FFD166]">
            {t("foodLibrary")}
          </p>
          <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">
            {t("manageDishes")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
            {t("manageDishesDescription")}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-sky-400/35 bg-sky-400/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-sky-300/60">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-300">{t("total")}</p>
            <strong className="mt-3 block text-3xl font-black text-white">
              {foodTotal}
            </strong>
          </div>
          <div className="rounded-2xl border border-emerald-400/35 bg-emerald-400/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300/60">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-300">
              {t("available")}
            </p>
            <strong className="mt-3 block text-3xl font-black text-white">
              {availableCount}
            </strong>
          </div>
          <div className="rounded-2xl border border-[#FFD166]/35 bg-[#FFD166]/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-[#FFD166]/60">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#FFD166]">{t("diet")}</p>
            <strong className="mt-3 block text-3xl font-black text-white">
              {dietCount}
            </strong>
          </div>
        </div>
        </div>
      </section>

      <section className="overflow-visible rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(30,42,45,0.96),rgba(22,31,34,0.94))] shadow-[0_22px_55px_rgba(0,0,0,0.24)] ring-1 ring-white/[0.04] backdrop-blur-sm">
        <div className="flex flex-col gap-4 border-b border-white/[0.08] bg-[radial-gradient(circle_at_100%_0%,rgba(127,29,29,0.14),transparent_34%),rgba(255,255,255,0.03)] p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[#7F1D1D]/35 bg-[#7F1D1D]/12 text-[#7F1D1D] transition duration-200 hover:scale-110">
              <UtensilsCrossed size={23} />
            </div>
            <div>
            <p className="text-sm font-bold text-white/45">
                {normalizedSearch
                  ? `${filteredFoods.length} ${filteredFoods.length === 1 ? t("result") : t("results")} "${search}"`
                  : t("dishesReady")}
              </p>
              <h2 className="text-2xl font-black text-white">{t("foods")}</h2>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {isAdmin && (
              <div ref={restaurantPickerRef} className="relative z-40 w-full sm:w-72">
                <button
                  type="button"
                  onClick={() =>
                    restaurants.length &&
                    setIsRestaurantPickerOpen((current) => !current)
                  }
                  className="flex h-12 w-full items-center justify-between gap-3 rounded-2xl border border-[#FFD166]/35 bg-[#0D1214] px-4 text-left text-sm font-black text-white shadow-[0_14px_30px_rgba(0,0,0,0.18)] transition hover:border-[#FFD166]/70 focus:outline-none focus:ring-4 focus:ring-[#FFD166]/10"
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
                  <div className="absolute right-0 top-[calc(100%+0.55rem)] z-[500] w-full overflow-hidden rounded-2xl border border-[#FFD166]/25 bg-[#0D1214] p-1.5 shadow-[0_24px_58px_rgba(0,0,0,0.45)] ring-1 ring-white/5">
                    {restaurants.length ? (
                      restaurants.map((restaurant) => {
                        const restaurantId = String(getEntityId(restaurant));
                        const isSelected = restaurantId === String(selectedRestaurantId);

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

            <button
              onClick={handleOpenAddFood}
              disabled={isAdmin && !selectedRestaurantId}
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#7F1D1D] px-4 text-sm font-black text-white shadow-[0_16px_34px_rgba(127,29,29,0.28)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#681718] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              <Plus size={18} className="transition duration-200 group-hover:rotate-90" />
              {t("addFood")}
            </button>
          </div>
        </div>

        <div className="space-y-5 border-b border-white/[0.08] bg-[#172124] p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3 text-base font-black text-white">
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-sky-400/35 bg-sky-400/12 text-sky-300">
                <ListFilter size={18} />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{t("filters")}</p>
                <p className="mt-1 text-sm font-extrabold text-white/55">
                  {filteredFoods.length} / {foodTotal}
                </p>
              </div>
              {activeFilterCount > 0 && (
                <span className="rounded-full border border-[#FFD166]/35 bg-[#FFD166]/12 px-3 py-1.5 text-sm font-black text-[#FFD166]">
                  {activeFilterCount} {t("active")}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="w-fit rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-base font-black text-white/70 transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0"
            >
              {t("clearFilters")}
            </button>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#202B2F] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.14em] text-sky-300">
                  {t("category")}
                </p>
                <p className="mt-1 text-sm font-extrabold text-white/50">
                  {t("pickMenuGroup")}
                </p>
              </div>
              <span className="rounded-full bg-[#0D1214]/70 px-3 py-1.5 text-sm font-black text-sky-200">
                {categoryFilterOptions.length} {t("groups")}
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categoryFilterOptions.map((option) => {
                const isActive = categoryFilter === option.id;
                const count = getCategoryCount(option.id);

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setCategoryFilter(option.id)}
                    className={`flex shrink-0 items-center gap-2 rounded-2xl border px-5 py-3.5 text-base font-black transition duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
                      isActive
                        ? "border-sky-300/70 bg-sky-400/20 text-white shadow-[0_14px_30px_rgba(56,189,248,0.14)]"
                        : "border-white/10 bg-[#162023] text-white/68 hover:border-sky-400/35 hover:bg-[#1C2A2F] hover:text-white"
                    }`}
                  >
                    <span>{option.label}</span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-sm ${
                        isActive ? "bg-white/18 text-white" : "bg-white/[0.07] text-white/45"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-[#202B2F] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="mb-3">
                <p className="text-sm font-black uppercase tracking-[0.14em] text-emerald-300">
                  {t("availability")}
                </p>
                <p className="mt-1 text-sm font-extrabold text-white/50">
                  {t("sellableOrHidden")}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {availabilityFilterOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setStatusFilter(option.id)}
                    className={`rounded-2xl border px-4 py-4 text-center transition duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
                      statusFilter === option.id
                        ? "border-emerald-300/65 bg-emerald-400/18 text-white shadow-[0_14px_30px_rgba(52,211,153,0.14)]"
                        : "border-white/10 bg-[#162023] text-white/68 hover:border-emerald-400/35 hover:bg-[#1C2A2F] hover:text-white"
                    }`}
                  >
                    <span className="block text-base font-black">{option.label}</span>
                    <span className="mt-1 block text-xl font-black">{option.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-[#202B2F] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="mb-3">
                <p className="text-sm font-black uppercase tracking-[0.14em] text-[#FFD166]">
                  {t("type")}
                </p>
                <p className="mt-1 text-sm font-extrabold text-white/50">
                  {t("dietFriendlyOrRegular")}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {dietFilterOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setDietFilter(option.id)}
                    className={`rounded-2xl border px-4 py-4 text-center transition duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
                      dietFilter === option.id
                        ? "border-[#FFD166]/65 bg-[#FFD166]/18 text-white shadow-[0_14px_30px_rgba(255,209,102,0.12)]"
                        : "border-white/10 bg-[#162023] text-white/68 hover:border-[#FFD166]/35 hover:bg-[#1C2A2F] hover:text-white"
                    }`}
                  >
                    <span className="block text-base font-black">{option.label}</span>
                    <span className="mt-1 block text-xl font-black">{option.count}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-5">
          {isLoadingMenu ? (
            <div className="rounded-[28px] border border-white/10 bg-[#0D1214]/72 px-5 py-16 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-[#FFD166]/35 bg-[#FFD166]/12 text-[#FFD166]">
                <Loader2 size={26} className="animate-spin" />
              </div>
              <h3 className="mt-4 text-2xl font-black text-white">
                {t("pleaseWait")}
              </h3>
              <p className="mt-2 text-sm text-white/50">
                {t("loadingRestaurantMenu")}
              </p>
            </div>
          ) : filteredFoods.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-white/14 bg-[#0D1214]/72 px-5 py-16 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-[#FFD166]/35 bg-[#FFD166]/12 text-[#FFD166]">
                <PackagePlus size={24} />
              </div>
              <h3 className="mt-4 text-2xl font-black text-white">
                {normalizedSearch ? t("noMatchingFoods") : t("noFoodsFound")}
              </h3>
              <p className="mt-2 text-sm text-white/50">
                {normalizedSearch
                  ? t("tryAnotherFood")
                  : t("addFirstDish")}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {filteredFoods.map((food) => {
                const imageUrl = getFoodImageUrl(food.image);

                return (
                  <article
                    key={food.id}
                    className="group overflow-hidden rounded-[24px] border border-white/10 bg-[#202B2F] shadow-[0_18px_42px_rgba(0,0,0,0.22)] transition duration-200 hover:-translate-y-1 hover:border-[#7F1D1D]/35 hover:shadow-[0_24px_58px_rgba(0,0,0,0.3)]"
                  >
                    <div className="relative h-40 overflow-hidden bg-[#0D1214]">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={food.name}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling?.classList.remove("hidden");
                          }}
                        />
                      ) : null}

                      <div
                        className={`grid h-full w-full place-items-center bg-[linear-gradient(145deg,rgba(255,209,102,0.12),rgba(127,29,29,0.08))] text-white/35 ${
                          imageUrl ? "hidden" : ""
                        }`}
                      >
                        <ImagePlus size={28} />
                      </div>

                      <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black backdrop-blur ${
                            food.is_available
                              ? "border border-emerald-300/35 bg-emerald-400/80 text-white shadow-lg shadow-emerald-500/25"
                              : "border border-[#7F1D1D]/35 bg-[#7F1D1D]/85 text-white shadow-lg shadow-[#7F1D1D]/25"
                          }`}
                        >
                          {food.is_available ? t("available") : t("unavailable")}
                        </span>
                        {food.is_diet && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#FFD166]/35 bg-[#FFD166]/85 px-3 py-1 text-xs font-black text-[#1b1510] shadow-lg shadow-[#FFD166]/20">
                            <Salad size={13} />
                            {t("diet")}
                          </span>
                        )}
                      </div>

                      <div className="absolute right-3 top-3 flex gap-2 opacity-100 transition duration-200 md:opacity-0 md:group-hover:opacity-100">
                        <button
                          onClick={() => handleOpenEditFood(food)}
                          title={t("editFood")}
                          className="grid h-10 w-10 place-items-center rounded-xl border border-[#FFD166]/35 bg-[#0D1214]/85 text-[#FFD166] shadow-lg backdrop-blur transition duration-200 hover:scale-110 hover:bg-[#FFD166]/12 active:scale-95"
                        >
                          <Edit3 size={17} />
                        </button>
                        <button
                          onClick={() => setDeleteFood(food)}
                          title={t("deleteFoodTitle")}
                          className="grid h-10 w-10 place-items-center rounded-xl border border-[#7F1D1D]/35 bg-[#0D1214]/85 text-[#7F1D1D] shadow-lg backdrop-blur transition duration-200 hover:scale-110 hover:bg-[#7F1D1D]/12 active:scale-95"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 p-3">
                      <div>
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <h3 className="text-base font-black leading-tight text-white">
                            {food.name}
                          </h3>
                          <span className="shrink-0 rounded-full border border-[#FFD166]/25 bg-[#FFD166]/10 px-3 py-1 text-sm font-black text-[#FFD166]">
                            ${food.price}
                          </span>
                        </div>
                        <p className="line-clamp-2 min-h-[38px] text-xs leading-5 text-white/48">
                          {food.description || t("noDescription")}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-2xl border border-white/8 bg-[#172124] p-3">
                          <p className="text-[11px] font-black uppercase tracking-[0.1em] text-white/35">
                            {t("category")}
                          </p>
                          <p className="mt-1 truncate text-xs font-black text-white/80">
                            {food.category?.name ?? "-"}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-[#FFD166]/18 bg-[#FFD166]/10 p-3">
                          <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#FFD166]/75">
                            {t("prep")}
                          </p>
                          <p className="mt-1 text-xs font-black text-white/80">
                            {food.preparation_time
                              ? `${food.preparation_time} min`
                              : "-"}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-sky-400/18 bg-sky-400/10 p-3">
                          <p className="text-[11px] font-black uppercase tracking-[0.1em] text-sky-300/75">
                            {t("batch")}
                          </p>
                          <p className="mt-1 text-xs font-black text-white/80">
                            {food.preparation_batch_size
                              ? `${food.preparation_batch_size} pcs`
                              : "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <FoodModal
        isOpen={openFoodModal}
        onClose={handleCloseFoodModal}
        onSave={handleSaveFood}
        categories={categories}
        food={editingFood}
        errorMessage={foodErrorMessage}
      />
      <AttachIngredientModal
        isOpen={openIngredientModal}
        onClose={() => setOpenIngredientModal(false)}
        food={selectedFood}
        ingredients={ingredients}
        onSave={handleAttachIngredients}
      />

      {deleteFood && (
        <div className="modal-backdrop-enter fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="modal-panel-enter w-full max-w-md rounded-[28px] border border-white/10 bg-[#182124] p-5 text-white shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#7F1D1D]/35 bg-[#7F1D1D]/12 text-[#7F1D1D]">
                <AlertTriangle size={24} />
              </div>

              <div>
                <h3 className="text-xl font-black text-white">
                  {t("deleteFood")}
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/55">
                  {t("deleteFoodConfirm")}{" "}
                  <span className="font-black text-white">
                    {deleteFood.name}
                  </span>
                  {t("deleteFoodCannotUndo")}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteFood(null)}
                className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-black text-white/65 transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.05] hover:text-white active:translate-y-0"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={handleDeleteFood}
                className="group inline-flex items-center gap-2 rounded-2xl bg-[#7F1D1D] px-5 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(127,29,29,0.28)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#681718] active:translate-y-0"
              >
                <Trash2
                  size={17}
                  className="transition duration-200 group-hover:rotate-6"
                />
                {t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {isSavingFood && (
        <div className="modal-backdrop-enter fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="modal-panel-enter w-full max-w-sm rounded-[28px] border border-white/10 bg-[#182124] p-6 text-center text-white shadow-2xl">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#7F1D1D] text-white shadow-[0_16px_34px_rgba(127,29,29,0.28)]">
              <Loader2 size={28} className="animate-spin" />
            </div>
            <h3 className="mt-4 text-xl font-black text-white">
              {t("pleaseWait")}
            </h3>
            <p className="mt-2 text-sm leading-6 text-white/55">
              {t("savingFood")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

