import { useEffect, useState } from "react";
import { ListTree, Save, X } from "lucide-react";

function ModifierOptionModal({ isOpen, onClose, onSave, option, groups, isSaving = false }) {
  const [form, setForm] = useState({
    modifier_group_id: "",
    name: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const saving = isSaving || isSubmitting;

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    setIsSubmitting(true);

    try {
      await onSave(form);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass =
    "w-full rounded-2xl border border-white/10 bg-[#0D1214] p-3 text-sm font-bold text-white outline-none transition duration-200 placeholder:text-white/30 hover:border-[#FFD166]/35 focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10";

  return (
    <div className="modal-backdrop-enter fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="modal-panel-enter w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-[#182124] text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-[radial-gradient(circle_at_100%_0%,rgba(217,70,239,0.16),transparent_34%),rgba(255,255,255,0.03)] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-fuchsia-300/35 bg-fuchsia-400/12 text-fuchsia-300">
              <ListTree size={19} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#FFD166]">
                Modifier option
              </p>
              <h2 className="text-xl font-black text-white">
                {option ? "Edit Option" : "Add Option"}
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
              disabled={saving}
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
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
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
              {saving ? "Please wait..." : option ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModifierOptionModal;
