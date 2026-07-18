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
    <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="modal-panel-enter w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-[#182124] text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-[radial-gradient(circle_at_100%_0%,rgba(255,209,102,0.16),transparent_34%),rgba(255,255,255,0.03)] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-[#FFD166]/35 bg-[#FFD166]/12 text-[#FFD166]">
              <Layers3 size={19} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#FFD166]">
                Modifier group
              </p>
              <h2 className="text-xl font-black text-white">
                {group ? "Edit Group" : "Add Group"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={saving ? undefined : onClose}
            disabled={saving}
            className="grid h-9 w-9 place-items-center rounded-xl text-white/55 transition duration-200 hover:scale-110 hover:bg-white/[0.06] hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
              Group Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Size, sauce, bread type..."
              className="w-full rounded-2xl border border-white/10 bg-[#0D1214] p-3 text-sm font-bold text-white outline-none transition duration-200 placeholder:text-white/30 hover:border-[#FFD166]/35 focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10"
              required
              disabled={saving}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-white/[0.08] pt-5">
            <button
              type="button"
              onClick={saving ? undefined : onClose}
              disabled={saving}
              className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-black text-white/65 transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.05] hover:text-white active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="group inline-flex items-center gap-2 rounded-2xl bg-[#7F1D1D] px-5 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(127,29,29,0.28)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#681718] active:translate-y-0 disabled:cursor-wait disabled:bg-[#7F1D1D]/45 disabled:shadow-none disabled:hover:translate-y-0"
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
