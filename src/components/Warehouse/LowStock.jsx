import { useCallback, useEffect, useState } from "react";
import api from "../../API/axios";
import { getStoredUser, ROLE_IDS } from "../../utils/auth";
import { ensureCurrentRestaurantId } from "../../utils/restaurant";
import WarehouseList from "./WarehouseList";

function LowStock() {
    const [inventory, setInventory] = useState([]);
    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
    const user = getStoredUser();
    const isAdmin = Number(user?.role_id ?? user?.role?.id) === ROLE_IDS.ADMIN;

    const getActiveRestaurantId = useCallback(async () => {
        if (isAdmin) return selectedRestaurantId || null;

        return ensureCurrentRestaurantId();
    }, [isAdmin, selectedRestaurantId]);

    const getLowStock = useCallback(async () => {
        try {
            const restaurantId = await getActiveRestaurantId();
            if (!restaurantId) {
                setInventory([]);
                return;
            }

            const res = await api.get(
                `/restaurants/${restaurantId}/inventory-alerts/low-stock`
            );

            setInventory(res.data.data);

        } catch (error) {
            console.log(error.response?.data || error);
            setInventory([]);
        }
    }, [getActiveRestaurantId]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        getLowStock();
    }, [getLowStock]);

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

    return (
        <div className="min-h-full">
            <WarehouseList
                inventory={inventory}
                readOnly={true}
                isAdmin={isAdmin}
                restaurants={restaurants}
                selectedRestaurantId={selectedRestaurantId}
                onRestaurantChange={(restaurantId) => {
                    setSelectedRestaurantId(restaurantId);
                }}
            />
        </div>
    );
}

export default LowStock;
