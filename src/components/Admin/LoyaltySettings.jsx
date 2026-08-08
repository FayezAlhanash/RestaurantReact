import { useEffect, useMemo, useState } from "react";
import { BadgePercent, Globe2, Loader2, Save, Store } from "lucide-react";
import api from "../../API/axios";
import { ROLE_IDS, getStoredUser } from "../../utils/auth";

const DEFAULT_SETTINGS = {
    is_enabled: 1,
    earning_enabled: 1,
    redemption_enabled: 1,
    earn_points: 1,
    earn_amount: 10,
    redeem_points: 100,
    redeem_amount: 1,
    min_redeem_points: 100,
    max_redeem_points: 500,
};

const FIELDS = [
    { key: "is_enabled", label: "Enabled", type: "toggle" },
    { key: "earning_enabled", label: "Points earning", type: "toggle" },
    { key: "redemption_enabled", label: "Points redemption", type: "toggle" },
    { key: "earn_points", label: "Earn points", min: 0 },
    { key: "earn_amount", label: "Earn amount", min: 0 },
    { key: "redeem_points", label: "Redeem points", min: 0 },
    { key: "redeem_amount", label: "Redeem amount", min: 0 },
    { key: "min_redeem_points", label: "Minimum redeem points", min: 0 },
    { key: "max_redeem_points", label: "Maximum redeem points", min: 0 },
];

function getList(data) {
    if (Array.isArray(data?.restaurants)) return data.restaurants;
    if (Array.isArray(data?.data?.restaurants)) return data.data.restaurants;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
}

function getSettings(data) {
    return (
        data?.settings ??
        data?.loyalty_settings ??
        data?.loyaltySettings ??
        data?.data?.settings ??
        data?.data?.loyalty_settings ??
        data?.data?.loyaltySettings ??
        data?.data ??
        data ??
        {}
    );
}

function getUserRestaurantId(user) {
    return (
        user?.restaurant_id ??
        user?.restaurant?.id ??
        user?.manager?.restaurant_id ??
        user?.manager?.restaurant?.id ??
        user?.employee?.restaurant_id ??
        user?.employee?.restaurant?.id ??
        ""
    );
}

function normalizeSettings(settings = {}) {
    return Object.fromEntries(
        Object.entries(DEFAULT_SETTINGS).map(([key, fallback]) => [
            key,
            settings[key] ?? settings[key.replaceAll("_", "")] ?? fallback,
        ])
    );
}

function appendSettings(formData, settings) {
    formData.append("_method", "PATCH");

    FIELDS.forEach(({ key, type }) => {
        formData.append(
            key,
            type === "toggle" ? (settings[key] ? 1 : 0) : settings[key] ?? 0
        );
    });
}

