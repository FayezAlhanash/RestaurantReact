import { useEffect, useState } from "react";
import { ImagePlus, Save, UtensilsCrossed, X } from "lucide-react";
import {
  nonNegativeNumberInputProps,
  toNonNegativeNumberValue,
} from "../../utils/nonNegativeNumberInput";
import {
  TRANSLATION_MODE_AUTOMATIC,
  TRANSLATION_MODE_MANUAL,
  getInitialTranslationMode,
} from "../../utils/translationPayload";
import { useTranslation } from "../../utils/i18n";

const numericFields = new Set([
  "price",
  "preparation_time",
  "preparation_batch_size",
  "calories",
  "protein",
  "carbs",
  "fats",
]);

const toBooleanValue = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  const normalizedValue = String(value).trim().toLowerCase();

  if (["0", "false", "no", "off"].includes(normalizedValue)) return false;
  if (["1", "true", "yes", "on"].includes(normalizedValue)) return true;

  return Boolean(value);
};

function FoodModal({ isOpen, onClose, onSave, categories, food, errorMessage = "" }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    translation_mode: TRANSLATION_MODE_AUTOMATIC,
    category_id: "",
    name: "",
    name_ar: "",
    name_en: "",
    price: "",
    description: "",
    description_ar: "",
    description_en: "",
    preparation_time: "",
    preparation_batch_size: "",
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
        translation_mode: getInitialTranslationMode(food, ["name", "description"]),
        category_id: food?.category_id ?? food?.category?.id ?? "",
        name: food?.name ?? "",
        name_ar: food?.name_ar ?? "",
        name_en: food?.name_en ?? "",
        price: food?.price ?? "",
        description: food?.description ?? "",
        description_ar: food?.description_ar ?? "",
        description_en: food?.description_en ?? "",
        preparation_time: food?.preparation_time ?? "",
        preparation_batch_size: food?.preparation_batch_size ?? "",
        calories: food?.calories ?? "",
        protein: food?.protein ?? "",
        carbs: food?.carbs ?? "",
        fats: food?.fats ?? "",
        is_diet: toBooleanValue(food?.is_diet, false),
        is_available: toBooleanValue(
          food?.is_available ?? food?.available ?? food?.can_order,
          true
        ),
        image: null,
      });
    }
  }, [isOpen, food]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "file"
            ? files[0]
            : numericFields.has(name)
              ? toNonNegativeNumberValue(value)
              : value,
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
                {t("foodItem")}
              </p>
              <h2 className="text-xl font-black text-white">
                {food ? t("editFood") : t("addFood")}
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
            <div className="md:col-span-2 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-[#0D1214] p-1">
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
                >
                  {label}
                </button>
              ))}
            </div>

            {form.translation_mode === TRANSLATION_MODE_AUTOMATIC ? (
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                {t("foodName")}
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className={fieldClass}
                placeholder={t("foodNamePlaceholder")}
                required
              />
            </div>
            ) : (
              <>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                    {t("arabicName")}
                  </label>
                  <input
                    name="name_ar"
                    value={form.name_ar}
                    onChange={handleChange}
                    className={fieldClass}
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                    {t("englishName")}
                  </label>
                  <input
                    name="name_en"
                    value={form.name_en}
                    onChange={handleChange}
                    className={fieldClass}
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                {t("category")}
              </label>
              <select
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                className={fieldClass}
                required
              >
                <option value="">{t("chooseCategory")}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                {t("price")}
              </label>
              <input
                type="number"
                {...nonNegativeNumberInputProps}
                step="0.01"
                name="price"
                value={form.price}
                onChange={handleChange}
                className={fieldClass}
                placeholder="12.50"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                {t("preparationTime")}
              </label>
              <input
                type="number"
                {...nonNegativeNumberInputProps}
                name="preparation_time"
                value={form.preparation_time}
                onChange={handleChange}
                className={fieldClass}
                placeholder="15"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                {t("batchSize")}
              </label>
              <input
                type="number"
                {...nonNegativeNumberInputProps}
                min="1"
                name="preparation_batch_size"
                value={form.preparation_batch_size}
                onChange={handleChange}
                className={fieldClass}
                placeholder="6"
              />
            </div>
          </div>

          {form.translation_mode === TRANSLATION_MODE_AUTOMATIC ? (
          <div className="mt-5">
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
              {t("description")}
            </label>
            <textarea
              rows={4}
              name="description"
              value={form.description}
              onChange={handleChange}
              className={fieldClass}
              placeholder={t("shortDescriptionPlaceholder")}
            />
          </div>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                  {t("arabicDescription")}
                </label>
                <textarea
                  rows={4}
                  name="description_ar"
                  value={form.description_ar}
                  onChange={handleChange}
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                  {t("englishDescription")}
                </label>
                <textarea
                  rows={4}
                  name="description_en"
                  value={form.description_en}
                  onChange={handleChange}
                  className={fieldClass}
                />
              </div>
            </div>
          )}

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {["calories", "protein", "carbs", "fats"].map((field) => (
              <input
                key={field}
                type="number"
                {...nonNegativeNumberInputProps}
                step="0.01"
                name={field}
                placeholder={t(field)}
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
                {t("foodImage")}
              </span>
              <span className="block truncate text-sm text-white/45">
                {form.image?.name || (food?.image ? t("keepCurrentPhoto") : t("uploadDishPhoto"))}
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
                  {t("available")}
                </span>
                <span className="text-sm text-white/45">
                  {t("cashiersCanSell")}
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
                  {t("dietFood")}
                </span>
                <span className="text-sm text-white/45">
                  {t("markDietFriendly")}
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

          {errorMessage && (
            <p className="mt-5 rounded-2xl border border-[#EF4444]/35 bg-[#7F1D1D]/18 px-4 py-3 text-sm font-bold text-[#FCA5A5]">
              {errorMessage}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3 border-t border-white/[0.08] pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-black text-white/65 transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.05] hover:text-white active:translate-y-0"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="group inline-flex items-center gap-2 rounded-2xl bg-[#7F1D1D] px-5 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(127,29,29,0.28)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#681718] active:translate-y-0"
            >
              <Save size={17} className="transition duration-200 group-hover:-rotate-6" />
              {food ? t("updateFood") : t("saveFood")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FoodModal;

