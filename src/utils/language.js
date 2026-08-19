const LANGUAGE_STORAGE_KEYS = ["appLanguage", "i18nextLng", "language", "locale"];

export function getAppLanguage() {
  for (const key of LANGUAGE_STORAGE_KEYS) {
    const value = window.localStorage.getItem(key) || window.sessionStorage.getItem(key);

    if (value?.toLowerCase().startsWith("en")) return "en";
    if (value?.toLowerCase().startsWith("ar")) return "ar";
  }

  return window.navigator.language?.toLowerCase().startsWith("en") ? "en" : "ar";
}

export function setAppLanguage(language) {
  const normalizedLanguage = language?.toLowerCase().startsWith("en") ? "en" : "ar";

  window.localStorage.setItem("appLanguage", normalizedLanguage);
  document.documentElement.lang = normalizedLanguage;
  window.dispatchEvent(new CustomEvent("app-language-change", { detail: normalizedLanguage }));

  return normalizedLanguage;
}
