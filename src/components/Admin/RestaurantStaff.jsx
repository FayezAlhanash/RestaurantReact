import { useEffect, useMemo, useState } from "react";
import {
    Building2,
    Check,
    ChevronDown,
    Mail,
    Phone,
    Search,
    ShieldAlert,
    UserRound,
    UsersRound,
} from "lucide-react";
import api from "../../API/axios";
import { useTheme } from "../../context/ThemeContext";
import { ensureCurrentRestaurantId } from "../../utils/restaurant";
import { getStoredUser, ROLE_IDS, storeUser } from "../../utils/auth";

const getList = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.staff)) return data.staff;
    if (Array.isArray(data?.users)) return data.users;
    if (Array.isArray(data?.employees)) return data.employees;
    if (Array.isArray(data?.data?.staff)) return data.data.staff;
    if (Array.isArray(data?.data?.users)) return data.data.users;
    if (Array.isArray(data?.data?.employees)) return data.data.employees;
    if (Array.isArray(data?.data)) return data.data;

    return [];
};

const getRestaurants = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.restaurants)) return data.restaurants;
    if (Array.isArray(data?.data?.restaurants)) return data.data.restaurants;
    if (Array.isArray(data?.data)) return data.data;

    return [];
};

const getRestaurantRecord = (data) =>
    data?.restaurant ??
    data?.data?.restaurant ??
    data?.data ??
    data ??
    {};

const getStaffName = (staff) =>
    staff?.name ||
    [staff?.first_name, staff?.father_name, staff?.last_name].filter(Boolean).join(" ") ||
    staff?.email ||
    `Staff #${staff?.id ?? ""}`;

const getRoleName = (staff) =>
    staff?.role?.name || staff?.role_name || staff?.roleName || "Staff";

const getStaffRestaurantId = (staff) =>
    staff?.restaurant_id ??
    staff?.restaurantId ??
    staff?.restaurant?.id ??
    staff?.employee?.restaurant_id ??
    staff?.employee?.restaurant?.id ??
    staff?.manager?.restaurant_id ??
    staff?.manager?.restaurant?.id ??
    null;

const getRestaurantName = (user, restaurantId) =>
    user?.restaurant?.name ||
    user?.manager?.restaurant?.name ||
    user?.employee?.restaurant?.name ||
    user?.restaurant_name ||
    user?.restaurantName ||
    (restaurantId ? `Restaurant #${restaurantId}` : "Restaurant");

const getRestaurantOptionName = (restaurant) =>
    restaurant?.name || restaurant?.restaurant_name || `Restaurant #${restaurant?.id ?? ""}`;

