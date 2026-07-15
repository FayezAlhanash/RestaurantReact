import { useEffect, useMemo, useState } from "react";
import {
    CheckCircle2,
    Eye,
    LayoutGrid,
    Pencil,
    Plus,
    Search,
    Table2,
    Trash2,
    TriangleAlert,
    Utensils,
    X,
} from "lucide-react";
import AddTableModal from "./AddTableModal";
import api from "../../API/axios";

const normalizeActiveValue = (value) =>
    value === true ||
    value === 1 ||
    value === "1" ||
    String(value).toLowerCase() === "true" ||
    String(value).toLowerCase() === "active";

function StatCard({ icon: Icon, label, value, helper, tone }) {
    const tones = {
        total: "border-sky-200 bg-sky-50 text-sky-900",
        pending: "border-rose-200 bg-rose-50 text-rose-900",
        active: "border-emerald-200 bg-emerald-50 text-emerald-900",
    };

    return (
        <div className={`rounded-2xl border p-5 shadow-sm ${tones[tone]}`}>
            <div className="flex items-start justify-between gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/75 shadow-sm">
                    <Icon size={22} />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.14em] opacity-70">
                    {label}
                </p>
            </div>
            <strong className="mt-6 block text-4xl font-black">{value}</strong>
            <p className="mt-1 text-sm font-semibold opacity-70">{helper}</p>
        </div>
    );
}

