import {
    BadgeCheck,
    Building2,
    Info,
    ListFilter,
    Mail,
    Pencil,
    Phone,
    Search,
    ShieldCheck,
    Trash2,
    Truck,
    UserPlus,
    Users,
    X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../API/axios";
import { RESTAURANT_ROLE_IDS } from "../../utils/permissionScopes";
import AddEmployeeModal from "./AddEmployeeModal";

const roleOptions = [
    { value: "3", label: "Manager" },
    { value: "4", label: "Cashier" },
    { value: "5", label: "Delivery" },
    { value: "6", label: "Chef" },
    { value: "7", label: "Warehouse Manager" },
    { value: "8", label: "Waiter" },
];

function getEmployeeName(employee) {
    return [employee?.first_name, employee?.last_name].filter(Boolean).join(" ");
}

function getRoleName(employee) {
    return employee?.role?.name || roleOptions.find((role) => role.value === String(employee?.role_id))?.label || "No role";
}

function isActive(employee) {
    return String(employee?.status || "").toLowerCase() === "active";
}

function Employee() {
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [restaurants, setRestaurants] = useState([]);
    const [employeeToDelete, setEmployeeToDelete] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [editRestaurantId, setEditRestaurantId] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const needsRestaurant = RESTAURANT_ROLE_IDS.includes(
        Number(selectedEmployee?.role_id)
    );

    const getEmployees = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage("");

        try {
            const response = await api.get("/admin/staff-users");
            setEmployees(response.data.users || []);
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message || "Could not load employees."
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                const res = await api.get("/restaurants");
                setRestaurants(res.data.restaurants || []);
            } catch (err) {
                console.log(err);
            }
        };

        fetchRestaurants();
        const timeoutId = window.setTimeout(getEmployees, 0);

        return () => window.clearTimeout(timeoutId);
    }, [getEmployees]);

    const openEditModal = (employee) => {
        setSelectedEmployee(employee);
        setEditRestaurantId(employee.restaurant_id || employee.restaurant?.id || "");
        setIsEditOpen(true);
    };

    const handleDeleteEmployee = async () => {
        try {
            await api.delete(`/admin/staff-users/${employeeToDelete.id}`);
            await getEmployees();
            setIsDeleteOpen(false);
            setEmployeeToDelete(null);
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message || "Could not delete employee."
            );
        }
    };

    const handleShowEmployee = async (id) => {
        try {
            const response = await api.get(`/admin/staff-users/${id}`);
            setSelectedEmployee(response.data.user);
            setIsInfoOpen(true);
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message || "Could not load employee details."
            );
        }
    };

    const handleUpdateEmployee = async () => {
        try {
            await api.post(`/admin/staff-users/${selectedEmployee.id}`, {
                phone_number: selectedEmployee.phone_number,
                role_id: selectedEmployee.role_id,
                restaurant_id: needsRestaurant ? editRestaurantId : null,
            });

            await getEmployees();
            setIsEditOpen(false);
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message || "Could not update employee."
            );
        }
    };

    const filteredEmployees = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return employees.filter((employee) =>
            (roleFilter === "all" || String(employee.role_id ?? employee.role?.id) === roleFilter) &&
            (!query || [
                getEmployeeName(employee),
                employee.email,
                employee.phone_number,
                getRoleName(employee),
                employee.status,
                employee.restaurant?.name,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(query))
        );
    }, [employees, roleFilter, searchQuery]);

    const roleFilterOptions = [
        { value: "all", label: "All", count: employees.length },
        ...roleOptions.map((role) => ({
            ...role,
            count: employees.filter(
                (employee) => String(employee.role_id ?? employee.role?.id) === role.value
            ).length,
        })),
    ];
    const hasActiveFilters = roleFilter !== "all";
    const clearFilters = () => {
        setRoleFilter("all");
    };

    const stats = [
        {
            label: "All Employees",
            value: employees.length,
            helper: `${filteredEmployees.length} shown`,
            icon: Users,
            card: "border-teal-200 bg-teal-50 text-teal-950",
            iconBox: "bg-teal-600 text-white ring-teal-200",
            helperClass: "text-teal-700",
        },
        {
            label: "Delivery Employees",
            value: employees.filter((employee) =>
                String(getRoleName(employee)).toLowerCase().includes("delivery")
            ).length,
            helper: "Assigned to delivery flow",
            icon: Truck,
            card: "border-amber-200 bg-amber-50 text-amber-950",
            iconBox: "bg-amber-600 text-white ring-amber-200",
            helperClass: "text-amber-700",
        },
        {
            label: "Active Employees",
            value: employees.filter(isActive).length,
            helper: "Currently enabled",
            icon: BadgeCheck,
            card: "border-rose-200 bg-rose-50 text-rose-950",
            iconBox: "bg-[#7F1D1D] text-white ring-rose-200",
            helperClass: "text-rose-700",
        },
    ];

    return (
        <div className="min-h-full overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(127,29,29,0.12),transparent_34%),linear-gradient(135deg,#F7EFE6_0%,#E6D8C8_52%,#D8C7B6_100%)] p-4 text-[#241F1D] sm:p-6 lg:p-8">
            <div className="mx-auto max-w-[1500px]">
                <section className="mb-6 rounded-xl border border-white/70 bg-white/95 p-5 shadow-[0_18px_50px_rgba(70,45,30,0.10)] sm:p-6">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase text-[#8E6E62]">
                                Staff administration
                            </p>
                            <h1 className="mt-2 text-3xl font-black text-[#201A18] sm:text-4xl">
                                Employees Management
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm font-medium text-stone-500">
                                Manage staff roles, contact details, and restaurant assignments.
                            </p>
                        </div>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#7F1D1D] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(127,29,29,0.24)] transition hover:-translate-y-0.5 hover:bg-[#681718]"
                        >
                            <UserPlus size={18} />
                            Add Employee
                        </button>
                    </div>

                    {errorMessage && (
                        <p className="mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                            {errorMessage}
                        </p>
                    )}
                </section>

                <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                    {stats.map((card) => {
                        const Icon = card.icon;

                        return (
                            <article
                                key={card.label}
                                className={`rounded-xl border p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg ${card.card}`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-black uppercase opacity-70">
                                            {card.label}
                                        </p>
                                        <h2 className="mt-3 text-3xl font-black">
                                            {card.value}
                                        </h2>
                                    </div>
                                    <div className={`grid h-11 w-11 place-items-center rounded-lg ring-1 ${card.iconBox}`}>
                                        <Icon size={21} />
                                    </div>
                                </div>
                                <p className={`mt-4 text-sm font-semibold ${card.helperClass}`}>
                                    {card.helper}
                                </p>
                            </article>
                        );
                    })}
                </section>

                <section className="overflow-hidden rounded-xl border border-white/70 bg-white/95 shadow-[0_18px_50px_rgba(70,45,30,0.10)]">
                    <div className="grid gap-4 border-b border-[#E4D5C6] p-5 lg:grid-cols-[minmax(220px,1fr)_minmax(320px,520px)] lg:items-center">
                        <div className="min-w-0">
                            <h2 className="text-2xl font-black">Staff Directory</h2>
                            <p className="mt-1 text-sm font-medium text-stone-500">
                                {isLoading
                                    ? "Loading employees..."
                                    : `${filteredEmployees.length} of ${employees.length} employees`}
                            </p>
                        </div>

                        <div className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-[#D8C8B8] bg-[#FFF9F2] px-4 shadow-inner">
                            <Search size={18} className="shrink-0 text-[#7F1D1D]" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="Search name, role, contact..."
                                className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-stone-400"
                            />
                        </div>
                    </div>

                    <div className="space-y-4 border-b border-[#E4D5C6] bg-gradient-to-r from-rose-50 via-white to-teal-50 p-5">
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                            <div className="flex items-center gap-2 text-sm font-black text-stone-800">
                                <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#F9ECEC] text-[#7F1D1D]">
                                    <ListFilter size={18} />
                                </div>
                                Filters
                            </div>

                            <button
                                type="button"
                                onClick={clearFilters}
                                disabled={!hasActiveFilters}
                                className="w-fit rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-black text-stone-600 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:text-stone-950 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
                            >
                                Clear filters
                            </button>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs font-black uppercase tracking-wide text-[#7F1D1D]">
                                Role
                            </p>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {roleFilterOptions.map((option) => {
                                    const isActiveFilter = roleFilter === option.value;

                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setRoleFilter(option.value)}
                                            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-black shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${
                                                isActiveFilter
                                                    ? "border-[#7F1D1D] bg-[#7F1D1D] text-white shadow-rose-200"
                                                    : "border-rose-200 bg-white text-[#7F1D1D] hover:border-rose-300 hover:bg-rose-50"
                                            }`}
                                        >
                                            {option.label}
                                            <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                                                isActiveFilter
                                                    ? "bg-white/18 text-white"
                                                    : "bg-rose-100 text-[#7F1D1D]"
                                            }`}>
                                                {option.count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] border-collapse">
                            <thead>
                                <tr className="border-y border-[#E4D5C6] bg-[#FFF7EF] text-left text-xs font-black uppercase text-[#73564A]">
                                    <th className="px-3 py-4">Employee</th>
                                    <th className="px-3 py-4">Role</th>
                                    <th className="px-3 py-4">Contact</th>
                                    <th className="px-3 py-4">Restaurant</th>
                                    <th className="px-3 py-4">Status</th>
                                    <th className="px-3 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="6" className="px-3 py-12 text-center text-sm font-bold text-stone-500">
                                            Loading employees...
                                        </td>
                                    </tr>
                                ) : filteredEmployees.length ? (
                                    filteredEmployees.map((employee) => (
                                        <tr
                                            key={employee.id}
                                            className="border-b border-[#EFE2D5] transition hover:bg-[#FFF7EF]"
                                        >
                                            <td className="px-3 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#7F1D1D] text-sm font-black text-white shadow-sm">
                                                        {getEmployeeName(employee)
                                                            .split(" ")
                                                            .map((part) => part[0])
                                                            .join("")
                                                            .slice(0, 2)
                                                            .toUpperCase() || "EM"}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate font-black">
                                                            {getEmployeeName(employee) || "Unnamed employee"}
                                                        </p>
                                                        <p className="text-xs font-bold text-stone-400">
                                                            EMP-{employee.id}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4">
                                                <span className="inline-flex items-center gap-2 rounded-lg bg-[#E8F3F1] px-3 py-1.5 text-sm font-bold text-[#0F766E]">
                                                    <ShieldCheck size={15} />
                                                    {getRoleName(employee)}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4">
                                                <div className="space-y-1 text-sm">
                                                    <p className="flex items-center gap-2 font-bold">
                                                        <Mail size={14} className="text-stone-400" />
                                                        {employee.email || "No email"}
                                                    </p>
                                                    <p className="flex items-center gap-2 text-stone-500">
                                                        <Phone size={14} className="text-stone-400" />
                                                        {employee.phone_number || "No phone"}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4">
                                                <span className="inline-flex items-center gap-2 text-sm font-bold text-stone-600">
                                                    <Building2 size={15} className="text-[#B45309]" />
                                                    {employee.restaurant?.name || "Not assigned"}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-sm font-black ${
                                                        isActive(employee)
                                                            ? "bg-emerald-100 text-emerald-800"
                                                            : "bg-red-100 text-red-800"
                                                    }`}
                                                >
                                                    {employee.status || "unknown"}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleShowEmployee(employee.id)}
                                                        className="grid h-9 w-9 place-items-center rounded-lg border border-sky-200 bg-sky-50 text-sky-700 transition hover:bg-sky-100"
                                                        title="Details"
                                                    >
                                                        <Info size={17} />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(employee)}
                                                        className="grid h-9 w-9 place-items-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700 transition hover:bg-amber-100"
                                                        title="Edit"
                                                    >
                                                        <Pencil size={17} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEmployeeToDelete(employee);
                                                            setIsDeleteOpen(true);
                                                        }}
                                                        className="grid h-9 w-9 place-items-center rounded-lg border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={17} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-3 py-12 text-center text-sm font-bold text-stone-500">
                                            No employees match your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            <AddEmployeeModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    getEmployees();
                }}
            />

            {isInfoOpen && selectedEmployee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-xl font-black">Employee Details</h2>
                            <button
                                onClick={() => setIsInfoOpen(false)}
                                className="grid h-9 w-9 place-items-center rounded-lg text-stone-500 hover:bg-stone-100"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-3 rounded-lg bg-[#FBFAF8] p-4 text-sm">
                            <p><span className="font-black">Name:</span> {getEmployeeName(selectedEmployee)}</p>
                            <p><span className="font-black">Phone:</span> {selectedEmployee.phone_number || "No phone"}</p>
                            <p><span className="font-black">Gender:</span> {selectedEmployee.gender || "Not set"}</p>
                            <p><span className="font-black">National Number:</span> {selectedEmployee.national_number || "Not set"}</p>
                            <p><span className="font-black">Role:</span> {getRoleName(selectedEmployee)}</p>
                        </div>
                    </div>
                </div>
            )}

            {isEditOpen && selectedEmployee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-xl font-black">Edit Employee</h2>
                            <button
                                onClick={() => setIsEditOpen(false)}
                                className="grid h-9 w-9 place-items-center rounded-lg text-stone-500 hover:bg-stone-100"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <label className="block">
                                <span className="mb-2 block text-sm font-black text-stone-700">Phone</span>
                                <input
                                    type="text"
                                    value={selectedEmployee.phone_number || ""}
                                    onChange={(event) =>
                                        setSelectedEmployee({
                                            ...selectedEmployee,
                                            phone_number: event.target.value,
                                        })
                                    }
                                    className="w-full rounded-lg border border-stone-200 px-4 py-3 text-sm font-bold outline-none focus:border-[#7F1D1D] focus:ring-4 focus:ring-[#7F1D1D]/10"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-sm font-black text-stone-700">Role</span>
                                <select
                                    value={selectedEmployee.role_id || ""}
                                    onChange={(event) =>
                                        setSelectedEmployee({
                                            ...selectedEmployee,
                                            role_id: event.target.value,
                                        })
                                    }
                                    className="w-full rounded-lg border border-stone-200 px-4 py-3 text-sm font-bold outline-none focus:border-[#7F1D1D] focus:ring-4 focus:ring-[#7F1D1D]/10"
                                >
                                    {roleOptions.map((role) => (
                                        <option key={role.value} value={role.value}>
                                            {role.label}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {needsRestaurant && (
                                <label className="block">
                                    <span className="mb-2 block text-sm font-black text-stone-700">Restaurant</span>
                                    <select
                                        value={editRestaurantId}
                                        onChange={(event) => setEditRestaurantId(event.target.value)}
                                        className="w-full rounded-lg border border-stone-200 px-4 py-3 text-sm font-bold outline-none focus:border-[#7F1D1D] focus:ring-4 focus:ring-[#7F1D1D]/10"
                                    >
                                        <option value="">Select Restaurant</option>
                                        {restaurants.map((restaurant) => (
                                            <option key={restaurant.id} value={restaurant.id}>
                                                {restaurant.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            )}
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => setIsEditOpen(false)}
                                className="flex-1 rounded-lg border border-stone-200 py-3 text-sm font-black text-stone-600 hover:bg-stone-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateEmployee}
                                className="flex-1 rounded-lg bg-[#7F1D1D] py-3 text-sm font-black text-white hover:bg-[#681718]"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isDeleteOpen && employeeToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-5 text-center shadow-2xl">
                        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-600">
                            <Trash2 size={28} />
                        </div>
                        <h2 className="text-xl font-black">Delete Employee</h2>
                        <p className="mt-3 text-sm font-medium text-stone-500">
                            Are you sure you want to delete
                            <span className="font-black text-stone-900"> {getEmployeeName(employeeToDelete)}</span>?
                        </p>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => setIsDeleteOpen(false)}
                                className="flex-1 rounded-lg border border-stone-200 py-3 text-sm font-black text-stone-600 hover:bg-stone-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteEmployee}
                                className="flex-1 rounded-lg bg-red-600 py-3 text-sm font-black text-white hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Employee;
