import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../../API/axios";
import { getUserPermissions } from "../../utils/permissions";
import { ensureCurrentRestaurantId } from "../../utils/restaurant";
import WarehouseList from "./WarehouseList";
import WarehouseModal from "./WarehouseModal";

function Warehouse() {
    const [selectedIngredient, setSelectedIngredient] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [deleteIngredient, setDeleteIngredient] = useState(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [inventory, setInventory] = useState([]);
    const [permissionMessage, setPermissionMessage] = useState("");
    const outletContext = useOutletContext() || {};
    const search = outletContext.search || "";
    const permissions = getUserPermissions();
    const canManageInventory = permissions.includes("manage_inventory");

    const denyManageInventory = () => {
        setPermissionMessage("You do not have permission to manage inventory.");
    };

    const getIngredients = async () => {
        const restaurantId = await ensureCurrentRestaurantId();
        if (!restaurantId) {
            setInventory([]);
            return;
        }

        const res = await api.get(`/restaurants/${restaurantId}/ingredients`);
        setInventory(res.data.data);
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        getIngredients();
    }, []);

    const addIngredient = async (ingredient) => {
        if (!canManageInventory) {
            denyManageInventory();
            return;
        }

        try {
            const restaurantId = await ensureCurrentRestaurantId();
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
            const restaurantId = await ensureCurrentRestaurantId();
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

        try {
            const restaurantId = await ensureCurrentRestaurantId();
            if (!restaurantId) return;

            await api.delete(`/restaurants/${restaurantId}/ingredients/${deleteIngredient.id}`);
            getIngredients();
            outletContext.refreshWarehouseStats?.();
            setIsDeleteOpen(false);
            setDeleteIngredient(null);
        } catch (error) {
            console.log(error.response?.data || error);
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

                    setDeleteIngredient(ingredient);
                    setIsDeleteOpen(true);
                }}
            />

            {permissionMessage && (
                <div className="fixed bottom-5 left-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-center text-sm font-extrabold text-red-700 shadow-xl">
                    {permissionMessage}
                    <button
                        type="button"
                        onClick={() => setPermissionMessage("")}
                        className="ml-3 text-red-900 underline"
                    >
                        Close
                    </button>
                </div>
            )}

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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-[420px] rounded-[28px] bg-white p-6 shadow-2xl">
                        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-600">
                            !
                        </div>

                        <h2 className="text-center text-2xl font-extrabold">
                            Delete Ingredient
                        </h2>

                        <p className="mt-3 text-center text-gray-600">
                            Are you sure you want to delete
                        </p>

                        <p className="mt-2 text-center text-lg font-bold">
                            {deleteIngredient.name}?
                        </p>

                        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
                            <button
                                onClick={() => setIsDeleteOpen(false)}
                                className="flex-1 rounded-2xl border border-gray-200 py-3 font-bold transition hover:bg-gray-50"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleDelete}
                                className="flex-1 rounded-2xl bg-red-600 py-3 font-bold text-white transition hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Warehouse;
