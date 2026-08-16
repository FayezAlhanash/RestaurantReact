import {
    AlertCircle,
    MessageSquareText,
    RefreshCw,
    Search,
    Star,
    Truck,
    UserRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../API/axios";
import { getStoredUser } from "../../utils/auth";

const getList = (data, key) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(data?.data?.[key])) return data.data[key];
    if (Array.isArray(data?.reviews)) return data.reviews;
    if (Array.isArray(data?.delivery_reviews)) return data.delivery_reviews;
    if (Array.isArray(data?.deliveryReviews)) return data.deliveryReviews;
    if (Array.isArray(data?.users)) return data.users;
    if (Array.isArray(data?.staff)) return data.staff;
    if (Array.isArray(data?.drivers)) return data.drivers;
    if (Array.isArray(data?.data)) return data.data;
    return [];
};

function getName(value = {}) {
    return (
        [value.first_name, value.last_name].filter(Boolean).join(" ") ||
        value.name ||
        value.full_name ||
        value.username ||
        value.email ||
        `Driver #${value.id ?? value.driver_id ?? ""}`
    );
}

function getRoleName(user = {}) {
    return user.role?.name || user.role_name || user.roleName || "";
}

function getDriverId(user = {}) {
    return (
        user.driver_id ??
        user.driver?.id ??
        user.employee?.driver_id ??
        user.staff?.driver_id ??
        user.id
    );
}

function isDeliveryDriver(user = {}) {
    const roleName = getRoleName(user).toLowerCase();

    return (
        roleName.includes("delivery") ||
        roleName.includes("driver") ||
        Boolean(user.driver_id || user.driver?.id || user.is_driver || user.isDriver)
    );
}

function getRating(review = {}) {
    return Number(
        review.rating ??
            review.stars ??
            review.score ??
            review.delivery_rating ??
            review.deliveryRating ??
            0
    );
}

function getComment(review = {}) {
    return (
        review.comment ||
        review.review ||
        review.feedback ||
        review.note ||
        review.notes ||
        "No comment"
    );
}

function getCustomerName(review = {}) {
    return (
        review.customer?.name ||
        review.user?.name ||
        review.customer_name ||
        review.customerName ||
        review.reviewer_name ||
        "Customer"
    );
}

function getReviewDate(review = {}) {
    const rawDate = review.created_at || review.createdAt || review.date || review.reviewed_at;
    const date = new Date(rawDate);

    if (!rawDate || Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
    });
}

function RatingStars({ value }) {
    const rating = Math.max(0, Math.min(5, Math.round(Number(value || 0))));

    return (
        <span className="flex items-center gap-1 text-[#FFD166]">
            {Array.from({ length: 5 }).map((_, index) => (
                <Star
                    key={index}
                    size={15}
                    fill={index < rating ? "currentColor" : "none"}
                    className={index < rating ? "text-[#FFD166]" : "text-white/20"}
                />
            ))}
        </span>
    );
}

