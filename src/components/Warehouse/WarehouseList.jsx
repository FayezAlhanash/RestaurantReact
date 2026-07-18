import { Boxes, Building2, CirclePlus, PackageCheck, TriangleAlert, Warehouse } from "lucide-react";
import WarehouseCard from "./WarehouseCard";

function StatCard({ title, value, helper, icon: Icon, tone = "red" }) {
    const styles = {
        red: "bg-[#7F1D1D]/14 text-[#7F1D1D]",
        yellow: "bg-[#FFD166]/14 text-[#FFD166]",
        green: "bg-emerald-400/12 text-emerald-300",
    };
    const borders = {
        red: "border-[#7F1D1D]/45",
        yellow: "border-[#FFD166]/45",
        green: "border-emerald-400/45",
    };

    return (
        <div className={`rounded-[24px] border ${borders[tone]} bg-[#20292D]/88 p-5 shadow-[0_18px_38px_rgba(0,0,0,0.20)] ring-1 ring-white/[0.04] backdrop-blur-sm`}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-bold text-white/50">{title}</p>
                    <h3 className="mt-2 text-3xl font-black text-[#FFD166]">{value}</h3>
                </div>
                <div className={`grid h-12 w-12 place-items-center rounded-2xl ${styles[tone]}`}>
                    <Icon size={23} />
                </div>
            </div>
            <p className="mt-4 text-sm font-medium text-white/45">{helper}</p>
        </div>
    );
}

function WarehouseList({
    inventory = [],
    stats,
    search,
    onAdd,
    onEdit,
    onDelete,
    readOnly = false,
    isAdmin = false,
    restaurants = [],
    selectedRestaurantId = "",
    onRestaurantChange,
}) {
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
        <section className="cashier-scroll px-4 py-6 text-white sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
            </div>

            {isAdmin && (
                <div className="mt-5 rounded-[24px] border border-[#FFD166]/30 bg-[linear-gradient(135deg,rgba(255,209,102,0.10),rgba(32,41,45,0.88))] p-4 shadow-[0_18px_38px_rgba(0,0,0,0.20)] ring-1 ring-white/[0.04] backdrop-blur-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[#FFD166]/35 bg-[#FFD166]/12 text-[#FFD166]">
                                <Building2 size={21} />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFD166]">
                                    Admin warehouse view
                                </p>
                                <h3 className="text-lg font-black text-white">
                                    Choose restaurant warehouse
                                </h3>
                            </div>
                        </div>
                    </div>

                    {restaurants.length > 0 && (
                        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                            {restaurants.map((restaurant) => {
                                const active =
                                    String(selectedRestaurantId) === String(restaurant.id);

                                return (
                                    <button
                                        key={restaurant.id}
                                        type="button"
                                        onClick={() => onRestaurantChange?.(restaurant.id)}
                                        className={`shrink-0 rounded-2xl border px-4 py-2 text-sm font-black transition ${
                                            active
                                                ? "border-[#FFD166]/70 bg-[#FFD166]/16 text-[#FFD166] shadow-[0_12px_26px_rgba(255,209,102,0.12)]"
                                                : "border-white/12 bg-[#0D1214]/70 text-white/68 hover:border-[#FFD166]/35 hover:bg-[#FFD166]/10 hover:text-white"
                                        }`}
                                    >
                                        #{restaurant.id} {restaurant.name}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            <div className="mt-6 rounded-[28px] border border-[#3A4448] bg-[#182124]/90 p-4 shadow-[0_20px_46px_rgba(0,0,0,0.24)] ring-1 ring-white/[0.04] backdrop-blur-sm sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#FFD166]">
                            Live inventory
                        </p>
                        <h2 className="mt-1 text-2xl font-black text-white sm:text-3xl">
                            Current Inventory Levels
                        </h2>
                    </div>

                    {!readOnly && onAdd && (
                        <button
                            onClick={onAdd}
                            className="flex items-center justify-center gap-2 rounded-2xl bg-[#7F1D1D] px-5 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(127,29,29,0.20)] transition hover:bg-[#681718]"
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
                    <div className="rounded-[24px] border border-dashed border-[#465155] bg-[#20292D] px-6 py-14 text-center">
                        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#7F1D1D]/14 text-[#7F1D1D]">
                            <Boxes size={30} />
                        </div>
                        <h3 className="mt-4 text-xl font-black text-white">
                            {search ? "No ingredients found" : "No inventory yet"}
                        </h3>
                        <p className="mx-auto mt-2 max-w-md text-sm text-white/52">
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
