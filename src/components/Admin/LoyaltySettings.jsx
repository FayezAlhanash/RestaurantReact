import { useEffect, useMemo, useState } from "react";
import {
    ArrowDownUp,
    BadgePercent,
    Check,
    ChevronDown,
    Coins,
    Gift,
    Globe2,
    Loader2,
    Save,
    ShieldCheck,
    Store,
} from "lucide-react";
import api from "../../API/axios";
import { ROLE_IDS, getStoredUser } from "../../utils/auth";
import {
    nonNegativeNumberInputProps,
    toNonNegativeNumberValue,
} from "../../utils/nonNegativeNumberInput";

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

const TOGGLE_FIELDS = [
    {
        key: "is_enabled",
        label: "Program status",
        active: "Enabled",
        inactive: "Disabled",
        icon: ShieldCheck,
    },
    {
        key: "earning_enabled",
        label: "Points earning",
        active: "Customers earn points",
        inactive: "Earning is off",
        icon: Coins,
    },
    {
        key: "redemption_enabled",
        label: "Points redemption",
        active: "Customers redeem points",
        inactive: "Redemption is off",
        icon: Gift,
    },
];

const NUMBER_FIELDS = [
    {
        key: "earn_points",
        label: "Earn points",
        helper: "Points awarded per spend rule.",
        suffix: "pts",
        icon: Coins,
    },
    {
        key: "earn_amount",
        label: "Earn amount",
        helper: "Customer spend needed for earning.",
        prefix: "$",
        icon: ArrowDownUp,
    },
    {
        key: "redeem_points",
        label: "Redeem points",
        helper: "Points customers exchange.",
        suffix: "pts",
        icon: Gift,
    },
    {
        key: "redeem_amount",
        label: "Redeem amount",
        helper: "Discount value for redemption.",
        prefix: "$",
        icon: BadgePercent,
    },
    {
        key: "min_redeem_points",
        label: "Minimum redeem",
        helper: "Smallest redemption allowed.",
        suffix: "pts",
        icon: ShieldCheck,
    },
    {
        key: "max_redeem_points",
        label: "Maximum redeem",
        helper: "Largest redemption allowed.",
        suffix: "pts",
        icon: ShieldCheck,
    },
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
        data?.global_settings ??
        data?.globalSettings ??
        data?.global_loyalty_settings ??
        data?.globalLoyaltySettings ??
        data?.global_loyalty_setting ??
        data?.globalLoyaltySetting ??
        data?.loyalty_setting ??
        data?.loyaltySetting ??
        data?.data?.settings ??
        data?.data?.loyalty_settings ??
        data?.data?.loyaltySettings ??
        data?.data?.global_settings ??
        data?.data?.globalSettings ??
        data?.data?.global_loyalty_settings ??
        data?.data?.globalLoyaltySettings ??
        data?.data?.global_loyalty_setting ??
        data?.data?.globalLoyaltySetting ??
        data?.data?.loyalty_setting ??
        data?.data?.loyaltySetting ??
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

function buildSettingsPayload(settings) {
    return Object.fromEntries(
        FIELDS.map(({ key, type }) => [
            key,
            type === "toggle" ? (settings[key] ? 1 : 0) : settings[key] ?? 0,
        ])
    );
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
    const [isRestaurantMenuOpen, setIsRestaurantMenuOpen] = useState(false);
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
        if (!isGlobal) return;

        setRestaurants([]);
        setSelectedRestaurantId("");
    }, [isGlobal]);

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
            [key]: toNonNegativeNumberValue(value),
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
            const response = await api.patch(endpoint, buildSettingsPayload(settings));
            const savedSettings = getSettings(response.data);

            if (savedSettings && Object.keys(savedSettings).length) {
                setSettings(normalizeSettings(savedSettings));
            }

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
    const earningRule = `${settings.earn_points || 0} pts / $${settings.earn_amount || 0}`;
    const redemptionRule = `${settings.redeem_points || 0} pts = $${settings.redeem_amount || 0}`;
    const redeemRange = `${settings.min_redeem_points || 0} - ${settings.max_redeem_points || 0} pts`;

    return (
        <main className="loyalty-settings-page admin-rich-page min-h-full p-4 text-white sm:p-6 lg:p-8">
            <div className="mx-auto max-w-[1180px]">
                <section className="loyalty-settings-panel mb-5 overflow-hidden rounded-[18px] border border-white/10 bg-[#171D20] shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
                    <div className="flex flex-col gap-5 border-b border-white/10 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[12px] border border-[#FFD166]/35 bg-[#FFD166]/14 text-[#FFD166] shadow-[0_12px_28px_rgba(255,209,102,0.08)]">
                                <HeaderIcon size={26} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFD166]">
                                    Loyalty rules
                                </p>
                                <h1 className="mt-1 text-3xl font-black leading-9 text-white">
                                    {title}
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/58">
                                    {subtitle}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 sm:min-w-[430px]">
                            {[
                                ["Earn", earningRule],
                                ["Redeem", redemptionRule],
                                ["Range", redeemRange],
                            ].map(([label, value]) => (
                                <div
                                    key={label}
                                    className="loyalty-settings-card rounded-[12px] border border-white/10 bg-black/18 px-3 py-3"
                                >
                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/40">
                                        {label}
                                    </p>
                                    <p className="mt-1 truncate text-sm font-black text-[#FFD166]">
                                        {value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <form
                    onSubmit={saveSettings}
                    className="loyalty-settings-panel overflow-hidden rounded-[18px] border border-white/10 bg-[#20272A] shadow-[0_18px_44px_rgba(0,0,0,0.24)]"
                >
                    <div className="border-b border-white/10 bg-white/[0.025] px-5 py-4 sm:px-6">
                        {!isGlobal && isAdmin && (
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                <div
                                    className="relative block w-full max-w-md"
                                    onBlur={(event) => {
                                        if (!event.currentTarget.contains(event.relatedTarget)) {
                                            setIsRestaurantMenuOpen(false);
                                        }
                                    }}
                                >
                                    <span className="loyalty-settings-muted mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-white/45">
                                        Restaurant
                                    </span>
                                    <button
                                        type="button"
                                        className="loyalty-settings-input loyalty-restaurant-filter flex h-12 w-full items-center justify-between gap-3 rounded-[12px] border border-white/10 bg-[#111518] px-3.5 text-left text-sm font-black text-white outline-none transition hover:border-[#FFD166]/45 focus:border-[#FFD166]/70"
                                        onClick={() =>
                                            setIsRestaurantMenuOpen((isOpen) => !isOpen)
                                        }
                                        aria-haspopup="listbox"
                                        aria-expanded={isRestaurantMenuOpen}
                                    >
                                        <span className="flex min-w-0 items-center gap-3">
                                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] border border-[#FFD166]/25 bg-[#FFD166]/12 text-[#FFD166]">
                                                <Store size={15} />
                                            </span>
                                            <span className="truncate">
                                                {selectedRestaurant?.name || "Select restaurant"}
                                            </span>
                                        </span>
                                        <ChevronDown
                                            size={17}
                                            className={`shrink-0 text-[#FFD166] transition-transform duration-200 ${
                                                isRestaurantMenuOpen ? "rotate-180" : ""
                                            }`}
                                        />
                                    </button>

                                    {isRestaurantMenuOpen && (
                                        <div
                                            role="listbox"
                                            className="loyalty-restaurant-menu absolute left-0 top-[calc(100%+8px)] z-40 w-full overflow-hidden rounded-[14px] border border-white/10 bg-[#111518] p-1.5 shadow-[0_20px_44px_rgba(0,0,0,0.28)]"
                                        >
                                            <button
                                                type="button"
                                                role="option"
                                                aria-selected={!selectedRestaurantId}
                                                onClick={() => {
                                                    setSelectedRestaurantId("");
                                                    setIsRestaurantMenuOpen(false);
                                                }}
                                                className={`loyalty-restaurant-option flex h-10 w-full items-center justify-between gap-3 rounded-[10px] px-3 text-left text-sm font-black transition ${
                                                    !selectedRestaurantId
                                                        ? "is-selected bg-[#FFD166] text-[#211704]"
                                                        : "text-white/72 hover:bg-white/[0.07] hover:text-white"
                                                }`}
                                            >
                                                <span className="truncate">Select restaurant</span>
                                                {!selectedRestaurantId && <Check size={15} />}
                                            </button>

                                            {restaurants.map((restaurant) => {
                                                const isSelected =
                                                    String(restaurant.id) ===
                                                    String(selectedRestaurantId);

                                                return (
                                                    <button
                                                        key={restaurant.id}
                                                        type="button"
                                                        role="option"
                                                        aria-selected={isSelected}
                                                        onClick={() => {
                                                            setSelectedRestaurantId(restaurant.id);
                                                            setIsRestaurantMenuOpen(false);
                                                        }}
                                                        className={`loyalty-restaurant-option flex h-10 w-full items-center justify-between gap-3 rounded-[10px] px-3 text-left text-sm font-black transition ${
                                                            isSelected
                                                                ? "is-selected bg-[#FFD166] text-[#211704]"
                                                                : "text-white/72 hover:bg-white/[0.07] hover:text-white"
                                                        }`}
                                                    >
                                                        <span className="truncate">
                                                            {restaurant.name ||
                                                                `Restaurant #${restaurant.id}`}
                                                        </span>
                                                        {isSelected && <Check size={15} />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {selectedRestaurant && (
                                    <div className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-[#FFD166]/25 bg-[#FFD166]/10 px-3 text-sm font-black text-[#FFD166]">
                                        <Store size={16} />
                                        <span className="truncate">
                                            Editing {selectedRestaurant.name}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {errorMessage && (
                            <p className="mt-4 rounded-[10px] border border-[#B91C1C]/35 bg-[#B91C1C]/12 px-4 py-3 text-sm font-bold text-[#ff9b9b]">
                                {errorMessage}
                            </p>
                        )}

                        {message && (
                            <p className="mt-4 rounded-[10px] border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-300">
                                {message}
                            </p>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="grid min-h-[360px] place-items-center p-6 text-sm font-black text-white/55">
                            <span className="inline-flex items-center gap-2">
                                <Loader2 size={18} className="animate-spin" />
                                Loading loyalty settings...
                            </span>
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                                <section className="space-y-3">
                                    {TOGGLE_FIELDS.map((field) => {
                                        const Icon = field.icon;
                                        const checked = Boolean(Number(settings[field.key]));

                                        return (
                                            <button
                                                key={field.key}
                                                type="button"
                                                onClick={() =>
                                                    updateField(field.key, checked ? 0 : 1)
                                                }
                                                className={`loyalty-settings-card flex w-full items-center justify-between gap-4 rounded-[14px] border p-4 text-left transition ${
                                                    checked
                                                        ? "border-[#FFD166]/35 bg-[#FFD166]/12"
                                                        : "border-white/10 bg-[#121719]"
                                                }`}
                                            >
                                                <span className="flex min-w-0 items-center gap-3">
                                                    <span
                                                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-[10px] ${
                                                            checked
                                                                ? "bg-[#FFD166] text-[#221704]"
                                                                : "bg-white/8 text-white/45"
                                                        }`}
                                                    >
                                                        <Icon size={20} />
                                                    </span>
                                                    <span className="min-w-0">
                                                        <span className="loyalty-settings-field-label block text-sm font-black text-white">
                                                            {field.label}
                                                        </span>
                                                        <span
                                                            className={`loyalty-settings-muted mt-1 block text-xs font-bold ${
                                                                checked
                                                                    ? "text-[#FFD166]"
                                                                    : "text-white/42"
                                                            }`}
                                                        >
                                                            {checked ? field.active : field.inactive}
                                                        </span>
                                                    </span>
                                                </span>
                                                <span
                                                    className={`loyalty-toggle-track relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ease-out ${
                                                        checked ? "is-on bg-[#FFD166]" : "is-off bg-white/12"
                                                    }`}
                                                >
                                                    <span
                                                        className={`loyalty-toggle-knob absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ease-out ${
                                                            checked ? "translate-x-5" : "translate-x-0"
                                                        }`}
                                                    />
                                                </span>
                                            </button>
                                        );
                                    })}
                                </section>

                                <section className="grid gap-4 md:grid-cols-2">
                                    {NUMBER_FIELDS.map((field) => {
                                        const Icon = field.icon;

                                        return (
                                            <label
                                                key={field.key}
                                                className="loyalty-settings-card rounded-[14px] border border-white/10 bg-[#121719] p-4 transition focus-within:border-[#FFD166]/55"
                                            >
                                                <span className="mb-3 flex items-start justify-between gap-3">
                                                    <span className="min-w-0">
                                                        <span className="loyalty-settings-field-label block text-sm font-black text-white">
                                                            {field.label}
                                                        </span>
                                                        <span className="loyalty-settings-muted mt-1 block text-xs font-semibold leading-5 text-white/42">
                                                            {field.helper}
                                                        </span>
                                                    </span>
                                                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[#FFD166]/12 text-[#FFD166]">
                                                        <Icon size={18} />
                                                    </span>
                                                </span>
                                                <span className="loyalty-settings-input flex h-12 items-center rounded-[10px] border border-white/10 bg-[#0B0F10] px-3 focus-within:border-[#FFD166]/45">
                                                    {field.prefix && (
                                                        <span className="mr-1 text-sm font-black text-[#FFD166]">
                                                            {field.prefix}
                                                        </span>
                                                    )}
                                                    <input
                                                        type="number"
                                                        {...nonNegativeNumberInputProps}
                                                        value={settings[field.key]}
                                                        onChange={(event) =>
                                                            updateField(field.key, event.target.value)
                                                        }
                                                        className="min-w-0 flex-1 bg-transparent text-base font-black text-white outline-none"
                                                    />
                                                    {field.suffix && (
                                                        <span className="loyalty-settings-muted ml-2 text-xs font-black uppercase tracking-wide text-white/38">
                                                            {field.suffix}
                                                        </span>
                                                    )}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </section>
                            </div>

                            <div className="loyalty-settings-panel flex items-center justify-between gap-4 border-t border-white/10 bg-[#171D20] px-5 py-4 sm:px-6">
                                <p className="loyalty-settings-muted text-xs font-bold text-white/45">
                                    Changes apply after saving.
                                </p>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="inline-flex h-12 min-w-32 items-center justify-center gap-2 rounded-[10px] bg-[#FFD166] px-5 text-sm font-black text-[#1f1804] shadow-[0_14px_30px_rgba(255,209,102,0.18)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
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
