import { useEffect, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import api from "../../API/axios";
import WarehouseSideBar from "./WarehouseSideBar";
import WarehouseTopBar from "./WarehouseTopBar";

function WarehouseLayout() {
    const [inventory, setInventory] = useState([]);
    const [search, setSearch] = useState("");

    const getIngredients = async () => {
        try {
            const res = await api.get("/restaurants/1/ingredients");
            setInventory(res.data.data);
        } catch (error) {
            console.log(error.response?.data || error);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        getIngredients();
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
            <WarehouseSideBar stats={stats} />

            <main className="min-w-0 flex-1 lg:overflow-y-auto">
                <WarehouseTopBar search={search} setSearch={setSearch} />
                <Outlet context={{ search, refreshWarehouseStats: getIngredients, stats }} />
            </main>
        </div>
    );
}

export default WarehouseLayout;
