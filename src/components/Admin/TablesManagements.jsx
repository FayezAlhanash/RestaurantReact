import { TableProperties, CircleCheck, Clock3 } from "lucide-react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Utensils, Users } from "lucide-react";
function TablesManagements() {
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
                    <div className="border-4 border-green-500 rounded-3xl h-96 p-5 relative flex flex-col">

                        <span className="absolute -top-[2px] -right-[2px] font-[lemon] bg-green-700 text-white text-sm px-3 py-1 rounded-bl-xl rounded-tr-3xl">
                            AVAILABLE
                        </span>

                        <div className="flex justify-center mt-10">
                            <div className="flex justify-center mt-12">
                                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                                    <Utensils size={48} />
                                </div>
                            </div>
                        </div>

                        <h3 className="text-3xl font-semibold text-center mt-8">
                            Table 01
                        </h3>

                        <p className="flex items-center justify-center gap-2 text-gray-500 mt-2">
                            <Users size={16} />
                            <span>4 Seats</span>
                        </p>
                        <div className="mt-auto">
                            <div className="border-t border-red-100 mb-5"></div>

                            <div className="flex justify-center gap-6">
                                <button className="hover:text-blue-500 transition cursor-pointer">
                                    <Eye size={20} />
                                </button>

                                <button className="hover:text-yellow-500 transition cursor-pointer">
                                    <Pencil size={20} />
                                </button>

                                <button className="hover:text-red-500 transition cursor-pointer">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    </div>



                    <div className="border-4 border-red-500 rounded-3xl h-96 p-5 relative flex flex-col">

                        <span className="absolute -top-[2px] font-[lemon] -right-[2px] bg-red-700 text-white text-sm px-3 py-1 rounded-bl-xl rounded-tr-3xl">
                            Booked
                        </span>

                        <div className="flex justify-center mt-10">
                            <div className="flex justify-center mt-12">
                                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                                    <Utensils size={48} />
                                </div>
                            </div>
                        </div>

                        <h3 className="text-3xl font-semibold text-center mt-8">
                            Table 01
                        </h3>

                        <p className="flex items-center justify-center gap-2 text-gray-500 mt-2">
                            <Users size={16} />
                            <span>4 Seats</span>
                        </p>
                        <div className="mt-auto">
                            <div className="border-t border-red-100 mb-5"></div>

                            <div className="flex justify-center gap-6">
                                <button className="hover:text-blue-500 transition cursor-pointer">
                                    <Eye size={20} />
                                </button>

                                <button className="hover:text-yellow-500 transition cursor-pointer">
                                    <Pencil size={20} />
                                </button>

                                <button className="hover:text-red-500 transition cursor-pointer">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="border-2 border-dashed border-red-200 rounded-3xl h-96 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:border-[#f7ab20] hover:bg-orange-50 hover:scale-105">

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

        </div>
    );
}

export default TablesManagements;