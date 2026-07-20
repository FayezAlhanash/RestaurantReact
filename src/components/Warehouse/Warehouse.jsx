import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../../API/axios";
import { getStoredUser, ROLE_IDS } from "../../utils/auth";
import { getUserPermissions } from "../../utils/permissions";
import { ensureCurrentRestaurantId } from "../../utils/restaurant";
import PermissionToast from "../Shared/PermissionToast";
import WarehouseList from "./WarehouseList";
import WarehouseModal from "./WarehouseModal";

function Warehouse() {
    const [selectedIngredient, setSelectedIngredient] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [deleteIngredient, setDeleteIngredient] = useState(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [inventory, setInventory] = useState([]);
    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
    const [permissionMessage, setPermissionMessage] = useState("");
    const outletContext = useOutletContext() || {};
    const search = outletContext.search || "";
    const permissions = getUserPermissions();
    const canManageInventory = permissions.includes("manage_inventory");
    const user = getStoredUser();
    const isAdmin = Number(user?.role_id ?? user?.role?.id) === ROLE_IDS.ADMIN;

    const denyManageInventory = () => {
        setPermissionMessage("You do not have permission to manage inventory.");
    };

    const getActiveRestaurantId = useCallback(async () => {
        if (isAdmin) return selectedRestaurantId || null;

        return ensureCurrentRestaurantId();
    }, [isAdmin, selectedRestaurantId]);

    const getIngredientRestaurantId = async (ingredient) =>
        ingredient?.restaurant_id ??
        ingredient?.restaurant?.id ??
        (await getActiveRestaurantId());

    const getIngredients = useCallback(async () => {
        const restaurantId = await getActiveRestaurantId();
        if (!restaurantId) {
            setInventory([]);
            return;
        }

        const res = await api.get(`/restaurants/${restaurantId}/ingredients`);
        setInventory(res.data.data);
    }, [getActiveRestaurantId]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        getIngredients();
    }, [getIngredients]);

    useEffect(() => {
        if (!isAdmin) return undefined;

        const fetchRestaurants = async () => {
            try {
                const res = await api.get("/restaurants");
                const restaurantList = res.data.restaurants || res.data.data || [];

                setRestaurants(restaurantList);
                setSelectedRestaurantId((current) =>
                    current || restaurantList[0]?.id || ""
                );
            } catch (error) {
                console.log(error.response?.data || error);
            }
        };

        fetchRestaurants();
    }, [isAdmin]);

    const addIngredient = async (ingredient) => {
        if (!canManageInventory) {
            denyManageInventory();
            return;
        }

        try {
            const restaurantId = await getActiveRestaurantId();
            if (!restaurantId) return;

            await api.post(`/restaurants/${restaurantId}/ingredients`, ingredient);
            getIngredients();
            outletContext.refreshWarehouseStats?.();
            setOpenModal(false);
        } catch (error) {
            console.log(error.response?.data || error);
        }
    };

    const updateIngredient = async (ingredient) => {
        if (!canManageInventory) {
            denyManageInventory();
            return;
        }

        try {
            const restaurantId = await getActiveRestaurantId();
            if (!restaurantId) return;

            await api.patch(`/restaurants/${restaurantId}/ingredients/${ingredient.id}`, {
                name: ingredient.name,
                unit: ingredient.unit,
                current_quantity: ingredient.current_quantity,
                min_quantity: ingredient.min_quantity,
            });

            getIngredients();
            outletContext.refreshWarehouseStats?.();
            setSelectedIngredient(null);
            setOpenModal(false);
        } catch (error) {
            console.log(error.response?.data || error);
        }
    };

    const handleEdit = (ingredient) => {
        if (!canManageInventory) {
            denyManageInventory();
            return;
        }

        setSelectedIngredient(ingredient);
        setOpenModal(true);
    };

    const handleDelete = async () => {
        if (!canManageInventory) {
            denyManageInventory();
            return;
        }

        if (!deleteIngredient?.id || isDeleting) return;

        setIsDeleting(true);
        setPermissionMessage("");
        setDeleteError("");

        try {
            const restaurantId = await getIngredientRestaurantId(deleteIngredient);
            if (!restaurantId) return;

            await api.delete(`/restaurants/${restaurantId}/ingredients/${deleteIngredient.id}`);
            getIngredients();
            outletContext.refreshWarehouseStats?.();
            setIsDeleteOpen(false);
            setDeleteIngredient(null);
        } catch (error) {
            console.log(error.response?.data || error);
            const message = String(error.response?.data?.message || "");
            const isLinkedToRecipes =
                error.response?.status === 500 &&
                (message.includes("food_ingredient") ||
                    message.includes("Foreign key violation") ||
                    message.includes("SQLSTATE[23503]"));

            setDeleteError(
                isLinkedToRecipes
                    ? "This ingredient is used in recipes. Remove it from recipes first, then delete it."
                    : message || "Ingredient could not be deleted from the dashboard."
            );
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredInventory = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return inventory;

        return inventory.filter((item) =>
            `${item.name} ${item.unit}`.toLowerCase().includes(query)
        );
    }, [inventory, search]);

    const stats = useMemo(() => ({
        total: inventory?.length || 0,
        lowStock: inventory?.filter(i =>
            Number(i.current_quantity) <= Number(i.min_quantity)
        ).length || 0,
        healthy: (inventory?.length || 0) - (inventory?.filter(i =>
            Number(i.current_quantity) <= Number(i.min_quantity)
        ).length || 0),
        totalUnits: inventory?.reduce(
            (sum, item) => sum + Number(item.current_quantity || 0),
            0
        ) || 0
    }), [inventory]);

    return (
        <>
            <WarehouseList
                inventory={filteredInventory}
                stats={stats}
                search={search}
                isAdmin={isAdmin}
                restaurants={restaurants}
                selectedRestaurantId={selectedRestaurantId}
                onRestaurantChange={(restaurantId) => {
                    setSelectedRestaurantId(restaurantId);
                    setSelectedIngredient(null);
                    setOpenModal(false);
                }}
                onAdd={() => {
                    if (!canManageInventory) {
                        denyManageInventory();
                        return;
                    }

                    setSelectedIngredient(null);
                    setOpenModal(true);
                }}
                onEdit={handleEdit}
                onDelete={(ingredient) => {
                    if (!canManageInventory) {
                        denyManageInventory();
                        return;
                    }

                    setDeleteError("");
                    setDeleteIngredient(ingredient);
                    setIsDeleteOpen(true);
                }}
            />

            <PermissionToast
                message={permissionMessage}
                onClose={() => setPermissionMessage("")}
            />

            <WarehouseModal
                isOpen={openModal}
                onClose={() => {
                    setOpenModal(false);
                    setSelectedIngredient(null);
                }}
                onSave={selectedIngredient ? updateIngredient : addIngredient}
                ingredient={selectedIngredient}
            />

            {isDeleteOpen && deleteIngredient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-md">
                    <div className="w-full max-w-[420px] rounded-[28px] border border-white/10 bg-[#12191C] p-6 text-white shadow-[0_34px_90px_rgba(0,0,0,0.55)]">
                        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#7F1D1D]/14 text-[#7F1D1D]">
                            !
                        </div>

                        <h2 className="text-center text-2xl font-extrabold text-white">
                            Delete Ingredient
                        </h2>

                        <p className="mt-3 text-center text-white/55">
                            Are you sure you want to delete
                        </p>

                        <p className="mt-2 text-center text-lg font-bold text-[#FFD166]">
                            {deleteIngredient.name}?
                        </p>

                        {deleteError && (
                            <p className="mt-4 rounded-2xl border border-[#7F1D1D]/25 bg-[#7F1D1D]/12 px-4 py-3 text-center text-sm font-bold text-[#7F1D1D]">
                                {deleteError}
                            </p>
                        )}

                        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
                            <button
                                onClick={() => {
                                    setIsDeleteOpen(false);
                                    setDeleteError("");
                                }}
                                className="flex-1 rounded-2xl border border-white/10 py-3 font-bold text-white/70 transition hover:bg-white/[0.07] hover:text-white"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 rounded-2xl bg-[#7F1D1D] py-3 font-bold text-white shadow-[0_14px_28px_rgba(127,29,29,0.20)] transition hover:bg-[#681718] disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/40"
                            >
                                {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Warehouse;
