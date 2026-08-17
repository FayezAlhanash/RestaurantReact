import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  AlertTriangle,
  ChevronDown,
  CheckCircle2,
  Edit3,
  Layers3,
  Link,
  ListTree,
  Loader2,
  Plus,
  Tags,
  Trash2,
  Unlink,
} from "lucide-react";
import CategoryModal from "./CategoryModal";
import ModifierGroupModal from "./ModifierGroupModal";
import ModifierOptionModal from "./ModifierOptionModal";
import api from "../../API/axios";
import { useTheme } from "../../context/ThemeContext";
import { getStoredUser, ROLE_IDS } from "../../utils/auth";
import {
  nonNegativeNumberInputProps,
  toNonNegativeNumberValue,
} from "../../utils/nonNegativeNumberInput";
import {
  ensureManagerRestaurantId,
  filterCategoriesByRestaurant,
  getResponseList,
} from "./managerHelpers";

const tabs = [
  {
    id: "categories",
    label: "Categories",
    icon: Tags,
    description: "The sections customers and cashiers browse first.",
    inactiveClass: "border-sky-200 bg-sky-50 text-sky-900 hover:border-sky-300",
    iconClass: "text-sky-700",
  },
  {
    id: "groups",
    label: "Modifier Groups",
    icon: Layers3,
    description: "Extras like size, toppings, sauces, and cooking style.",
    inactiveClass:
      "border-amber-200 bg-amber-50 text-amber-900 hover:border-amber-300",
    iconClass: "text-amber-700",
  },
  {
    id: "options",
    label: "Modifier Options",
    icon: ListTree,
    description: "The selectable choices that sit inside each group.",
    inactiveClass:
      "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900 hover:border-fuchsia-300",
    iconClass: "text-fuchsia-700",
  },
];

const getGroupFoods = (group) => {
  if (Array.isArray(group?.foods)) return group.foods;
  if (Array.isArray(group?.food)) return group.food;
  return [];
};

const getFoodId = (food) => food?.food_id ?? food?.pivot?.food_id ?? food?.id;

const getOptionGroupId = (option) =>
  option?.modifier_group_id ?? option?.modifier_group?.id ?? option?.group?.id;

const getOptionGroupName = (option, groups) => {
  const groupId = getOptionGroupId(option);
  const group = groups.find((item) => String(item.id) === String(groupId));

  return option?.modifier_group?.name ?? option?.group?.name ?? group?.name ?? "-";
};

const getOptionsForGroup = (groupId, options) =>
  options.filter((option) => String(getOptionGroupId(option)) === String(groupId));

const getGroupOptions = (group) =>
  group?.options ?? group?.modifier_options ?? group?.modifierOptions ?? [];

const isVariantGroup = (group) =>
  Boolean(Number(group?.is_variant ?? group?.isVariant ?? 0)) ||
  ["size", "sizes", "\u062d\u062c\u0645", "\u0627\u0644\u062d\u062c\u0645"].some((term) =>
    String(group?.name ?? "").toLowerCase().includes(term)
  );

const getOptionId = (option) => option?.id ?? option?.modifier_option_id;

const getRelationValue = (item, key) =>
  item?.pivot?.[key] ??
  item?.food_pivot?.[key] ??
  item?.modifier_group_food?.[key] ??
  item?.modifierGroupFood?.[key] ??
  item?.[key];

const getRelationPrice = (option) =>
  option?.pivot?.price ??
  option?.pivot?.additional_price ??
  option?.pivot?.extra_price ??
  option?.pivot?.option_price ??
  option?.pivot?.modifier_price ??
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
  option?.option_price ??
  option?.price;

const getApiErrorMessage = (error, fallback) => {
  const data = error.response?.data;
  const firstError = Object.values(data?.errors ?? {})
    .flat()
    .find(Boolean);

  return firstError || data?.message || error.message || fallback;
};

const getItemRestaurantId = (item) =>
  item?.restaurant_id ??
  item?.restaurantId ??
  item?.restaurant?.id ??
  item?.pivot?.restaurant_id ??
  item?.pivot?.restaurantId ??
  null;

const withRestaurantContext = (items, restaurant) =>
  items.map((item) => ({
    ...item,
    restaurant_id: getItemRestaurantId(item) ?? restaurant?.id,
    restaurant: item?.restaurant ?? restaurant,
  }));

const getAttachSettings = (settings, groupId, optionCount = 1) =>
  settings[groupId] ?? {
    max_select: String(Math.min(1, Math.max(optionCount, 1))),
    required: true,
    prices: {},
  };

