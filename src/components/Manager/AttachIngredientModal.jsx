import { useEffect, useState } from "react";
import { Plus, Save, Trash2, X } from "lucide-react";
import {
  nonNegativeNumberInputProps,
  toNonNegativeNumberValue,
} from "../../utils/nonNegativeNumberInput";

export default function AttachIngredientModal({
  isOpen,
  onClose,
  onSave,
  food,
  ingredients,
}) {
  const [rows, setRows] = useState([
    {
      ingredient_id: "",
      quantity: "",
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRows([
        {
          ingredient_id: "",
          quantity: "",
        },
      ]);
    }
  }, [isOpen]);

  const addRow = () => {
    setRows([
      ...rows,
      {
        ingredient_id: "",
        quantity: "",
      },
    ]);
  };

  const removeRow = (index) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  const handleSubmit = () => {
    const recipe = rows
      .filter((row) => row.ingredient_id)
      .map((row) => ({
        ingredient_id: row.ingredient_id,
        quantity: Number(row.quantity || 0),
      }));

    onSave({
      food_id: food?.id,
      ingredients: recipe,
    });
  };

  if (!isOpen) return null;

  const fieldClass =
    "w-full rounded-lg border border-stone-200 bg-white p-3 text-sm font-semibold outline-none transition duration-200 hover:border-[#7F1D1D]/30 focus:scale-[1.01] focus:border-[#7F1D1D] focus:ring-4 focus:ring-[#7F1D1D]/10";

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[#7F1D1D]">
              Food ingredients
            </p>
            <h2 className="text-xl font-black text-stone-950">
              Link Ingredients
            </h2>
            <p className="text-sm font-semibold text-stone-500">
              {food?.name || "New food item"}
            </p>
          </div>

          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-stone-500 transition duration-200 hover:scale-110 hover:bg-white hover:text-stone-950 hover:shadow-sm active:scale-95"
          >
            <X size={19} />
          </button>
        </div>

        <div className="p-5">
          <div className="overflow-x-auto rounded-lg border border-stone-200 shadow-sm">
            <table className="w-full min-w-[420px]">
              <thead className="bg-stone-100 text-xs font-black uppercase tracking-wide text-stone-600">
                <tr>
                  <th className="px-4 py-3 text-left">Ingredient</th>
                  <th className="px-4 py-3 text-left">Quantity</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100">
                {rows.map((row, index) => (
                  <tr key={index} className="transition duration-200 hover:bg-stone-50">
                    <td className="p-3">
                      <select
                        value={row.ingredient_id}
                        onChange={(e) =>
                          handleChange(index, "ingredient_id", e.target.value)
                        }
                        className={fieldClass}
                      >
                        <option value="">
                          {ingredients.length
                            ? "Select Ingredient"
                            : "No ingredients available"}
                        </option>
                        {ingredients.map((ingredient) => (
                          <option key={ingredient.id} value={ingredient.id}>
                            {ingredient.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="p-3">
                      <input
                        type="number"
                        {...nonNegativeNumberInputProps}
                        step="0.01"
                        value={row.quantity}
                        onChange={(e) =>
                          handleChange(
                            index,
                            "quantity",
                            toNonNegativeNumberValue(e.target.value)
                          )
                        }
                        className={fieldClass}
                        placeholder="2"
                      />
                    </td>

                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        className="inline-grid h-10 w-10 place-items-center rounded-lg border border-stone-200 bg-white text-rose-500 transition duration-200 hover:scale-110 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                        disabled={rows.length === 1}
                      >
                        <Trash2 size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addRow}
            className="group mt-4 inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm font-black text-stone-700 transition duration-200 hover:-translate-y-0.5 hover:scale-105 hover:border-[#7F1D1D]/30 hover:text-stone-950 hover:shadow-md active:translate-y-0 active:scale-100"
          >
            <Plus size={17} className="transition duration-200 group-hover:rotate-90" />
            Add Row
          </button>
        </div>

        <div className="flex justify-end gap-3 border-t border-stone-200 bg-stone-50 p-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-200 bg-white px-5 py-3 text-sm font-black text-stone-600 transition duration-200 hover:-translate-y-0.5 hover:text-stone-950 hover:shadow-sm active:translate-y-0"
          >
            Later
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="group inline-flex items-center gap-2 rounded-lg bg-[#7F1D1D] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#7F1D1D]/20 transition duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-[#651717] hover:shadow-xl active:translate-y-0 active:scale-100"
          >
            <Save size={17} className="transition duration-200 group-hover:-rotate-6" />
            Save Links
          </button>
        </div>
      </div>
    </div>
  );
}

