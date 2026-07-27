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
import { useTheme } from "../../context/ThemeContext";
import { isRestaurantRole } from "../../utils/permissionScopes";
import AddEmployeeModal from "./AddEmployeeModal";

const getList = (data, key) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(data?.data)) return data.data;
    return [];
};

function getEmployeeName(employee) {
    return [employee?.first_name, employee?.last_name].filter(Boolean).join(" ");
}

function getRoleName(employee, roles = []) {
    return (
        employee?.role?.name ||
        roles.find((role) => String(role.id) === String(employee?.role_id))?.name ||
        "No role"
    );
}

function getRestaurantId(employee) {
    return (
        employee?.restaurant_id ??
        employee?.restaurant?.id ??
        employee?.employee?.restaurant_id ??
        employee?.staff?.restaurant_id ??
        employee?.pivot?.restaurant_id ??
        ""
    );
}

function getRestaurantName(employee, restaurants = []) {
    const directName =
        employee?.restaurant?.name ||
        employee?.restaurant_name ||
        employee?.restaurantName ||
        employee?.branch?.name ||
        employee?.employee?.restaurant?.name ||
        employee?.staff?.restaurant?.name ||
        "";

    if (directName) return directName;

    const restaurantId = getRestaurantId(employee);
    const matchedRestaurant = restaurants.find(
        (restaurant) => String(restaurant.id) === String(restaurantId)
    );

    return matchedRestaurant?.name || "";
}

function isActive(employee) {
    return String(employee?.status || "").toLowerCase() === "active";
}