function DeleteConfirmModal({
  isOpen,
  itemName,
  itemType,
  isDeleting,
  errorMessage,
  isLight,
  onClose,
  onConfirm,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div className={`modal-panel-enter w-full max-w-md overflow-hidden rounded-3xl border shadow-[0_28px_70px_rgba(0,0,0,0.42)] ring-1 ${isLight
          ? "border-[#D8B7A8] bg-[#FFF9F2] text-[#241815] ring-white/70"
          : "border-white/10 bg-[#0D1214] text-white ring-white/5"
        }`}>
        <div className={`border-b px-6 py-5 ${isLight
            ? "border-[#DEC2B5] bg-[#F2DDD4]"
            : "border-white/10 bg-[#172124]"
          }`}>
          <div className="flex items-center gap-4">
            <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border ${isLight
                ? "border-[#8F1D1D]/25 bg-[#F3DCDC] text-[#8F1D1D]"
                : "border-[#EF4444]/30 bg-[#7F1D1D]/20 text-[#FCA5A5]"
              }`}>
              <AlertTriangle size={23} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h3 className={`text-xl font-black leading-6 ${isLight ? "text-[#241815]" : "text-white"}`}>
                Delete {itemType}
              </h3>
              <p className={`mt-1 text-sm font-bold ${isLight ? "text-[#6D5147]" : "text-white/50"}`}>
                This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <div className={`px-6 py-5 ${isLight ? "bg-[#FFFDF8]" : "bg-[#0D1214]"}`}>
          <p className={`text-base font-bold leading-7 ${isLight ? "text-[#4F403A]" : "text-white/78"}`}>
            Are you sure you want to delete{" "}
            <span className={`font-black ${isLight ? "text-[#8F1D1D]" : "text-[#FCA5A5]"}`}>"{itemName}"</span>?
          </p>

          {errorMessage && (
            <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-bold leading-5 ${isLight
                ? "border-[#8F1D1D]/25 bg-[#F3DCDC] text-[#8F1D1D]"
                : "border-[#EF4444]/35 bg-[#7F1D1D]/18 text-[#FCA5A5]"
              }`}>
              {errorMessage}
            </div>
          )}
        </div>

        <div className={`flex flex-col-reverse gap-3 border-t px-6 py-5 sm:flex-row sm:justify-end ${isLight
            ? "border-[#DEC2B5] bg-[#FFF1E8]"
            : "border-white/10 bg-[#11191C]"
          }`}>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className={`h-12 rounded-2xl border px-5 text-sm font-black transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${isLight
                ? "border-[#D8B7A8] bg-white text-[#4F403A] hover:bg-[#F8EFE7]"
                : "border-white/12 bg-[#172124] text-white/78 hover:border-white/20 hover:bg-[#1D2A2E]"
              }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#7F1D1D] px-5 text-sm font-black text-white shadow-[0_16px_34px_rgba(127,29,29,0.28)] transition duration-200 hover:bg-[#681718] disabled:cursor-wait disabled:opacity-75"
          >
            {isDeleting && <Loader2 size={17} className="animate-spin" />}
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

const buildAttachSettingsFromGroup = (group, fallbackSettings) => {
  const prices = { ...fallbackSettings.prices };

  getGroupOptions(group).forEach((option) => {
    const optionId = getOptionId(option);
    const price = getRelationPrice(option);

    if (optionId !== undefined && price !== undefined && price !== null) {
      prices[optionId] = String(price);
    }
  });

  const required = getRelationValue(group, "required");

  return {
    max_select: String(getRelationValue(group, "max_select") ?? fallbackSettings.max_select),
    required:
      required === undefined || required === null
        ? fallbackSettings.required
        : Boolean(Number(required)),
    prices,
  };
};

const findModifierGroupInFood = (food, groupId) => {
  const groups = food?.modifier_groups ?? food?.modifierGroups ?? food?.groups ?? [];

  return groups.find(
    (group) => String(group.id ?? group.modifier_group_id) === String(groupId)
  );
};

const ATTACH_SETTINGS_STORAGE_KEY = "manager_menu_attach_settings";
const SAVED_MODIFIER_PRICES_STORAGE_KEY = "manager_menu_modifier_prices";

const loadAttachSettingsDraft = () => {
  try {
    const savedSettings = window.localStorage.getItem(ATTACH_SETTINGS_STORAGE_KEY);

    return savedSettings ? JSON.parse(savedSettings) : {};
  } catch {
    return {};
  }
};

const saveModifierPriceDraft = (foodId, groupId, settings) => {
  try {
    const savedPrices = JSON.parse(
      window.localStorage.getItem(SAVED_MODIFIER_PRICES_STORAGE_KEY) || "{}"
    );

    Object.entries(settings.prices ?? {}).forEach(([optionId, price]) => {
      savedPrices[`${foodId}:${groupId}:${optionId}`] = price;
    });

    window.localStorage.setItem(
      SAVED_MODIFIER_PRICES_STORAGE_KEY,
      JSON.stringify(savedPrices)
    );
  } catch {
    // Local draft storage is only a frontend fallback.
  }
};

export default function AddMenu() {
  const { search = "" } = useOutletContext() ?? {};
  const { isLight } = useTheme();
  const user = getStoredUser();
  const isAdmin = Number(user?.role_id ?? user?.role?.id) === ROLE_IDS.ADMIN;
  const [activeTab, setActiveTab] = useState("categories");
  const [openCategoryModal, setOpenCategoryModal] = useState(false);
  const [openGroupModal, setOpenGroupModal] = useState(false);
  const [openOptionModal, setOpenOptionModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingOption, setEditingOption] = useState(null);
  const [categories, setCategories] = useState([]);
  const [modifierGroups, setModifierGroups] = useState([]);
  const [modifierOptions, setModifierOptions] = useState([]);
  const [foods, setFoods] = useState([]);
  const [foodSelections, setFoodSelections] = useState({});
  const [attachSettings, setAttachSettings] = useState(loadAttachSettingsDraft);
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState("");
  const [savingGroup, setSavingGroup] = useState(false);
  const [savingOption, setSavingOption] = useState(false);
  const [attachingGroupId, setAttachingGroupId] = useState(null);
  const [attachErrors, setAttachErrors] = useState({});
  const [openFoodPickerGroupId, setOpenFoodPickerGroupId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [ingredients, setIngredients] = useState([]);
  const fetchRestaurantsForAdmin = async () => {
    if (!isAdmin) return [];

    const res = await api.get("/restaurants");
    return getResponseList(res.data, ["restaurants"]);
  };

  const fetchRestaurantScopedList = async (endpoint, keys) => {
    const restaurantId = await ensureManagerRestaurantId();

    if (restaurantId) {
      const res = await api.get(endpoint, {
        params: { restaurant_id: restaurantId },
      });

      return getResponseList(res.data, keys);
    }

    if (!isAdmin) return [];

    const restaurants = await fetchRestaurantsForAdmin();
    const responses = await Promise.allSettled(
      restaurants.map((restaurant) =>
        api.get(endpoint, { params: { restaurant_id: restaurant.id } })
      )
    );

    return responses.flatMap((result, index) => {
      if (result.status !== "fulfilled") {
        console.error(result.reason?.response?.data || result.reason);
        return [];
      }

      return withRestaurantContext(
        getResponseList(result.value.data, keys),
        restaurants[index]
      );
    });
  };

  const fetchCategories = async () => {
    try {
      const restaurantId = await ensureManagerRestaurantId();
      const res = await api.get("/categories", {
        params: restaurantId ? { restaurant_id: restaurantId } : undefined,
      });
      const categoryList = getResponseList(res.data, ["categories"]);

      setCategories(filterCategoriesByRestaurant(categoryList, restaurantId));
    } catch (err) {
      console.error(err.response?.data || err);
    }
  };

  const fetchModifierGroups = async () => {
    try {
      setModifierGroups(
        await fetchRestaurantScopedList("/modifier-groups", [
          "modifier_groups",
          "modifierGroups",
          "groups",
          "modifiergroups",
        ])
      );
    } catch (err) {
      console.error(err.response?.data || err);
    }
  };

  const fetchFoods = async () => {
    try {
      setFoods(await fetchRestaurantScopedList("/food", ["food", "foods"]));
    } catch (err) {
      console.error(err.response?.data || err);
    }
  };
  const fetchIngredients = async () => {
  try {
    const restaurantId = await ensureManagerRestaurantId();

    // Manager: عنده مطعم محدد
    if (restaurantId) {
      const res = await api.get(
        `/restaurants/${restaurantId}/ingredients`
      );

      setIngredients(
        getResponseList(res.data, ["ingredients"])
      );

      return;
    }

    // إذا مش Admin وما في restaurant
    if (!isAdmin) {
      setIngredients([]);
      return;
    }

    // Admin: جيب المطاعم كلها
    const restaurants = await fetchRestaurantsForAdmin();

    const responses = await Promise.allSettled(
      restaurants.map((restaurant) =>
        api.get(`/restaurants/${restaurant.id}/ingredients`)
      )
    );

    const allIngredients = responses.flatMap((result, index) => {
      if (result.status !== "fulfilled") {
        console.error(
          result.reason?.response?.data || result.reason
        );
        return [];
      }

      return withRestaurantContext(
        getResponseList(result.value.data, ["ingredients"]),
        restaurants[index]
      );
    });

    setIngredients(allIngredients);
  } catch (error) {
    console.error(error.response?.data || error);
    setIngredients([]);
  }
};
  const fetchModifierOptions = async () => {
    try {
      setModifierOptions(
        await fetchRestaurantScopedList("/modifier-options", [
          "modifier_options",
          "modifierOptions",
          "options",
          "modifieroptions",
        ])
      );
    } catch (err) {
      console.error(err.response?.data || err);
    }
  };

  const handleSaveCategory = async (data) => {
    if (savingCategory) return;

    const normalizedName = data.name.trim().toLowerCase();
    const duplicateCategory = categories.find(
      (category) =>
        String(category.id) !== String(editingCategory?.id ?? "") &&
        String(category.name ?? "").trim().toLowerCase() === normalizedName
    );

    if (!normalizedName) {
      setCategoryError("Category name is required.");
      return;
    }

    if (duplicateCategory) {
      setCategoryError("This category name already exists. Please use a unique name.");
      return;
    }

    try {
      setSavingCategory(true);
      setCategoryError("");
      const restaurantId = await ensureManagerRestaurantId();
      const formData = new FormData();

      formData.append("restaurant_id", restaurantId);
      formData.append("name", data.name.trim());
      formData.append("is_active", data.is_active);

      if (editingCategory) {
        await api.post(`/categories/${editingCategory.id}`, formData);
      } else {
        await api.post("/categories", formData);
      }

      await fetchCategories();
      setEditingCategory(null);
      setOpenCategoryModal(false);
    } catch (err) {
      console.error(err.response?.data || err);
      setCategoryError(
        getApiErrorMessage(
          err,
          "Category could not be saved. Please check the name and try again."
        )
      );
    } finally {
      setSavingCategory(false);
    }
  };

  const openDeleteModal = (type, item) => {
    setDeleteError("");
    setDeleteTarget({ type, item });
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;

    setDeleteTarget(null);
    setDeleteError("");
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;

    const { type, item } = deleteTarget;

    try {
      setIsDeleting(true);
      setDeleteError("");

      if (type === "category") {
        await api.delete(`/categories/${item.id}`);
        await fetchCategories();
      }

      if (type === "modifier group") {
        await api.delete(`/modifier-groups/${item.id}`);
        await fetchModifierGroups();
      }

      if (type === "modifier option") {
        await api.delete(`/modifier-options/${item.id}`);
        await fetchModifierOptions();
      }

      setDeleteTarget(null);
    } catch (err) {
      console.error(err.response?.data || err);
      setDeleteError(
        getApiErrorMessage(err, "This item could not be deleted. Please try again.")
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenEditCategory = (category) => {
    setCategoryError("");
    setEditingCategory(category);
    setOpenCategoryModal(true);
  };

  const handleCloseCategoryModal = () => {
    setCategoryError("");
    setEditingCategory(null);
    setOpenCategoryModal(false);
  };

  const handleSaveGroup = async (data) => {
    if (savingGroup) return;

    try {
      setSavingGroup(true);
      const restaurantId = await ensureManagerRestaurantId();
      const formData = new FormData();

      formData.append("restaurant_id", restaurantId);
      formData.append("name", data.name);
      formData.append("is_variant", data.is_variant ? 1 : 0);

      if (editingGroup) {
        await api.post(`/modifier-groups/${editingGroup.id}`, formData);
      } else {
        await api.post("/modifier-groups", formData);
      }

      await fetchModifierGroups();
      setEditingGroup(null);
      setOpenGroupModal(false);
    } catch (err) {
      console.error(err.response?.data || err);
    } finally {
      setSavingGroup(false);
    }
  };

  const handleAttachGroupToFood = async (group) => {
    const foodId = foodSelections[group.id];
    const groupOptions = getOptionsForGroup(group.id, modifierOptions);
    const settings = getAttachSettings(attachSettings, group.id, groupOptions.length);
    const isLinkedFood = getGroupFoods(group).some(
      (food) => String(getFoodId(food)) === String(foodId)
    );

    if (!foodId || !groupOptions.length || attachingGroupId) return;

    if (isLinkedFood) {
      setAttachErrors((prev) => ({
        ...prev,
        [group.id]: "This modifier group is already attached to this food.",
      }));
      return;
    }

    try {
      setAttachingGroupId(group.id);
      setAttachErrors((prev) => ({ ...prev, [group.id]: "" }));
      const formData = new FormData();
      formData.append("food_id", foodId);
      formData.append("max_select", isVariantGroup(group) ? 1 : settings.max_select || 1);
      formData.append("required", isVariantGroup(group) ? 1 : settings.required ? 1 : 0);

      groupOptions.forEach((option, index) => {
        const optionId = getOptionId(option);

        formData.append(`options[${index}][modifier_option_id]`, optionId);
        formData.append(
          `options[${index}][price]`,
          settings.prices?.[optionId] ?? 0
        );
      });

      await api.post(`/modifier-groups/${group.id}/foods`, formData);

      saveModifierPriceDraft(foodId, group.id, settings);
      setFoodSelections((prev) => ({ ...prev, [group.id]: "" }));
      setAttachSettings((prev) => {
        const nextSettings = { ...prev };
        delete nextSettings[group.id];

        return nextSettings;
      });
      await fetchModifierGroups();
    } catch (err) {
      console.error(err.response?.data || err);
      setAttachErrors((prev) => ({
        ...prev,
        [group.id]: getApiErrorMessage(
          err,
          "Modifier group could not be attached to this food."
        ),
      }));
    } finally {
      setAttachingGroupId(null);
    }
  };

  const handleRemoveGroupFromFood = async (groupId, foodId) => {
    try {
      await api.delete(`/modifier-groups/${groupId}/foods/${foodId}`);
      await fetchModifierGroups();
    } catch (err) {
      console.error(err.response?.data || err);
    }
  };

  const handleFoodSelectionChange = async (group, foodId) => {
    const groupOptions = getOptionsForGroup(group.id, modifierOptions);
    const linkedFood = getGroupFoods(group).find(
      (food) => String(getFoodId(food)) === String(foodId)
    );

    setAttachErrors((prev) => ({
      ...prev,
      [group.id]: linkedFood
        ? "This modifier group is already attached to this food."
        : "",
    }));

    setFoodSelections((prev) => ({
      ...prev,
      [group.id]: foodId,
    }));

    if (!foodId) return;

    const fallbackSettings = getAttachSettings(
      attachSettings,
      group.id,
      groupOptions.length
    );
    if (linkedFood) {
      setAttachSettings((prev) => ({
        ...prev,
        [group.id]: buildAttachSettingsFromGroup(
          {
            ...group,
            ...linkedFood,
            options: getGroupOptions(linkedFood).length
              ? getGroupOptions(linkedFood)
              : getGroupOptions(group),
          },
          fallbackSettings
        ),
      }));
    }

    try {
      const response = await api.get(`/food/${foodId}`);
      const [detailsFromList] = getResponseList(response.data, ["food", "foods"]);
      const foodDetails = detailsFromList || response.data?.food || response.data?.data || response.data;
      const detailGroup = findModifierGroupInFood(foodDetails, group.id);

      if (detailGroup) {
        setAttachSettings((prev) => ({
          ...prev,
          [group.id]: buildAttachSettingsFromGroup(
            detailGroup,
            getAttachSettings(prev, group.id, groupOptions.length)
          ),
        }));
      }
    } catch (err) {
      console.error(err.response?.data || err);
    }
  };

  const handleOpenEditGroup = (group) => {
    setEditingGroup(group);
    setOpenGroupModal(true);
  };

  const handleCloseGroupModal = () => {
    setEditingGroup(null);
    setOpenGroupModal(false);
  };

  const handleSaveOption = async (data) => {
    if (savingOption) return;

    try {
      setSavingOption(true);
      const formData = new FormData();

      formData.append("modifier_group_id", data.modifier_group_id);
      formData.append("name", data.name);

      if (editingOption) {
        await api.post(`/modifier-options/${editingOption.id}`, formData);
      } else {
        await api.post("/modifier-options", formData);
      }

      await fetchModifierOptions();
      setEditingOption(null);
      setOpenOptionModal(false);
    } catch (err) {
      console.error(err.response?.data || err);
    } finally {
      setSavingOption(false);
    }
  };

  const handleOpenEditOption = (option) => {
    setEditingOption(option);
    setOpenOptionModal(true);
  };

  const handleCloseOptionModal = () => {
    setEditingOption(null);
    setOpenOptionModal(false);
  };

  useEffect(() => {
    fetchCategories();
    fetchModifierGroups();
    fetchModifierOptions();
    fetchFoods();
    fetchIngredients();
  }, []);

  useEffect(() => {
    modifierGroups.forEach((group) => {
      const linkedFoods = getGroupFoods(group);
      const linkedFoodId = linkedFoods.length === 1 ? getFoodId(linkedFoods[0]) : null;

      if (linkedFoodId && !foodSelections[group.id]) {
        handleFoodSelectionChange(group, String(linkedFoodId));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modifierGroups, modifierOptions]);

  useEffect(() => {
    window.localStorage.setItem(
      ATTACH_SETTINGS_STORAGE_KEY,
      JSON.stringify(attachSettings)
    );
  }, [attachSettings]);

  const activeTabData = tabs.find((tab) => tab.id === activeTab);
  const normalizedSearch = search.trim().toLowerCase();
  const filteredCategories = categories.filter((category) => {
    if (!normalizedSearch) return true;

    return [category.name, category.is_active ? "active" : "inactive"]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch));
  });
  const filteredGroups = modifierGroups.filter((group) => {
    if (!normalizedSearch) return true;

    return [group.name, ...getGroupFoods(group).map((food) => food.name)]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch));
  });
  const filteredOptions = modifierOptions.filter((option) => {
    if (!normalizedSearch) return true;

    return [option.name, getOptionGroupName(option, modifierGroups)]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch));
  });
  const attachedFoodCount = modifierGroups.reduce(
    (total, group) => total + getGroupFoods(group).length,
    0
  );

  return (
    <div className="space-y-6 p-4 text-white sm:p-6">
      <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(27,37,40,0.92)_0%,rgba(21,29,32,0.84)_55%,rgba(44,25,31,0.78)_100%)] p-5 shadow-[0_22px_55px_rgba(0,0,0,0.28)] ring-1 ring-white/[0.04] backdrop-blur-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_300px] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#FFD166]">
              Menu Builder
            </p>
            <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">
              Shape the restaurant menu
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
              Manage categories, modifier groups, and the foods each group belongs
              to from one workspace.
            </p>
          </div>

          <div className="rounded-2xl border border-[#166534]/35 bg-[#166534]/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-[#166534]/60">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-[#166534]">Live setup</p>
            <div className="mt-3 flex items-end justify-between">
              <strong className="text-4xl font-black text-white">
                {activeTab === "groups"
                  ? modifierGroups.length
                  : activeTab === "options"
                    ? modifierOptions.length
                    : categories.length}
              </strong>
              <span className="rounded-full border border-[#166534]/35 bg-[#166534]/10 px-3 py-1 text-xs font-black text-[#166534]">
                {activeTab === "groups"
                  ? `${attachedFoodCount} food links`
                  : activeTab === "options"
                    ? `${modifierGroups.length} groups`
                    : "Active setup"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`group relative overflow-hidden rounded-[24px] border p-4 text-left transition duration-200 hover:-translate-y-1 active:scale-[0.99] ${isActive
                  ? "border-[#7F1D1D]/70 bg-[linear-gradient(145deg,rgba(127,29,29,0.20),rgba(32,43,47,0.96)_58%,rgba(22,31,34,0.98))] text-white shadow-[0_18px_38px_rgba(127,29,29,0.20)] ring-2 ring-[#7F1D1D]/22"
                  : "border-white/10 bg-[#202B2F] text-white/72 shadow-[0_14px_32px_rgba(0,0,0,0.18)] hover:border-white/18 hover:bg-[#253236]"
                }`}
            >
              {isActive && (
                <span className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#7F1D1D,#FFD166,#7F1D1D)]" />
              )}
              <div className="mb-4 flex items-center justify-between gap-3">
                <span
                  className={`grid h-10 w-10 place-items-center rounded-2xl border transition duration-200 group-hover:scale-105 ${isActive
                      ? "border-[#7F1D1D]/25 bg-[#7F1D1D] text-white shadow-[0_10px_22px_rgba(127,29,29,0.24)]"
                      : "border-white/10 bg-white/[0.04] text-white/55"
                    }`}
                >
                  <Icon size={20} className="transition duration-200 group-hover:-rotate-6" />
                </span>
                {isActive && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FFD166]/30 bg-[#7F1D1D] px-3 py-1 text-xs font-black uppercase tracking-[0.10em] text-white shadow-[0_10px_22px_rgba(127,29,29,0.22)]">
                    <CheckCircle2 size={14} />
                    Selected
                  </span>
                )}
              </div>
              <h2 className={`font-black ${isActive ? "text-white" : ""}`}>
                {tab.label}
              </h2>
              <p
                className={`mt-2 text-sm leading-5 ${isActive ? "text-white/68" : "text-white/48"
                  }`}
              >
                {tab.description}
              </p>
            </button>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(30,42,45,0.96),rgba(22,31,34,0.94))] shadow-[0_22px_55px_rgba(0,0,0,0.24)] ring-1 ring-white/[0.04] backdrop-blur-sm">
        <div className="flex flex-col gap-4 border-b border-white/[0.08] bg-[radial-gradient(circle_at_100%_0%,rgba(127,29,29,0.14),transparent_34%),rgba(255,255,255,0.03)] p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-white/45">
              {activeTab === "categories" && normalizedSearch
                ? `${filteredCategories.length} result${filteredCategories.length === 1 ? "" : "s"} for "${search}"`
                : activeTab === "groups" && normalizedSearch
                  ? `${filteredGroups.length} result${filteredGroups.length === 1 ? "" : "s"} for "${search}"`
                  : activeTab === "options" && normalizedSearch
                    ? `${filteredOptions.length} result${filteredOptions.length === 1 ? "" : "s"} for "${search}"`
                    : activeTabData.description}
            </p>
            <h2 className="mt-1 text-2xl font-black text-white">
              {activeTabData.label}
            </h2>
          </div>

          {activeTab === "categories" && (
            <button
              type="button"
              onClick={() => {
                setCategoryError("");
                setEditingCategory(null);
                setOpenCategoryModal(true);
              }}
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[#7F1D1D] px-4 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(127,29,29,0.28)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#681718] active:translate-y-0"
            >
              <Plus size={18} className="transition duration-200 group-hover:rotate-90" />
              Add Category
            </button>
          )}

          {activeTab === "groups" && (
            <button
              onClick={() => {
                setEditingGroup(null);
                setOpenGroupModal(true);
              }}
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[#7F1D1D] px-4 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(127,29,29,0.28)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#681718] active:translate-y-0"
            >
              <Plus size={18} className="transition duration-200 group-hover:rotate-90" />
              Add Group
            </button>
          )}

          {activeTab === "options" && (
            <button
              onClick={() => {
                setEditingOption(null);
                setOpenOptionModal(true);
              }}
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[#7F1D1D] px-4 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(127,29,29,0.28)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#681718] active:translate-y-0"
            >
              <Plus size={18} className="transition duration-200 group-hover:rotate-90" />
              Add Option
            </button>
          )}
        </div>

        {activeTab === "categories" && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead className="bg-[#172124] text-sm font-black uppercase tracking-[0.14em] text-white/55">
                <tr>
                  <th className="px-5 py-4 text-left">Name</th>
                  <th className="px-5 py-4 text-left">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.07]">
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-5 py-16 text-center">
                      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-[#FFD166]/35 bg-[#FFD166]/12 text-[#FFD166]">
                        <Tags size={24} />
                      </div>
                      <h3 className="mt-4 text-xl font-black text-white">
                        {normalizedSearch ? "No matching categories" : "No categories yet"}
                      </h3>
                      <p className="mt-2 text-sm text-white/50">
                        {normalizedSearch
                          ? "Try another category name or status."
                          : "Start with the sections your cashier will use every day."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((category) => (
                    <tr key={category.id} className="transition duration-200 hover:bg-white/[0.035]">
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-4">
                          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[#EF4444]/45 bg-[#DC2626]/18 text-[#F87171] shadow-[0_10px_22px_rgba(220,38,38,0.16)]">
                            <Tags size={21} />
                          </div>
                          <span className="text-lg font-black text-white">{category.name}</span>
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <span
                          className={`inline-flex rounded-full px-4 py-1.5 text-sm font-black ${category.is_active
                              ? isLight
                                ? "border border-[#0F8B5F]/30 bg-[#D9F2E5] text-[#08764D] shadow-[0_10px_22px_rgba(15,139,95,0.12)]"
                                : "border border-[#10B981]/65 bg-[#064E3B] text-[#D1FAE5] shadow-[0_10px_22px_rgba(6,78,59,0.28)]"
                              : isLight
                                ? "border border-[#8F1D1D]/25 bg-[#F3DCDC] text-[#8F1D1D]"
                                : "border border-[#EF4444]/45 bg-[#DC2626]/14 text-[#FCA5A5]"
                            }`}
                        >
                          {category.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditCategory(category)}
                            className={`group relative grid h-10 w-10 place-items-center rounded-xl border transition duration-200 hover:scale-110 active:scale-95 ${isLight
                                ? "border-[#D8A22D]/30 bg-[#FFF4D6] text-[#9A6400] hover:bg-[#FFE8A3]"
                                : "border-[#FFD166]/30 bg-[#172124] text-[#FFD166] hover:bg-[#FFD166]/12"
                              }`}
                          >
                            <Edit3 size={16} className="transition duration-200 group-hover:-rotate-6" />
                            <span className={`pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md px-2 py-1 text-xs font-bold opacity-0 shadow-lg transition duration-200 group-hover:opacity-100 ${isLight
                                ? "border border-[#D8A22D]/25 bg-[#FFF4D6] text-[#9A6400]"
                                : "bg-stone-950 text-white"
                              }`}>
                              Edit
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal("category", category)}
                            className={`group relative grid h-10 w-10 place-items-center rounded-xl border transition duration-200 hover:scale-110 active:scale-95 ${isLight
                                ? "border-[#8F1D1D]/25 bg-[#F3DCDC] text-[#8F1D1D] hover:border-[#8F1D1D]/45 hover:bg-[#EBC8C8]"
                                : "border-[#EF4444]/45 bg-[#2A1719] text-[#F87171] hover:border-[#FCA5A5]/70 hover:bg-[#DC2626]/20 hover:text-[#FCA5A5]"
                              }`}
                          >
                            <Trash2 size={16} className="transition duration-200 group-hover:rotate-6" />
                            <span className={`pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md px-2 py-1 text-xs font-bold opacity-0 shadow-lg transition duration-200 group-hover:opacity-100 ${isLight
                                ? "border border-[#8F1D1D]/25 bg-[#F3DCDC] text-[#8F1D1D]"
                                : "bg-stone-950 text-white"
                              }`}>
                              Delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "groups" && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-[#172124] text-sm font-black uppercase tracking-[0.14em] text-white/55">
                <tr>
                  <th className="px-5 py-4 text-left">Group</th>
                  <th className="px-5 py-4 text-left">Linked foods</th>
                  <th className="px-5 py-4 text-left">Attach to food</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.07]">
                {filteredGroups.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-5 py-16 text-center">
                      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-[#FFD166]/35 bg-[#FFD166]/12 text-[#FFD166]">
                        <Layers3 size={24} />
                      </div>
                      <h3 className="mt-4 text-xl font-black text-white">
                        {normalizedSearch ? "No matching groups" : "No modifier groups yet"}
                      </h3>
                      <p className="mt-2 text-sm text-white/50">
                        {normalizedSearch
                          ? "Try another group or food name."
                          : "Add groups like size, sauce, bread type, or toppings."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredGroups.map((group) => {
                    const linkedFoods = getGroupFoods(group);
                    const groupOptions = getOptionsForGroup(group.id, modifierOptions);
                    const groupAttachSettings = getAttachSettings(
                      attachSettings,
                      group.id,
                      groupOptions.length
                    );
                    const linkedFoodIds = new Set(
                      linkedFoods.map((food) => String(getFoodId(food)))
                    );
                    const selectedFoodId = String(foodSelections[group.id] ?? "");
                    const isSelectedFoodLinked =
                      selectedFoodId && linkedFoodIds.has(selectedFoodId);

                    return (
                      <tr key={group.id} className="align-top transition duration-200 hover:bg-white/[0.035]">
                        <td className="px-5 py-5">
                          <div className="flex items-center gap-4">
                            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[#FFD166]/25 bg-[#FFD166]/10 text-[#FFD166]">
                              <Layers3 size={21} />
                            </div>
                            <div>
                              <p className="text-lg font-black text-white">{group.name}</p>
                              <p className="text-sm font-bold text-white/35">
                                ID #{group.id}
                              </p>
                              {isVariantGroup(group) && (
                                <span className="mt-2 inline-flex rounded-full border border-[#FFD166]/30 bg-[#FFD166]/10 px-3 py-1 text-xs font-black text-[#FFD166]">
                                  Size add-ons
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          {linkedFoods.length ? (
                            <div className="flex max-w-sm flex-wrap gap-2">
                              {linkedFoods.map((food) => (
                                <span
                                  key={getFoodId(food)}
                                  className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-1.5 text-sm font-black text-sky-200"
                                >
                                  <button
                                    type="button"
                                    title="Load linked food prices"
                                    onClick={() =>
                                      handleFoodSelectionChange(
                                        group,
                                        String(getFoodId(food))
                                      )
                                    }
                                    className="transition hover:text-white"
                                  >
                                    {food.name ?? `Food #${getFoodId(food)}`}
                                  </button>
                                  <button
                                    type="button"
                                    title="Remove from food"
                                    onClick={() =>
                                      handleRemoveGroupFromFood(
                                        group.id,
                                        getFoodId(food)
                                      )
                                    }
                                    className="text-sky-300 transition hover:scale-125 hover:text-[#7F1D1D]"
                                  >
                                    <Unlink size={13} />
                                  </button>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-base font-semibold text-white/35">
                              Not attached yet
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-5">
                          <div className="max-w-md space-y-3">
                            <div className="flex gap-2">
                              <div className="relative min-w-0 flex-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenFoodPickerGroupId((current) =>
                                      current === group.id ? null : group.id
                                    )
                                  }
                                  className="flex h-12 w-full min-w-0 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#172124] px-3 text-left text-base font-semibold text-white outline-none transition duration-200 hover:border-[#FFD166]/35 focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10"
                                >
                                  <span className="min-w-0 flex-1 truncate">
                                    {foods.find(
                                      (food) =>
                                        String(getFoodId(food)) ===
                                        String(foodSelections[group.id] ?? "")
                                    )?.name ||
                                      (foods.length ? "Choose food" : "No foods yet")}
                                  </span>
                                  <ChevronDown
                                    size={18}
                                    className={`shrink-0 text-[#FFD166] transition duration-200 ${openFoodPickerGroupId === group.id ? "rotate-180" : ""
                                      }`}
                                  />
                                </button>

                                {openFoodPickerGroupId === group.id && (
                                  <div className="modal-panel-enter absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 max-h-72 overflow-hidden rounded-2xl border border-[#7F1D1D]/20 bg-[#FFF9F3] p-1.5 text-[#241815] shadow-[0_24px_48px_rgba(127,29,29,0.18)] ring-1 ring-white/70">
                                    <div className="max-h-64 overflow-y-auto pr-1 [scrollbar-width:thin]">
                                      {foods.length ? (
                                        foods.map((food) => {
                                          const foodId = getFoodId(food);
                                          const isLinked = linkedFoodIds.has(String(foodId));
                                          const isSelected =
                                            String(foodSelections[group.id] ?? "") ===
                                            String(foodId);

                                          return (
                                            <button
                                              key={foodId}
                                              type="button"
                                              onClick={() => {
                                                handleFoodSelectionChange(
                                                  group,
                                                  String(foodId)
                                                );
                                                setOpenFoodPickerGroupId(null);
                                              }}
                                              className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-black transition duration-150 ${isSelected
                                                  ? "bg-[#7F1D1D] text-white shadow-sm"
                                                  : "text-[#241815] hover:bg-[#F1E2DA]"
                                                }`}
                                            >
                                              <span className="min-w-0 truncate">
                                                {food.name}
                                              </span>
                                              {isLinked && (
                                                <span
                                                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${isSelected
                                                      ? "bg-white/18 text-white"
                                                      : "bg-[#166534]/10 text-[#166534]"
                                                    }`}
                                                >
                                                  Linked
                                                </span>
                                              )}
                                            </button>
                                          );
                                        })
                                      ) : (
                                        <p className="px-3 py-6 text-center text-sm font-black text-[#8D7B74]">
                                          No foods yet
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleAttachGroupToFood(group)}
                                disabled={
                                  !foodSelections[group.id] ||
                                  !groupOptions.length ||
                                  isSelectedFoodLinked ||
                                  Boolean(attachingGroupId)
                                }
                                className="grid h-12 w-12 place-items-center rounded-2xl bg-[#7F1D1D] text-white shadow-[0_16px_34px_rgba(127,29,29,0.24)] transition duration-200 hover:scale-105 hover:bg-[#681718] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                                title={attachingGroupId === group.id ? "Please wait..." : "Attach to food"}
                              >
                                {attachingGroupId === group.id ? (
                                  <Loader2 size={17} className="animate-spin" />
                                ) : (
                                  <Link size={17} />
                                )}
                              </button>
                            </div>

                            {attachErrors[group.id] && (
                              <div className="rounded-2xl border border-[#EF4444]/35 bg-[#7F1D1D]/16 px-3 py-2 text-sm font-bold leading-5 text-[#FCA5A5]">
                                {attachErrors[group.id]}
                              </div>
                            )}

                            {!isVariantGroup(group) && (
                              <div className="grid grid-cols-[1fr_120px] gap-2">
                                <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#172124] px-3 py-2 text-sm font-black text-white/70">
                                  <input
                                    type="checkbox"
                                    checked={groupAttachSettings.required}
                                    onChange={(e) =>
                                      setAttachSettings((prev) => ({
                                        ...prev,
                                        [group.id]: {
                                          ...getAttachSettings(prev, group.id, groupOptions.length),
                                          required: e.target.checked,
                                        },
                                      }))
                                    }
                                    className="h-4 w-4 accent-[#7F1D1D]"
                                  />
                                  Required
                                </label>
                                <input
                                  type="number"
                                  {...nonNegativeNumberInputProps}
                                  min="1"
                                  max={Math.max(groupOptions.length, 1)}
                                  value={groupAttachSettings.max_select}
                                  onChange={(e) =>
                                    setAttachSettings((prev) => ({
                                      ...prev,
                                      [group.id]: {
                                        ...getAttachSettings(prev, group.id, groupOptions.length),
                                        max_select: toNonNegativeNumberValue(e.target.value),
                                      },
                                    }))
                                  }
                                  className="rounded-2xl border border-white/10 bg-[#172124] px-3 py-2 text-sm font-black text-white outline-none focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10"
                                  title="Max select"
                                />
                              </div>
                            )}

                            {isVariantGroup(group) && (
                              <p className="rounded-2xl border border-[#FFD166]/18 bg-[#FFD166]/10 px-3 py-2 text-sm font-bold leading-5 text-[#FFD166]">
                                Small uses the food price. Enter only the extra amount for bigger sizes; customers see the final price.
                              </p>
                            )}

                            {groupOptions.length ? (
                              <div className="space-y-2 rounded-2xl border border-[#FFD166]/18 bg-[#172124] p-2">
                                {groupOptions.map((option) => (
                                  <div
                                    key={option.id}
                                    className="grid grid-cols-[1fr_90px] items-center gap-2"
                                  >
                                    <span className="truncate text-sm font-black text-white/80">
                                      {option.name}
                                    </span>
                                    <input
                                      type="number"
                                      {...nonNegativeNumberInputProps}
                                      step="0.01"
                                      placeholder={isVariantGroup(group) ? "Extra" : "Price"}
                                      value={groupAttachSettings.prices?.[option.id] ?? ""}
                                      onChange={(e) =>
                                        setAttachSettings((prev) => {
                                          const current = getAttachSettings(
                                            prev,
                                            group.id,
                                            groupOptions.length
                                          );

                                          return {
                                            ...prev,
                                            [group.id]: {
                                              ...current,
                                              prices: {
                                                ...current.prices,
                                                [option.id]: toNonNegativeNumberValue(
                                                  e.target.value
                                                ),
                                              },
                                            },
                                          };
                                        })
                                      }
                                      className="rounded-xl border border-[#FFD166]/20 bg-[#0D1214] px-2 py-1.5 text-sm font-bold text-[#FFD166] outline-none focus:border-[#FFD166]/70 focus:ring-2 focus:ring-[#FFD166]/10"
                                      title={isVariantGroup(group) ? "Extra above food price" : "Extra price"}
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="rounded-2xl border border-[#7F1D1D]/25 bg-[#7F1D1D]/10 px-3 py-2 text-sm font-bold text-[#7F1D1D]">
                                Add options to this group first.
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditGroup(group)}
                              className="group relative grid h-10 w-10 place-items-center rounded-xl border border-[#FFD166]/30 bg-[#172124] text-[#FFD166] transition duration-200 hover:scale-110 hover:bg-[#FFD166]/12 active:scale-95"
                              title="Edit group"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteModal("modifier group", group)}
                              className="group relative grid h-10 w-10 place-items-center rounded-xl border border-[#7F1D1D]/30 bg-[#172124] text-[#7F1D1D] transition duration-200 hover:scale-110 hover:bg-[#7F1D1D]/12 active:scale-95"
                              title="Delete group"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "options" && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-[#172124] text-sm font-black uppercase tracking-[0.14em] text-white/55">
                <tr>
                  <th className="px-5 py-4 text-left">Option</th>
                  <th className="px-5 py-4 text-left">Group</th>
                  <th className="px-5 py-4 text-left">Option ID</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.07]">
                {filteredOptions.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-5 py-16 text-center">
                      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-fuchsia-300/35 bg-fuchsia-400/12 text-fuchsia-300">
                        <ListTree size={24} />
                      </div>
                      <h3 className="mt-4 text-xl font-black text-white">
                        {normalizedSearch ? "No matching options" : "No modifier options yet"}
                      </h3>
                      <p className="mt-2 text-sm text-white/50">
                        {modifierGroups.length
                          ? "Add choices inside a modifier group."
                          : "Create a modifier group first, then add its choices."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredOptions.map((option) => (
                    <tr key={option.id} className="transition duration-200 hover:bg-white/[0.035]">
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-4">
                          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-fuchsia-300/25 bg-fuchsia-400/10 text-fuchsia-300">
                            <ListTree size={21} />
                          </div>
                          <span className="text-lg font-black text-white">
                            {option.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <span className="rounded-full border border-[#FFD166]/30 bg-[#FFD166]/10 px-4 py-1.5 text-sm font-black text-[#FFD166]">
                          {getOptionGroupName(option, modifierGroups)}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <span className="text-base font-bold text-white/35">
                          #{option.id}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditOption(option)}
                            className="group relative grid h-10 w-10 place-items-center rounded-xl border border-fuchsia-300/30 bg-[#172124] text-fuchsia-300 transition duration-200 hover:scale-110 hover:bg-fuchsia-400/12 active:scale-95"
                            title="Edit option"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal("modifier option", option)}
                            className="group relative grid h-10 w-10 place-items-center rounded-xl border border-[#7F1D1D]/30 bg-[#172124] text-[#7F1D1D] transition duration-200 hover:scale-110 hover:bg-[#7F1D1D]/12 active:scale-95"
                            title="Delete option"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <CategoryModal
        isOpen={openCategoryModal}
        onClose={handleCloseCategoryModal}
        onSave={handleSaveCategory}
        category={editingCategory}
        errorMessage={categoryError}
        onClearError={() => setCategoryError("")}
        isSaving={savingCategory}
      />
      <ModifierGroupModal
        isOpen={openGroupModal}
        onClose={handleCloseGroupModal}
        onSave={handleSaveGroup}
        group={editingGroup}
        isSaving={savingGroup}
      />
      <ModifierOptionModal
        isOpen={openOptionModal}
        onClose={handleCloseOptionModal}
        onSave={handleSaveOption}
        option={editingOption}
        groups={modifierGroups}
        ingredients={ingredients}
        isSaving={savingOption}
      />
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        itemName={deleteTarget?.item?.name ?? ""}
        itemType={deleteTarget?.type ?? "item"}
        isDeleting={isDeleting}
        errorMessage={deleteError}
        isLight={isLight}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
