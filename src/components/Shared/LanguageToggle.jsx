import { Languages } from "lucide-react";
import { useEffect, useState } from "react";
import { translate } from "../../utils/i18n";
import { getAppLanguage, setAppLanguage } from "../../utils/language";

export default function LanguageToggle({ compact = false, variant = "dark" }) {
    const [language, setLanguage] = useState(() => getAppLanguage());
    const isLight = variant === "light";

    useEffect(() => {
        document.documentElement.lang = language;

        const handleLanguageChange = (event) => {
            setLanguage(event.detail || getAppLanguage());
        };

        window.addEventListener("app-language-change", handleLanguageChange);
        return () => window.removeEventListener("app-language-change", handleLanguageChange);
    }, [language]);

    const handleChange = (nextLanguage) => {
        if (nextLanguage === language) return;

        setAppLanguage(nextLanguage);
        window.location.reload();
    };

    return (
        <div
            className={`flex shrink-0 items-center gap-1 rounded-xl border p-1 shadow-sm ${
                compact ? "h-10" : "h-11"
            } ${
                isLight
                    ? "border-[#E4CFC3] bg-white text-[#5F514B]"
                    : "border-white/10 bg-white/[0.07] text-white"
            }`}
            title={`${translate("language")}: ${language.toUpperCase()}`}
            aria-label={translate("language")}
        >
            <Languages size={compact ? 15 : 16} className="mx-1 text-[#FFD166]" />
            {["ar", "en"].map((option) => (
                <button
                    key={option}
                    type="button"
                    onClick={() => handleChange(option)}
                    aria-pressed={language === option}
                    className={`h-8 min-w-9 rounded-lg px-2 text-xs font-black uppercase transition ${
                        language === option
                            ? "bg-[#FFD166] text-[#24190B] shadow-[0_8px_20px_rgba(255,209,102,0.28)] ring-1 ring-[#7F1D1D]/10"
                            : isLight
                                ? "text-[#5F514B] hover:bg-[#FFF4DA] hover:text-[#7F1D1D]"
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                >
                    {option}
                </button>
            ))}
        </div>
    );
}