function Employee() {
    const { isLight } = useTheme();
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
    const [roles, setRoles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [spotlightIndex, setSpotlightIndex] = useState(0);
    const [roleSpotlightIndex, setRoleSpotlightIndex] = useState(0);

    const roleOptions = useMemo(
        () =>
            roles.filter(
                (role) => String(role.name ?? "").toLowerCase() !== "customer"
            ),
        [roles]
    );

    const selectedEmployeeRole =
        roleOptions.find((role) => String(role.id) === String(selectedEmployee?.role_id)) ??
        selectedEmployee?.role;
    const needsRestaurant = isRestaurantRole(selectedEmployeeRole);

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
        const fetchPageData = async () => {
            try {
                const [restaurantsResponse, rolesResponse] = await Promise.all([
                    api.get("/restaurants"),
                    api.get("/admin/roles"),
                ]);

                setRestaurants(restaurantsResponse.data.restaurants || []);
                setRoles(getList(rolesResponse.data, "roles"));
            } catch (err) {
                console.log(err);
            }
        };

        fetchPageData();
        const timeoutId = window.setTimeout(getEmployees, 0);

        return () => window.clearTimeout(timeoutId);
    }, [getEmployees]);

    useEffect(() => {
        if (employees.length <= 1) return undefined;

        const intervalId = window.setInterval(() => {
            setSpotlightIndex((currentIndex) => (currentIndex + 1) % employees.length);
        }, 5000);

        return () => window.clearInterval(intervalId);
    }, [employees.length]);

    useEffect(() => {
        if (spotlightIndex >= employees.length) {
            setSpotlightIndex(0);
        }
    }, [employees.length, spotlightIndex]);

    const roleCounts = useMemo(() => {
        const counts = new Map();

        employees.forEach((employee) => {
            const roleName = getRoleName(employee, roleOptions);

            counts.set(roleName, (counts.get(roleName) ?? 0) + 1);
        });

        return Array.from(counts, ([name, count]) => ({ name, count }));
    }, [employees, roleOptions]);

    useEffect(() => {
        if (roleCounts.length <= 1) return undefined;

        const intervalId = window.setInterval(() => {
            setRoleSpotlightIndex((currentIndex) => (currentIndex + 1) % roleCounts.length);
        }, 5000);

        return () => window.clearInterval(intervalId);
    }, [roleCounts.length]);

    useEffect(() => {
        if (roleSpotlightIndex >= roleCounts.length) {
            setRoleSpotlightIndex(0);
        }
    }, [roleCounts.length, roleSpotlightIndex]);

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
                getRoleName(employee, roleOptions),
                employee.status,
                getRestaurantName(employee, restaurants),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(query))
        );
    }, [employees, restaurants, roleFilter, roleOptions, searchQuery]);

    const roleFilterRoles = roleOptions.filter(
        (role) => String(role.name ?? "").toLowerCase() !== "admin"
    );
    const roleFilterOptions = [
        { value: "all", label: "All", count: employees.length },
        ...roleFilterRoles.map((role) => ({
            value: String(role.id),
            label: role.name,
            count: employees.filter(
                (employee) => String(employee.role_id ?? employee.role?.id) === String(role.id)
            ).length,
        })),
    ];
    const hasActiveFilters = roleFilter !== "all";
    const tableBorder = isLight ? "border-[#E4CFC3]" : "border-white/[0.08]";
    const tableRowBorder = isLight ? "border-[#EAD8CD]" : "border-white/[0.07]";
    const tableText = isLight ? "text-[#241815]" : "text-white";
    const tableMutedText = isLight ? "text-[#6B5A52]" : "text-white/45";
    const tableSubtleText = isLight ? "text-[#7A6A64]" : "text-white/38";
    const clearFilters = () => {
        setRoleFilter("all");
    };

    const spotlightEmployee = employees[spotlightIndex] ?? null;
    const spotlightRole = roleCounts[roleSpotlightIndex] ?? null;

    const stats = [
        {
            label: "All Employees",
            value: employees.length,
            helper: `${filteredEmployees.length} shown`,
            icon: Users,
            card: isLight
                ? "border-[#8BCFB0]/45 bg-[#FFF9F2] text-[#241815]"
                : "border-emerald-400/25 bg-[linear-gradient(145deg,rgba(16,185,129,0.18),rgba(32,43,47,0.94))] text-white",
            iconBox: isLight
                ? "border border-[#8BCFB0]/50 bg-[#E9F7EF] text-[#2E8B61] shadow-[0_12px_28px_rgba(46,139,97,0.08)]"
                : "border border-emerald-400/35 bg-emerald-400/10 text-emerald-300 shadow-[0_12px_28px_rgba(16,185,129,0.12)]",
            helperClass: isLight ? "text-[#2E8B61]" : "text-emerald-300",
        },
        {
            label: "Role Breakdown",
            value: spotlightRole?.name ?? "No roles",
            helper: spotlightRole ? `${spotlightRole.count} employees` : "0 employees",
            icon: Truck,
            card: isLight
                ? "border-[#D8A22D]/45 bg-[#FFF4DA] text-[#241815] shadow-[0_18px_42px_rgba(216,162,45,0.14)]"
                : "border-[#FFD166]/25 bg-[linear-gradient(145deg,rgba(255,209,102,0.18),rgba(32,43,47,0.94))] text-white",
            iconBox: "border border-[#FFD166]/35 bg-[#FFD166]/10 text-[#FFD166] shadow-[0_12px_28px_rgba(255,209,102,0.12)]",
            helperClass: "text-[#FFD166]",
            isRoleSpotlight: true,
            spotlightKey: spotlightRole?.name ?? roleSpotlightIndex,
        },
        {
            label: "Staff Spotlight",
            value: getEmployeeName(spotlightEmployee) || "No employees",
            helper: spotlightEmployee ? getRoleName(spotlightEmployee, roleOptions) : "No role",
            icon: BadgeCheck,
            card: isLight
                ? "border-[#7F1D1D]/35 bg-[#F9ECEC] text-[#241815] shadow-[0_18px_42px_rgba(127,29,29,0.12)]"
                : "border-[#7F1D1D]/35 bg-[linear-gradient(145deg,rgba(127,29,29,0.14),rgba(32,43,47,0.94))] text-white",
            iconBox: "border border-[#7F1D1D]/35 bg-[#7F1D1D]/12 text-[#7F1D1D] shadow-[0_12px_28px_rgba(127,29,29,0.12)]",
            helperClass: "text-[#7F1D1D]",
            isSpotlight: true,
            spotlightKey: spotlightEmployee?.id ?? spotlightIndex,
        },
    ];

    return (
        <div className="min-h-full overflow-y-auto bg-[radial-gradient(circle_at_86%_10%,rgba(127,29,29,0.18),transparent_30%),radial-gradient(circle_at_18%_22%,rgba(255,209,102,0.12),transparent_26%),radial-gradient(circle_at_60%_82%,rgba(52,211,153,0.08),transparent_30%),linear-gradient(145deg,#0D1214_0%,#12191C_52%,#24171A_100%)] p-4 text-white sm:p-6 lg:p-8">
            <div className="mx-auto max-w-[1500px]">
                <section className="mb-6 overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(27,37,40,0.92)_0%,rgba(21,29,32,0.84)_55%,rgba(44,25,31,0.78)_100%)] p-5 shadow-[0_22px_55px_rgba(0,0,0,0.28)] ring-1 ring-white/[0.04] backdrop-blur-sm sm:p-6">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFD166]">
                                Staff administration
                            </p>
                            <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">
                                Employees Management
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm font-medium text-white/55">
                                Manage staff roles, contact details, and restaurant assignments.
                            </p>
                        </div>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#7F1D1D] px-5 text-sm font-black text-white shadow-[0_16px_34px_rgba(127,29,29,0.28)] transition hover:-translate-y-0.5 hover:bg-[#681718]"
                        >
                            <UserPlus size={18} />
                            Add Employee
                        </button>
                    </div>

                    {errorMessage && (
                        <p className="mt-5 rounded-2xl border border-[#7F1D1D]/30 bg-[#7F1D1D]/10 px-4 py-3 text-sm font-bold text-[#7F1D1D]">
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
                                className={`rounded-[24px] border p-5 shadow-[0_18px_42px_rgba(0,0,0,0.22)] ring-1 ring-white/[0.03] transition duration-200 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_24px_58px_rgba(0,0,0,0.3)] ${card.card}`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-[0.12em] opacity-70">
                                            {card.label}
                                        </p>
                                        {card.isSpotlight || card.isRoleSpotlight ? (
                                            <div
                                                key={card.spotlightKey}
                                                className="employee-spotlight-cycle mt-3 min-h-[72px]"
                                            >
                                                <h2 className="max-w-[310px] text-3xl font-black leading-tight">
                                                    {card.value}
                                                </h2>
                                                <p className={`mt-2 text-base font-black ${card.isSpotlight ? "capitalize" : ""} ${card.helperClass}`}>
                                                    {card.helper}
                                                </p>
                                            </div>
                                        ) : (
                                            <h2 className="mt-3 text-4xl font-black tabular-nums">
                                                {card.value}
                                            </h2>
                                        )}
                                    </div>
                                    <div className={`grid h-11 w-11 place-items-center rounded-2xl ${card.iconBox}`}>
                                        <Icon size={21} />
                                    </div>
                                </div>
                                {!card.isSpotlight && !card.isRoleSpotlight && (
                                    <p className={`mt-4 text-sm font-semibold ${card.helperClass}`}>
                                        {card.helper}
                                    </p>
                                )}
                            </article>
                        );
                    })}
                </section>

                <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(30,42,45,0.98),rgba(17,27,30,0.96))] shadow-[0_24px_70px_rgba(0,0,0,0.30)] ring-1 ring-white/[0.04]">
                    <div className="grid gap-4 border-b border-white/[0.08] bg-[radial-gradient(circle_at_100%_0%,rgba(127,29,29,0.14),transparent_34%),rgba(255,255,255,0.03)] p-5 lg:grid-cols-[minmax(220px,1fr)_minmax(320px,520px)] lg:items-center">
                        <div className="min-w-0">
                            <h2 className="text-2xl font-black text-white">Staff Directory</h2>
                            <p className="mt-1 text-sm font-medium text-white/48">
                                {isLoading
                                    ? "Loading employees..."
                                    : `${filteredEmployees.length} of ${employees.length} employees`}
                            </p>
                        </div>

                        <div className="flex min-h-12 w-full items-center gap-3 rounded-2xl border border-white/10 bg-[#0D1214] px-4 shadow-inner">
                            <Search size={18} className="shrink-0 text-[#FFD166]" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="Search name, role, contact..."
                                className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/35"
                            />
                        </div>
                    </div>

                    <div className="space-y-4 border-b border-white/[0.08] bg-[#172124] p-5">
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                            <div className="flex items-center gap-2 text-sm font-black text-white">
                                <div className="grid h-9 w-9 place-items-center rounded-xl border border-[#7F1D1D]/30 bg-[#7F1D1D]/10 text-[#7F1D1D]">
                                    <ListFilter size={18} />
                                </div>
                                Filters
                            </div>

                            <button
                                type="button"
                                onClick={clearFilters}
                                disabled={!hasActiveFilters}
                                className="w-fit rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-black text-white/65 transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0"
                            >
                                Clear filters
                            </button>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#FFD166]">
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
                                                    ? isLight
                                                        ? "border-[#B87878] bg-[#F9ECEC] text-[#7F1D1D] shadow-[0_14px_30px_rgba(127,29,29,0.10)]"
                                                        : "border-[#7F1D1D]/65 bg-[#7F1D1D]/18 text-white shadow-[0_14px_30px_rgba(127,29,29,0.14)]"
                                                    : isLight
                                                        ? "border-[#E4CFC3] bg-[#FFF9F2] text-[#6B5A52] hover:border-[#7F1D1D]/35 hover:bg-[#FFF4EA] hover:text-[#241815]"
                                                        : "border-white/10 bg-[#202B2F] text-white/70 hover:border-[#7F1D1D]/35 hover:bg-[#253236] hover:text-white"
                                            }`}
                                        >
                                            {option.label}
                                            <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                                                isActiveFilter
                                                    ? isLight
                                                        ? "bg-[#FFF4EA] text-[#241815]"
                                                        : "bg-white/18 text-white"
                                                    : isLight
                                                        ? "bg-[#F3E5D9] text-[#6B5A52]"
                                                        : "bg-white/[0.07] text-white/45"
                                            }`}>
                                                {option.count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className={`overflow-x-auto ${isLight ? "bg-[#FFF9F2]" : "bg-[#111A1D]"}`}>
                        <table className="w-full min-w-[900px] border-separate border-spacing-0">
                            <thead>
                                <tr className={`text-left text-xs font-black uppercase tracking-[0.12em] ${
                                    isLight
                                        ? "bg-[#F6E8DE] text-[#7A6A64]"
                                        : "bg-[linear-gradient(90deg,rgba(255,209,102,0.08),rgba(127,29,29,0.08))] text-white/55"
                                }`}>
                                    <th className={`border-y px-4 py-4 ${tableBorder}`}>Employee</th>
                                    <th className={`border-y px-4 py-4 ${tableBorder}`}>Role</th>
                                    <th className={`border-y px-4 py-4 ${tableBorder}`}>Contact</th>
                                    <th className={`border-y px-4 py-4 ${tableBorder}`}>Restaurant</th>
                                    <th className={`border-y px-4 py-4 ${tableBorder}`}>Status</th>
                                    <th className={`border-y px-4 py-4 text-right ${tableBorder}`}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="6" className="px-3 py-12 text-center text-sm font-bold text-white/45">
                                            Loading employees...
                                        </td>
                                    </tr>
                                ) : filteredEmployees.length ? (
                                    filteredEmployees.map((employee) => {
                                        const restaurantName = getRestaurantName(employee, restaurants);

                                        return (
                                        <tr
                                            key={employee.id}
                                            className={`group transition ${isLight ? "hover:bg-[#FFF4EA]" : "hover:bg-white/[0.035]"}`}
                                        >
                                            <td className={`border-b px-4 py-4 transition ${tableRowBorder}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#9B2C2C_0%,#7F1D1D_48%,#4E1515_100%)] text-sm font-black text-white shadow-[0_12px_26px_rgba(127,29,29,0.20)] ring-1 ring-white/10">
                                                        {getEmployeeName(employee)
                                                            .split(" ")
                                                            .map((part) => part[0])
                                                            .join("")
                                                            .slice(0, 2)
                                                            .toUpperCase() || "EM"}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className={`truncate text-base font-black ${tableText}`}>
                                                            {getEmployeeName(employee) || "Unnamed employee"}
                                                        </p>
                                                        <p className={`text-xs font-bold ${tableSubtleText}`}>
                                                            EMP-{employee.id}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={`border-b px-4 py-4 transition ${tableRowBorder}`}>
                                                <span className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-bold shadow-[0_8px_20px_rgba(16,185,129,0.08)] ${
                                                    isLight
                                                        ? "border-[#8BCFB0]/45 bg-[#E9F7EF] text-[#2E8B61]"
                                                        : "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                                                }`}>
                                                    <ShieldCheck size={15} />
                                                    {getRoleName(employee, roleOptions)}
                                                </span>
                                            </td>
                                            <td className={`border-b px-4 py-4 transition ${tableRowBorder}`}>
                                                <div className="space-y-1 text-sm">
                                                    <p className={`flex items-center gap-2 font-bold ${tableText}`}>
                                                        <Mail size={14} className={isLight ? "text-[#7A6A64]" : "text-white/35"} />
                                                        {employee.email || "No email"}
                                                    </p>
                                                    <p className={`flex items-center gap-2 ${tableMutedText}`}>
                                                        <Phone size={14} className={isLight ? "text-[#7A6A64]" : "text-white/35"} />
                                                        {employee.phone_number || "No phone"}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className={`border-b px-4 py-4 transition ${tableRowBorder}`}>
                                                <span
                                                    className={`inline-flex max-w-[230px] items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-black ${
                                                        restaurantName
                                                            ? "border-[#FFD166]/28 bg-[#FFD166]/10 text-[#FFD166]"
                                                            : "border-white/10 bg-white/[0.04] text-white/42"
                                                    }`}
                                                    title={restaurantName || "Not assigned"}
                                                >
                                                    <Building2 size={15} className={restaurantName ? "text-[#FFD166]" : "text-white/28"} />
                                                    <span className="truncate">
                                                        {restaurantName || "Not assigned"}
                                                    </span>
                                                </span>
                                            </td>
                                            <td className={`border-b px-4 py-4 transition ${tableRowBorder}`}>
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-sm font-black shadow-[0_8px_20px_rgba(0,0,0,0.12)] ${
                                                        isActive(employee)
                                                            ? isLight
                                                                ? "border border-[#8BCFB0]/45 bg-[#E9F7EF] text-[#2E8B61]"
                                                                : "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                                                            : "border border-[#7F1D1D]/30 bg-[#7F1D1D]/10 text-[#7F1D1D]"
                                                    }`}
                                                >
                                                    {employee.status || "unknown"}
                                                </span>
                                            </td>
                                            <td className={`border-b px-4 py-4 transition ${tableRowBorder}`}>
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleShowEmployee(employee.id)}
                                                        className="grid h-9 w-9 place-items-center rounded-xl border border-sky-400/30 bg-sky-400/10 text-sky-300 transition hover:bg-sky-400/18"
                                                        title="Details"
                                                    >
                                                        <Info size={17} />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(employee)}
                                                        className="grid h-9 w-9 place-items-center rounded-xl border border-[#FFD166]/30 bg-[#FFD166]/10 text-[#FFD166] transition hover:bg-[#FFD166]/18"
                                                        title="Edit"
                                                    >
                                                        <Pencil size={17} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEmployeeToDelete(employee);
                                                            setIsDeleteOpen(true);
                                                        }}
                                                        className="grid h-9 w-9 place-items-center rounded-xl border border-[#7F1D1D]/30 bg-[#7F1D1D]/10 text-[#7F1D1D] transition hover:bg-[#7F1D1D]/18"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={17} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-3 py-12 text-center text-sm font-bold text-white/45">
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
                roles={roleOptions}
                onClose={() => {
                    setIsModalOpen(false);
                    getEmployees();
                }}
            />

            {isInfoOpen && selectedEmployee && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#182124] p-5 text-white shadow-2xl">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-xl font-black">Employee Details</h2>
                            <button
                                onClick={() => setIsInfoOpen(false)}
                                className="grid h-9 w-9 place-items-center rounded-xl text-white/55 hover:bg-white/[0.06] hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-3 rounded-2xl border border-white/10 bg-[#0D1214] p-4 text-sm text-white/65">
                            <p><span className="font-black">Name:</span> {getEmployeeName(selectedEmployee)}</p>
                            <p><span className="font-black">Phone:</span> {selectedEmployee.phone_number || "No phone"}</p>
                            <p><span className="font-black">Gender:</span> {selectedEmployee.gender || "Not set"}</p>
                            <p><span className="font-black">National Number:</span> {selectedEmployee.national_number || "Not set"}</p>
                            <p><span className="font-black">Role:</span> {getRoleName(selectedEmployee, roleOptions)}</p>
                        </div>
                    </div>
                </div>
            )}

            {isEditOpen && selectedEmployee && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#182124] p-5 text-white shadow-2xl">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-xl font-black">Edit Employee</h2>
                            <button
                                onClick={() => setIsEditOpen(false)}
                                className="grid h-9 w-9 place-items-center rounded-xl text-white/55 hover:bg-white/[0.06] hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <label className="block">
                                <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">Phone</span>
                                <input
                                    type="text"
                                    value={selectedEmployee.phone_number || ""}
                                    onChange={(event) =>
                                        setSelectedEmployee({
                                            ...selectedEmployee,
                                            phone_number: event.target.value,
                                        })
                                    }
                                    className="w-full rounded-2xl border border-white/10 bg-[#0D1214] px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">Role</span>
                                <select
                                    value={selectedEmployee.role_id || ""}
                                    onChange={(event) =>
                                        setSelectedEmployee({
                                            ...selectedEmployee,
                                            role_id: event.target.value,
                                        })
                                    }
                                    className="w-full rounded-2xl border border-white/10 bg-[#0D1214] px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10"
                                >
                                    {roleOptions.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {needsRestaurant && (
                                <label className="block">
                                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">Restaurant</span>
                                    <select
                                        value={editRestaurantId}
                                        onChange={(event) => setEditRestaurantId(event.target.value)}
                                        className="w-full rounded-2xl border border-white/10 bg-[#0D1214] px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10"
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
                                className="flex-1 rounded-2xl border border-white/10 py-3 text-sm font-black text-white/65 hover:bg-white/[0.05] hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateEmployee}
                                className="flex-1 rounded-2xl bg-[#7F1D1D] py-3 text-sm font-black text-white hover:bg-[#681718]"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isDeleteOpen && employeeToDelete && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#182124] p-5 text-center text-white shadow-2xl">
                        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-[#7F1D1D]/35 bg-[#7F1D1D]/10 text-[#7F1D1D]">
                            <Trash2 size={28} />
                        </div>
                        <h2 className="text-xl font-black">Delete Employee</h2>
                        <p className="mt-3 text-sm font-medium text-white/55">
                            Are you sure you want to delete
                            <span className="font-black text-white"> {getEmployeeName(employeeToDelete)}</span>?
                        </p>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => setIsDeleteOpen(false)}
                                className="flex-1 rounded-2xl border border-white/10 py-3 text-sm font-black text-white/65 hover:bg-white/[0.05] hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteEmployee}
                                className="flex-1 rounded-2xl bg-[#7F1D1D] py-3 text-sm font-black text-white hover:bg-[#681718]"
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
