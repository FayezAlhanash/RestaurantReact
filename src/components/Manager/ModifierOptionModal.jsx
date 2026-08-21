import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ListTree, Save, X } from "lucide-react";
import {
  TRANSLATION_MODE_AUTOMATIC,
  TRANSLATION_MODE_MANUAL,
  getInitialTranslationMode,
} from "../../utils/translationPayload";
import { useTranslation } from "../../utils/i18n";

function CompactSelect({
  label,
  value,
  placeholder,
  emptyLabel,
  options,
  disabled,
  isLight = false,
  required = false,
  onChange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const selectedOption = options.find(
    (option) => String(option.value) === String(value)
  );

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  return (
    <div ref={wrapperRef} className="relative">
      <label
        className={`mb-2 block text-xs font-black uppercase tracking-[0.14em] ${
          isLight ? "text-[#7D6C64]" : "text-white/55"
        }`}
      >
        {label}
      </label>
      <input
        value={value}
        required={required}
        tabIndex={-1}
        onChange={() => {}}
        className="pointer-events-none absolute h-px w-px opacity-0"
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((current) => !current)}
        className={`flex h-12 w-full items-center justify-between gap-3 rounded-2xl border px-3.5 text-left text-sm font-bold outline-none transition duration-200 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-55 ${
          isLight
            ? "border-[#E6CFC2] bg-white text-[#241815] shadow-sm hover:border-[#D8A23A]/55 focus:border-[#D8A23A] focus:ring-[#D8A23A]/12"
            : "border-white/10 bg-[#0D1214] text-white hover:border-[#FFD166]/35 focus:border-[#FFD166]/70 focus:ring-[#FFD166]/10"
        }`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            selectedOption || value === ""
              ? isLight
                ? "text-[#241815]"
                : "text-white"
              : isLight
                ? "text-[#9B8A82]"
                : "text-white/35"
          }`}
        >
          {selectedOption?.label || (value === "" ? emptyLabel : placeholder)}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 transition duration-200 ${
            isLight ? "text-[#9A6400]" : "text-[#FFD166]"
          } ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`modal-panel-enter absolute left-0 right-0 top-[calc(100%+0.45rem)] z-[360] overflow-hidden rounded-2xl border p-1.5 shadow-[0_20px_46px_rgba(0,0,0,0.20)] ring-1 ${
            isLight
              ? "border-[#E6CFC2] bg-[#FFF9F2] ring-white/80"
              : "border-[#FFD166]/20 bg-[#11191C] ring-white/5"
          }`}
        >
          <div className="max-h-60 overflow-y-auto pr-1 [scrollbar-color:#FFD16666_transparent] [scrollbar-width:thin]">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-black transition duration-150 ${
                value === ""
                  ? "bg-[#FFD166] text-[#17120B]"
                  : isLight
                    ? "text-[#6D5147] hover:bg-[#F2E4DB] hover:text-[#241815]"
                    : "text-white/64 hover:bg-white/[0.07] hover:text-white"
              }`}
            >
              <span className="min-w-0 truncate">{emptyLabel}</span>
              {value === "" && <Check size={16} />}
            </button>

            {options.map((option) => {
              const isSelected = String(option.value) === String(value);

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-black transition duration-150 ${
                    isSelected
                      ? "bg-[#7F1D1D] text-white"
                      : isLight
                        ? "text-[#4F403A] hover:bg-[#F2E4DB] hover:text-[#241815]"
                        : "text-white/78 hover:bg-white/[0.07] hover:text-white"
                  }`}
                >
                  <span className="min-w-0 truncate">{option.label}</span>
                  {isSelected && <Check size={16} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ModifierOptionModal({
  isOpen,
  onClose,
  onSave,
  option,
  groups,
  ingredients = [],
  isSaving = false,
  isLight = false,
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    translation_mode: TRANSLATION_MODE_AUTOMATIC,
    modifier_group_id: "",
    name: "",
    name_ar: "",
    name_en: "",
    ingredient_id: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const saving = isSaving || isSubmitting;
  const selectedGroup = groups.find(
    (group) => String(group.id) === String(form.modifier_group_id)
  );
  const selectedGroupRestaurantId =
    selectedGroup?.restaurant_id ?? selectedGroup?.restaurant?.id ?? null;
  const visibleIngredients = selectedGroupRestaurantId
    ? ingredients.filter((ingredient) => {
        const ingredientRestaurantId =
          ingredient?.restaurant_id ?? ingredient?.restaurant?.id ?? null;

        return (
          !ingredientRestaurantId ||
          String(ingredientRestaurantId) === String(selectedGroupRestaurantId)
        );
      })
    : ingredients;
  const groupOptions = groups.map((group) => ({
    value: group.id,
    label: group.name,
  }));
  const ingredientOptions = visibleIngredients.map((ingredient) => ({
    value: ingredient.id,
    label: ingredient.name,
  }));

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        translation_mode: getInitialTranslationMode(option, ["name"]),
        modifier_group_id:
          option?.modifier_group_id ?? option?.modifier_group?.id ?? "",

        name: option?.name ?? "",
        name_ar: option?.name_ar ?? "",
        name_en: option?.name_en ?? "",

        ingredient_id:
          option?.ingredient_id ?? option?.ingredient?.id ?? "",
      });
    }
  }, [isOpen, option]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;
    if (!form.modifier_group_id) return;

    setIsSubmitting(true);

    try {
      await onSave({
        ...form,
        ingredient_id: form.ingredient_id || null,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass =
    "w-full rounded-2xl border border-white/10 bg-[#0D1214] p-3 text-sm font-bold text-white outline-none transition duration-200 placeholder:text-white/30 hover:border-[#FFD166]/35 focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10";

  return (
    <div className="modal-backdrop-enter fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="modal-panel-enter w-full max-w-md rounded-[28px] border border-white/10 bg-[#182124] text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-[radial-gradient(circle_at_100%_0%,rgba(217,70,239,0.16),transparent_34%),rgba(255,255,255,0.03)] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-fuchsia-300/35 bg-fuchsia-400/12 text-fuchsia-300">
              <ListTree size={19} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#FFD166]">
                {t("Modifier option")}
              </p>
              <h2 className="text-xl font-black text-white">
                {option ? t("editOption") : t("Add Option")}
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
          <CompactSelect
            label={t("modifierGroups")}
            value={form.modifier_group_id}
            placeholder={t("Choose group")}
            emptyLabel={groups.length ? t("Choose group") : t("noGroupsAvailable")}
            options={groupOptions}
            required
            disabled={saving || !groups.length}
            isLight={isLight}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                modifier_group_id: value,
                ingredient_id: "",
              }))
            }
          />

          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-[#0D1214] p-1">
            {[
              [TRANSLATION_MODE_AUTOMATIC, t("autoTranslate")],
              [TRANSLATION_MODE_MANUAL, t("arabicEnglish")],
            ].map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() =>
                  setForm((prev) => ({ ...prev, translation_mode: mode }))
                }
                className={`h-10 rounded-xl text-xs font-black transition ${
                  form.translation_mode === mode
                    ? "bg-[#FFD166] text-[#1B1510]"
                    : "text-white/55 hover:bg-white/[0.05] hover:text-white"
                }`}
                disabled={saving}
              >
                {label}
              </button>
            ))}
          </div>

          {form.translation_mode === TRANSLATION_MODE_AUTOMATIC ? (
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
              {t("Option name")}
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder={t("Brown bread, extra cheese, large...")}
              className={fieldClass}
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
                  value={form.name_ar}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name_ar: e.target.value }))
                  }
                  className={fieldClass}
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
                  value={form.name_en}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name_en: e.target.value }))
                  }
                  className={fieldClass}
                  required
                  disabled={saving}
                />
              </div>
            </div>
          )}
          <div>
            <CompactSelect
              label={t("foodIngredients")}
              value={form.ingredient_id}
              placeholder={t("Choose ingredient")}
              emptyLabel={t("noInventoryLink")}
              options={ingredientOptions}
              disabled={saving}
              isLight={isLight}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  ingredient_id: value,
                }))
              }
            />
            <p className="mt-2 text-xs font-semibold text-white/35">
              {t("Optional. Link this option to an inventory ingredient.")}
            </p>
          </div>
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
              {saving ? `${t("pleaseWait")}...` : option ? t("update") : t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModifierOptionModal;
