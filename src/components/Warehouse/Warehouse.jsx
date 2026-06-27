import { useState } from "react";

import WarehouseSideBar from "./WarehouseSideBar";
import WarehouseTopBar from "./WarehouseTopBar";
import WarehouseList from "./WarehouseList";
import WarehouseModal from "./WarehouseModal";

function Warehouse() {

    const [openModal, setOpenModal] = useState(false);

    const [inventory, setInventory] = useState([]);

    return (

        <div className="flex flex-col bg-[#F8F5F1] min-h-screen lg:flex-row">

            <WarehouseSideBar
                onAdd={() => setOpenModal(true)}
            />

            <div className="min-w-0 flex-1">

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
