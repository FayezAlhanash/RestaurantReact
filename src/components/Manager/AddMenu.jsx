import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  CheckCircle2,
  Edit3,
  Layers3,
  Link,
  ListTree,
  Plus,
  Tags,
  Trash2,
  Unlink,
} from "lucide-react";
import CategoryModal from "./CategoryModal";
import ModifierGroupModal from "./ModifierGroupModal";
import ModifierOptionModal from "./ModifierOptionModal";
import api from "../../API/axios";
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

const getOptionGroupId = (option) =>
  option?.modifier_group_id ?? option?.modifier_group?.id ?? option?.group?.id;

const getOptionGroupName = (option, groups) => {
  const groupId = getOptionGroupId(option);
  const group = groups.find((item) => String(item.id) === String(groupId));

  return option?.modifier_group?.name ?? option?.group?.name ?? group?.name ?? "-";
};

export default function AddMenu() {
  const { search = "" } = useOutletContext() ?? {};
  const [activeTab, setActiveTab] = useState("categories");
  const [openCategoryModal, setOpenCategoryModal] = useState(false);
  const [openGroupModal, setOpenGroupModal] = useState(false);
  const [openOptionModal, setOpenOptionModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingOption, setEditingOption] = useState(null);
  const [categories, setCategories] = useState([]);
  const [modifierGroups, setModifierGroups] = useState([]);
  const [modifierOptions, setModifierOptions] = useState([]);
  const [foods, setFoods] = useState([]);
  const [foodSelections, setFoodSelections] = useState({});

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
      const restaurantId = await ensureManagerRestaurantId();
      const res = await api.get("/modifier-groups", {
        params: { restaurant_id: restaurantId },
      });

      setModifierGroups(
        getResponseList(res.data, [
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
      const restaurantId = await ensureManagerRestaurantId();
      const res = await api.get("/food", {
        params: { restaurant_id: restaurantId },
      });

      setFoods(getResponseList(res.data, ["food", "foods"]));
    } catch (err) {
      console.error(err.response?.data || err);
    }
  };

  const fetchModifierOptions = async () => {
    try {
      const restaurantId = await ensureManagerRestaurantId();
      const res = await api.get("/modifier-options", {
        params: { restaurant_id: restaurantId },
      });

      setModifierOptions(
        getResponseList(res.data, [
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
    try {
      const restaurantId = await ensureManagerRestaurantId();
      const formData = new FormData();

      formData.append("restaurant_id", restaurantId);
      formData.append("name", data.name);
      formData.append("is_active", data.is_active);

      await api.post("/categories", formData);
      await fetchCategories();
      setOpenCategoryModal(false);
    } catch (err) {
      console.error(err.response?.data || err);
    }
  };

  const handleSaveGroup = async (data) => {
    try {
      const restaurantId = await ensureManagerRestaurantId();
      const formData = new FormData();

      formData.append("restaurant_id", restaurantId);
      formData.append("name", data.name);

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
    }
  };

  const handleDeleteGroup = async (group) => {
    if (!window.confirm(`Delete "${group.name}"?`)) return;

    try {
      await api.delete(`/modifier-groups/${group.id}`);
      await fetchModifierGroups();
    } catch (err) {
      console.error(err.response?.data || err);
    }
  };

  const handleAttachGroupToFood = async (group) => {
    const foodId = foodSelections[group.id];

    if (!foodId) return;

    try {
      const formData = new FormData();
      formData.append("food_id", foodId);

      await api.post(`/modifier-groups/${group.id}/foods`, formData);
      setFoodSelections((prev) => ({ ...prev, [group.id]: "" }));
      await fetchModifierGroups();
    } catch (err) {
      console.error(err.response?.data || err);
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

  const handleOpenEditGroup = (group) => {
    setEditingGroup(group);
    setOpenGroupModal(true);
  };

  const handleCloseGroupModal = () => {
    setEditingGroup(null);
    setOpenGroupModal(false);
  };

  const handleSaveOption = async (data) => {
    try {
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
    }
  };

  const handleDeleteOption = async (option) => {
    if (!window.confirm(`Delete "${option.name}"?`)) return;

    try {
      await api.delete(`/modifier-options/${option.id}`);
      await fetchModifierOptions();
    } catch (err) {
      console.error(err.response?.data || err);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCategories();
    fetchModifierGroups();
    fetchModifierOptions();
    fetchFoods();
  }, []);

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
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-[#7F1D1D]">
            Menu Builder
          </p>
          <h1 className="mt-2 text-3xl font-black text-stone-950">
            Shape the restaurant menu
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-500">
            Manage categories, modifier groups, and the foods each group belongs
            to from one workspace.
          </p>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
          <p className="text-sm font-bold text-emerald-700">Live setup</p>
          <div className="mt-3 flex items-end justify-between">
            <strong className="text-4xl font-black text-emerald-950">
              {activeTab === "groups"
                ? modifierGroups.length
                : activeTab === "options"
                  ? modifierOptions.length
                  : categories.length}
            </strong>
            <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-black text-emerald-700">
              {activeTab === "groups"
                ? `${attachedFoodCount} food links`
                : activeTab === "options"
                  ? `${modifierGroups.length} groups`
                  : "Active setup"}
            </span>
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
              className={`group rounded-lg border p-4 text-left transition duration-200 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-md active:scale-[0.99] ${
                isActive
                  ? "border-[#7F1D1D] bg-[#7F1D1D] text-white shadow-lg shadow-[#7F1D1D]/15"
                  : `${tab.inactiveClass} shadow-sm`
              }`}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <Icon
                  size={21}
                  className={`transition duration-200 group-hover:scale-110 group-hover:-rotate-6 ${
                    isActive ? "text-white" : tab.iconClass
                  }`}
                />
                {isActive && <CheckCircle2 size={18} />}
              </div>
              <h2 className="font-black">{tab.label}</h2>
              <p
                className={`mt-2 text-sm leading-5 ${
                  isActive ? "text-white/75" : "text-stone-500"
                }`}
              >
                {tab.description}
              </p>
            </button>
          );
        })}
      </section>

      <section className="rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-stone-200 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-stone-500">
              {activeTab === "categories" && normalizedSearch
                ? `${filteredCategories.length} result${filteredCategories.length === 1 ? "" : "s"} for "${search}"`
                : activeTab === "groups" && normalizedSearch
                  ? `${filteredGroups.length} result${filteredGroups.length === 1 ? "" : "s"} for "${search}"`
                  : activeTab === "options" && normalizedSearch
                    ? `${filteredOptions.length} result${filteredOptions.length === 1 ? "" : "s"} for "${search}"`
                    : activeTabData.description}
            </p>
            <h2 className="mt-1 text-2xl font-black text-stone-950">
              {activeTabData.label}
            </h2>
          </div>

          {activeTab === "categories" && (
            <button
              onClick={() => setOpenCategoryModal(true)}
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#7F1D1D] px-4 py-3 text-sm font-black text-white shadow-lg shadow-[#7F1D1D]/20 transition duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-[#651717] hover:shadow-xl active:translate-y-0 active:scale-100"
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
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#7F1D1D] px-4 py-3 text-sm font-black text-white shadow-lg shadow-[#7F1D1D]/20 transition duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-[#651717] hover:shadow-xl active:translate-y-0 active:scale-100"
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
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#7F1D1D] px-4 py-3 text-sm font-black text-white shadow-lg shadow-[#7F1D1D]/20 transition duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-[#651717] hover:shadow-xl active:translate-y-0 active:scale-100"
            >
              <Plus size={18} className="transition duration-200 group-hover:rotate-90" />
              Add Option
            </button>
          )}
        </div>

        {activeTab === "categories" && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead className="bg-stone-50 text-sm font-black uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-5 py-4 text-left">Name</th>
                  <th className="px-5 py-4 text-left">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100">
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-5 py-16 text-center">
                      <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-[#f4e7dc] text-[#7F1D1D]">
                        <Tags size={24} />
                      </div>
                      <h3 className="mt-4 text-lg font-black text-stone-950">
                        {normalizedSearch ? "No matching categories" : "No categories yet"}
                      </h3>
                      <p className="mt-2 text-sm text-stone-500">
                        {normalizedSearch
                          ? "Try another category name or status."
                          : "Start with the sections your cashier will use every day."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((category) => (
                    <tr key={category.id} className="transition duration-200 hover:bg-stone-50">
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-4">
                          <div className="grid h-12 w-12 place-items-center rounded-lg bg-[#f4e7dc] text-[#7F1D1D]">
                            <Tags size={21} />
                          </div>
                          <span className="text-lg font-black text-stone-900">{category.name}</span>
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <span
                          className={`inline-flex rounded-full px-4 py-1.5 text-sm font-black ${
                            category.is_active
                              ? "border border-emerald-200 bg-emerald-100 text-emerald-800"
                              : "border border-rose-200 bg-rose-100 text-rose-800"
                          }`}
                        >
                          {category.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex justify-end gap-2">
                          <button className="group relative grid h-9 w-9 place-items-center rounded-lg border border-stone-200 bg-white text-stone-500 shadow-sm transition duration-200 hover:scale-110 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 hover:shadow-md active:scale-95">
                            <Edit3 size={16} className="transition duration-200 group-hover:-rotate-6" />
                            <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md bg-stone-950 px-2 py-1 text-xs font-bold text-white opacity-0 shadow-lg transition duration-200 group-hover:opacity-100">
                              Edit
                            </span>
                          </button>
                          <button className="group relative grid h-9 w-9 place-items-center rounded-lg border border-stone-200 bg-white text-rose-500 shadow-sm transition duration-200 hover:scale-110 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 hover:shadow-md active:scale-95">
                            <Trash2 size={16} className="transition duration-200 group-hover:rotate-6" />
                            <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md bg-stone-950 px-2 py-1 text-xs font-bold text-white opacity-0 shadow-lg transition duration-200 group-hover:opacity-100">
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
              <thead className="bg-amber-50 text-sm font-black uppercase tracking-wide text-amber-700">
                <tr>
                  <th className="px-5 py-4 text-left">Group</th>
                  <th className="px-5 py-4 text-left">Linked foods</th>
                  <th className="px-5 py-4 text-left">Attach to food</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100">
                {filteredGroups.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-5 py-16 text-center">
                      <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-amber-100 text-amber-700">
                        <Layers3 size={24} />
                      </div>
                      <h3 className="mt-4 text-lg font-black text-stone-950">
                        {normalizedSearch ? "No matching groups" : "No modifier groups yet"}
                      </h3>
                      <p className="mt-2 text-sm text-stone-500">
                        {normalizedSearch
                          ? "Try another group or food name."
                          : "Add groups like size, sauce, bread type, or toppings."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredGroups.map((group) => {
                    const linkedFoods = getGroupFoods(group);
                    const linkedFoodIds = new Set(
                      linkedFoods.map((food) => String(food.id ?? food.food_id))
                    );
                    const availableFoods = foods.filter(
                      (food) => !linkedFoodIds.has(String(food.id))
                    );

                    return (
                      <tr key={group.id} className="align-top transition duration-200 hover:bg-stone-50">
                        <td className="px-5 py-5">
                          <div className="flex items-center gap-4">
                            <div className="grid h-12 w-12 place-items-center rounded-lg bg-amber-100 text-amber-700">
                              <Layers3 size={21} />
                            </div>
                            <div>
                              <p className="text-lg font-black text-stone-900">{group.name}</p>
                              <p className="text-sm font-bold text-stone-400">
                                ID #{group.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          {linkedFoods.length ? (
                            <div className="flex max-w-sm flex-wrap gap-2">
                              {linkedFoods.map((food) => (
                                <span
                                  key={food.id ?? food.food_id}
                                  className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-black text-sky-800"
                                >
                                  {food.name ?? `Food #${food.food_id}`}
                                  <button
                                    type="button"
                                    title="Remove from food"
                                    onClick={() =>
                                      handleRemoveGroupFromFood(
                                        group.id,
                                        food.id ?? food.food_id
                                      )
                                    }
                                    className="text-sky-500 transition hover:scale-125 hover:text-rose-600"
                                  >
                                    <Unlink size={13} />
                                  </button>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-base font-semibold text-stone-400">
                              Not attached yet
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex max-w-sm gap-2">
                            <select
                              value={foodSelections[group.id] ?? ""}
                              onChange={(e) =>
                                setFoodSelections((prev) => ({
                                  ...prev,
                                  [group.id]: e.target.value,
                                }))
                              }
                              className="min-w-0 flex-1 rounded-lg border border-stone-200 bg-white p-3 text-base font-semibold outline-none transition duration-200 hover:border-[#7F1D1D]/30 focus:border-[#7F1D1D] focus:ring-4 focus:ring-[#7F1D1D]/10"
                            >
                              <option value="">
                                {availableFoods.length ? "Choose food" : "All foods linked"}
                              </option>
                              {availableFoods.map((food) => (
                                <option key={food.id} value={food.id}>
                                  {food.name}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => handleAttachGroupToFood(group)}
                              disabled={!foodSelections[group.id]}
                              className="grid h-11 w-11 place-items-center rounded-lg bg-[#7F1D1D] text-white shadow-lg shadow-[#7F1D1D]/20 transition duration-200 hover:scale-110 hover:bg-[#651717] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                              title="Attach to food"
                            >
                              <Link size={17} />
                            </button>
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditGroup(group)}
                              className="group relative grid h-9 w-9 place-items-center rounded-lg border border-stone-200 bg-white text-stone-500 shadow-sm transition duration-200 hover:scale-110 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 hover:shadow-md active:scale-95"
                              title="Edit group"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteGroup(group)}
                              className="group relative grid h-9 w-9 place-items-center rounded-lg border border-stone-200 bg-white text-rose-500 shadow-sm transition duration-200 hover:scale-110 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 hover:shadow-md active:scale-95"
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
              <thead className="bg-fuchsia-50 text-sm font-black uppercase tracking-wide text-fuchsia-700">
                <tr>
                  <th className="px-5 py-4 text-left">Option</th>
                  <th className="px-5 py-4 text-left">Group</th>
                  <th className="px-5 py-4 text-left">Option ID</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100">
                {filteredOptions.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-5 py-16 text-center">
                      <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-fuchsia-100 text-fuchsia-700">
                        <ListTree size={24} />
                      </div>
                      <h3 className="mt-4 text-lg font-black text-stone-950">
                        {normalizedSearch ? "No matching options" : "No modifier options yet"}
                      </h3>
                      <p className="mt-2 text-sm text-stone-500">
                        {modifierGroups.length
                          ? "Add choices inside a modifier group."
                          : "Create a modifier group first, then add its choices."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredOptions.map((option) => (
                    <tr key={option.id} className="transition duration-200 hover:bg-stone-50">
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-4">
                          <div className="grid h-12 w-12 place-items-center rounded-lg bg-fuchsia-100 text-fuchsia-700">
                            <ListTree size={21} />
                          </div>
                          <span className="text-lg font-black text-stone-900">
                            {option.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-black text-amber-800">
                          {getOptionGroupName(option, modifierGroups)}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <span className="text-base font-bold text-stone-400">
                          #{option.id}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditOption(option)}
                            className="group relative grid h-9 w-9 place-items-center rounded-lg border border-stone-200 bg-white text-stone-500 shadow-sm transition duration-200 hover:scale-110 hover:border-fuchsia-300 hover:bg-fuchsia-50 hover:text-fuchsia-700 hover:shadow-md active:scale-95"
                            title="Edit option"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteOption(option)}
                            className="group relative grid h-9 w-9 place-items-center rounded-lg border border-stone-200 bg-white text-rose-500 shadow-sm transition duration-200 hover:scale-110 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 hover:shadow-md active:scale-95"
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
        onClose={() => setOpenCategoryModal(false)}
        onSave={handleSaveCategory}
      />
      <ModifierGroupModal
        isOpen={openGroupModal}
        onClose={handleCloseGroupModal}
        onSave={handleSaveGroup}
        group={editingGroup}
      />
      <ModifierOptionModal
        isOpen={openOptionModal}
        onClose={handleCloseOptionModal}
        onSave={handleSaveOption}
        option={editingOption}
        groups={modifierGroups}
      />
    </div>
  );
}