function TablesManagements() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [editTable, setEditTable] = useState(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [search, setSearch] = useState("");

    const getTables = async () => {
        try {
            const res = await api.get("/tables");
            const fixed = (res.data.tables || []).map((table) => ({
                ...table,
                is_active: normalizeActiveValue(table.is_active) ? 1 : 0,
            }));

            setTables(fixed);

            return fixed;
        } catch (error) {
            console.log(error);
            return [];
        }
    };

    const deleteTable = async (id) => {
        try {
            await api.delete(`/tables/${id}`);
            getTables();
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        getTables();
    }, []);

    const query = search.trim().toLowerCase();
    const filteredTables = useMemo(() => {
        if (!query) return tables;

        return tables.filter((table) =>
            [`table ${table.table_number}`, table.table_number, Number(table.is_active) === 1 ? "active" : "not active"]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query))
        );
    }, [query, tables]);

    const activeTables = tables.filter((table) => Number(table.is_active) === 1).length;
    const inactiveTables = tables.length - activeTables;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FFFDFB] to-[#D2C7B8] px-4 py-6 sm:px-6 lg:px-7">
            <section className="overflow-hidden rounded-3xl border border-[#E8DCD4] bg-white shadow-[0_18px_45px_rgba(70,45,30,0.08)]">
                <div className="flex flex-col gap-5 border-b border-[#EFE3DD] bg-gradient-to-r from-[#FFF7F2] via-white to-[#F8F1EC] p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#7F1D1D] text-white shadow-[0_14px_30px_rgba(127,29,29,0.18)]">
                            <LayoutGrid size={27} />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9A7A70]">
                                Floor plan
                            </p>
                            <h1 className="mt-1 text-3xl font-black text-[#241F1D]">
                                Tables Management
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#7A6A64]">
                                Manage restaurant tables, availability, and floor-plan visibility
                                from one polished workspace.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#7F1D1D] px-5 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(127,29,29,0.18)] transition hover:-translate-y-0.5 hover:bg-[#681718]"
                    >
                        <Plus size={18} />
                        Add Table
                    </button>
                </div>

                <div className="grid gap-4 p-5 lg:grid-cols-3">
                    <StatCard
                        icon={Table2}
                        label="Total"
                        value={tables.length}
                        helper="Restaurant tables"
                        tone="total"
                    />
                    <StatCard
                        icon={TriangleAlert}
                        label="Not Active"
                        value={inactiveTables}
                        helper="Hidden or unavailable"
                        tone="pending"
                    />
                    <StatCard
                        icon={CheckCircle2}
                        label="Available"
                        value={activeTables}
                        helper="Active on floor plan"
                        tone="active"
                    />
                </div>
            </section>

            <section className="mt-6 overflow-hidden rounded-3xl border border-[#E8DCD4] bg-white shadow-[0_18px_45px_rgba(70,45,30,0.08)]">
                <div className="flex flex-col gap-4 border-b border-[#EFE3DD] bg-white p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#9A7A70]">
                            Floor Plan Visualizer
                        </p>
                        <h2 className="mt-1 text-2xl font-black text-[#241F1D]">
                            {filteredTables.length} table{filteredTables.length === 1 ? "" : "s"}
                        </h2>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-[#E4D6CF] bg-[#F8F5F1] px-4 py-3 shadow-sm lg:w-[360px]">
                        <Search size={18} className="shrink-0 text-[#A08980]" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search tables..."
                            className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-[#A08980]"
                        />
                    </div>
                </div>

                <div className="grid gap-5 p-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {filteredTables.map((table) => {
                        const isActive = Number(table.is_active) === 1;

                        return (
                            <article
                                key={table.id}
                                className={`group relative min-h-[280px] overflow-hidden rounded-[28px] border-2 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                                    isActive
                                        ? "border-emerald-300 hover:border-emerald-400"
                                        : "border-rose-200 hover:border-rose-300"
                                }`}
                            >
                                <span
                                    className={`absolute right-0 top-0 rounded-bl-2xl px-4 py-1.5 text-xs font-black text-white ${
                                        isActive ? "bg-emerald-600" : "bg-rose-600"
                                    }`}
                                >
                                    {isActive ? "Active" : "Not Active"}
                                </span>

                                <div className="mt-8 flex justify-center">
                                    <div className="grid h-20 w-20 place-items-center rounded-full bg-[#F1EEE9] text-[#241F1D] transition group-hover:scale-105">
                                        <Utensils size={40} />
                                    </div>
                                </div>

                                <h3 className="mt-6 text-center text-3xl font-black text-[#241F1D]">
                                    Table {table.table_number}
                                </h3>
                                <p className="mt-2 text-center text-sm font-semibold text-[#8C7B74]">
                                    ID #{table.id}
                                </p>

                                <div className="mt-8 border-t border-[#EFE3DD] pt-4">
                                    <div className="flex justify-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedTable(table);
                                                setIsViewOpen(true);
                                            }}
                                            title="View table"
                                            className="grid h-10 w-10 place-items-center rounded-xl border border-sky-200 bg-sky-50 text-sky-700 transition hover:scale-110 hover:bg-sky-600 hover:text-white"
                                        >
                                            <Eye size={18} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditTable(table);
                                                setIsEditOpen(true);
                                            }}
                                            title="Edit table"
                                            className="grid h-10 w-10 place-items-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700 transition hover:scale-110 hover:bg-amber-500 hover:text-white"
                                        >
                                            <Pencil size={18} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => deleteTable(table.id)}
                                            title="Delete table"
                                            className="grid h-10 w-10 place-items-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:scale-110 hover:bg-rose-600 hover:text-white"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}

                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="group min-h-[280px] rounded-[28px] border-2 border-dashed border-[#E6C5C5] bg-[#FFFDFB] p-5 text-[#7F1D1D] transition hover:-translate-y-1 hover:border-[#7F1D1D] hover:bg-[#F9ECEC] hover:shadow-xl"
                    >
                        <div className="flex h-full flex-col items-center justify-center">
                            <div className="grid h-20 w-20 place-items-center rounded-full border-2 border-dashed border-[#E6C5C5] bg-white text-[#7F1D1D] transition group-hover:scale-105 group-hover:border-[#7F1D1D]">
                                <Plus size={32} />
                            </div>
                            <p className="mt-6 text-xl font-black">New Table</p>
                            <p className="mt-2 text-sm font-semibold text-[#9A7A70]">
                                Add another floor-plan spot
                            </p>
                        </div>
                    </button>
                </div>
            </section>

            <AddTableModal
                isOpen={isModalOpen || isEditOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setIsEditOpen(false);
                    setEditTable(null);
                }}
                editData={editTable}
                refresh={getTables}
            />

            {isViewOpen && selectedTable && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#241F1D]/45 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9A7A70]">
                                    Table details
                                </p>
                                <h2 className="mt-1 text-2xl font-black text-[#241F1D]">
                                    Table {selectedTable.table_number}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsViewOpen(false)}
                                className="grid h-10 w-10 place-items-center rounded-2xl text-[#7A6A64] transition hover:bg-[#F9ECEC] hover:text-[#7F1D1D]"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mt-5 rounded-2xl border border-[#E8DCD4] bg-[#F8F5F1] p-4">
                            <div className="flex justify-between text-sm font-bold text-[#6D5D56]">
                                <span>Number</span>
                                <span className="text-[#241F1D]">
                                    {selectedTable.table_number}
                                </span>
                            </div>
                            <div className="mt-3 flex justify-between text-sm font-bold text-[#6D5D56]">
                                <span>Status</span>
                                <span
                                    className={
                                        Number(selectedTable.is_active) === 1
                                            ? "text-emerald-700"
                                            : "text-rose-700"
                                    }
                                >
                                    {Number(selectedTable.is_active) === 1 ? "Active" : "Not Active"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TablesManagements;
