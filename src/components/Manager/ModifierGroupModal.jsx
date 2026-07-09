import { useEffect, useState } from "react";
import { Layers3, Save, X } from "lucide-react";

function ModifierGroupModal({ isOpen, onClose, onSave, group, isSaving = false }) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const saving = isSaving || isSubmitting;

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(group?.name ?? "");
    }
  }, [isOpen, group]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    setIsSubmitting(true);

    try {
      await onSave({ name });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#7F1D1D] text-white">
              <Layers3 size={19} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-[#7F1D1D]">
                Modifier group
              </p>
              <h2 className="text-xl font-black text-stone-950">
                {group ? "Edit Group" : "Add Group"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={saving ? undefined : onClose}
            disabled={saving}
            className="grid h-9 w-9 place-items-center rounded-lg text-stone-500 transition duration-200 hover:scale-110 hover:bg-white hover:text-stone-950 hover:shadow-sm active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div>
            <label className="mb-2 block text-sm font-black text-stone-700">
              Group Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Size, sauce, bread type..."
              className="w-full rounded-lg border border-stone-200 bg-white p-3 text-sm font-semibold outline-none transition duration-200 hover:border-[#7F1D1D]/30 focus:scale-[1.01] focus:border-[#7F1D1D] focus:ring-4 focus:ring-[#7F1D1D]/10"
              required
              disabled={saving}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-stone-100 pt-5">
            <button
              type="button"
              onClick={saving ? undefined : onClose}
              disabled={saving}
              className="rounded-lg border border-stone-200 px-5 py-3 text-sm font-black text-stone-600 transition duration-200 hover:-translate-y-0.5 hover:bg-stone-50 hover:text-stone-950 hover:shadow-sm active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="group inline-flex items-center gap-2 rounded-lg bg-[#7F1D1D] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#7F1D1D]/20 transition duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-[#651717] hover:shadow-xl active:translate-y-0 active:scale-100 disabled:cursor-wait disabled:bg-[#CBB9B1] disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:scale-100"
            >
              <Save size={17} className="transition duration-200 group-hover:-rotate-6" />
              {saving ? "Please wait..." : group ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModifierGroupModal;
