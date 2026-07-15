import { useEffect, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import api from "../../API/axios";
import WarehouseSideBar from "./WarehouseSideBar";
import WarehouseTopBar from "./WarehouseTopBar";
import { getStoredUser, storeUser } from "../../utils/auth";
import {
    getProfileUserPermissions,
    getUserPermissions,
    toPermissionKeys,
} from "../../utils/permissions";
import { ensureCurrentRestaurantId } from "../../utils/restaurant";

function WarehouseLayout() {
    const [inventory, setInventory] = useState([]);
    const [search, setSearch] = useState("");
    const [permissions, setPermissions] = useState(() => getUserPermissions());

    const getIngredients = async () => {
        try {
            const restaurantId = await ensureCurrentRestaurantId();
            if (!restaurantId) {
                setInventory([]);
                return;
            }

            const res = await api.get(`/restaurants/${restaurantId}/ingredients`);
            setInventory(res.data.data);
        } catch (error) {
            console.log(error.response?.data || error);
            setInventory([]);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        getIngredients();
    }, []);

    useEffect(() => {
        const refreshProfile = async () => {
            const user = getStoredUser();

            if (!user) return;

            try {
                const res = await api.get("/profile/permissions");
                const nextPermissions = toPermissionKeys(
                    getProfileUserPermissions(res.data)
                );

                storeUser(user, res.data);
                setPermissions(nextPermissions);
            } catch (error) {
                console.log(error.response?.data || error);
            }
        };

        refreshProfile();

        const handleFocus = () => {
            refreshProfile();
        };

        const handleVisibilityChange = () => {
            if (!document.hidden) {
                refreshProfile();
            }
        };

        window.addEventListener("focus", handleFocus);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    const stats = useMemo(() => {
        const total = inventory.length;
        const lowStock = inventory.filter(
            (item) => Number(item.current_quantity) <= Number(item.min_quantity)
        ).length;

        return {
            total,
            lowStock,
            healthy: total - lowStock,
            totalUnits: inventory.reduce(
                (sum, item) => sum + Number(item.current_quantity || 0),
                0
            ),
        };
    }, [inventory]);

    return (
        <div className="min-h-dvh bg-[#F8F5F1] font-[Raleway] text-[#27201D] lg:flex lg:h-dvh lg:overflow-hidden">
            <WarehouseSideBar stats={stats} permissions={permissions} />

            <main className="min-w-0 flex-1 lg:overflow-y-auto">
                <WarehouseTopBar search={search} setSearch={setSearch} />
                <Outlet context={{ search, refreshWarehouseStats: getIngredients, stats }} />
            </main>
        </div>
    );
}

export default WarehouseLayout;
