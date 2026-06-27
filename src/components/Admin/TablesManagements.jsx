import { useState } from "react";
import AddTableModal from "./AddTableModal";
import { TableProperties, CircleCheck, Clock3 } from "lucide-react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Utensils, Users } from "lucide-react";
import { useEffect } from "react";
import api from "../../API/axios";
function TablesManagements() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [editTable, setEditTable] = useState(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const deleteTable = async (id) => {
        try {
            await api.delete(`/tables/${id}`);
            getTables(); // refresh بعد الحذف
        } catch (error) {
            console.log(error);
        }
    };

    const getTables = async () => {
        try {
            const res = await api.get("/tables");

            const fixed = res.data.tables.map(t => ({
                ...t,
                is_active: Number(t.is_active)
            }));

            setTables(fixed);

        } catch (error) {
            console.log(error);
        }
    };
    useEffect(() => {
        getTables();
    }, []);
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#ffffff] to-[#c0b29f]">
            <div className="flex items-center justify-between px-10">
                <div className="pl-5 pt-5 text-left flex flex-col ml-3">

                    <h2 className="text-4xl font-bold">
                        TABLES MANAGEMENT
                    </h2>
                    <h5 className="text-lg mt-2 text-gray-600 ml-1">
                        Manage restaurant tables and reservations
                    </h5>

                </div>

            </div>
            <div className="grid grid-cols-3 gap-6 px-7 mt-12">
                <div className="bg-[#f8fbff] border border-blue-200 rounded-3xl p-8">

                    <div className="flex justify-between items-start">

                        <div className="w-14 h-14 rounded-2xl bg-blue-200 flex items-center justify-center">
                            <TableProperties />
                        </div>

                        <p className="font-bold text-blue-500">
                            TOTAL
                        </p>

                    </div>

                    <h3 className="text-5xl font-bold mt-6">
                        12
                    </h3>

                    <p className="text-gray-500 mt-2">
                        Total restaurant tables
                    </p>

                </div>


                <div className="bg-[#fff2f2] border border-red-200 rounded-3xl p-8">

                    <div className="flex justify-between items-start">

                        <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
                            <Clock3 />
                        </div>

                        <p className="font-bold text-red-600">
                            Pending
                        </p>

                    </div>

                    <h3 className="text-5xl font-bold mt-6">
                        5
                    </h3>

                    <p className="text-gray-500 mt-2">
                        Pending restaurant tables
                    </p>

                </div>

                <div className="bg-[#f7fff1] border border-green-200 rounded-3xl p-8">

                    <div className="flex justify-between items-start">

                        <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
                            <CircleCheck />
                        </div>

                        <p className="font-bold text-green-600">
                            Availalbe
                        </p>

                    </div>

                    <h3 className="text-5xl font-bold mt-6">
                        12
                    </h3>

                    <p className="text-gray-500 mt-2">
                        Availalbe restaurant tables
                    </p>

                </div>
            </div>

            <div className="bg-white rounded-3xl shadow mt-10 mx-7 p-8">
                <div className="flex justify-between items-center">

                    <h2 className="text-3xl font-bold">
                        Floor Plan Visualizer
                    </h2>

                </div>

                <div className="grid grid-cols-5 gap-9 mt-8">
                    {tables.map((table) => (
                        <div
                            key={table.id}
                            className={`border-4 rounded-3xl h-96 p-5 relative flex flex-col
       ${Number(table.is_active) === 1 ? "border-green-500" : "border-red-500"}`}
                        >

                            <span className={`absolute -top-[2px] -right-[2px] text-white text-sm px-3 py-1 rounded-bl-xl rounded-tr-3xl
      ${Number(table.is_active) === 1 ? "bg-green-600" : "bg-red-600"}`}>
                                {Number(table.is_active) === 1 ? "Active" : "Not Active"}
                            </span>

                            <div className="flex justify-center mt-10">
                                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                                    <Utensils size={48} />
                                </div>
                            </div>

                            <h3 className="text-3xl font-semibold text-center mt-8">
                                Table {table.table_number}
                            </h3>


                            <div className="mt-auto">
                                <div className="border-t border-gray-400 mt-6 mb-6"></div>

                                <div className="flex justify-center gap-6">

                                    {/* VIEW */}
                                    <button
                                        onClick={() => {
                                            setSelectedTable(table);
                                            setIsViewOpen(true);
                                        }}
                                        className="hover:text-blue-500 transition-all duration-200 hover:scale-110"
                                    >
                                        <Eye size={26} />
                                    </button>

                                    {/* EDIT */}
                                    <button
                                        onClick={() => {
                                            setEditTable(table);
                                            setIsEditOpen(true);
                                        }}
                                        className="hover:text-yellow-500 transition-all duration-200 hover:scale-110"
                                    >
                                        <Pencil size={26} />
                                    </button>

                                    {/* DELETE */}
                                    <button
                                        onClick={() => deleteTable(table.id)}
                                        className="hover:text-red-500 transition-all duration-200 hover:scale-110"
                                    >
                                        <Trash2 size={26} />
                                    </button>

                                </div>
                            </div>
                        </div>
                    ))}

                    <div
                        onClick={() => setIsModalOpen(true)}
                        className="border-2 border-dashed border-red-200 rounded-3xl h-96 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:border-[#f7ab20] hover:bg-orange-50 hover:scale-105"
                    >
                        <div className="w-20 h-20 rounded-full border-2 border-dashed border-red-200 flex items-center justify-center">
                            <span className="text-5xl text-gray-400">
                                +
                            </span>
                        </div>

                        <p className="mt-6 text-xl text-gray-500">
                            New Table
                        </p>

                    </div>

                </div>
            </div>
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
                    <div className="bg-white p-8 rounded-2xl w-[400px]">

                        <h2 className="text-2xl font-bold mb-4">
                            Table Details
                        </h2>

                        <p>Number: {selectedTable.table_number}</p>
                        <p>Status: {selectedTable.is_active ? "Active" : "Booked"}</p>

                        <button
                            onClick={() => setIsViewOpen(false)}
                            className="mt-5 bg-red-500 text-white px-4 py-2 rounded-xl"
                        >
                            Close
                        </button>

                    </div>
                </div>
            )}
        </div>
    );
}

export default TablesManagements;