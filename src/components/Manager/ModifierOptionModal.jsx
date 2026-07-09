import { useEffect, useState } from "react";
import { ListTree, Save, X } from "lucide-react";

function ModifierOptionModal({ isOpen, onClose, onSave, option, groups }) {
  const [form, setForm] = useState({
    modifier_group_id: "",
    name: "",
  });

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        modifier_group_id:
          option?.modifier_group_id ?? option?.modifier_group?.id ?? "",
        name: option?.name ?? "",
      });
    }
  }, [isOpen, option]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  const fieldClass =
    "w-full rounded-lg border border-stone-200 bg-white p-3 text-sm font-semibold outline-none transition duration-200 hover:border-[#7F1D1D]/30 focus:scale-[1.01] focus:border-[#7F1D1D] focus:ring-4 focus:ring-[#7F1D1D]/10";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#7F1D1D] text-white">
              <ListTree size={19} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-[#7F1D1D]">
                Modifier option
              </p>
              <h2 className="text-xl font-black text-stone-950">
                {option ? "Edit Option" : "Add Option"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-stone-500 transition duration-200 hover:scale-110 hover:bg-white hover:text-stone-950 hover:shadow-sm active:scale-95"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div>
            <label className="mb-2 block text-sm font-black text-stone-700">
              Modifier Group
            </label>
            <select
              value={form.modifier_group_id}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  modifier_group_id: e.target.value,
                }))
              }
              className={fieldClass}
              required
            >
              <option value="">
                {groups.length ? "Choose group" : "No groups available"}
              </option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-stone-700">
              Option Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Brown bread, extra cheese, large..."
              className={fieldClass}
              required
            />
          </div>

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
              {option ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModifierOptionModal;
