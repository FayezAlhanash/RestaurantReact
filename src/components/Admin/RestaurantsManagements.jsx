import { useEffect, useMemo, useState } from "react";
import { Loader2, Lock, Plus, Store, Trash2, UtensilsCrossed, X } from "lucide-react";
import api from "../../API/axios";
import { getStoredUser } from "../../utils/auth";
import RestaurantModal from "./RestaurantsModal";
import AddRestaurantsCard from "./AddRestaurantsCard";
import RestaurantsCard from "./RestaurantCard";

function getLoginIdentifier(user) {
    return (
        user?.email ||
        user?.username ||
        user?.login ||
        user?.phone ||
        user?.name ||
        ""
    );
}

function DeletePasswordModal({
    restaurant,
    password,
    setPassword,
    errorMessage,
    isDeleting,
    onClose,
    onConfirm,
}) {
    if (!restaurant) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6">
            <form
                onSubmit={onConfirm}
                className="w-full max-w-md overflow-hidden rounded-[26px] border border-white/10 bg-[#182124] text-white shadow-2xl"
            >
                <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] bg-[radial-gradient(circle_at_100%_0%,rgba(185,28,28,0.24),transparent_36%),rgba(24,33,36,0.96)] px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[#B91C1C]/40 bg-[#B91C1C]/14 text-[#EF4444]">
                            <Trash2 size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#FFD166]">
                                Confirm delete
                            </p>
                            <h2 className="text-xl font-black text-white">
                                Delete {restaurant.name}
                            </h2>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="grid h-10 w-10 place-items-center rounded-xl text-white/55 transition hover:scale-110 hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
                        aria-label="Close delete confirmation"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4 p-5">
                    <p className="text-sm font-semibold leading-6 text-white/58">
                        Enter your account password to delete this restaurant. This
                        keeps accidental clicks from removing a branch.
                    </p>

                    <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                            Account password
                        </span>
                        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0D1214] px-4 py-3 transition focus-within:border-[#FFD166]/70 focus-within:ring-4 focus-within:ring-[#FFD166]/10">
                            <Lock size={18} className="shrink-0 text-white/35" />
                            <input
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                autoComplete="current-password"
                                placeholder="Enter password"
                                className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/30"
                                autoFocus
                            />
                        </div>
                    </label>

                    {errorMessage && (
                        <p className="rounded-2xl border border-[#B91C1C]/35 bg-[#B91C1C]/12 px-4 py-3 text-sm font-bold text-[#EF4444]">
                            {errorMessage}
                        </p>
                    )}
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-white/[0.08] bg-[#0D1214]/45 p-5 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="h-11 rounded-2xl border border-white/10 px-6 text-sm font-black text-white/65 transition hover:scale-[1.03] hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={isDeleting || !password.trim()}
                        className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#DC2626_0%,#B91C1C_52%,#991B1B_100%)] px-6 text-sm font-black text-white shadow-[0_16px_34px_rgba(185,28,28,0.28)] transition hover:scale-[1.03] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isDeleting && <Loader2 size={17} className="animate-spin" />}
                        Delete Restaurant
                    </button>
                </div>
            </form>
        </div>
    );
}

