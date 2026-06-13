import { Info, Pencil, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../../API/axios";
import AddEmployeeModal from "./AddEmployeeModal";
function Employee() {
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const openEditModal = (employee) => {
        setSelectedEmployee(employee);
        setIsEditOpen(true);
    };
    const handleDeleteEmployee = async () => {
        try {

            await api.delete(
                `/admin/staff-users/${employeeToDelete.id}`
            );

            getEmployees();

            setIsDeleteOpen(false);
            setEmployeeToDelete(null);

        } catch (error) {
            console.log(error);
        }
    };
    const handleShowEmployee = async (id) => {
        try {
            const response = await api.get(`/admin/staff-users/${id}`);

            setSelectedEmployee(response.data.user);
            setIsInfoOpen(true);

        } catch (error) {
            console.log(error);
        }
    };
    const handleUpdateEmployee = async () => {
        try {

            await api.post(
                `/admin/staff-users/${selectedEmployee.id}`,
                {
                    phone_number: selectedEmployee.phone_number,
                    role_id: selectedEmployee.role_id,
                }
            );

            getEmployees();

            setIsEditOpen(false);

        } catch (error) {
            console.log(error);
        }
    };
    const getEmployees = async () => {
        try {
            const response = await api.get("/admin/staff-users");

            setEmployees(response.data.users);
        } catch (error) {
            console.log(error);
        }
    }; useEffect(() => {
        getEmployees();
    }, []);
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#ffffff] to-[#c0b29f]">

            {/*القسم لعلوي */}
            <div className="flex items-center justify-between px-10">

                <div className="pl-5 pt-5 text-left flex flex-col ml-3 ">

                    <h2 className="text-4xl font-bold ">
                        EMPLOYEES MANAGEMENT
                    </h2>

                    <h5 className="text-lg mt-2 text-gray-600 ml-3">
                        Welcome Sir.... You can manage your employees
                    </h5>

                </div>
                <button onClick={() => setIsModalOpen(true)}
                    className="bg-[#7F1D1D] text-white px-12 py-3 rounded-xl text-lg font-semibold mt-2 mr-16 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                    + Add Employee
                </button>
            </div>
            {/*القسم لعلوي */}

            {/*CARDS */}
            <div className="grid grid-cols-3 gap-6 px-9 mt-12">


                <div className="bg-[#ddf2ff] rounded-2xl shadow p-9 h-35 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                    <p className="text-m text-gray-500 font-bold">
                        ALL EMPLOYEES
                    </p>

                    <h3 className="text-4xl font-bold mt-3">
                        114
                    </h3>
                </div>


                <div className="bg-[#ffdfdf] rounded-2xl shadow p-9 h-35 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                    <p className="text-m text-gray-500 font-bold">
                        Delivery Empolyees
                    </p>

                    <h3 className="text-4xl font-bold mt-3">
                        8
                    </h3>
                </div>


                <div className="bg-[#e2fdd5] rounded-2xl shadow p-9 h-35 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                    <p className="text-m text-gray-500 font-bold">
                        Active Employees
                    </p>

                    <h3 className="text-4xl font-bold mt-3">
                        123
                    </h3>
                </div>
            </div>

            {/*CARDS */}


            {/*STAFF SHOW */}
            <div className="bg-white rounded-2xl shadow mt-10 mx-10 p-6">

                <div className="flex justify-between items-center">

                    <h2 className="text-3xl font-bold">
                        Staff Directory
                    </h2>

                    <div className="flex items-center gap-2">

                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-56 bg-gray-200 rounded-full px-5 py-2 outline-none"
                        />

                        <button className="bg-[#7F1D1D] text-white px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl">
                            Search
                        </button>

                    </div>


                </div>


                <div className="grid grid-cols-[1.5fr_1.2fr_1.5fr_1.1fr_0.4fr] mt-8 py-4 border-t border-b text-sm font-bold text-gray-600">
                    <p>EMPLOYEE</p>
                    <p>ROLE</p>
                    <p>CONTACT</p>
                    <p>STATUS</p>
                    <p >ACTION</p>
                </div>
                {
                    employees.map((employee) => (



                        <div
                            key={employee.id}
                            className="grid grid-cols-[1.5fr_1.2fr_1.5fr_1fr_0.5fr] items-center py-5 border-b"
                        >
                            <div>
                                <p className="font-semibold">
                                    {employee.first_name} {employee.last_name}
                                </p>

                                <p className="text-sm text-gray-500">
                                    EMP-{employee.id}
                                </p>
                            </div>

                            <p>
                                {employee.role?.name}
                            </p>

                            <div>
                                <p>{employee.email}</p>

                                <p className="text-sm text-gray-500">
                                    {employee.phone_number}
                                </p>
                            </div>

                            <span
                                className={`px-3 py-1 rounded-full w-fit
                ${employee.status === "active"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"
                                    }`}
                            >
                                {employee.status}
                            </span>

                            <div className="flex items-center justify-end gap-2">
                                <button
                                    onClick={() => handleShowEmployee(employee.id)}
                                    className="border border-blue-500 text-blue-500 p-2 rounded-lg transition-all duration-300 hover:bg-blue-500 hover:text-white hover:scale-110"
                                >
                                    <Info size={18} />
                                </button>
                                <button
                                    onClick={() => openEditModal(employee)}
                                    className="border border-yellow-500 text-yellow-500 p-2 rounded-lg transition-all duration-300 hover:bg-yellow-500 hover:text-white hover:scale-110"
                                >
                                    <Pencil size={18} />
                                </button>

                                <button
                                    onClick={() => {
                                        setEmployeeToDelete(employee);
                                        setIsDeleteOpen(true);
                                    }}
                                    className="border border-red-500 text-red-500 p-2 rounded-lg transition-all duration-300 hover:bg-red-500 hover:text-white hover:scale-110"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))

                }
            </div>





            {/*STAFF SHOW */}

            <AddEmployeeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
            {
                isInfoOpen && selectedEmployee && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

                        <div className="bg-white rounded-2xl p-6 w-[450px] shadow-2xl">

                            <h2 className="text-2xl font-bold mb-6">
                                Employee Details
                            </h2>

                            <div className="space-y-4">

                                <p>
                                    <span className="font-bold">Name:</span>{" "}
                                    {selectedEmployee.first_name}{" "}
                                    {selectedEmployee.last_name}
                                </p>

                                <p>
                                    <span className="font-bold">Phone:</span>{" "}
                                    {selectedEmployee.phone_number}
                                </p>

                                <p>
                                    <span className="font-bold">Gender:</span>{" "}
                                    {selectedEmployee.gender}
                                </p>

                                <p>
                                    <span className="font-bold">National Number:</span>{" "}
                                    {selectedEmployee.national_number}
                                </p>

                            </div>

                            <button
                                onClick={() => setIsInfoOpen(false)}
                                className="w-full mt-6 bg-[#7F1D1D] text-white py-3 rounded-xl"
                            >
                                Close
                            </button>

                        </div>

                    </div>
                )
            }

            {
                isEditOpen && selectedEmployee && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

                        <div className="bg-white rounded-2xl p-6 w-[400px] shadow-2xl">

                            <h2 className="text-2xl font-bold mb-6">
                                Edit Employee
                            </h2>

                            <div className="space-y-4">

                                <input
                                    type="text"
                                    value={selectedEmployee.phone_number}
                                    onChange={(e) =>
                                        setSelectedEmployee({
                                            ...selectedEmployee,
                                            phone_number: e.target.value,
                                        })
                                    }
                                    className="w-full border rounded-xl px-4 py-3"
                                />

                                <select
                                    value={selectedEmployee.role_id}
                                    onChange={(e) =>
                                        setSelectedEmployee({
                                            ...selectedEmployee,
                                            role_id: e.target.value,
                                        })
                                    }
                                    className="w-full border rounded-xl px-4 py-3"
                                >
                                    <option value="3">Manager</option>
                                    <option value="4">Cashier</option>
                                    <option value="5">Delivery</option>
                                    <option value="6">Chef</option>
                                    <option value="7">Warehouse Manager</option>
                                     <option value="8">Waiter</option>
                                </select>

                            </div>

                            <div className="flex gap-3 mt-6">

                                <button
                                    onClick={() => setIsEditOpen(false)}
                                    className="flex-1 border rounded-xl py-3"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleUpdateEmployee}
                                    className="flex-1 bg-[#7F1D1D] text-white rounded-xl py-3"
                                >
                                    Save
                                </button>

                            </div>

                        </div>

                    </div>
                )
            }
            {
                isDeleteOpen && employeeToDelete && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

                        <div className="bg-white rounded-2xl p-6 w-[420px] shadow-2xl">

                            <div className="flex justify-center mb-4">
                                <div className="bg-red-100 p-4 rounded-full">
                                    <Trash2
                                        size={35}
                                        className="text-red-600"
                                    />
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-center">
                                Delete Employee
                            </h2>

                            <p className="text-center text-gray-600 mt-3">
                                Are you sure you want to delete
                            </p>

                            <p className="text-center font-bold text-lg mt-2">
                                {employeeToDelete.first_name}
                                {" "}
                                {employeeToDelete.last_name}
                                ?
                            </p>

                            <div className="flex gap-3 mt-8">

                                <button
                                    onClick={() => setIsDeleteOpen(false)}
                                    className="flex-1 py-3 rounded-xl border border-gray-300 hover:bg-gray-100"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleDeleteEmployee}
                                    className="flex-1 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700"
                                >
                                    Delete
                                </button>

                            </div>

                        </div>

                    </div>
                )
            }
        </div >
    );
}

export default Employee;