import { useEffect, useState } from "react";
import api from "../../API/axios";
import WarehouseList from "./WarehouseList";

function LowStock() {
    const [inventory, setInventory] = useState([]);

    const getLowStock = async () => {
        try {
            const res = await api.get(
                "/restaurants/1/inventory-alerts/low-stock"
            );

            setInventory(res.data.data);

        } catch (error) {
            console.log(error.response?.data || error);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        getLowStock();
    }, []);

    return (
        <div className="flex flex-col bg-[#F8F5F1] min-h-screen lg:flex-row">

         
            <div className="min-w-0 flex-1">

                

                <WarehouseList
                    inventory={inventory}
                    readOnly={true}
                />

            </div>

        </div>
    );
}

export default LowStock;
