import { useEffect, useState } from "react";
import { Layers3, Save, X } from "lucide-react";
import {
  TRANSLATION_MODE_AUTOMATIC,
  TRANSLATION_MODE_MANUAL,
  getInitialTranslationMode,
} from "../../utils/translationPayload";
import { useTranslation } from "../../utils/i18n";

function ModifierGroupModal({ isOpen, onClose, onSave, group, isSaving = false }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [translationMode, setTranslationMode] = useState(TRANSLATION_MODE_AUTOMATIC);
  const [isVariant, setIsVariant] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const saving = isSaving || isSubmitting;

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTranslationMode(getInitialTranslationMode(group, ["name"]));
      setName(group?.name ?? "");
      setNameAr(group?.name_ar ?? "");
      setNameEn(group?.name_en ?? "");
      setIsVariant(Boolean(Number(group?.is_variant ?? group?.isVariant ?? 0)));
    }
  }, [isOpen, group]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    setIsSubmitting(true);

    try {
      await onSave({
        translation_mode: translationMode,
        name,
        name_ar: nameAr,
        name_en: nameEn,
        is_variant: isVariant ? 1 : 0,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop-enter fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="modal-panel-enter w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-[#182124] text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-[radial-gradient(circle_at_100%_0%,rgba(255,209,102,0.16),transparent_34%),rgba(255,255,255,0.03)] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-[#FFD166]/35 bg-[#FFD166]/12 text-[#FFD166]">
              <Layers3 size={19} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#FFD166]">
                {t("Modifier group")}
              </p>
              <h2 className="text-xl font-black text-white">
                {group ? t("editGroup") : t("Add Group")}
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
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-[#0D1214] p-1">
            {[
              [TRANSLATION_MODE_AUTOMATIC, t("autoTranslate")],
              [TRANSLATION_MODE_MANUAL, t("arabicEnglish")],
            ].map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTranslationMode(mode)}
                className={`h-10 rounded-xl text-xs font-black transition ${
                  translationMode === mode
                    ? "bg-[#FFD166] text-[#1B1510]"
                    : "text-white/55 hover:bg-white/[0.05] hover:text-white"
                }`}
                disabled={saving}
              >
                {label}
              </button>
            ))}
          </div>

          {translationMode === TRANSLATION_MODE_AUTOMATIC ? (
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
              {t("groupName")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("Size, sauce, bread type...")}
              className="w-full rounded-2xl border border-white/10 bg-[#0D1214] p-3 text-sm font-bold text-white outline-none transition duration-200 placeholder:text-white/30 hover:border-[#FFD166]/35 focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10"
              required
              disabled={saving}
            />
          </div>
          ) : (
            <div className="grid gap-3">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                  {t("arabicName")}
                </label>
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#0D1214] p-3 text-sm font-bold text-white outline-none transition duration-200 placeholder:text-white/30 hover:border-[#FFD166]/35 focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10"
                  required
                  disabled={saving}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                  {t("englishName")}
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#0D1214] p-3 text-sm font-bold text-white outline-none transition duration-200 placeholder:text-white/30 hover:border-[#FFD166]/35 focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10"
                  required
                  disabled={saving}
                />
              </div>
            </div>
          )}

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#FFD166]/20 bg-[#0D1214] p-3 transition hover:border-[#FFD166]/45">
            <input
              type="checkbox"
              checked={isVariant}
              onChange={(e) => setIsVariant(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[#FFD166]"
              disabled={saving}
            />
            <span>
              <span className="block text-sm font-black text-[#FFD166]">
                {t("Variable pricing group")}
              </span>
              <span className="mt-1 block text-xs font-bold leading-5 text-white/50">
                {t("Used for sizes. Small uses the food price; larger options store only the added amount.")}
              </span>
            </span>
          </label>

          <div className="flex justify-end gap-3 border-t border-white/[0.08] pt-5">
            <button
              type="button"
              onClick={saving ? undefined : onClose}
              disabled={saving}
              className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-black text-white/65 transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.05] hover:text-white active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="group inline-flex items-center gap-2 rounded-2xl bg-[#7F1D1D] px-5 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(127,29,29,0.28)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#681718] active:translate-y-0 disabled:cursor-wait disabled:bg-[#7F1D1D]/45 disabled:shadow-none disabled:hover:translate-y-0"
            >
              <Save size={17} className="transition duration-200 group-hover:-rotate-6" />
              {saving ? `${t("pleaseWait")}...` : group ? t("update") : t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModifierGroupModal;
