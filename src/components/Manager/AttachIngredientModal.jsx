import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Plus, Save, Trash2, X } from "lucide-react";
import {
  nonNegativeNumberInputProps,
  toNonNegativeNumberValue,
} from "../../utils/nonNegativeNumberInput";

function IngredientPicker({ value, ingredients, getIngredientLabel, disabled, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef(null);
  const selectedIngredient = ingredients.find(
    (ingredient) => String(ingredient.id) === String(value)
  );

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!pickerRef.current?.contains(event.target)) setIsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  return (
    <div ref={pickerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((current) => !current)}
        className="flex h-12 w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0D1214] px-3.5 text-left text-sm font-black text-white outline-none transition hover:border-[#FFD166]/45 focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={selectedIngredient ? "truncate" : "truncate text-white/35"}>
          {selectedIngredient
            ? getIngredientLabel(selectedIngredient)
            : ingredients.length
              ? "Select ingredient"
              : "No ingredients available"}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-[#FFD166] transition ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.45rem)] z-[420] overflow-hidden rounded-2xl border border-[#FFD166]/25 bg-[#0D1214] p-1.5 shadow-[0_24px_58px_rgba(0,0,0,0.45)] ring-1 ring-white/5">
          <div className="max-h-64 overflow-y-auto pr-1 [scrollbar-color:#FFD16666_transparent] [scrollbar-width:thin]">
            {ingredients.map((ingredient) => {
              const isSelected = String(ingredient.id) === String(value);

              return (
                <button
                  key={ingredient.id}
                  type="button"
                  onClick={() => {
                    onChange(ingredient.id);
                    setIsOpen(false);
                  }}
                  className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-black transition ${
                    isSelected
                      ? "bg-[#FFD166] text-[#1B1510]"
                      : "text-white/75 hover:bg-white/[0.07] hover:text-white"
                  }`}
                >
                  <span className="min-w-0 truncate">{getIngredientLabel(ingredient)}</span>
                  {isSelected && <Check size={16} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AttachIngredientModal({
  isOpen,
  onClose,
  onSave,
  food,
  ingredients,
}) {
  const foodRestaurantId = food?.restaurant_id ?? food?.restaurantId ?? food?.restaurant?.id ?? null;
  const visibleIngredients = ingredients.filter((ingredient) => {
    const ingredientRestaurantId =
      ingredient?.restaurant_id ?? ingredient?.restaurantId ?? ingredient?.restaurant?.id ?? null;

    return (
      !foodRestaurantId ||
      !ingredientRestaurantId ||
      String(ingredientRestaurantId) === String(foodRestaurantId)
    );
  });

  const getIngredientLabel = (ingredient) =>
    ingredient?.name ||
    ingredient?.name_ar ||
    ingredient?.name_en ||
    ingredient?.title ||
    `Ingredient #${ingredient?.id}`;

  const [rows, setRows] = useState([{ ingredient_id: "", quantity: "" }]);

  useEffect(() => {
    if (!isOpen) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRows([{ ingredient_id: "", quantity: "" }]);
  }, [isOpen]);

  const addRow = () => setRows([...rows, { ingredient_id: "", quantity: "" }]);

  const removeRow = (index) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, rowIndex) => rowIndex !== index));
  };

  const handleChange = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index][field] = value;
    setRows(updatedRows);
  };

  const handleSubmit = () => {
    const recipe = rows
      .filter((row) => row.ingredient_id)
      .map((row) => ({
        ingredient_id: row.ingredient_id,
        quantity: Number(row.quantity || 0),
      }));

    onSave({ food_id: food?.id, ingredients: recipe });
  };

  if (!isOpen) return null;

  const inputClass =
    "h-12 w-full rounded-2xl border border-white/10 bg-[#0D1214] px-3.5 text-sm font-black text-white outline-none transition placeholder:text-white/30 hover:border-[#FFD166]/45 focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10";

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/72 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-visible rounded-[28px] border border-white/10 bg-[#182124] text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-[radial-gradient(circle_at_100%_0%,rgba(255,209,102,0.16),transparent_34%),rgba(255,255,255,0.03)] px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#FFD166]">
              Food ingredients
            </p>
            <h2 className="text-xl font-black text-white">Link Ingredients</h2>
            <p className="text-sm font-bold text-white/45">
              {food?.name || "New food item"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-xl text-white/55 transition hover:scale-110 hover:bg-white/[0.06] hover:text-white active:scale-95"
          >
            <X size={19} />
          </button>
        </div>

        <div className="p-5">
          <div className="overflow-visible rounded-2xl border border-white/10 bg-[#202B2F] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(120px,0.8fr)_72px] border-b border-white/[0.08] bg-[#0D1214]/45 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white/45">
              <span>Ingredient</span>
              <span>Quantity</span>
              <span className="text-right">Action</span>
            </div>

            <div className="divide-y divide-white/[0.07]">
              {rows.map((row, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[minmax(0,1.3fr)_minmax(120px,0.8fr)_72px] gap-3 p-3"
                >
                  <IngredientPicker
                    value={row.ingredient_id}
                    ingredients={visibleIngredients}
                    getIngredientLabel={getIngredientLabel}
                    disabled={!visibleIngredients.length}
                    onChange={(value) => handleChange(index, "ingredient_id", value)}
                  />

                  <input
                    type="number"
                    {...nonNegativeNumberInputProps}
                    step="0.01"
                    value={row.quantity}
                    onChange={(event) =>
                      handleChange(
                        index,
                        "quantity",
                        toNonNegativeNumberValue(event.target.value)
                      )
                    }
                    className={inputClass}
                    placeholder="2"
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="grid h-12 w-12 place-items-center rounded-2xl border border-[#7F1D1D]/30 bg-[#7F1D1D]/10 text-[#FCA5A5] transition hover:scale-110 hover:bg-[#7F1D1D]/18 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                      disabled={rows.length === 1}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!visibleIngredients.length && (
            <p className="mt-3 rounded-2xl border border-[#FFD166]/25 bg-[#FFD166]/10 px-4 py-3 text-sm font-black text-[#FFD166]">
              No ingredients are available for this restaurant.
            </p>
          )}

          <button
            type="button"
            onClick={addRow}
            className="group mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-white/70 transition hover:-translate-y-0.5 hover:border-[#FFD166]/35 hover:text-white active:translate-y-0"
          >
            <Plus size={17} className="transition group-hover:rotate-90" />
            Add Row
          </button>
        </div>

        <div className="flex justify-end gap-3 border-t border-white/[0.08] bg-[#0D1214]/45 p-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white/65 transition hover:-translate-y-0.5 hover:bg-white/[0.07] hover:text-white active:translate-y-0"
          >
            Later
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!visibleIngredients.length}
            className="group inline-flex items-center gap-2 rounded-2xl bg-[#7F1D1D] px-5 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(127,29,29,0.28)] transition hover:-translate-y-0.5 hover:bg-[#681718] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <Save size={17} className="transition group-hover:-rotate-6" />
            Save Links
          </button>
        </div>
      </div>
    </div>
  );
}
