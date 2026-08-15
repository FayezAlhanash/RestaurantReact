import {
    BadgeCheck,
    Building2,
    Check,
    ChevronDown,
    Info,
    ListFilter,
    Loader2,
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
import { roleRequiresRestaurantAssignment } from "../../utils/permissionScopes";
import AddEmployeeModal from "./AddEmployeeModal";

const getList = (data, key) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(data?.data)) return data.data;
    return [];
};

const getRoleList = (data) => {
    const roles = getList(data, "roles");

    return roles.length ? roles : getList(data, "staff_roles");
};

const EXCLUDED_ROLE_NAMES = ["admin", "customer"];

const normalizeRoleName = (name) =>
    String(name ?? "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

const formatRoleLabel = (role) =>
    String(role?.name ?? "")
        .replace(/[_-]+/g, " ")
        .trim()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());

function StyledSelect({
    value,
    options,
    placeholder,
    onChange,
    getOptionLabel,
    getOptionValue = (option) => option.id,
    disabled = false,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(
        (option) => String(getOptionValue(option)) === String(value)
    );
    const selectedLabel = selectedOption ? getOptionLabel(selectedOption) : placeholder;

    const handleSelect = (option) => {
        onChange(String(getOptionValue(option)));
        setIsOpen(false);
    };

    const handleBlur = (event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsOpen(false);
        }
    };

    return (
        <div className="relative" onBlur={handleBlur}>
            <button
                type="button"
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((current) => !current)}
                className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-black text-white outline-none shadow-inner transition-all focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10 ${
                    disabled
                        ? "cursor-not-allowed border-white/5 bg-white/[0.03] text-white/30"
                        : "border-white/10 bg-[#0D1214] hover:border-[#FFD166]/40 hover:bg-[#11181B]"
                }`}
            >
                <span className={selectedOption ? "truncate" : "truncate text-white/35"}>
                    {selectedLabel}
                </span>
                <ChevronDown
                    size={18}
                    className={`shrink-0 text-[#FFD166] transition-transform ${
                        isOpen ? "rotate-180" : ""
                    }`}
                />
            </button>

            {isOpen && !disabled && (
                <div
                    role="listbox"
                    tabIndex={-1}
                    className="absolute left-0 right-0 z-[340] mt-2 max-h-60 overflow-y-auto rounded-2xl border border-[#FFD166]/20 bg-[#11181B] p-1.5 shadow-2xl shadow-black/45"
                >
                    {options.map((option) => {
                        const optionValue = String(getOptionValue(option));
                        const isSelected = optionValue === String(value);

                        return (
                            <button
                                key={optionValue}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => handleSelect(option)}
                                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-black transition ${
                                    isSelected
                                        ? "bg-[#FFD166] text-[#151A1D]"
                                        : "text-white/78 hover:bg-white/[0.07] hover:text-white"
                                }`}
                            >
                                <span className="truncate">{getOptionLabel(option)}</span>
                                {isSelected && <Check size={16} className="shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

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

function getDateValue(value) {
    if (!value) return "";

    return String(value).split("T")[0];
}

function getErrorMessage(error, fallbackMessage) {
    const errors = error.response?.data?.errors;

    if (errors && typeof errors === "object") {
        return Object.values(errors).flat().filter(Boolean).join(" ");
    }

    return error.response?.data?.message || fallbackMessage;
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
    const [editImage, setEditImage] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [roles, setRoles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [editErrorMessage, setEditErrorMessage] = useState("");
    const [isEditSubmitting, setIsEditSubmitting] = useState(false);
    const [spotlightIndex, setSpotlightIndex] = useState(0);
    const [roleSpotlightIndex, setRoleSpotlightIndex] = useState(0);

    const roleOptions = useMemo(
        () =>
            roles.filter((role) => !EXCLUDED_ROLE_NAMES.includes(normalizeRoleName(role.name))),
        [roles]
    );

    const selectedEmployeeRole =
        roleOptions.find((role) => String(role.id) === String(selectedEmployee?.role_id)) ??
        selectedEmployee?.role;
    const needsRestaurant = roleRequiresRestaurantAssignment(selectedEmployeeRole);

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
                    api.get("/staff-roles"),
                ]);

                setRestaurants(restaurantsResponse.data.restaurants || []);
                setRoles(getRoleList(rolesResponse.data));
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
            const frameId = window.requestAnimationFrame(() => {
            setSpotlightIndex(0);
            });

            return () => window.cancelAnimationFrame(frameId);
        }

        return undefined;
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
            const frameId = window.requestAnimationFrame(() => {
            setRoleSpotlightIndex(0);
            });

            return () => window.cancelAnimationFrame(frameId);
        }

        return undefined;
    }, [roleCounts.length, roleSpotlightIndex]);

    const openEditModal = (employee) => {
        setErrorMessage("");
        setEditErrorMessage("");
        setSelectedEmployee({
            ...employee,
            role_id: employee.role_id ?? employee.role?.id ?? "",
            date_of_birth: getDateValue(employee.date_of_birth),
        });
        setEditRestaurantId(getRestaurantId(employee));
        setEditImage(null);
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

    const handleShowEmployee = async (employee) => {
        setErrorMessage("");
        setSelectedEmployee(employee);
        setIsInfoOpen(true);

        try {
            const response = await api.get(`/admin/staff-users/${employee.id}`);
            setSelectedEmployee(response.data.user);
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message || "Could not load employee details."
            );
        }
    };

    const handleUpdateEmployee = async () => {
        if (isEditSubmitting) return;

        setEditErrorMessage("");
        setIsEditSubmitting(true);

        try {
            const formData = new FormData();

            formData.append("first_name", String(selectedEmployee.first_name || "").trim());
            formData.append("father_name", String(selectedEmployee.father_name || "").trim());
            formData.append("last_name", String(selectedEmployee.last_name || "").trim());
            formData.append("phone_number", String(selectedEmployee.phone_number || "").trim());
            formData.append("role_id", selectedEmployee.role_id || "");
            formData.append("restaurant_id", needsRestaurant ? editRestaurantId : "");
            formData.append("date_of_birth", getDateValue(selectedEmployee.date_of_birth));
            formData.append("job_title", String(selectedEmployee.job_title || "").trim());
            formData.append("national_number", String(selectedEmployee.national_number || "").trim());

            if (editImage) {
                formData.append("image", editImage);
            }

            await api.post(`/admin/staff-users/${selectedEmployee.id}`, formData);

            await getEmployees();
            setIsEditOpen(false);
            setEditImage(null);
        } catch (error) {
            setEditErrorMessage(getErrorMessage(error, "Could not update employee."));
        } finally {
            setIsEditSubmitting(false);
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
    const tableBorder = isLight ? "border-[#D8B7A8]" : "border-white/[0.08]";
    const tableRowBorder = isLight ? "border-[#DEC2B5]" : "border-white/[0.07]";
    const tableText = isLight ? "text-[#241815]" : "text-white";
    const tableMutedText = isLight ? "text-[#4F403A]" : "text-white/45";
    const tableSubtleText = isLight ? "text-[#6D5147]" : "text-white/38";
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
                ? "border-[#0F8B5F]/35 bg-[#E3F6EC] text-[#103B2B] shadow-[0_18px_42px_rgba(15,139,95,0.16)]"
                : "border-emerald-400/25 bg-[linear-gradient(145deg,rgba(16,185,129,0.18),rgba(32,43,47,0.94))] text-white",
            iconBox: isLight
                ? "border border-[#0F8B5F]/35 bg-[#CDEEDD] text-[#08764D] shadow-[0_12px_28px_rgba(15,139,95,0.14)]"
                : "border border-emerald-400/35 bg-emerald-400/10 text-emerald-300 shadow-[0_12px_28px_rgba(16,185,129,0.12)]",
            helperClass: isLight ? "text-[#08764D]" : "text-emerald-300",
        },
        {
            label: "Role Breakdown",
            value: spotlightRole?.name ?? "No roles",
            helper: spotlightRole ? `${spotlightRole.count} employees` : "0 employees",
            icon: Truck,
            card: isLight
                ? "border-[#C18200]/45 bg-[#FFE8A3] text-[#241815] shadow-[0_18px_42px_rgba(193,130,0,0.18)]"
                : "border-[#FFD166]/25 bg-[linear-gradient(145deg,rgba(255,209,102,0.18),rgba(32,43,47,0.94))] text-white",
            iconBox: isLight
                ? "border border-[#B17400]/35 bg-[#FFD166]/35 text-[#8A5700] shadow-[0_12px_28px_rgba(193,130,0,0.14)]"
                : "border border-[#FFD166]/35 bg-[#FFD166]/10 text-[#FFD166] shadow-[0_12px_28px_rgba(255,209,102,0.12)]",
            helperClass: isLight ? "text-[#8A5700]" : "text-[#FFD166]",
            isRoleSpotlight: true,
            spotlightKey: spotlightRole?.name ?? roleSpotlightIndex,
        },
        {
            label: "Staff Spotlight",
            value: getEmployeeName(spotlightEmployee) || "No employees",
            helper: spotlightEmployee ? getRoleName(spotlightEmployee, roleOptions) : "No role",
            icon: BadgeCheck,
            card: isLight
                ? "border-[#8F1D1D]/35 bg-[#F3DCDC] text-[#241815] shadow-[0_18px_42px_rgba(127,29,29,0.16)]"
                : "border-[#7F1D1D]/35 bg-[linear-gradient(145deg,rgba(127,29,29,0.14),rgba(32,43,47,0.94))] text-white",
            iconBox: "border border-[#7F1D1D]/35 bg-[#7F1D1D]/12 text-[#7F1D1D] shadow-[0_12px_28px_rgba(127,29,29,0.12)]",
            helperClass: "text-[#7F1D1D]",
            isSpotlight: true,
            spotlightKey: spotlightEmployee?.id ?? spotlightIndex,
        },
    ];

    return (
        <div
            className={`min-h-full overflow-y-auto p-4 sm:p-6 lg:p-8 ${
                isLight
                    ? "bg-[radial-gradient(circle_at_86%_10%,rgba(127,29,29,0.12),transparent_30%),radial-gradient(circle_at_18%_22%,rgba(216,162,45,0.18),transparent_26%),linear-gradient(145deg,#FFFDF8_0%,#F8EDE5_52%,#F0D8CF_100%)] text-[#241815]"
                    : "bg-[radial-gradient(circle_at_86%_10%,rgba(127,29,29,0.18),transparent_30%),radial-gradient(circle_at_18%_22%,rgba(255,209,102,0.12),transparent_26%),radial-gradient(circle_at_60%_82%,rgba(52,211,153,0.08),transparent_30%),linear-gradient(145deg,#0D1214_0%,#12191C_52%,#24171A_100%)] text-white"
            }`}
        >
            <div className="mx-auto max-w-[1500px]">
                <section
                    className={`mb-6 overflow-hidden rounded-[28px] border p-5 shadow-[0_22px_55px_rgba(0,0,0,0.28)] ring-1 ring-white/[0.04] backdrop-blur-sm sm:p-6 ${
                        isLight
                            ? "border-[#D8B7A8] bg-[linear-gradient(135deg,#FFFDF8_0%,#F5E6DD_58%,#E8C9C0_100%)] shadow-[0_22px_55px_rgba(127,29,29,0.14)]"
                            : "border-white/10 bg-[linear-gradient(145deg,rgba(27,37,40,0.92)_0%,rgba(21,29,32,0.84)_55%,rgba(44,25,31,0.78)_100%)]"
                    }`}
                >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <p className={`text-xs font-black uppercase tracking-[0.18em] ${isLight ? "text-[#9A6400]" : "text-[#FFD166]"}`}>
                                Staff administration
                            </p>
                            <h1 className={`mt-2 text-3xl font-black sm:text-4xl ${isLight ? "text-[#241815]" : "text-white"}`}>
                                Employees Management
                            </h1>
                            <p className={`mt-2 max-w-2xl text-sm font-semibold ${isLight ? "text-[#5A453D]" : "text-white/55"}`}>
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

                <section
                    className={`overflow-hidden rounded-[28px] border shadow-[0_24px_70px_rgba(0,0,0,0.30)] ring-1 ring-white/[0.04] ${
                        isLight
                            ? "border-[#D8B7A8] bg-[#FFF9F2] shadow-[0_24px_70px_rgba(127,29,29,0.13)]"
                            : "border-white/10 bg-[linear-gradient(145deg,rgba(30,42,45,0.98),rgba(17,27,30,0.96))]"
                    }`}
                >
                    <div
                        className={`grid gap-4 border-b p-5 lg:grid-cols-[minmax(220px,1fr)_minmax(320px,520px)] lg:items-center ${
                            isLight
                                ? "border-[#D8B7A8] bg-[linear-gradient(90deg,#FFFDF8_0%,#F2DDD4_100%)]"
                                : "border-white/[0.08] bg-[radial-gradient(circle_at_100%_0%,rgba(127,29,29,0.14),transparent_34%),rgba(255,255,255,0.03)]"
                        }`}
                    >
                        <div className="min-w-0">
                            <h2 className={`text-2xl font-black ${isLight ? "text-[#241815]" : "text-white"}`}>Staff Directory</h2>
                            <p className={`mt-1 text-sm font-semibold ${isLight ? "text-[#6D5147]" : "text-white/48"}`}>
                                {isLoading
                                    ? "Loading employees..."
                                    : `${filteredEmployees.length} of ${employees.length} employees`}
                            </p>
                        </div>

                        <div className={`flex min-h-12 w-full items-center gap-3 rounded-2xl border px-4 shadow-inner ${
                            isLight
                                ? "border-[#D8B7A8] bg-white text-[#241815]"
                                : "border-white/10 bg-[#0D1214]"
                        }`}>
                            <Search size={18} className={`shrink-0 ${isLight ? "text-[#9A6400]" : "text-[#FFD166]"}`} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="Search name, role, contact..."
                                className={`min-w-0 flex-1 bg-transparent text-sm font-bold outline-none ${
                                    isLight
                                        ? "text-[#241815] placeholder:text-[#7A5A50]"
                                        : "text-white placeholder:text-white/35"
                                }`}
                            />
                        </div>
                    </div>

                    <div className={`space-y-4 border-b p-5 ${
                        isLight
                            ? "border-[#D8B7A8] bg-[#FFF1E8]"
                            : "border-white/[0.08] bg-[#172124]"
                    }`}>
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                            <div className={`flex items-center gap-2 text-sm font-black ${isLight ? "text-[#241815]" : "text-white"}`}>
                                <div className="grid h-9 w-9 place-items-center rounded-xl border border-[#8F1D1D]/35 bg-[#F3DCDC] text-[#8F1D1D]">
                                    <ListFilter size={18} />
                                </div>
                                Filters
                            </div>

                            <button
                                type="button"
                                onClick={clearFilters}
                                disabled={!hasActiveFilters}
                                className={`w-fit rounded-2xl border px-4 py-2 text-sm font-black transition duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0 ${
                                    isLight
                                        ? "border-[#D8B7A8] bg-white text-[#7F1D1D] hover:border-[#8F1D1D]/45 hover:bg-[#F9ECEC]"
                                        : "border-white/10 bg-white/[0.04] text-white/65 hover:border-white/20 hover:text-white"
                                }`}
                            >
                                Clear filters
                            </button>
                        </div>

                        <div className="space-y-2">
                            <p className={`text-xs font-black uppercase tracking-[0.14em] ${isLight ? "text-[#8A5700]" : "text-[#FFD166]"}`}>
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
                                                        ? "border-[#8F1D1D]/50 bg-[#F3DCDC] text-[#7F1D1D] shadow-[0_14px_30px_rgba(127,29,29,0.14)]"
                                                        : "border-[#7F1D1D]/65 bg-[#7F1D1D]/18 text-white shadow-[0_14px_30px_rgba(127,29,29,0.14)]"
                                                    : isLight
                                                        ? "border-[#D0AD9E] bg-white text-[#4F403A] hover:border-[#8F1D1D]/45 hover:bg-[#F9ECEC] hover:text-[#241815]"
                                                        : "border-white/10 bg-[#202B2F] text-white/70 hover:border-[#7F1D1D]/35 hover:bg-[#253236] hover:text-white"
                                            }`}
                                        >
                                            {option.label}
                                            <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                                                isActiveFilter
                                                    ? isLight
                                                        ? "bg-white text-[#241815]"
                                                        : "bg-white/18 text-white"
                                                    : isLight
                                                        ? "bg-[#E7D1C6] text-[#4F403A]"
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

                    <div className={`overflow-x-auto ${isLight ? "bg-[#FFFDF8]" : "bg-[#111A1D]"}`}>
                        <table className="w-full min-w-[900px] border-separate border-spacing-0">
                            <thead>
                                <tr className={`text-left text-xs font-black uppercase tracking-[0.12em] ${
                                    isLight
                                        ? "bg-[#EAD2C5] text-[#5A4037]"
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
                                            className={`group transition ${isLight ? "hover:bg-[#FFF1E8]" : "hover:bg-white/[0.035]"}`}
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
                                                        ? "border-[#0F8B5F]/35 bg-[#D9F2E5] text-[#08764D]"
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
                                                            ? isLight
                                                                ? "border-[#C18200]/35 bg-[#FFE8A3] text-[#7A4F00]"
                                                                : "border-[#FFD166]/28 bg-[#FFD166]/10 text-[#FFD166]"
                                                            : isLight
                                                                ? "border-[#D8B7A8] bg-white text-[#5A453D]"
                                                                : "border-white/10 bg-white/[0.04] text-white/42"
                                                    }`}
                                                    title={restaurantName || "Not assigned"}
                                                >
                                                    <Building2
                                                        size={15}
                                                        className={
                                                            restaurantName
                                                                ? isLight
                                                                    ? "text-[#9A6400]"
                                                                    : "text-[#FFD166]"
                                                                : isLight
                                                                    ? "text-[#6D5147]"
                                                                    : "text-white/28"
                                                        }
                                                    />
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
                                                                ? "border border-[#0F8B5F]/35 bg-[#D9F2E5] text-[#08764D]"
                                                                : "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                                                            : "border border-[#7F1D1D]/30 bg-[#7F1D1D]/10 text-[#7F1D1D]"
                                                    }`}
                                                >
                                                    {employee.status || "unknown"}
                                                </span>
                                            </td>
                                            <td className={`border-b px-4 py-4 transition ${tableRowBorder}`}>
                                                <div
                                                    className={`ml-auto flex w-fit items-center justify-end gap-1.5 rounded-2xl border p-1 shadow-inner ${
                                                        isLight
                                                            ? "border-[#D8B7A8] bg-[#FFF1E8]"
                                                            : "border-white/10 bg-black/15"
                                                    }`}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => handleShowEmployee(employee)}
                                                        className={`grid h-9 w-9 place-items-center rounded-xl border transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg active:translate-y-0 active:scale-90 focus:outline-none focus:ring-2 focus:ring-sky-400/30 ${
                                                            isLight
                                                                ? "border-sky-600/25 bg-white text-sky-700 hover:border-sky-600/40 hover:bg-sky-100 hover:shadow-sky-900/10"
                                                                : "border-sky-400/25 bg-white/[0.04] text-sky-300 hover:border-sky-400/45 hover:bg-sky-400/14 hover:shadow-sky-950/25"
                                                        }`}
                                                        title="Details"
                                                    >
                                                        <Info size={17} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(employee)}
                                                        className={`grid h-9 w-9 place-items-center rounded-xl border transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg active:translate-y-0 active:scale-90 focus:outline-none focus:ring-2 focus:ring-[#FFD166]/30 ${
                                                            isLight
                                                                ? "border-[#C18200]/25 bg-white text-[#8A5700] hover:border-[#C18200]/45 hover:bg-[#FFE8A3] hover:shadow-[#8A5700]/10"
                                                                : "border-[#FFD166]/25 bg-white/[0.04] text-[#FFD166] hover:border-[#FFD166]/45 hover:bg-[#FFD166]/14 hover:shadow-black/25"
                                                        }`}
                                                        title="Edit"
                                                    >
                                                        <Pencil size={17} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEmployeeToDelete(employee);
                                                            setIsDeleteOpen(true);
                                                        }}
                                                        className={`grid h-9 w-9 place-items-center rounded-xl border transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg active:translate-y-0 active:scale-90 focus:outline-none focus:ring-2 focus:ring-[#7F1D1D]/30 ${
                                                            isLight
                                                                ? "border-[#8F1D1D]/25 bg-white text-[#8F1D1D] hover:border-[#8F1D1D]/45 hover:bg-[#F3DCDC] hover:shadow-[#7F1D1D]/10"
                                                                : "border-[#7F1D1D]/25 bg-white/[0.04] text-[#EF8888] hover:border-[#7F1D1D]/45 hover:bg-[#7F1D1D]/14 hover:text-[#FFB0B0] hover:shadow-black/25"
                                                        }`}
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
                <div className="modal-backdrop-enter fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                    <div className="modal-panel-enter w-full max-w-md rounded-[28px] border border-white/10 bg-[#182124] p-5 text-white shadow-2xl">
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
                <div className="modal-backdrop-enter fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                    <div className="modal-panel-enter max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#182124] p-5 text-white shadow-2xl">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-xl font-black">Edit Employee</h2>
                            <button
                                onClick={() => {
                                    setEditErrorMessage("");
                                    setEditImage(null);
                                    setIsEditOpen(false);
                                }}
                                className="grid h-9 w-9 place-items-center rounded-xl text-white/55 hover:bg-white/[0.06] hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <label className="block">
                                <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">First Name</span>
                                <input
                                    type="text"
                                    value={selectedEmployee.first_name || ""}
                                    onChange={(event) => {
                                        setEditErrorMessage("");
                                        setSelectedEmployee({
                                            ...selectedEmployee,
                                            first_name: event.target.value,
                                        });
                                    }}
                                    className="w-full rounded-2xl border border-white/10 bg-[#0D1214] px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">Father Name</span>
                                <input
                                    type="text"
                                    value={selectedEmployee.father_name || ""}
                                    onChange={(event) => {
                                        setEditErrorMessage("");
                                        setSelectedEmployee({
                                            ...selectedEmployee,
                                            father_name: event.target.value,
                                        });
                                    }}
                                    className="w-full rounded-2xl border border-white/10 bg-[#0D1214] px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">Last Name</span>
                                <input
                                    type="text"
                                    value={selectedEmployee.last_name || ""}
                                    onChange={(event) => {
                                        setEditErrorMessage("");
                                        setSelectedEmployee({
                                            ...selectedEmployee,
                                            last_name: event.target.value,
                                        });
                                    }}
                                    className="w-full rounded-2xl border border-white/10 bg-[#0D1214] px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">Date Of Birth</span>
                                <input
                                    type="date"
                                    value={getDateValue(selectedEmployee.date_of_birth)}
                                    onChange={(event) => {
                                        setEditErrorMessage("");
                                        setSelectedEmployee({
                                            ...selectedEmployee,
                                            date_of_birth: event.target.value,
                                        });
                                    }}
                                    className="w-full rounded-2xl border border-white/10 bg-[#0D1214] px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">National Number</span>
                                <input
                                    type="text"
                                    value={selectedEmployee.national_number || ""}
                                    onChange={(event) => {
                                        setEditErrorMessage("");
                                        setSelectedEmployee({
                                            ...selectedEmployee,
                                            national_number: event.target.value,
                                        });
                                    }}
                                    className="w-full rounded-2xl border border-white/10 bg-[#0D1214] px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">Job Title</span>
                                <input
                                    type="text"
                                    value={selectedEmployee.job_title || ""}
                                    onChange={(event) => {
                                        setEditErrorMessage("");
                                        setSelectedEmployee({
                                            ...selectedEmployee,
                                            job_title: event.target.value,
                                        });
                                    }}
                                    className="w-full rounded-2xl border border-white/10 bg-[#0D1214] px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">Role</span>
                                <StyledSelect
                                    value={selectedEmployee.role_id || ""}
                                    options={roleOptions}
                                    placeholder="Select role"
                                    getOptionLabel={formatRoleLabel}
                                    onChange={(nextRole) => {
                                        setEditErrorMessage("");
                                        setSelectedEmployee({
                                            ...selectedEmployee,
                                            role_id: nextRole,
                                        });
                                    }}
                                    disabled={!roleOptions.length}
                                />
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">Photo</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) => {
                                        setEditErrorMessage("");
                                        setEditImage(event.target.files?.[0] || null);
                                    }}
                                    className="w-full rounded-2xl border border-white/10 bg-[#0D1214] px-4 py-3 text-sm font-bold text-white file:mr-4 file:rounded-xl file:border-0 file:bg-[#FFD166] file:px-4 file:py-2 file:text-sm file:font-black file:text-[#151A1D] focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10"
                                />
                            </label>

                            {needsRestaurant && (
                                <label className="block">
                                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">Restaurant</span>
                                    <StyledSelect
                                        value={editRestaurantId}
                                        options={restaurants}
                                        placeholder="Select Restaurant"
                                        getOptionLabel={(restaurant) => restaurant.name}
                                        onChange={(nextRestaurantId) => {
                                            setEditErrorMessage("");
                                            setEditRestaurantId(nextRestaurantId);
                                        }}
                                        disabled={!restaurants.length}
                                    />
                                </label>
                            )}
                        </div>

                        {editErrorMessage && (
                            <p className="mt-4 rounded-2xl border border-[#7F1D1D]/35 bg-[#7F1D1D]/12 px-4 py-3 text-sm font-bold leading-relaxed text-[#FFB0B0]">
                                {editErrorMessage}
                            </p>
                        )}

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                disabled={isEditSubmitting}
                                onClick={() => {
                                    setEditErrorMessage("");
                                    setEditImage(null);
                                    setIsEditOpen(false);
                                }}
                                className="flex-1 rounded-2xl border border-white/10 py-3 text-sm font-black text-white/65 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.05] hover:text-white active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleUpdateEmployee}
                                disabled={isEditSubmitting}
                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#7F1D1D] py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(127,29,29,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#681718] hover:shadow-[0_18px_36px_rgba(127,29,29,0.32)] active:translate-y-0 active:scale-[0.98] disabled:cursor-wait disabled:opacity-75 disabled:hover:translate-y-0 disabled:hover:bg-[#7F1D1D]"
                            >
                                {isEditSubmitting && <Loader2 size={17} className="animate-spin" />}
                                {isEditSubmitting ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isDeleteOpen && employeeToDelete && (
                <div className="modal-backdrop-enter fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                    <div className="modal-panel-enter w-full max-w-md rounded-[28px] border border-white/10 bg-[#182124] p-5 text-center text-white shadow-2xl">
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