export default function LoyaltySettings({ scope = "restaurant" }) {
    const isGlobal = scope === "global";
    const user = getStoredUser();
    const isAdmin = Number(user?.role_id ?? user?.role?.id) === ROLE_IDS.ADMIN;
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurantId, setSelectedRestaurantId] = useState(
        getUserRestaurantId(user)
    );
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const selectedRestaurant = useMemo(
        () =>
            restaurants.find(
                (restaurant) =>
                    String(restaurant.id) === String(selectedRestaurantId)
            ),
        [restaurants, selectedRestaurantId]
    );

    const endpoint = useMemo(() => {
        if (isGlobal) return "/loyalty-settings/global";
        if (!selectedRestaurantId) return "";
        return `/restaurants/${selectedRestaurantId}/loyalty-settings`;
    }, [isGlobal, selectedRestaurantId]);

    useEffect(() => {
        if (!isAdmin || isGlobal) return undefined;

        const loadRestaurants = async () => {
            try {
                const response = await api.get("/restaurants");
                const restaurantList = getList(response.data);

                setRestaurants(restaurantList);
                setSelectedRestaurantId(
                    (current) => current || restaurantList[0]?.id || ""
                );
            } catch (error) {
                setErrorMessage(
                    error.response?.data?.message || "Could not load restaurants."
                );
            }
        };

        loadRestaurants();
        return undefined;
    }, [isAdmin, isGlobal]);

    useEffect(() => {
        const loadSettings = async () => {
            if (!endpoint) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setErrorMessage("");
            setMessage("");

            try {
                const response = await api.get(endpoint);
                setSettings(normalizeSettings(getSettings(response.data)));
            } catch (error) {
                setErrorMessage(
                    error.response?.data?.message ||
                        "Could not load loyalty settings."
                );
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = window.setTimeout(loadSettings, 0);

        return () => window.clearTimeout(timeoutId);
    }, [endpoint]);

    const updateField = (key, value) => {
        setSettings((current) => ({
            ...current,
            [key]: value,
        }));
    };

    const saveSettings = async (event) => {
        event.preventDefault();

        if (!endpoint) {
            setErrorMessage("Select a restaurant first.");
            return;
        }

        setIsSaving(true);
        setMessage("");
        setErrorMessage("");

        try {
            const formData = new FormData();
            appendSettings(formData, settings);

            await api.post(endpoint, formData);
            setMessage("Loyalty settings saved.");
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message || "Could not save loyalty settings."
            );
        } finally {
            setIsSaving(false);
        }
    };

    const HeaderIcon = isGlobal ? Globe2 : Store;
    const title = isGlobal ? "Global Loyalty Settings" : "Loyalty Settings";
    const subtitle = isGlobal
        ? "Default loyalty earning and redemption rules for the platform."
        : "Restaurant-specific loyalty earning and redemption rules.";

    return (
        <main className="loyalty-settings-page admin-rich-page min-h-full p-4 text-white sm:p-6 lg:p-8">
            <div className="mx-auto max-w-[1100px]">
                <section className="loyalty-settings-panel mb-6 rounded-[18px] border border-white/10 bg-[#15191b] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="grid h-12 w-12 place-items-center rounded-[10px] border border-[#FFD166]/35 bg-[#FFD166]/12 text-[#FFD166]">
                                <HeaderIcon size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFD166]">
                                    Loyalty
                                </p>
                                <h1 className="mt-1 text-2xl font-black text-white">
                                    {title}
                                </h1>
                                <p className="mt-2 text-sm font-semibold leading-6 text-white/55">
                                    {subtitle}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <form
                    onSubmit={saveSettings}
                    className="loyalty-settings-panel rounded-[18px] border border-white/10 bg-[#20262a] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.24)]"
                >
                    {!isGlobal && isAdmin && (
                        <label className="mb-5 block">
                            <span className="loyalty-settings-muted mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/50">
                                Restaurant
                            </span>
                            <select
                                value={selectedRestaurantId}
                                onChange={(event) =>
                                    setSelectedRestaurantId(event.target.value)
                                }
                                className="loyalty-settings-input h-12 w-full rounded-[10px] border border-white/10 bg-[#111518] px-4 text-sm font-black text-white outline-none transition focus:border-[#FFD166]/70"
                            >
                                <option value="">Select restaurant</option>
                                {restaurants.map((restaurant) => (
                                    <option key={restaurant.id} value={restaurant.id}>
                                        {restaurant.name || `Restaurant #${restaurant.id}`}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}

                    {selectedRestaurant && (
                        <p className="mb-5 rounded-[10px] border border-[#FFD166]/25 bg-[#FFD166]/10 px-4 py-3 text-sm font-black text-[#FFD166]">
                            Editing {selectedRestaurant.name}
                        </p>
                    )}

                    {errorMessage && (
                        <p className="mb-5 rounded-[10px] border border-[#B91C1C]/35 bg-[#B91C1C]/12 px-4 py-3 text-sm font-bold text-[#ff9b9b]">
                            {errorMessage}
                        </p>
                    )}

                    {message && (
                        <p className="mb-5 rounded-[10px] border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-300">
                            {message}
                        </p>
                    )}

                    {isLoading ? (
                        <div className="loyalty-settings-card loyalty-settings-muted grid min-h-[280px] place-items-center rounded-[14px] border border-white/10 bg-[#15191b] text-sm font-black text-white/55">
                            <span className="inline-flex items-center gap-2">
                                <Loader2 size={18} className="animate-spin" />
                                Loading loyalty settings...
                            </span>
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-4 md:grid-cols-2">
                                {FIELDS.map((field) => (
                                    <label
                                        key={field.key}
                                        className="loyalty-settings-card rounded-[12px] border border-white/10 bg-[#15191b] p-4"
                                    >
                                        <span className="loyalty-settings-field-label mb-3 flex items-center gap-2 text-sm font-black text-white">
                                            <BadgePercent
                                                size={17}
                                                className="text-[#FFD166]"
                                            />
                                            {field.label}
                                        </span>
                                        {field.type === "toggle" ? (
                                            <input
                                                type="checkbox"
                                                checked={Boolean(Number(settings[field.key]))}
                                                onChange={(event) =>
                                                    updateField(
                                                        field.key,
                                                        event.target.checked ? 1 : 0
                                                    )
                                                }
                                                className="h-5 w-5 accent-[#FFD166]"
                                            />
                                        ) : (
                                            <input
                                                type="number"
                                                min={field.min}
                                                value={settings[field.key]}
                                                onChange={(event) =>
                                                    updateField(
                                                        field.key,
                                                        event.target.value
                                                    )
                                                }
                                                className="loyalty-settings-input h-11 w-full rounded-[10px] border border-white/10 bg-[#0f1315] px-3 text-sm font-black text-white outline-none transition focus:border-[#FFD166]/70"
                                            />
                                        )}
                                    </label>
                                ))}
                            </div>

                            <div className="mt-5 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-[#FFD166] px-5 text-sm font-black text-[#1f1804] shadow-[0_14px_30px_rgba(255,209,102,0.18)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
                                >
                                    {isSaving ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Save size={18} />
                                    )}
                                    Save
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </main>
    );
}
