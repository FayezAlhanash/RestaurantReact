import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  AlertTriangle,
  Edit3,
  ImagePlus,
  ListFilter,
  Loader2,
  PackagePlus,
  Plus,
  Salad,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import FoodModal from "./FoodModal";
import api from "../../API/axios";
import AttachIngredientModal from "./AttachIngredientModal";
import {
  filterCategoriesByRestaurant,
  getManagerRestaurantId,
  getResponseList,
} from "./managerHelpers";

const getFoodImageUrl = (image) => {
  if (!image) return "";
  if (image.startsWith("http://") || image.startsWith("https://")) return image;

  const cleanPath = image.replace(/^\/+/, "");

  if (cleanPath.startsWith("storage/")) {
    return `https://big4.me/${cleanPath}`;
  }

  return `https://big4.me/storage/${cleanPath}`;
};

export default function AddFood() {
  const { search = "" } = useOutletContext() ?? {};
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [openFoodModal, setOpenFoodModal] = useState(false);
  const [openIngredientModal, setOpenIngredientModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [editingFood, setEditingFood] = useState(null);
  const [deleteFood, setDeleteFood] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [isSavingFood, setIsSavingFood] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dietFilter, setDietFilter] = useState("all");

  const fetchCategories = async () => {
    try {
      const restaurantId = getManagerRestaurantId();
      const res = await api.get("/categories", {
        params: restaurantId ? { restaurant_id: restaurantId } : undefined,
      });
      const categoryList = getResponseList(res.data, ["categories"]);

      setCategories(filterCategoriesByRestaurant(categoryList, restaurantId));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFoods = async () => {
    try {
      const res = await api.get("/food");
      setFoods(res.data.food ?? []);
    } catch (err) {
      console.error(err.response?.data || err);
    }
  };

  const fetchIngredients = async () => {
    try {
      const restaurantId = getManagerRestaurantId() ?? 1;
      const res = await api.get(`/restaurants/${restaurantId}/ingredients`);

      setIngredients(getResponseList(res.data, ["ingredients"]));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAttachIngredients = async (recipe) => {
    try {
      console.log(recipe);
      setOpenIngredientModal(false);
    } catch (err) {
      console.error(err.response?.data || err);
    }
  };

  const handleSaveFood = async (food) => {
    const isEditing = Boolean(editingFood);

    try {
      setIsSavingFood(true);
      const formData = new FormData();

      formData.append("category_id", food.category_id);
      formData.append("name", food.name);
      formData.append("price", food.price);
      formData.append("description", food.description);
      formData.append("preparation_time", food.preparation_time);
      formData.append("calories", food.calories);
      formData.append("protein", food.protein);
      formData.append("carbs", food.carbs);
      formData.append("fats", food.fats);
      formData.append("is_diet", food.is_diet ? 1 : 0);
      formData.append("is_available", food.is_available ? 1 : 0);

      if (food.image) {
        formData.append("image", food.image);
      }

      const response = isEditing
        ? await api.post(`/food/${editingFood.id}`, formData)
        : await api.post("/food", formData);

      await fetchFoods();

      setSelectedFood(response.data.food ?? response.data);
      setEditingFood(null);
      setOpenFoodModal(false);

      if (!isEditing) {
        setOpenIngredientModal(true);
      }
    } catch (err) {
      console.error(err.response?.data || err);
    } finally {
      setIsSavingFood(false);
    }
  };

  const handleOpenAddFood = () => {
    setEditingFood(null);
    setOpenFoodModal(true);
  };

  const handleOpenEditFood = (food) => {
    setEditingFood(food);
    setOpenFoodModal(true);
  };

  const handleCloseFoodModal = () => {
    setOpenFoodModal(false);
    setEditingFood(null);
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
    fetchCategories();
    fetchFoods();
    fetchIngredients();
  }, []);

  const availableCount = foods.filter((food) => food.is_available).length;
  const dietCount = foods.filter((food) => food.is_diet).length;
  const categoryFilterOptions = [
    { id: "all", label: "All" },
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

  const clearFilters = () => {
    setCategoryFilter("all");
    setStatusFilter("all");
    setDietFilter("all");
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-[#7F1D1D]">
            Food Library
          </p>
          <h1 className="mt-2 text-3xl font-black text-stone-950">
            Manage dishes and recipes
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-500">
            Add dishes, connect them to categories, keep pricing visible, and
            prepare recipe ingredients right after creation.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md">
            <p className="text-xs font-black uppercase text-sky-700">Total</p>
            <strong className="mt-3 block text-3xl font-black text-sky-950">
              {foods.length}
            </strong>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
            <p className="text-xs font-black uppercase text-emerald-700">
              Available
            </p>
            <strong className="mt-3 block text-3xl font-black text-emerald-950">
              {availableCount}
            </strong>
          </div>
          <div className="rounded-lg border border-lime-200 bg-lime-50 p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-lime-300 hover:shadow-md">
            <p className="text-xs font-black uppercase text-lime-700">Diet</p>
            <strong className="mt-3 block text-3xl font-black text-lime-950">
              {dietCount}
            </strong>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-stone-200 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-[#f4e7dc] text-[#7F1D1D] transition duration-200 hover:scale-110 hover:bg-[#7F1D1D] hover:text-white">
              <UtensilsCrossed size={23} />
            </div>
            <div>
            <p className="text-sm font-bold text-stone-500">
                {normalizedSearch
                  ? `${filteredFoods.length} result${filteredFoods.length === 1 ? "" : "s"} for "${search}"`
                  : "Dishes ready for the menu"}
              </p>
              <h2 className="text-2xl font-black text-stone-950">Foods</h2>
            </div>
          </div>

          <button
            onClick={handleOpenAddFood}
            className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#7F1D1D] px-4 py-3 text-sm font-black text-white shadow-lg shadow-[#7F1D1D]/20 transition duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-[#651717] hover:shadow-xl active:translate-y-0 active:scale-100"
          >
            <Plus size={18} className="transition duration-200 group-hover:rotate-90" />
            Add Food
          </button>
        </div>

        <div className="space-y-4 border-b border-stone-200 bg-gradient-to-r from-sky-50 via-white to-lime-50 p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-2 text-sm font-black text-stone-800">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-100 text-sky-700">
                <ListFilter size={18} />
              </div>
              Filters
            </div>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="w-fit rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-black text-stone-600 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:text-stone-950 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
            >
              Clear filters
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-wide text-sky-700">
              Category
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categoryFilterOptions.map((option) => {
                const isActive = categoryFilter === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setCategoryFilter(option.id)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-sm font-black shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${
                      isActive
                        ? "border-sky-500 bg-sky-600 text-white shadow-sky-200"
                        : "border-sky-200 bg-white text-sky-800 hover:border-sky-300 hover:bg-sky-50"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                Availability
              </p>
              <div className="grid gap-2 rounded-lg border border-emerald-200 bg-white p-1 shadow-sm sm:grid-cols-3">
                {[
                  { id: "all", label: "All" },
                  { id: "available", label: "Available" },
                  { id: "unavailable", label: "Unavailable" },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setStatusFilter(option.id)}
                    className={`rounded-md px-3 py-2 text-sm font-black transition duration-200 hover:scale-[1.02] active:scale-95 ${
                      statusFilter === option.id
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                        : "text-emerald-800 hover:bg-emerald-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-wide text-lime-700">
                Type
              </p>
              <div className="grid gap-2 rounded-lg border border-lime-200 bg-white p-1 shadow-sm sm:grid-cols-3">
                {[
                  { id: "all", label: "All" },
                  { id: "diet", label: "Diet" },
                  { id: "regular", label: "Regular" },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setDietFilter(option.id)}
                    className={`rounded-md px-3 py-2 text-sm font-black transition duration-200 hover:scale-[1.02] active:scale-95 ${
                      dietFilter === option.id
                        ? "bg-lime-600 text-white shadow-md shadow-lime-200"
                        : "text-lime-800 hover:bg-lime-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-5">
          {filteredFoods.length === 0 ? (
            <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-5 py-16 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-[#f4e7dc] text-[#7F1D1D]">
                <PackagePlus size={24} />
              </div>
              <h3 className="mt-4 text-lg font-black text-stone-950">
                {normalizedSearch ? "No matching foods" : "No foods found"}
              </h3>
              <p className="mt-2 text-sm text-stone-500">
                {normalizedSearch
                  ? "Try another food name, category, status, description, or filter."
                  : "Add the first dish and then attach its ingredients."}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {filteredFoods.map((food) => {
                const imageUrl = getFoodImageUrl(food.image);

                return (
                  <article
                    key={food.id}
                    className="group overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#7F1D1D]/25 hover:shadow-xl"
                  >
                    <div className="relative h-36 overflow-hidden bg-stone-100">
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
                        className={`grid h-full w-full place-items-center bg-gradient-to-br from-stone-100 to-stone-200 text-stone-400 ${
                          imageUrl ? "hidden" : ""
                        }`}
                      >
                        <ImagePlus size={28} />
                      </div>

                      <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black backdrop-blur ${
                            food.is_available
                              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                              : "bg-rose-500 text-white shadow-lg shadow-rose-500/25"
                          }`}
                        >
                          {food.is_available ? "Available" : "Unavailable"}
                        </span>
                        {food.is_diet && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-lime-500 px-3 py-1 text-xs font-black text-white shadow-lg shadow-lime-500/25">
                            <Salad size={13} />
                            Diet
                          </span>
                        )}
                      </div>

                      <div className="absolute right-3 top-3 flex gap-2 opacity-100 transition duration-200 md:opacity-0 md:group-hover:opacity-100">
                        <button
                          onClick={() => handleOpenEditFood(food)}
                          title="Edit food"
                          className="grid h-10 w-10 place-items-center rounded-lg bg-white/95 text-amber-700 shadow-lg backdrop-blur transition duration-200 hover:scale-110 hover:bg-amber-50 active:scale-95"
                        >
                          <Edit3 size={17} />
                        </button>
                        <button
                          onClick={() => setDeleteFood(food)}
                          title="Delete food"
                          className="grid h-10 w-10 place-items-center rounded-lg bg-white/95 text-rose-600 shadow-lg backdrop-blur transition duration-200 hover:scale-110 hover:bg-rose-50 active:scale-95"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 p-3">
                      <div>
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <h3 className="text-base font-black leading-tight text-stone-950">
                            {food.name}
                          </h3>
                          <span className="shrink-0 rounded-full bg-sky-50 px-3 py-1 text-sm font-black text-sky-800">
                            ${food.price}
                          </span>
                        </div>
                        <p className="line-clamp-2 min-h-[38px] text-xs leading-5 text-stone-500">
                          {food.description || "No description"}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-stone-50 p-3">
                          <p className="text-[11px] font-black uppercase text-stone-400">
                            Category
                          </p>
                          <p className="mt-1 truncate text-xs font-black text-stone-800">
                            {food.category?.name ?? "-"}
                          </p>
                        </div>
                        <div className="rounded-lg bg-amber-50 p-3">
                          <p className="text-[11px] font-black uppercase text-amber-600">
                            Prep
                          </p>
                          <p className="mt-1 text-xs font-black text-amber-900">
                            {food.preparation_time
                              ? `${food.preparation_time} min`
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
      />
      <AttachIngredientModal
        isOpen={openIngredientModal}
        onClose={() => setOpenIngredientModal(false)}
        food={selectedFood}
        ingredients={ingredients}
        onSave={handleAttachIngredients}
      />

      {deleteFood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-rose-50 text-rose-600">
                <AlertTriangle size={24} />
              </div>

              <div>
                <h3 className="text-xl font-black text-stone-950">
                  Delete food?
                </h3>
                <p className="mt-2 text-sm leading-6 text-stone-500">
                  Are you sure you want to delete{" "}
                  <span className="font-black text-stone-900">
                    {deleteFood.name}
                  </span>
                  ? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteFood(null)}
                className="rounded-lg border border-stone-200 px-5 py-3 text-sm font-black text-stone-600 transition duration-200 hover:-translate-y-0.5 hover:border-stone-300 hover:bg-stone-50 hover:text-stone-950 hover:shadow-sm active:translate-y-0"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteFood}
                className="group inline-flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-rose-600/20 transition duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-rose-700 hover:shadow-xl hover:shadow-rose-600/25 active:translate-y-0 active:scale-100"
              >
                <Trash2
                  size={17}
                  className="transition duration-200 group-hover:rotate-6"
                />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isSavingFood && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-lg border border-white/10 bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-[#7F1D1D] text-white shadow-lg shadow-[#7F1D1D]/25">
              <Loader2 size={28} className="animate-spin" />
            </div>
            <h3 className="mt-4 text-xl font-black text-stone-950">
              Please wait
            </h3>
            <p className="mt-2 text-sm leading-6 text-stone-500">
              Saving the food item and preparing ingredients setup...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

