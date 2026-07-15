import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  AlertTriangle,
  Link,
  Loader2,
  Package,
  Save,
  Search,
  Unlink,
  UtensilsCrossed,
} from "lucide-react";
import api from "../../API/axios";
import { ensureManagerRestaurantId, getResponseList } from "./managerHelpers";
import { getUserPermissions } from "../../utils/permissions";

const getFoodIngredientId = (item) =>
  item?.ingredient_id ?? item?.pivot?.ingredient_id ?? item?.id;

const getFoodIngredientQuantity = (item) =>
  item?.quantity ??
  item?.pivot?.quantity ??
  item?.food_ingredient?.quantity ??
  item?.foodIngredient?.quantity ??
  "";

export default function Ingredients() {
  const { search = "" } = useOutletContext() ?? {};
  const permissions = getUserPermissions();
  const canManageRecipes = permissions.includes("manage_recipes");
  const [ingredients, setIngredients] = useState([]);
  const [foods, setFoods] = useState([]);
  const [foodIngredients, setFoodIngredients] = useState([]);
  const [selectedFoodId, setSelectedFoodId] = useState("");
  const [selectedIngredientId, setSelectedIngredientId] = useState("");
  const [recipeQuantity, setRecipeQuantity] = useState("");
  const [isSavingRecipe, setIsSavingRecipe] = useState(false);
  const [loadingRecipe, setLoadingRecipe] = useState(false);

  const fetchIngredients = async () => {
    try {
      const restaurantId = await ensureManagerRestaurantId();
      const res = await api.get(`/restaurants/${restaurantId}/ingredients`);

      setIngredients(getResponseList(res.data, ["ingredients"]));
    } catch (error) {
      console.error(error.response?.data || error);
    }
  };

  const fetchFoods = async () => {
    try {
      const restaurantId = await ensureManagerRestaurantId();
      const res = await api.get("/food", {
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
      const restaurantId = await ensureManagerRestaurantId();
      const res = await api.get(
        `/restaurants/${restaurantId}/foods/${foodId}/ingredients`
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchIngredients();
    fetchFoods();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFoodIngredients(selectedFoodId);
    setSelectedIngredientId("");
    setRecipeQuantity("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFoodId]);

  const handleSaveRecipeIngredient = async () => {
    if (!canManageRecipes) return;

    if (!selectedFoodId || !selectedIngredientId || !recipeQuantity || isSavingRecipe) {
      return;
    }

    try {
      setIsSavingRecipe(true);
      const restaurantId = await ensureManagerRestaurantId();
      const isLinked = foodIngredients.some(
        (item) => String(getFoodIngredientId(item)) === String(selectedIngredientId)
      );

      if (isLinked) {
        await api.patch(
          `/restaurants/${restaurantId}/foods/${selectedFoodId}/ingredients/${selectedIngredientId}`,
          { quantity: Number(recipeQuantity) }
        );
      } else {
        const formData = new FormData();

        formData.append("ingredient_id", selectedIngredientId);
        formData.append("quantity", recipeQuantity);

        await api.post(
          `/restaurants/${restaurantId}/foods/${selectedFoodId}/ingredients`,
          formData
        );
      }

      await fetchFoodIngredients();
      setSelectedIngredientId("");
      setRecipeQuantity("");
    } catch (error) {
      console.error(error.response?.data || error);
    } finally {
      setIsSavingRecipe(false);
    }
  };

  const handleEditRecipeQuantity = async (ingredientId, quantity) => {
    if (!canManageRecipes) return;

    try {
      const restaurantId = await ensureManagerRestaurantId();

      await api.patch(
        `/restaurants/${restaurantId}/foods/${selectedFoodId}/ingredients/${ingredientId}`,
        { quantity: Number(quantity || 0) }
      );
      await fetchFoodIngredients();
    } catch (error) {
      console.error(error.response?.data || error);
    }
  };

  const handleDeleteRecipeIngredient = async (ingredientId) => {
    if (!canManageRecipes) return;

    try {
      const restaurantId = await ensureManagerRestaurantId();

      await api.delete(
        `/restaurants/${restaurantId}/foods/${selectedFoodId}/ingredients/${ingredientId}`
      );
      await fetchFoodIngredients();
    } catch (error) {
      console.error(error.response?.data || error);
    }
  };

  const normalizedSearch = search.trim().toLowerCase();
  const selectedFood = foods.find((food) => String(food.id) === String(selectedFoodId));
  const recipeIngredientIds = new Set(
    foodIngredients.map((item) => String(getFoodIngredientId(item)))
  );
  const filteredFoods = useMemo(() => {
    if (!normalizedSearch) return foods;

    return foods.filter((food) =>
      [food.name, food.category?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch))
    );
  }, [foods, normalizedSearch]);

  const fieldClass =
    "w-full rounded-lg border border-stone-200 bg-white p-3 text-sm font-semibold outline-none transition duration-200 hover:border-[#7F1D1D]/30 focus:border-[#7F1D1D] focus:ring-4 focus:ring-[#7F1D1D]/10";

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#f4e7dc] text-[#7F1D1D]">
              <Link size={22} />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-[#7F1D1D]">
                Food Ingredients
              </p>
              <h1 className="mt-1 text-3xl font-black text-stone-950">
                Link ingredients to foods
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
                Select a food item to view its ingredients. Recipe changes require
                manage_recipes permission.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
            <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
              <p className="text-xs font-black uppercase text-sky-700">Foods</p>
              <strong className="mt-2 block text-3xl font-black text-sky-950">
                {foods.length}
              </strong>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-black uppercase text-emerald-700">
                Ingredients
              </p>
              <strong className="mt-2 block text-3xl font-black text-emerald-950">
                {ingredients.length}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <div className="rounded-lg border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-200 bg-stone-50 p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-white text-[#7F1D1D] shadow-sm">
                <UtensilsCrossed size={21} />
              </div>
              <div>
                <p className="text-sm font-bold text-stone-500">
                  Recipe setup
                </p>
                <h2 className="text-xl font-black text-stone-950">
                  Attach existing ingredient
                </h2>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-5">
            {!canManageRecipes && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm font-bold text-amber-800">
                <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                You can view recipes, but you do not have permission to add or
                update ingredients.
              </div>
            )}

            {normalizedSearch && (
              <div className="flex items-center gap-2 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-sm font-bold text-sky-800">
                <Search size={16} />
                {filteredFoods.length} food result
                {filteredFoods.length === 1 ? "" : "s"}
              </div>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-black text-stone-700">
                Food
              </span>
              <select
                value={selectedFoodId}
                onChange={(event) => setSelectedFoodId(event.target.value)}
                className={fieldClass}
              >
                <option value="">
                  {filteredFoods.length ? "Select food" : "No foods found"}
                </option>
                {filteredFoods.map((food) => (
                  <option key={food.id} value={food.id}>
                    {food.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-black text-stone-700">
                Ingredient
              </span>
              <select
                value={selectedIngredientId}
                onChange={(event) => setSelectedIngredientId(event.target.value)}
                disabled={!selectedFoodId || !canManageRecipes}
                className={`${fieldClass} disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-400`}
              >
                <option value="">
                  {!selectedFoodId
                    ? "Select food first"
                    : canManageRecipes
                      ? "Select ingredient"
                      : "No permission to edit"}
                </option>
                {ingredients.map((ingredient) => (
                  <option key={ingredient.id} value={ingredient.id}>
                    {ingredient.name}
                    {recipeIngredientIds.has(String(ingredient.id)) ? " (linked)" : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-black text-stone-700">
                Quantity
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={recipeQuantity}
                onChange={(event) => setRecipeQuantity(event.target.value)}
                disabled={!selectedFoodId || !canManageRecipes}
                className={`${fieldClass} disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-400`}
                placeholder="2"
              />
            </label>

            <button
              type="button"
              onClick={handleSaveRecipeIngredient}
              disabled={
                !selectedFoodId ||
                !selectedIngredientId ||
                !recipeQuantity ||
                !canManageRecipes ||
                isSavingRecipe
              }
              className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#7F1D1D] px-4 py-3 text-sm font-black text-white shadow-lg shadow-[#7F1D1D]/15 transition duration-200 hover:-translate-y-0.5 hover:bg-[#651717] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isSavingRecipe ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}
              {canManageRecipes ? "Save Link" : "View only"}
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-stone-200 bg-stone-50 p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-white text-emerald-700 shadow-sm">
                <Package size={21} />
              </div>
              <div>
                <p className="text-sm font-bold text-stone-500">
                  {selectedFood ? selectedFood.name : "No food selected"}
                </p>
                <h2 className="text-2xl font-black text-stone-950">
                  Linked Ingredients
                </h2>
              </div>
            </div>
            {loadingRecipe && (
              <Loader2 size={22} className="animate-spin text-[#7F1D1D]" />
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-stone-100 text-sm font-black uppercase tracking-wide text-stone-600">
                <tr>
                  <th className="px-5 py-4 text-left">Ingredient</th>
                  <th className="px-5 py-4 text-left">Quantity</th>
                  <th className="px-5 py-4 text-left">Unit</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {!selectedFoodId || foodIngredients.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-5 py-16 text-center">
                      <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-[#f4e7dc] text-[#7F1D1D]">
                        <Link size={24} />
                      </div>
                      <h3 className="mt-4 text-lg font-black text-stone-950">
                        {selectedFoodId ? "No ingredients linked" : "Select a food"}
                      </h3>
                      <p className="mt-2 text-sm text-stone-500">
                        {selectedFoodId
                          ? "Attach the first ingredient to this food."
                          : "Choose a food to view and edit its linked ingredients."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  foodIngredients.map((ingredient) => {
                    const ingredientId = getFoodIngredientId(ingredient);
                    const unit =
                      ingredient.unit ??
                      ingredients.find((item) => String(item.id) === String(ingredientId))
                        ?.unit ??
                      "-";

                    return (
                      <tr
                        key={ingredientId}
                        className="transition duration-200 hover:bg-stone-50"
                      >
                        <td className="px-5 py-5">
                          <p className="text-lg font-black text-stone-900">
                            {ingredient.name}
                          </p>
                          <p className="text-sm font-bold text-stone-400">
                            ID #{ingredientId}
                          </p>
                        </td>
                        <td className="px-5 py-5">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={getFoodIngredientQuantity(ingredient)}
                            onBlur={(event) =>
                              handleEditRecipeQuantity(ingredientId, event.target.value)
                            }
                            readOnly={!canManageRecipes}
                            className={`w-28 rounded-lg border border-stone-200 px-3 py-2 text-sm font-black outline-none focus:border-[#7F1D1D] focus:ring-4 focus:ring-[#7F1D1D]/10 ${
                              canManageRecipes
                                ? "bg-white"
                                : "cursor-not-allowed bg-stone-50 text-stone-500"
                            }`}
                          />
                        </td>
                        <td className="px-5 py-5 text-base font-bold text-stone-500">
                          {unit}
                        </td>
                        <td className="px-5 py-5">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              title="Remove from food"
                              onClick={() => handleDeleteRecipeIngredient(ingredientId)}
                              disabled={!canManageRecipes}
                              className="grid h-9 w-9 place-items-center rounded-lg border border-stone-200 bg-white text-rose-500 shadow-sm transition duration-200 hover:scale-110 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:scale-100 disabled:hover:border-stone-200 disabled:hover:bg-white disabled:hover:text-rose-500"
                            >
                              <Unlink size={16} />
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
        </div>
      </section>
    </div>
  );
}