function RestaurantStaff() {
    const { isLight } = useTheme();
    const [isAdmin] = useState(() => {
        const user = getStoredUser();

        return Number(user?.role_id ?? user?.role?.id) === ROLE_IDS.ADMIN;
    });
    const [restaurants, setRestaurants] = useState([]);
    const [restaurantId, setRestaurantId] = useState(null);
    const [restaurantName, setRestaurantName] = useState(() =>
        getRestaurantName(getStoredUser(), null)
    );
    const [staff, setStaff] = useState([]);
    const [search, setSearch] = useState("");
    const [isRestaurantMenuOpen, setIsRestaurantMenuOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        let isActive = true;

        const prepareRestaurantScope = async () => {
            setIsLoading(true);
            setErrorMessage("");

            try {
                if (isAdmin) {
                    const response = await api.get("/restaurants");

                    if (!isActive) return;

                    setRestaurants(getRestaurants(response.data));
                    setRestaurantId(null);
                    setRestaurantName("Choose restaurant");
                    return;
                }

                const currentRestaurantId = await ensureCurrentRestaurantId();

                if (!isActive) return;

                if (!currentRestaurantId) {
                    setRestaurantId(null);
                    setStaff([]);
                    setErrorMessage("This account is not linked to a restaurant.");
                    return;
                }

                setRestaurantId(currentRestaurantId);
                setRestaurantName(getRestaurantName(getStoredUser(), currentRestaurantId));

                try {
                    const restaurantResponse = await api.get(`/restaurants/${currentRestaurantId}`);
                    const restaurant = getRestaurantRecord(restaurantResponse.data);

                    if (!isActive) return;

                    if (restaurant?.name) {
                        setRestaurantName(restaurant.name);

                        const currentUser = getStoredUser();
                        if (currentUser) {
                            storeUser(currentUser, {
                                restaurant: {
                                    ...(currentUser.restaurant || {}),
                                    ...restaurant,
                                    id: restaurant?.id ?? currentRestaurantId,
                                    name: restaurant.name,
                                },
                                restaurant_id: restaurant?.id ?? currentRestaurantId,
                            });
                        }
                    }
                } catch {
                    // Staff can still load when the restaurant name endpoint is unavailable.
                }
            } catch (error) {
                if (isActive) {
                    setErrorMessage(
                        error.response?.data?.message || "Could not load restaurant data."
                    );
                    setStaff([]);
                }
            } finally {
                if (isActive) setIsLoading(false);
            }
        };

        prepareRestaurantScope();

        return () => {
            isActive = false;
        };
    }, [isAdmin]);

    useEffect(() => {
        let isActive = true;

        const fetchStaff = async () => {
            if (!restaurantId) {
                setStaff([]);
                return;
            }

            setIsLoading(true);
            setErrorMessage("");

            try {
                const response = await api.get(`/restaurants/${restaurantId}/staff`);
                const staffList = getList(response.data);
                const hasRestaurantScope = staffList.some(
                    (staffMember) => getStaffRestaurantId(staffMember) != null
                );
                const scopedStaff = hasRestaurantScope
                    ? staffList.filter(
                          (staffMember) =>
                              String(getStaffRestaurantId(staffMember)) === String(restaurantId)
                      )
                    : staffList;

                if (isActive) {
                    setStaff(scopedStaff);
                }
            } catch (error) {
                if (isActive) {
                    setErrorMessage(
                        error.response?.data?.message || "Could not load restaurant staff."
                    );
                    setStaff([]);
                }
            } finally {
                if (isActive) setIsLoading(false);
            }
        };

        fetchStaff();

        return () => {
            isActive = false;
        };
    }, [restaurantId]);

    const filteredStaff = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return staff;

        return staff.filter((staffMember) =>
            [
                getStaffName(staffMember),
                getRoleName(staffMember),
                staffMember?.email,
                staffMember?.phone_number,
                staffMember?.phone,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query))
        );
    }, [search, staff]);

    const selectedRestaurant = restaurants.find(
        (restaurant) => String(restaurant.id) === String(restaurantId)
    );
    const restaurantFilterLabel = selectedRestaurant
        ? getRestaurantOptionName(selectedRestaurant)
        : "Choose restaurant";

    return (
        <div className={`min-h-full px-4 py-6 sm:px-6 lg:px-7 ${isLight ? "bg-transparent text-[#241815]" : "bg-[#101517] text-white"}`}>
            <section className={`overflow-hidden rounded-[24px] border shadow-[0_22px_55px_rgba(127,29,29,0.10)] ${isLight ? "border-[#E4CFC3] bg-[#FFF9F2]" : "border-white/10 bg-[#172124]"}`}>
                <div className={`flex flex-col gap-4 border-b p-5 lg:flex-row lg:items-center lg:justify-between ${isLight ? "border-[#E4CFC3] bg-[#FFFDF9]" : "border-white/[0.08] bg-white/[0.025]"}`}>
                    <div className="flex items-start gap-4">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#7F1D1D] text-white shadow-[0_14px_30px_rgba(127,29,29,0.22)]">
                            <UsersRound size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9A6400] dark:text-[#FFD166]">
                                Restaurant Staff
                            </p>
                            <h1 className={`mt-1 text-3xl font-black ${isLight ? "text-[#241815]" : "text-white"}`}>
                                {restaurantName}
                            </h1>
                            <p className={`mt-2 text-sm font-semibold ${isLight ? "text-[#6B5A52]" : "text-white/55"}`}>
                                {restaurantId
                                    ? `${filteredStaff.length} of ${staff.length} staff members`
                                    : "No restaurant is connected to this account"}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 lg:w-[420px]">
                        {isAdmin && (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsRestaurantMenuOpen((isOpen) => !isOpen)}
                                    className={`flex h-12 w-full items-center gap-3 rounded-2xl border px-4 text-left shadow-inner transition hover:-translate-y-0.5 ${
                                        isLight
                                            ? "border-[#E4CFC3] bg-white text-[#241815] hover:border-[#D8A22D]/55 hover:bg-[#FFFDF9]"
                                            : "border-white/10 bg-[#0D1214] text-white hover:border-[#FFD166]/35"
                                    }`}
                                >
                                    <Building2 size={18} className="shrink-0 text-[#9A6400] dark:text-[#FFD166]" />
                                    <span className="min-w-0 flex-1 truncate text-sm font-black">
                                        {restaurantFilterLabel}
                                    </span>
                                    <ChevronDown
                                        size={18}
                                        className={`shrink-0 transition ${isRestaurantMenuOpen ? "rotate-180" : ""}`}
                                    />
                                </button>

                                {isRestaurantMenuOpen && (
                                    <div className={`absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border p-1.5 shadow-[0_18px_44px_rgba(70,45,30,0.16)] ${
                                        isLight
                                            ? "border-[#E4CFC3] bg-white"
                                            : "border-white/10 bg-[#111A1D]"
                                    }`}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setRestaurantId(null);
                                                setRestaurantName("Choose restaurant");
                                                setSearch("");
                                                setIsRestaurantMenuOpen(false);
                                            }}
                                            className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-black transition ${
                                                !restaurantId
                                                    ? "bg-[#7F1D1D] text-white"
                                                    : isLight
                                                        ? "text-[#6B5A52] hover:bg-[#FFF4EA] hover:text-[#241815]"
                                                        : "text-white/65 hover:bg-white/[0.06] hover:text-white"
                                            }`}
                                        >
                                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-current/10">
                                                <Building2 size={15} />
                                            </span>
                                            <span className="min-w-0 flex-1 truncate">Choose restaurant</span>
                                            {!restaurantId && <Check size={16} />}
                                        </button>

                                        <div className="mt-1 max-h-64 space-y-1 overflow-y-auto pr-1">
                                            {restaurants.map((restaurant) => {
                                                const isSelected = String(restaurant.id) === String(restaurantId);
                                                const name = getRestaurantOptionName(restaurant);

                                                return (
                                                    <button
                                                        type="button"
                                                        key={restaurant.id}
                                                        onClick={() => {
                                                            setRestaurantId(restaurant.id);
                                                            setRestaurantName(name);
                                                            setSearch("");
                                                            setIsRestaurantMenuOpen(false);
                                                        }}
                                                        className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-black transition ${
                                                            isSelected
                                                                ? "bg-[#7F1D1D] text-white"
                                                                : isLight
                                                                    ? "text-[#241815] hover:bg-[#FFF4EA]"
                                                                    : "text-white/82 hover:bg-white/[0.06] hover:text-white"
                                                        }`}
                                                    >
                                                        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${
                                                            isSelected
                                                                ? "bg-white/16 text-white"
                                                                : isLight
                                                                    ? "bg-[#FFF4DA] text-[#8F5F00]"
                                                                    : "bg-[#FFD166]/10 text-[#FFD166]"
                                                        }`}>
                                                            <Building2 size={15} />
                                                        </span>
                                                        <span className="min-w-0 flex-1 truncate">{name}</span>
                                                        {isSelected && <Check size={16} />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <label className={`flex h-12 items-center gap-3 rounded-2xl border px-4 shadow-inner ${isLight ? "border-[#E4CFC3] bg-white" : "border-white/10 bg-[#0D1214]"}`}>
                            <Search size={18} className="shrink-0 text-[#9A6400] dark:text-[#FFD166]" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search staff..."
                                className={`min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none ${isLight ? "text-[#241815] placeholder:text-[#8A7972]" : "text-white placeholder:text-white/35"}`}
                            />
                        </label>
                    </div>
                </div>

                <div className="p-5">
                    {isAdmin && !restaurantId && !errorMessage ? (
                        <div className={`rounded-2xl border border-dashed p-8 text-center ${isLight ? "border-[#E4CFC3] bg-white/70 text-[#6B5A52]" : "border-white/10 bg-white/[0.04] text-white/55"}`}>
                            Choose a restaurant to view its staff.
                        </div>
                    ) : isLoading ? (
                        <div className={`rounded-2xl border border-dashed p-8 text-center ${isLight ? "border-[#E4CFC3] bg-white/70 text-[#6B5A52]" : "border-white/10 bg-white/[0.04] text-white/55"}`}>
                            Loading restaurant staff...
                        </div>
                    ) : errorMessage ? (
                        <div className={`rounded-2xl border p-5 ${isLight ? "border-[#7F1D1D]/25 bg-[#F9ECEC] text-[#7F1D1D]" : "border-[#7F1D1D]/35 bg-[#7F1D1D]/15 text-[#FFB4A8]"}`}>
                            <div className="flex items-center gap-3 font-black">
                                <ShieldAlert size={20} />
                                {errorMessage}
                            </div>
                        </div>
                    ) : filteredStaff.length ? (
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {filteredStaff.map((staffMember, index) => (
                                <article
                                    key={staffMember?.id ?? `${getStaffName(staffMember)}-${index}`}
                                    className={`rounded-2xl border p-4 shadow-[0_14px_30px_rgba(70,45,30,0.07)] ${isLight ? "border-[#E4CFC3] bg-white" : "border-white/10 bg-[#101A1D]"}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border font-black ${isLight ? "border-[#D8A22D]/35 bg-[#FFF4DA] text-[#8F5F00]" : "border-[#FFD166]/25 bg-[#FFD166]/10 text-[#FFD166]"}`}>
                                            <UserRound size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className={`truncate text-lg font-black ${isLight ? "text-[#241815]" : "text-white"}`}>
                                                {getStaffName(staffMember)}
                                            </h2>
                                            <p className={`mt-1 text-xs font-black uppercase tracking-[0.12em] ${isLight ? "text-[#7F1D1D]" : "text-[#FFD166]"}`}>
                                                {getRoleName(staffMember)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className={`mt-4 space-y-2 border-t pt-3 text-sm font-semibold ${isLight ? "border-[#E4CFC3] text-[#6B5A52]" : "border-white/10 text-white/55"}`}>
                                        <p className="flex min-w-0 items-center gap-2">
                                            <Mail size={15} className="shrink-0" />
                                            <span className="truncate">{staffMember?.email || "No email"}</span>
                                        </p>
                                        <p className="flex min-w-0 items-center gap-2">
                                            <Phone size={15} className="shrink-0" />
                                            <span className="truncate">
                                                {staffMember?.phone_number || staffMember?.phone || "No phone"}
                                            </span>
                                        </p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className={`rounded-2xl border border-dashed p-8 text-center ${isLight ? "border-[#E4CFC3] bg-white/70 text-[#6B5A52]" : "border-white/10 bg-white/[0.04] text-white/55"}`}>
                            No staff members found for this restaurant.
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

export default RestaurantStaff;
