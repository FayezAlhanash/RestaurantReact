import { useState } from "react";

import WarehouseSideBar from "./WarehouseSideBar";
import WarehouseTopBar from "./WarehouseTopBar";
import WarehouseList from "./WarehouseList";
import WarehouseModal from "./WarehouseModal";

function Warehouse() {

    const [openModal, setOpenModal] = useState(false);

    const [inventory, setInventory] = useState([]);

    return (

        <div className="flex bg-[#F8F5F1] min-h-screen">

            <WarehouseSideBar
                onAdd={() => setOpenModal(true)}
            />

            <div className="flex-1">

                <WarehouseTopBar />

                <WarehouseList
                    inventory={inventory}
                />

            </div>

            <WarehouseModal

                isOpen={openModal}

                onClose={() => setOpenModal(false)}

                onSave={(item) => {

                    setInventory([
                        ...inventory,
                        {
                            id: Date.now(),
                            ...item,
                        },
                    ]);

                }}

            />

        </div>

    );
}

export default Warehouse;