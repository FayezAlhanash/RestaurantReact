import { useEffect, useState } from "react";
import { PackagePlus, Save, X } from "lucide-react";
import {
  nonNegativeNumberInputProps,
  toNonNegativeNumberValue,
} from "../../utils/nonNegativeNumberInput";

const units = ["kg", "g", "L", "ml", "pcs"];

export default function IngredientModal({
  isOpen,
  onClose,
  onSave,
  ingredient,
  isSaving = false,
}) {
  const [form, setForm] = useState({
    name: "",
    current_quantity: "",
    min_quantity: "",
    unit: "",
  });

  useEffect(() => {
    if (!isOpen) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      name: ingredient?.name ?? "",
      current_quantity: ingredient?.current_quantity ?? "",
      min_quantity: ingredient?.min_quantity ?? "",
      unit: ingredient?.unit ?? "",
    });
  }, [isOpen, ingredient]);

  if (!isOpen) return null;

  const handleChange = (event) => {
    const { name, type, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? toNonNegativeNumberValue(value) : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSave({
      id: ingredient?.id,
      name: form.name,
      unit: form.unit,
      current_quantity: Number(form.current_quantity || 0),
      min_quantity: Number(form.min_quantity || 0),
    });
  };

  const fieldClass =
    "w-full rounded-lg border border-sky-200 bg-white p-3 text-sm font-semibold outline-none transition duration-200 hover:border-sky-400 focus:scale-[1.01] focus:border-sky-600 focus:ring-4 focus:ring-sky-100";

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-amber-200 bg-gradient-to-r from-[#7F1D1D] via-[#B93737] to-amber-500 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/20 text-white shadow-lg shadow-black/10">
              <PackagePlus size={20} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-amber-100">
                Inventory ingredient
              </p>
              <h2 className="text-xl font-black text-white">
                {ingredient ? "Edit Ingredient" : "Add Ingredient"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-white transition duration-200 hover:scale-110 hover:bg-white hover:text-[#7F1D1D] hover:shadow-sm active:scale-95"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-gradient-to-b from-amber-50 to-white p-5">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-black text-stone-700">
                Ingredient Name
              </span>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className={fieldClass}
                placeholder="Tomato"
                required
              />
            </label>

            <label className="rounded-lg border border-sky-100 bg-sky-50/70 p-3">
              <span className="mb-2 block text-sm font-black text-stone-700">
                Current Quantity
              </span>
              <input
                type="number"
                {...nonNegativeNumberInputProps}
                step="0.01"
                name="current_quantity"
                value={form.current_quantity}
                onChange={handleChange}
                className={fieldClass}
                placeholder="0"
              />
            </label>

            <label className="rounded-lg border border-amber-100 bg-amber-50/80 p-3">
              <span className="mb-2 block text-sm font-black text-stone-700">
                Minimum Quantity
              </span>
              <input
                type="number"
                {...nonNegativeNumberInputProps}
                step="0.01"
                name="min_quantity"
                value={form.min_quantity}
                onChange={handleChange}
                className={fieldClass}
                placeholder="0"
              />
            </label>

            <label className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3 md:col-span-2">
              <span className="mb-2 block text-sm font-black text-stone-700">
                Unit
              </span>
              <select
                name="unit"
                value={form.unit}
                onChange={handleChange}
                className={fieldClass}
                required
              >
                <option value="">Select Unit</option>
                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-amber-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-stone-200 bg-white px-5 py-3 text-sm font-black text-stone-600 transition duration-200 hover:-translate-y-0.5 hover:bg-stone-50 hover:text-stone-950 hover:shadow-sm active:translate-y-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="group inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-200 transition duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-emerald-700 hover:shadow-xl active:translate-y-0 active:scale-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100"
            >
              <Save size={17} className="transition duration-200 group-hover:-rotate-6" />
              {ingredient ? "Update Ingredient" : "Save Ingredient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
