import WarehouseCard from "./WarehouseCard";

function WarehouseList({ inventory }) {
    return (
        <div className="px-8 pb-8">

            <div className="bg-white rounded-2xl border border-[#E8D9D3] p-6">

                <h2 className="text-3xl font-bold mb-6">
                    Current Inventory Levels
                </h2>

                <div className="space-y-5">

                    {inventory.map((item) => (
                        <WarehouseCard
                            key={item.id}
                            item={item}
                        />
                    ))}

                </div>

            </div>

        </div>
    );
}

export default WarehouseList;