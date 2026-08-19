import { useEffect, useState } from "react";
import { AlertTriangle, Save, Tags, X } from "lucide-react";
import {
  TRANSLATION_MODE_AUTOMATIC,
  TRANSLATION_MODE_MANUAL,
  getInitialTranslationMode,
} from "../../utils/translationPayload";
import { useTranslation } from "../../utils/i18n";

function CategoryModal({
  isOpen,
  onClose,
  onSave,
  category,
  errorMessage = "",
  onClearError,
  isSaving = false,
}) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [translationMode, setTranslationMode] = useState(TRANSLATION_MODE_AUTOMATIC);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const saving = isSaving || isSubmitting;

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTranslationMode(getInitialTranslationMode(category, ["name"]));
      setName(category?.name ?? "");
      setNameAr(category?.name_ar ?? "");
      setNameEn(category?.name_en ?? "");
      setIsActive(Boolean(Number(category?.is_active ?? category?.isActive ?? 1)));
    }
  }, [isOpen, category]);

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
        is_active: isActive ? 1 : 0,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop-enter fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="modal-panel-enter w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-[#182124] text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-[radial-gradient(circle_at_100%_0%,rgba(127,29,29,0.16),transparent_34%),rgba(255,255,255,0.03)] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-[#7F1D1D]/35 bg-[#7F1D1D]/12 text-[#7F1D1D]">
              <Tags size={19} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#FFD166]">
                تصنيف القائمة
              </p>
              <h2 className="text-xl font-black text-white">
                {category ? "تعديل التصنيف" : "إضافة تصنيف"}
              </h2>
            </div>
          </div>

          <button
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
                onClick={() => {
                  setTranslationMode(mode);
                  onClearError?.();
                }}
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
              {t("categoryName")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                onClearError?.();
              }}
              placeholder="بيتزا، برغر، مشروبات..."
              className={`w-full rounded-2xl border bg-[#0D1214] p-3 text-sm font-bold text-white outline-none transition duration-200 placeholder:text-white/30 hover:border-[#FFD166]/35 focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10 ${
                errorMessage ? "border-[#EF4444]/70" : "border-white/10"
              }`}
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
                  onChange={(e) => {
                    setNameAr(e.target.value);
                    onClearError?.();
                  }}
                  className={`w-full rounded-2xl border bg-[#0D1214] p-3 text-sm font-bold text-white outline-none transition duration-200 placeholder:text-white/30 hover:border-[#FFD166]/35 focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10 ${
                    errorMessage ? "border-[#EF4444]/70" : "border-white/10"
                  }`}
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
                  onChange={(e) => {
                    setNameEn(e.target.value);
                    onClearError?.();
                  }}
                  className={`w-full rounded-2xl border bg-[#0D1214] p-3 text-sm font-bold text-white outline-none transition duration-200 placeholder:text-white/30 hover:border-[#FFD166]/35 focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10 ${
                    errorMessage ? "border-[#EF4444]/70" : "border-white/10"
                  }`}
                  required
                  disabled={saving}
                />
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-start gap-2 rounded-2xl border border-[#EF4444]/35 bg-[#7F1D1D]/18 px-3 py-2.5 text-sm font-bold leading-5 text-[#FCA5A5]">
              <AlertTriangle size={17} className="mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#166534]/30 bg-[#166534]/10 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#166534]/55">
            <span>
              <span className="block text-sm font-black text-[#166534]">
                تصنيف نشط
              </span>
              <span className="text-sm text-white/45">
                إظهار هذا القسم ضمن تدفق القائمة المباشر.
              </span>
            </span>
            <input
              type="checkbox"
              checked={isActive}
              onChange={() => setIsActive(!isActive)}
              className="h-5 w-5 accent-[#7F1D1D]"
              disabled={saving}
            />
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
              {saving ? `${t("pleaseWait")}...` : category ? t("update") : t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CategoryModal;

