import { useEffect, useState } from "react";
import { Save, Tags, X } from "lucide-react";

function CategoryModal({ isOpen, onClose, onSave }) {
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setIsActive(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    onSave({
      name,
      is_active: isActive ? 1 : 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#7F1D1D] text-white">
              <Tags size={19} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-[#7F1D1D]">
                Menu category
              </p>
              <h2 className="text-xl font-black text-stone-950">
                Add Category
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

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div>
            <label className="mb-2 block text-sm font-black text-stone-700">
              Category Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pizza, Burgers, Drinks..."
              className="w-full rounded-lg border border-stone-200 bg-white p-3 text-sm font-semibold outline-none transition duration-200 hover:border-[#7F1D1D]/30 focus:scale-[1.01] focus:border-[#7F1D1D] focus:ring-4 focus:ring-[#7F1D1D]/10"
              required
            />
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-white hover:shadow-sm">
            <span>
              <span className="block text-sm font-black text-emerald-950">
                Active category
              </span>
              <span className="text-sm text-emerald-700">
                Show this section in the live menu flow.
              </span>
            </span>
            <input
              type="checkbox"
              checked={isActive}
              onChange={() => setIsActive(!isActive)}
              className="h-5 w-5 accent-[#7F1D1D]"
            />
          </label>

          <div className="flex justify-end gap-3 border-t border-stone-100 pt-5">
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
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CategoryModal;

