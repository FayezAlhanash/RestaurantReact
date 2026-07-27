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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    "w-full rounded-2xl border border-white/10 bg-[#0D1214] p-3 text-sm font-bold text-white outline-none transition duration-200 placeholder:text-white/30 hover:border-[#FFD166]/35 focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10";

  return (
    <div className="modal-backdrop-enter fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="modal-panel-enter max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/10 bg-[#182124] text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-[radial-gradient(circle_at_100%_0%,rgba(127,29,29,0.16),transparent_34%),rgba(255,255,255,0.03)] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-[#7F1D1D]/35 bg-[#7F1D1D]/12 text-[#7F1D1D]">
              <UtensilsCrossed size={19} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#FFD166]">
                Food item
              </p>
              <h2 className="text-xl font-black text-white">
                {food ? "Edit Food" : "Add Food"}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl text-white/55 transition duration-200 hover:scale-110 hover:bg-white/[0.06] hover:text-white active:scale-95"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[calc(92vh-73px)] overflow-y-auto p-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
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
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
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
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
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
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
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
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
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

          <label className="mt-5 flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-sky-400/35 bg-sky-400/10 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-sky-400/60 hover:bg-sky-400/14">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-sky-400/30 bg-[#0D1214] text-sky-300 transition duration-200 group-hover:scale-110">
              <ImagePlus size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-black text-white">
                Food Image
              </span>
              <span className="block truncate text-sm text-white/45">
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
            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#166534]/30 bg-[#166534]/10 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#166534]/55">
              <span>
                <span className="block text-sm font-black text-[#166534]">
                  Available
                </span>
                <span className="text-sm text-white/45">
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

            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#FFD166]/25 bg-[#FFD166]/10 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#FFD166]/50">
              <span>
                <span className="block text-sm font-black text-[#FFD166]">
                  Diet Food
                </span>
                <span className="text-sm text-white/45">
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

          <div className="mt-6 flex justify-end gap-3 border-t border-white/[0.08] pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-black text-white/65 transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.05] hover:text-white active:translate-y-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="group inline-flex items-center gap-2 rounded-2xl bg-[#7F1D1D] px-5 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(127,29,29,0.28)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#681718] active:translate-y-0"
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

