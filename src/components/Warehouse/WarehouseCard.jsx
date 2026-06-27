import { Package } from "lucide-react";

function WarehouseCard({ item }) {
    return (
        <div
            className="
                bg-white
                rounded-2xl
                border
                border-[#E8D9D3]
                shadow-sm
                hover:shadow-md
                transition
                flex flex-col sm:flex-row
                sm:items-center
                justify-between
                px-4 sm:px-6
                py-4 sm:py-6
                gap-4
            "
        >

            {/* Left */}
            <div className="flex w-full sm:w-auto items-center gap-4 sm:gap-5">

                <div className="w-16 h-16 rounded-xl bg-[#F9F4F2] flex items-center justify-center">
                    <Package
                        size={30}
                        className="text-[#7F1D1D]"
                    />
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                        {item.name}
                    </h2>

                    <p className="text-gray-500 text-sm">
                        {item.category}
                    </p>
                </div>

            </div>

            {/* Right */}
            <div className="flex w-full items-baseline justify-between sm:block sm:w-auto sm:text-right">

                <h3 className="text-2xl font-bold text-[#7F1D1D]">
                    {item.quantity}
                </h3>

                <p className="text-gray-500">
                    {item.unit}
                </p>

            </div>

        </div>
    );
}

export default WarehouseCard;
