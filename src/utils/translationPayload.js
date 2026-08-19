export const TRANSLATION_MODE_AUTOMATIC = "automatic";
export const TRANSLATION_MODE_MANUAL = "manual";

export function getInitialTranslationMode(item, fields = ["name"]) {
  return fields.some((field) => item?.[`${field}_ar`] || item?.[`${field}_en`])
    ? TRANSLATION_MODE_MANUAL
    : TRANSLATION_MODE_AUTOMATIC;
}

export function appendIfFilled(formData, key, value) {
  const normalizedValue = typeof value === "string" ? value.trim() : value;

  if (normalizedValue !== undefined && normalizedValue !== null && normalizedValue !== "") {
    formData.append(key, normalizedValue);
  }
}

export function appendTranslationFields(formData, values, fields) {
  const mode = values.translation_mode || TRANSLATION_MODE_AUTOMATIC;

  fields.forEach((field) => {
    if (mode === TRANSLATION_MODE_MANUAL) {
      const arValue = values[`${field}_ar`]?.trim();
      const enValue = values[`${field}_en`]?.trim();

      if (arValue || enValue) {
        formData.append(`${field}_ar`, arValue || "");
        formData.append(`${field}_en`, enValue || "");
      }

      return;
    }

    appendIfFilled(formData, field, values[field]);
  });
}

export function getApiErrorMessage(error, fallback = "Could not save item.") {
  if (error.response?.status === 503) {
    return "Automatic translation is temporarily unavailable. Please try again.";
  }

  const errors = error.response?.data?.errors;

  if (errors && typeof errors === "object") {
    return Object.values(errors).flat().filter(Boolean).join(" ");
  }

  return error.response?.data?.message || fallback;
}
