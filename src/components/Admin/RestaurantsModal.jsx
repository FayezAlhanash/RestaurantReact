import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Loader2, Store, X } from "lucide-react";
import api from "../../API/axios";
import {
    nonNegativeNumberInputProps,
    toNonNegativeNumberValue,
} from "../../utils/nonNegativeNumberInput";
import { getStorageImageUrl } from "../../utils/restaurant";
import {
    TRANSLATION_MODE_AUTOMATIC,
    TRANSLATION_MODE_MANUAL,
    appendTranslationFields,
    getApiErrorMessage,
    getInitialTranslationMode,
} from "../../utils/translationPayload";
import { useTranslation } from "../../utils/i18n";

function UploadBox({ label, file, existingImage, cacheKey, onChange }) {
    const { t } = useTranslation();
    const previewUrl = useMemo(() => {
        if (file) return URL.createObjectURL(file);
        return getStorageImageUrl(existingImage, cacheKey);
    }, [cacheKey, existingImage, file]);

    useEffect(() => {
        return () => {
            if (file && previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [file, previewUrl]);

    return (
        <label className="group block cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-[#202B2F] shadow-sm transition hover:-translate-y-0.5 hover:border-[#7F1D1D]/35 hover:shadow-md">
            <input
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => onChange(event.target.files?.[0] || null)}
            />

            <div className="relative h-40 bg-[#0D1214]">
                {previewUrl ? (
                    <img
                        src={previewUrl}
                        alt={label}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="grid h-full place-items-center text-[#7F1D1D]">
                        <ImagePlus size={40} />
                    </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-3">
                    <p className="text-sm font-black text-white">{label}</p>
                    <p className="truncate text-xs font-bold text-white/75">
                        {file ? file.name : t("clickUploadImage")}
                    </p>
                </div>
            </div>
        </label>
    );
}

function RestaurantModal({ isOpen, onClose, onSave, restaurant }) {
    const { t } = useTranslation();
    const formKey = `${restaurant?.id ?? "new"}-${isOpen ? "open" : "closed"}`;
    const [isVisible, setIsVisible] = useState(false);
    const [name, setName] = useState("");
    const [nameAr, setNameAr] = useState("");
    const [nameEn, setNameEn] = useState("");
    const [description, setDescription] = useState("");
    const [descriptionAr, setDescriptionAr] = useState("");
    const [descriptionEn, setDescriptionEn] = useState("");
    const [translationMode, setTranslationMode] = useState(TRANSLATION_MODE_AUTOMATIC);
    const [tax, setTax] = useState("");
    const [frontImage, setFrontImage] = useState(null);
    const [backImage, setBackImage] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (!isOpen) return undefined;

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTranslationMode(getInitialTranslationMode(restaurant, ["name", "description"]));
        setName(restaurant?.name || "");
        setNameAr(restaurant?.name_ar || "");
        setNameEn(restaurant?.name_en || "");
        setDescription(restaurant?.description || "");
        setDescriptionAr(restaurant?.description_ar || "");
        setDescriptionEn(restaurant?.description_en || "");
        setTax(restaurant?.tax_percentage ?? "");
        setFrontImage(null);
        setBackImage(null);
        setErrorMessage("");
        setIsVisible(false);

        const frameId = window.requestAnimationFrame(() => {
            setIsVisible(true);
        });

        return () => window.cancelAnimationFrame(frameId);
    }, [formKey, isOpen, restaurant]);

    if (!isOpen) return null;

    const resetAndClose = () => {
        setIsVisible(false);
        window.setTimeout(() => {
            setName("");
            setNameAr("");
            setNameEn("");
            setDescription("");
            setDescriptionAr("");
            setDescriptionEn("");
            setTax("");
            setFrontImage(null);
            setBackImage(null);
            setErrorMessage("");
            onClose();
        }, 160);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (translationMode === TRANSLATION_MODE_AUTOMATIC && !name.trim()) {
            setErrorMessage(t("restaurantNameRequired"));
            return;
        }

        if (
            translationMode === TRANSLATION_MODE_MANUAL &&
            (!nameAr.trim() || !nameEn.trim())
        ) {
            setErrorMessage(t("restaurantNamesRequired"));
            return;
        }

        if (
            translationMode === TRANSLATION_MODE_MANUAL &&
            ((descriptionAr.trim() && !descriptionEn.trim()) ||
                (!descriptionAr.trim() && descriptionEn.trim()))
        ) {
            setErrorMessage("يجب تعبئة الوصف بالعربية والإنكليزية معاً.");
            return;
        }

        setIsSaving(true);
        setErrorMessage("");

        try {
            const formData = new FormData();

            appendTranslationFields(
                formData,
                {
                    translation_mode: translationMode,
                    name,
                    name_ar: nameAr,
                    name_en: nameEn,
                    description,
                    description_ar: descriptionAr,
                    description_en: descriptionEn,
                },
                ["name", "description"]
            );
            formData.append("delivery_time", 30);
            formData.append("tax_percentage", tax || 0);

            if (frontImage) formData.append("front_image", frontImage);
            if (backImage) formData.append("back_image", backImage);

            const response = restaurant
                ? await api.post(`/restaurants/${restaurant.id}`, formData)
                : await api.post("/restaurants", formData);

            onSave(response.data.restaurant);
            resetAndClose();
        } catch (error) {
            setErrorMessage(getApiErrorMessage(error, t("restaurantSaveError")));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div
            className={`fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm transition-opacity duration-200 ease-out sm:p-6 ${
                isVisible ? "opacity-100" : "opacity-0"
            }`}
        >
            <form
                onSubmit={handleSubmit}
                className={`max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#182124] text-white shadow-2xl transition duration-200 ease-out will-change-transform ${
                    isVisible
                        ? "translate-y-0 scale-100 opacity-100"
                        : "translate-y-4 scale-[0.98] opacity-0"
                }`}
            >
                <div className="sticky top-0 z-10 border-b border-white/[0.08] bg-[radial-gradient(circle_at_100%_0%,rgba(127,29,29,0.16),transparent_34%),rgba(24,33,36,0.96)] px-5 py-4 backdrop-blur">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[#7F1D1D]/35 bg-[#7F1D1D]/12 text-[#7F1D1D]">
                                <Store size={21} />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#FFD166]">
                                    {restaurant ? "تعديل فرع" : "فرع جديد"}
                                </p>
                                <h2 className="text-xl font-black text-white">
                                    {restaurant ? t("updateRestaurant") : t("addRestaurant")}
                                </h2>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={resetAndClose}
                            className="grid h-10 w-10 place-items-center rounded-xl text-white/55 transition hover:bg-white/[0.06] hover:text-white"
                            aria-label="Close restaurant form"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="grid gap-6 p-5 lg:grid-cols-[1fr_1.1fr]">
                    <section className="space-y-4">
                        <UploadBox
                            label={t("frontImage")}
                            file={frontImage}
                            existingImage={restaurant?.front_image}
                            cacheKey={
                                restaurant?.updated_at ||
                                restaurant?.front_image_updated_at ||
                                restaurant?.id
                            }
                            onChange={setFrontImage}
                        />
                        <UploadBox
                            label={t("backImage")}
                            file={backImage}
                            existingImage={restaurant?.back_image}
                            cacheKey={
                                restaurant?.updated_at ||
                                restaurant?.back_image_updated_at ||
                                restaurant?.id
                            }
                            onChange={setBackImage}
                        />
                    </section>

                    <section className="space-y-4">
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
                                        setErrorMessage("");
                                    }}
                                    className={`h-10 rounded-xl text-xs font-black transition ${
                                        translationMode === mode
                                            ? "bg-[#FFD166] text-[#1B1510]"
                                            : "text-white/55 hover:bg-white/[0.05] hover:text-white"
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {translationMode === TRANSLATION_MODE_AUTOMATIC ? (
                        <label className="block">
                            <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                                {t("restaurantName")}
                            </span>
                            <input
                                type="text"
                                placeholder="الركن الإيطالي"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-[#0D1214] px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-white/30 focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10"
                            />
                        </label>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                                <label className="block">
                                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                                        {t("arabicName")}
                                    </span>
                                    <input
                                        type="text"
                                        value={nameAr}
                                        onChange={(event) => setNameAr(event.target.value)}
                                        className="w-full rounded-2xl border border-white/10 bg-[#0D1214] px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-white/30 focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10"
                                        required
                                    />
                                </label>
                                <label className="block">
                                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                                        {t("englishName")}
                                    </span>
                                    <input
                                        type="text"
                                        value={nameEn}
                                        onChange={(event) => setNameEn(event.target.value)}
                                        className="w-full rounded-2xl border border-white/10 bg-[#0D1214] px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-white/30 focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10"
                                        required
                                    />
                                </label>
                            </div>
                        )}

                        {translationMode === TRANSLATION_MODE_AUTOMATIC ? (
                        <label className="block">
                            <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                                {t("description")}
                            </span>
                            <textarea
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                placeholder={t("restaurantShortDescriptionPlaceholder")}
                                rows={5}
                                className="w-full resize-none rounded-2xl border border-white/10 bg-[#0D1214] px-4 py-3 text-sm font-semibold leading-6 text-white outline-none transition placeholder:text-white/30 focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10"
                            />
                        </label>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                                <label className="block">
                                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                                        {t("arabicDescription")}
                                    </span>
                                    <textarea
                                        value={descriptionAr}
                                        onChange={(event) => setDescriptionAr(event.target.value)}
                                        rows={5}
                                        className="w-full resize-none rounded-2xl border border-white/10 bg-[#0D1214] px-4 py-3 text-sm font-semibold leading-6 text-white outline-none transition placeholder:text-white/30 focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10"
                                    />
                                </label>
                                <label className="block">
                                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                                        {t("englishDescription")}
                                    </span>
                                    <textarea
                                        value={descriptionEn}
                                        onChange={(event) => setDescriptionEn(event.target.value)}
                                        rows={5}
                                        className="w-full resize-none rounded-2xl border border-white/10 bg-[#0D1214] px-4 py-3 text-sm font-semibold leading-6 text-white outline-none transition placeholder:text-white/30 focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10"
                                    />
                                </label>
                            </div>
                        )}

                        <label className="block">
                            <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                                {t("tax")} (%)
                            </span>
                            <input
                                type="number"
                                {...nonNegativeNumberInputProps}
                                step="0.01"
                                value={tax}
                                onChange={(event) =>
                                    setTax(toNonNegativeNumberValue(event.target.value))
                                }
                                placeholder="5"
                                className="w-full rounded-2xl border border-white/10 bg-[#0D1214] px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-white/30 focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10"
                            />
                        </label>

                        {errorMessage && (
                            <p className="rounded-2xl border border-[#7F1D1D]/30 bg-[#7F1D1D]/10 px-4 py-3 text-sm font-bold text-[#7F1D1D]">
                                {errorMessage}
                            </p>
                        )}
                    </section>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-white/[0.08] bg-[#0D1214]/45 p-5 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={resetAndClose}
                        className="h-11 rounded-2xl border border-white/10 px-6 text-sm font-black text-white/65 transition hover:bg-white/[0.05] hover:text-white"
                    >
                        {t("cancel")}
                    </button>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#7F1D1D] px-6 text-sm font-black text-white shadow-[0_16px_34px_rgba(127,29,29,0.24)] transition hover:bg-[#681718] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isSaving && <Loader2 size={17} className="animate-spin" />}
                        {restaurant ? t("updateRestaurant") : t("createRestaurant")}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default RestaurantModal;
