import { Boxes, CirclePlus, PackageCheck, TriangleAlert, Warehouse } from "lucide-react";
import WarehouseCard from "./WarehouseCard";

function StatCard({ title, value, helper, icon: Icon, tone = "red" }) {
    const styles = {
        red: "bg-[#F9ECEC] text-[#7F1D1D]",
        yellow: "bg-[#FFF6D8] text-[#84630A]",
        green: "bg-[#F0FAEC] text-[#2E7D32]",
        neutral: "bg-[#F8F5F1] text-[#6B5B55]",
    };

    return (
        <div className="rounded-[24px] border border-[#E8D9D3] bg-white p-5 shadow-[0_8px_30px_rgba(83,53,42,0.05)]">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-bold text-[#94847D]">{title}</p>
                    <h3 className="mt-2 text-3xl font-black text-[#2C2421]">{value}</h3>
                </div>
                <div className={`grid h-12 w-12 place-items-center rounded-2xl ${styles[tone]}`}>
                    <Icon size={23} />
                </div>
            </div>
            <p className="mt-4 text-sm text-[#8C7B74]">{helper}</p>
        </div>
    );
}

function WarehouseList({ inventory = [], stats, search, onAdd, onEdit, onDelete, readOnly = false }) {
    const fallbackStats = {
        total: inventory.length,
        lowStock: inventory.filter(
            (item) => Number(item.current_quantity) <= Number(item.min_quantity)
        ).length,
        healthy:
            inventory.length -
            inventory.filter(
                (item) => Number(item.current_quantity) <= Number(item.min_quantity)
            ).length,
        totalUnits: inventory.reduce(
            (sum, item) => sum + Number(item.current_quantity || 0),
            0
        ),
    };
    const displayStats = stats || fallbackStats;

    return (
        <section className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Total Ingredients"
                    value={displayStats.total || 0}
                    helper="Tracked in this restaurant"
                    icon={Warehouse}
                    tone="red"
                />
                <StatCard
                    title="Healthy Stock"
                    value={displayStats.healthy || 0}
                    helper="Above minimum level"
                    icon={PackageCheck}
                    tone="green"
                />
                <StatCard
                    title="Low Stock"
                    value={displayStats.lowStock || 0}
                    helper="Needs purchasing soon"
                    icon={TriangleAlert}
                    tone="yellow"
                />
                <StatCard
                    title="Total Quantity"
                    value={displayStats.totalUnits || 0}
                    helper="Combined available units"
                    icon={Boxes}
                    tone="neutral"
                />
            </div>

            <div className="mt-6 rounded-[28px] border border-[#E8D9D3] bg-white p-4 shadow-[0_12px_40px_rgba(83,53,42,0.06)] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A08980]">
                            Live inventory
                        </p>
                        <h2 className="mt-1 text-2xl font-black sm:text-3xl">
                            Current Inventory Levels
                        </h2>
                    </div>

                    {!readOnly && onAdd && (
                        <button
                            onClick={onAdd}
                            className="flex items-center justify-center gap-2 rounded-2xl bg-[#7F1D1D] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#681718]"
                        >
                            <CirclePlus size={18} />
                            Add Ingredient
                        </button>
                    )}
                </div>

                {inventory?.length ? (
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {inventory.map((item) => (
                            <WarehouseCard
                                key={item.id}
                                item={item}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-[24px] border border-dashed border-[#D9C8C0] bg-[#FDFBF9] px-6 py-14 text-center">
                        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#F9ECEC] text-[#7F1D1D]">
                            <Boxes size={30} />
                        </div>
                        <h3 className="mt-4 text-xl font-black">
                            {search ? "No ingredients found" : "No inventory yet"}
                        </h3>
                        <p className="mx-auto mt-2 max-w-md text-sm text-[#8C7B74]">
                            {search
                                ? "Try another search keyword."
                                : "Add your first ingredient to start tracking stock levels."}
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}

export default WarehouseList;