function DeliveryReviews() {
    const [drivers, setDrivers] = useState([]);
    const [selectedDriverId, setSelectedDriverId] = useState("");
    const [reviews, setReviews] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoadingDrivers, setIsLoadingDrivers] = useState(true);
    const [isLoadingReviews, setIsLoadingReviews] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const selectedDriver = drivers.find(
        (driver) => String(getDriverId(driver)) === String(selectedDriverId)
    );

    const filteredDrivers = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        if (!query) return drivers;

        return drivers.filter((driver) =>
            [getName(driver), driver.email, driver.phone_number, getRoleName(driver)]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(query)
        );
    }, [drivers, searchQuery]);

    const averageRating = useMemo(() => {
        if (!reviews.length) return 0;

        const total = reviews.reduce((sum, review) => sum + getRating(review), 0);
        return total / reviews.length;
    }, [reviews]);

    const loadDrivers = useCallback(async () => {
        setIsLoadingDrivers(true);
        setErrorMessage("");

        try {
            const response = await api.get("/delivery-reviews/drivers");
            const currentUser = getStoredUser();
            const deliveryDrivers = getList(response.data, "drivers");
            const currentUserIsDriver =
                currentUser && isDeliveryDriver(currentUser)
                    ? [currentUser]
                    : [];
            const uniqueDrivers = [...deliveryDrivers, ...currentUserIsDriver].filter(
                (driver, index, list) =>
                    list.findIndex(
                        (item) => String(getDriverId(item)) === String(getDriverId(driver))
                    ) === index
            );

            setDrivers(uniqueDrivers);
            setSelectedDriverId((current) => current || getDriverId(uniqueDrivers[0]) || "");
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message || "Delivery drivers could not be loaded."
            );
        } finally {
            setIsLoadingDrivers(false);
        }
    }, []);

    const loadReviews = useCallback(async (driverId) => {
        if (!driverId) {
            setReviews([]);
            return;
        }

        setIsLoadingReviews(true);
        setErrorMessage("");

        try {
            const response = await api.get(`/drivers/${driverId}/delivery-reviews`);
            setReviews(getList(response.data, "reviews"));
        } catch (error) {
            setReviews([]);
            setErrorMessage(
                error.response?.data?.message || "Delivery reviews could not be loaded."
            );
        } finally {
            setIsLoadingReviews(false);
        }
    }, []);

    useEffect(() => {
        loadDrivers();
    }, [loadDrivers]);

    useEffect(() => {
        loadReviews(selectedDriverId);
    }, [loadReviews, selectedDriverId]);

    return (
        <div className="min-h-full overflow-y-auto bg-[radial-gradient(circle_at_82%_10%,rgba(127,29,29,0.16),transparent_30%),radial-gradient(circle_at_18%_20%,rgba(255,209,102,0.12),transparent_26%),linear-gradient(145deg,#0D1214_0%,#12191C_54%,#22171A_100%)] p-4 text-white sm:p-6 lg:p-8">
            <div className="mx-auto max-w-[1500px]">
                <section className="mb-6 overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(27,37,40,0.92)_0%,rgba(21,29,32,0.84)_55%,rgba(44,25,31,0.78)_100%)] p-5 shadow-[0_22px_55px_rgba(0,0,0,0.28)] ring-1 ring-white/[0.04] sm:p-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFD166]">
                                Delivery quality
                            </p>
                            <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">
                                Delivery Reviews
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm font-medium text-white/55">
                                Driver feedback and rating history.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                loadDrivers();
                                loadReviews(selectedDriverId);
                            }}
                            disabled={isLoadingDrivers || isLoadingReviews}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#7F1D1D] px-5 text-sm font-black text-white shadow-[0_16px_34px_rgba(127,29,29,0.28)] transition hover:-translate-y-0.5 hover:bg-[#681718] disabled:cursor-wait disabled:opacity-60"
                        >
                            <RefreshCw
                                size={18}
                                className={isLoadingDrivers || isLoadingReviews ? "animate-spin" : ""}
                            />
                            Refresh
                        </button>
                    </div>

                    {errorMessage && (
                        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#7F1D1D]/30 bg-[#7F1D1D]/10 px-4 py-3 text-sm font-bold text-[#ffb4b4]">
                            <AlertCircle size={18} className="mt-0.5 shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    )}
                </section>

                <section className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
                    <aside className="min-h-[520px] rounded-[28px] border border-white/10 bg-[#252A2D]/88 p-4 shadow-[0_18px_42px_rgba(0,0,0,0.22)]">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#FFD166]">
                                    Drivers
                                </p>
                                <h2 className="mt-1 text-2xl font-black text-white">
                                    {drivers.length}
                                </h2>
                            </div>
                            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[#FFD166]/35 bg-[#FFD166]/12 text-[#FFD166]">
                                <Truck size={23} />
                            </div>
                        </div>

                        <label className="mb-4 flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-black/18 px-4 text-white/65">
                            <Search size={17} />
                            <input
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="Search drivers"
                                className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/35"
                            />
                        </label>

                        <div className="max-h-[410px] space-y-2 overflow-y-auto pr-1">
                            {isLoadingDrivers ? (
                                <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.04] p-5 text-sm font-bold text-white/45">
                                    Loading drivers...
                                </div>
                            ) : filteredDrivers.length ? (
                                filteredDrivers.map((driver) => {
                                    const driverId = getDriverId(driver);
                                    const isActive = String(selectedDriverId) === String(driverId);

                                    return (
                                        <button
                                            key={driverId}
                                            type="button"
                                            onClick={() => setSelectedDriverId(driverId)}
                                            className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                                                isActive
                                                    ? "border-[#FFD166]/65 bg-[#FFD166]/14 text-white"
                                                    : "border-white/10 bg-white/[0.04] text-white/70 hover:border-[#FFD166]/35 hover:bg-white/[0.07] hover:text-white"
                                            }`}
                                        >
                                            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
                                                isActive
                                                    ? "bg-[#FFD166] text-[#16120a]"
                                                    : "bg-black/22 text-[#FFD166]"
                                            }`}>
                                                <UserRound size={20} />
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm font-black">
                                                    {getName(driver)}
                                                </span>
                                                <span className="mt-1 block truncate text-xs font-semibold text-white/42">
                                                    Driver #{driverId}
                                                </span>
                                            </span>
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.04] p-5 text-sm font-bold text-white/45">
                                    No delivery drivers found.
                                </div>
                            )}
                        </div>
                    </aside>

                    <main className="min-h-[520px] rounded-[28px] border border-white/10 bg-[#252A2D]/88 p-5 shadow-[0_18px_42px_rgba(0,0,0,0.22)] sm:p-6">
                        <div className="mb-6 grid gap-4 md:grid-cols-3">
                            <article className="rounded-2xl border border-white/10 bg-black/16 p-4">
                                <p className="text-xs font-black uppercase tracking-[0.14em] text-white/42">
                                    Driver
                                </p>
                                <h3 className="mt-2 truncate text-xl font-black text-white">
                                    {selectedDriver ? getName(selectedDriver) : "No driver"}
                                </h3>
                            </article>
                            <article className="rounded-2xl border border-white/10 bg-black/16 p-4">
                                <p className="text-xs font-black uppercase tracking-[0.14em] text-white/42">
                                    Reviews
                                </p>
                                <h3 className="mt-2 text-xl font-black tabular-nums text-white">
                                    {isLoadingReviews ? "..." : reviews.length}
                                </h3>
                            </article>
                            <article className="rounded-2xl border border-[#FFD166]/25 bg-[#FFD166]/10 p-4">
                                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#FFD166]/75">
                                    Average rating
                                </p>
                                <div className="mt-2 flex items-center gap-3">
                                    <h3 className="text-xl font-black tabular-nums text-[#FFD166]">
                                        {averageRating ? averageRating.toFixed(1) : "0.0"}
                                    </h3>
                                    <RatingStars value={averageRating} />
                                </div>
                            </article>
                        </div>

                        <div className="space-y-3">
                            {isLoadingReviews ? (
                                <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.04] p-6 text-sm font-bold text-white/45">
                                    Loading delivery reviews...
                                </div>
                            ) : reviews.length ? (
                                reviews.map((review, index) => {
                                    const rating = getRating(review);

                                    return (
                                        <article
                                            key={review.id ?? `${selectedDriverId}-${index}`}
                                            className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 transition hover:border-[#FFD166]/30 hover:bg-white/[0.065]"
                                        >
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-3">
                                                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#7F1D1D]/18 text-[#ffb4b4]">
                                                            <MessageSquareText size={18} />
                                                        </span>
                                                        <div className="min-w-0">
                                                            <h4 className="truncate text-base font-black text-white">
                                                                {getCustomerName(review)}
                                                            </h4>
                                                            <p className="mt-1 text-xs font-semibold text-white/38">
                                                                {getReviewDate(review)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <p className="mt-4 text-sm font-semibold leading-6 text-white/68">
                                                        {getComment(review)}
                                                    </p>
                                                </div>
                                                <div className="shrink-0 rounded-2xl border border-[#FFD166]/20 bg-[#FFD166]/10 px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-base font-black text-[#FFD166]">
                                                            {rating || 0}
                                                        </span>
                                                        <RatingStars value={rating} />
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })
                            ) : (
                                <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.04] p-8 text-center">
                                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#FFD166]/12 text-[#FFD166]">
                                        <MessageSquareText size={24} />
                                    </div>
                                    <h3 className="mt-4 text-lg font-black text-white">
                                        No delivery reviews yet.
                                    </h3>
                                </div>
                            )}
                        </div>
                    </main>
                </section>
            </div>
        </div>
    );
}

export default DeliveryReviews;