function RestaurantsManagements() {
    const [isOpen, setIsOpen] = useState(false);
    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [restaurantToDelete, setRestaurantToDelete] = useState(null);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteErrorMessage, setDeleteErrorMessage] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const getRestaurants = async () => {
        setIsLoading(true);
        setErrorMessage("");

        try {
            const response = await api.get("/restaurants");
            setRestaurants(response.data.restaurants || []);
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message || "Could not load restaurants."
            );
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = window.setTimeout(getRestaurants, 0);

        return () => window.clearTimeout(timeoutId);
    }, []);

    const handleOpenCreate = () => {
        setSelectedRestaurant(null);
        setIsOpen(true);
    };

    const handleOpenDelete = (restaurant) => {
        setRestaurantToDelete(restaurant);
        setDeletePassword("");
        setDeleteErrorMessage("");
    };

    const handleCloseDelete = () => {
        if (isDeleting) return;

        setRestaurantToDelete(null);
        setDeletePassword("");
        setDeleteErrorMessage("");
    };

    const handleConfirmDelete = async (event) => {
        event.preventDefault();

        if (!restaurantToDelete) return;

        const user = getStoredUser();
        const login = getLoginIdentifier(user);

        if (!login) {
            setDeleteErrorMessage("Could not identify the current account.");
            return;
        }

        if (!deletePassword.trim()) {
            setDeleteErrorMessage("Password is required.");
            return;
        }

        setIsDeleting(true);
        setDeleteErrorMessage("");

        try {
            const formData = new FormData();

            formData.append("login", login);
            formData.append("password", deletePassword);

            await api.post("/login", formData);
            await api.delete(`/restaurants/${restaurantToDelete.id}`);
            setRestaurants((prev) =>
                prev.filter((restaurant) => restaurant.id !== restaurantToDelete.id)
            );
            setRestaurantToDelete(null);
            setDeletePassword("");
            setDeleteErrorMessage("");
        } catch (error) {
            setDeleteErrorMessage(
                error.response?.data?.message ||
                    "Password is incorrect or restaurant could not be deleted."
            );
        } finally {
            setIsDeleting(false);
        }
    };

    const averageTax = useMemo(() => {
        if (!restaurants.length) return 0;

        const total = restaurants.reduce(
            (sum, restaurant) => sum + Number(restaurant.tax_percentage || 0),
            0
        );

        return total / restaurants.length;
    }, [restaurants]);

    return (
        <div className="min-h-full bg-[radial-gradient(circle_at_86%_10%,rgba(185,28,28,0.20),transparent_30%),radial-gradient(circle_at_18%_22%,rgba(255,209,102,0.12),transparent_26%),radial-gradient(circle_at_60%_82%,rgba(52,211,153,0.08),transparent_30%),linear-gradient(145deg,#0D1214_0%,#12191C_52%,#24171A_100%)] p-4 text-white sm:p-6 lg:p-8">
            <div className="mx-auto max-w-[1500px] space-y-6">
                <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(27,37,40,0.92)_0%,rgba(21,29,32,0.84)_55%,rgba(44,25,31,0.78)_100%)] p-5 shadow-[0_22px_55px_rgba(0,0,0,0.28)] ring-1 ring-white/[0.04] backdrop-blur-sm sm:p-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFD166]">
                                Restaurant network
                            </p>
                            <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">
                                Restaurants
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/55">
                                Create and manage every restaurant branch in one place.
                                There is no fixed limit on how many restaurants you can add.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleOpenCreate}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#B91C1C] px-5 text-sm font-black text-white shadow-[0_16px_34px_rgba(185,28,28,0.30)] transition hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-[#DC2626] hover:shadow-[0_20px_40px_rgba(220,38,38,0.34)] active:scale-[0.99]"
                        >
                            <Plus size={18} />
                            Add Restaurant
                        </button>
                    </div>

                    {errorMessage && (
                        <p className="mt-5 rounded-2xl border border-[#B91C1C]/35 bg-[#B91C1C]/12 px-4 py-3 text-sm font-bold text-[#EF4444]">
                            {errorMessage}
                        </p>
                    )}
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    <article className="rounded-[24px] border border-emerald-400/35 bg-emerald-400/10 p-5 text-white shadow-[0_18px_42px_rgba(0,0,0,0.22)] transition duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_24px_58px_rgba(0,0,0,0.30)]">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-300">
                                    Restaurants
                                </p>
                                <strong className="mt-3 block text-3xl font-black">
                                    {restaurants.length}
                                </strong>
                            </div>
                            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-emerald-400/35 bg-emerald-400/10 text-emerald-300">
                                <Store size={21} />
                            </div>
                        </div>
                    </article>

                    <article className="rounded-[24px] border border-[#B91C1C]/40 bg-[#B91C1C]/12 p-5 text-white shadow-[0_18px_42px_rgba(0,0,0,0.22)] transition duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:border-[#EF4444]/50 hover:shadow-[0_24px_58px_rgba(185,28,28,0.24)]">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#EF4444]">
                                    Average tax
                                </p>
                                <strong className="mt-3 block text-3xl font-black">
                                    {averageTax.toFixed(2)}%
                                </strong>
                            </div>
                            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[#B91C1C]/40 bg-[#B91C1C]/12 text-[#EF4444]">
                                %
                            </div>
                        </div>
                    </article>

                    <article className="rounded-[24px] border border-[#FFD166]/35 bg-[#FFD166]/10 p-5 text-white shadow-[0_18px_42px_rgba(0,0,0,0.22)] transition duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_24px_58px_rgba(0,0,0,0.30)]">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#FFD166]">
                                    Capacity
                                </p>
                                <strong className="mt-3 block text-3xl font-black">
                                    Open
                                </strong>
                            </div>
                            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[#FFD166]/35 bg-[#FFD166]/10 text-[#FFD166]">
                                <UtensilsCrossed size={21} />
                            </div>
                        </div>
                    </article>
                </section>

                <section className="grid grid-cols-1 gap-5 xl:grid-cols-2 xl:gap-8">
                    {isLoading ? (
                        <div className="col-span-full rounded-[24px] border border-white/10 bg-[#202B2F] p-10 text-center text-sm font-black text-white/45 shadow-[0_18px_42px_rgba(0,0,0,0.22)]">
                            Loading restaurants...
                        </div>
                    ) : (
                        <>
                            {restaurants.map((restaurant) => (
                                <RestaurantsCard
                                    key={restaurant.id}
                                    restaurant={restaurant}
                                    onDelete={() => handleOpenDelete(restaurant)}
                                    onEdit={(currentRestaurant) => {
                                        setSelectedRestaurant(currentRestaurant);
                                        setIsOpen(true);
                                    }}
                                />
                            ))}

                            <AddRestaurantsCard onClick={handleOpenCreate} />
                        </>
                    )}
                </section>

                <RestaurantModal
                    isOpen={isOpen}
                    restaurant={selectedRestaurant}
                    onClose={() => {
                        setIsOpen(false);
                        setSelectedRestaurant(null);
                    }}
                    onSave={(updatedRestaurant) => {
                        setRestaurants((prev) => {
                            const exists = prev.some(
                                (restaurant) => restaurant.id === updatedRestaurant.id
                            );

                            if (exists) {
                                return prev.map((restaurant) =>
                                    restaurant.id === updatedRestaurant.id
                                        ? updatedRestaurant
                                        : restaurant
                                );
                            }

                            return [...prev, updatedRestaurant];
                        });
                    }}
                />

                <DeletePasswordModal
                    restaurant={restaurantToDelete}
                    password={deletePassword}
                    setPassword={setDeletePassword}
                    errorMessage={deleteErrorMessage}
                    isDeleting={isDeleting}
                    onClose={handleCloseDelete}
                    onConfirm={handleConfirmDelete}
                />
            </div>
        </div>
    );
}

export default RestaurantsManagements;
