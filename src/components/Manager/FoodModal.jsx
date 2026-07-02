import { useEffect, useState } from "react";
import { ImagePlus, Save, UtensilsCrossed, X } from "lucide-react";

function FoodModal({ isOpen, onClose, onSave, categories, food }) {
  const [form, setForm] = useState({
    category_id: "",
    name: "",
    price: "",
    description: "",
    preparation_time: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
    is_diet: false,
    is_available: true,
    image: null,
  });

  useEffect(() => {
    if (isOpen) {
      setForm({
        category_id: food?.category_id ?? food?.category?.id ?? "",
        name: food?.name ?? "",
        price: food?.price ?? "",
        description: food?.description ?? "",
        preparation_time: food?.preparation_time ?? "",
        calories: food?.calories ?? "",
        protein: food?.protein ?? "",
        carbs: food?.carbs ?? "",
        fats: food?.fats ?? "",
        is_diet: Boolean(food?.is_diet),
        is_available: food?.is_available ?? true,
        image: null,
      });
    }
  }, [isOpen, food]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "file" ? files[0] : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  const fieldClass =
    "w-full rounded-lg border border-stone-200 bg-white p-3 text-sm font-semibold outline-none transition duration-200 hover:border-[#7F1D1D]/30 focus:scale-[1.01] focus:border-[#7F1D1D] focus:ring-4 focus:ring-[#7F1D1D]/10";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#7F1D1D] text-white">
              <UtensilsCrossed size={19} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-[#7F1D1D]">
                Food item
              </p>
              <h2 className="text-xl font-black text-stone-950">
                {food ? "Edit Food" : "Add Food"}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-stone-500 transition duration-200 hover:scale-110 hover:bg-white hover:text-stone-950 hover:shadow-sm active:scale-95"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[calc(92vh-73px)] overflow-y-auto p-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-black text-stone-700">
                Food Name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className={fieldClass}
                placeholder="Classic beef burger"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-stone-700">
                Category
              </label>
              <select
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                className={fieldClass}
                required
              >
                <option value="">Choose Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-stone-700">
                Price
              </label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                className={fieldClass}
                placeholder="12.50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-stone-700">
                Preparation Time
              </label>
              <input
                type="number"
                name="preparation_time"
                value={form.preparation_time}
                onChange={handleChange}
                className={fieldClass}
                placeholder="15"
              />
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-black text-stone-700">
              Description
            </label>
            <textarea
              rows={4}
              name="description"
              value={form.description}
              onChange={handleChange}
              className={fieldClass}
              placeholder="Short kitchen-friendly description..."
            />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {["calories", "protein", "carbs", "fats"].map((field) => (
              <input
                key={field}
                type="number"
                name={field}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                value={form[field]}
                onChange={handleChange}
                className={fieldClass}
              />
            ))}
          </div>

          <label className="mt-5 flex cursor-pointer items-center gap-4 rounded-lg border border-dashed border-sky-300 bg-sky-50 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-sky-400 hover:bg-white hover:shadow-sm">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-white text-sky-700 transition duration-200 group-hover:scale-110">
              <ImagePlus size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-black text-stone-900">
                Food Image
              </span>
              <span className="block truncate text-sm text-stone-500">
                {form.image?.name || (food?.image ? "Keep current photo" : "Upload a dish photo")}
              </span>
            </div>
            <input
              type="file"
              name="image"
              onChange={handleChange}
              className="hidden"
            />
          </label>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-white hover:shadow-sm">
              <span>
                <span className="block text-sm font-black text-emerald-950">
                  Available
                </span>
                <span className="text-sm text-emerald-700">
                  Cashiers can sell this item.
                </span>
              </span>
              <input
                type="checkbox"
                name="is_available"
                checked={form.is_available}
                onChange={handleChange}
                className="h-5 w-5 accent-[#7F1D1D]"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-lime-200 bg-lime-50 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-lime-300 hover:bg-white hover:shadow-sm">
              <span>
                <span className="block text-sm font-black text-lime-950">
                  Diet Food
                </span>
                <span className="text-sm text-lime-700">
                  Mark it for diet-friendly filtering.
                </span>
              </span>
              <input
                type="checkbox"
                name="is_diet"
                checked={form.is_diet}
                onChange={handleChange}
                className="h-5 w-5 accent-[#7F1D1D]"
              />
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-stone-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-stone-200 px-5 py-3 text-sm font-black text-stone-600 transition duration-200 hover:-translate-y-0.5 hover:bg-stone-50 hover:text-stone-950 hover:shadow-sm active:translate-y-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="group inline-flex items-center gap-2 rounded-lg bg-[#7F1D1D] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#7F1D1D]/20 transition duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-[#651717] hover:shadow-xl active:translate-y-0 active:scale-100"
            >
              <Save size={17} className="transition duration-200 group-hover:-rotate-6" />
              {food ? "Update Food" : "Save Food"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FoodModal;

