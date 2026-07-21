import {
    AlertCircle,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Pencil,
    RefreshCw,
    Search,
    Send,
    Trash2,
    UserRoundCheck,
    X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../../API/axios";
import { useTheme } from "../../context/ThemeContext";

const WEEK_DAYS = [
    { value: "monday", label: "Monday", short: "Mon" },
    { value: "tuesday", label: "Tuesday", short: "Tue" },
    { value: "wednesday", label: "Wednesday", short: "Wed" },
    { value: "thursday", label: "Thursday", short: "Thu" },
    { value: "friday", label: "Friday", short: "Fri" },
    { value: "saturday", label: "Saturday", short: "Sat" },
    { value: "sunday", label: "Sunday", short: "Sun" },
];

const getList = (data, key) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(data?.data?.[key])) return data.data[key];
    if (Array.isArray(data?.data)) return data.data;
    return [];
};

const DAY_VALUES = new Set(WEEK_DAYS.map((day) => day.value));

const mapShiftValue = (value, fallbackDay = "") => {
    if (!value || typeof value !== "object") return null;

    return {
        ...(value ?? {}),
        day_of_week:
            value.day_of_week ??
            value.dayOfWeek ??
            value.day ??
            value.weekday ??
            value.week_day ??
            fallbackDay,
    };
};

const toShiftArray = (value) => {
    if (Array.isArray(value)) return value.map((item) => mapShiftValue(item)).filter(Boolean);

    if (!value || typeof value !== "object") return [];

    return Object.entries(value)
        .flatMap(([key, item]) => {
            const fallbackDay = DAY_VALUES.has(normalizeDay(key))
                ? normalizeDay(key)
                : "";

            if (Array.isArray(item)) {
                return item
                    .map((shift) => mapShiftValue(shift, fallbackDay))
                    .filter(Boolean);
            }

            return mapShiftValue(item, fallbackDay) ?? [];
        })
        .filter((shift) => normalizeDay(getShiftDay(shift)) !== "unknown");
};

function getEmployeeName(employee) {
    return (
        [employee?.first_name, employee?.last_name].filter(Boolean).join(" ") ||
        employee?.name ||
        employee?.email ||
        `Employee #${employee?.id ?? ""}`
    );
}

function getRoleName(employee) {
    return employee?.role?.name || employee?.role_name || "Staff";
}

function getEmployeeInitials(employee) {
    const nameParts = getEmployeeName(employee)
        .split(" ")
        .filter(Boolean)
        .slice(0, 2);

    return nameParts.map((part) => part[0]).join("").toUpperCase() || "E";
}

function getShiftId(shift) {
    return shift?.id ?? shift?.shift_id ?? shift?.employee_shift_id;
}

function getShiftDay(shift) {
    return (
        shift?.day_of_week ??
        shift?.dayOfWeek ??
        shift?.day ??
        shift?.weekday ??
        shift?.week_day ??
        "Unknown"
    );
}

function normalizeDay(day) {
    return String(day ?? "").trim().toLowerCase();
}

function isSameDay(leftDay, rightDay) {
    return normalizeDay(leftDay) === normalizeDay(rightDay);
}

function getShiftStartTime(shift) {
    return String(shift?.start_time ?? shift?.startTime ?? "").slice(0, 5);
}

function getShiftEndTime(shift) {
    return String(shift?.end_time ?? shift?.endTime ?? "").slice(0, 5);
}

function getErrorMessage(error) {
    const errors = error.response?.data?.errors;

    if (errors && typeof errors === "object") {
        return Object.values(errors).flat().filter(Boolean).join(" ");
    }

    return error.response?.data?.message || "Could not create employee shifts.";
}

function EmployeeShifts() {
    const { isLight } = useTheme();
    const [employees, setEmployees] = useState([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
    const [selectedDays, setSelectedDays] = useState(["monday"]);
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("23:00");
    const [searchQuery, setSearchQuery] = useState("");
    const [employeeShifts, setEmployeeShifts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isShiftsLoading, setIsShiftsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingShiftId, setEditingShiftId] = useState("");
    const [editStartTime, setEditStartTime] = useState("");
    const [editEndTime, setEditEndTime] = useState("");
    const [busyShiftId, setBusyShiftId] = useState("");
    const [pendingDeleteShiftId, setPendingDeleteShiftId] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const selectedEmployee = employees.find(
        (employee) => String(employee.id) === String(selectedEmployeeId)
    );

    const bookedShiftDays = useMemo(
        () =>
            new Set(
                employeeShifts
                    .map((shift) => normalizeDay(getShiftDay(shift)))
                    .filter(Boolean)
            ),
        [employeeShifts]
    );

    const hasShiftOnDay = (dayValue) =>
        employeeShifts.some((shift) => isSameDay(getShiftDay(shift), dayValue));

    const bookedDaysCount = WEEK_DAYS.filter((day) =>
        hasShiftOnDay(day.value)
    ).length;
    const availableDaysCount = selectedEmployeeId
        ? WEEK_DAYS.length - bookedDaysCount
        : 0;

    const filteredEmployees = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return employees.filter((employee) =>
            !query ||
            [
                getEmployeeName(employee),
                employee.email,
                employee.phone_number,
                getRoleName(employee),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(query)
        );
    }, [employees, searchQuery]);

    useEffect(() => {
        document.querySelector(".app-content")?.scrollTo({ top: 0, left: 0 });
    }, []);

    useEffect(() => {
        const fetchEmployees = async () => {
            setIsLoading(true);
            setErrorMessage("");

            try {
                const response = await api.get("/admin/staff-users");
                setEmployees(getList(response.data, "users"));
            } catch (error) {
                setErrorMessage(
                    error.response?.data?.message || "Could not load employees."
                );
            } finally {
                setIsLoading(false);
            }
        };

        fetchEmployees();
    }, []);

    const getShiftList = (data) => {
        const collectShiftLists = (node, depth = 0) => {
            if (!node || depth > 5) return [];

            if (Array.isArray(node)) {
                const shifts = toShiftArray(node);
                return shifts.length ? shifts : [];
            }

            if (typeof node !== "object") return [];

            const found = [];

            for (const [key, value] of Object.entries(node)) {
                const normalizedKey = key.toLowerCase();

                if (
                    normalizedKey === "shifts" ||
                    normalizedKey === "employee_shifts"
                ) {
                    found.push(...toShiftArray(value));
                    continue;
                }

                found.push(...collectShiftLists(value, depth + 1));
            }

            return found;
        };

        const shifts = collectShiftLists(data);
        if (shifts.length) return shifts;

        return [
            ...toShiftArray(getList(data, "shifts")),
            ...toShiftArray(getList(data, "employee_shifts")),
        ];
    };

    const fetchEmployeeShifts = async (employeeId) => {
        if (!employeeId) {
            setEmployeeShifts([]);
            return;
        }

        setIsShiftsLoading(true);
        setEmployeeShifts([]);

        try {
            const response = await api.get(`/users/${employeeId}/shifts`);
            const shifts = getShiftList(response.data);
            const shiftDays = new Set(
                shifts.map((shift) => normalizeDay(getShiftDay(shift))).filter(Boolean)
            );

            setEmployeeShifts(shifts);
            setSelectedDays((currentDays) =>
                currentDays.filter((day) => !shiftDays.has(day))
            );
        } catch (error) {
            setEmployeeShifts([]);
            setErrorMessage(
                error.response?.data?.message || "Could not load employee shifts."
            );
        } finally {
            setIsShiftsLoading(false);
        }
    };

    const openEditShift = (shift) => {
        setEditingShiftId(getShiftId(shift));
        setPendingDeleteShiftId("");
        setEditStartTime(getShiftStartTime(shift));
        setEditEndTime(getShiftEndTime(shift));
        setSuccessMessage("");
        setErrorMessage("");
    };

    const cancelEditShift = () => {
        setEditingShiftId("");
        setEditStartTime("");
        setEditEndTime("");
    };

    const handleUpdateShift = async (shift) => {
        const shiftId = getShiftId(shift);
        const formData = new FormData();

        if (!shiftId) {
            setErrorMessage("Could not find this shift id.");
            return;
        }

        if (!editStartTime || !editEndTime) {
            setErrorMessage("Please set start and end time.");
            return;
        }

        formData.append("_method", "PATCH");
        formData.append("start_time", editStartTime);
        formData.append("end_time", editEndTime);
        formData.append("is_active", "1");

        setBusyShiftId(shiftId);
        setSuccessMessage("");
        setErrorMessage("");

        try {
            await api.post(`/users/${selectedEmployeeId}/shifts/${shiftId}`, formData);
            setSuccessMessage(`${getShiftDay(shift)} shift updated.`);
            cancelEditShift();
            fetchEmployeeShifts(selectedEmployeeId);
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setBusyShiftId("");
        }
    };

    const openDeleteShift = (shift) => {
        setPendingDeleteShiftId(getShiftId(shift));
        setEditingShiftId("");
        setEditStartTime("");
        setEditEndTime("");
        setSuccessMessage("");
        setErrorMessage("");
    };

    const cancelDeleteShift = () => {
        setPendingDeleteShiftId("");
    };

    const handleDeleteShift = async (shift) => {
        const shiftId = getShiftId(shift);
        const formData = new FormData();

        if (!shiftId) {
            setErrorMessage("Could not find this shift id.");
            return;
        }

        formData.append("_method", "DELETE");
        setBusyShiftId(shiftId);
        setSuccessMessage("");
        setErrorMessage("");

        try {
            await api.post(`/users/${selectedEmployeeId}/shifts/${shiftId}`, formData);
            setSuccessMessage(`${getShiftDay(shift)} shift deleted.`);
            setPendingDeleteShiftId("");
            fetchEmployeeShifts(selectedEmployeeId);
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setBusyShiftId("");
        }
    };

    const toggleDay = (day) => {
        if (bookedShiftDays.has(day)) return;

        setSuccessMessage("");
        setErrorMessage("");
        setSelectedDays((currentDays) =>
            currentDays.includes(day)
                ? currentDays.filter((item) => item !== day)
                : [...currentDays, day]
        );
    };

    const selectWorkWeek = () => {
        setSuccessMessage("");
        setErrorMessage("");
        setSelectedDays(
            WEEK_DAYS.slice(0, 5)
                .map((day) => day.value)
                .filter((day) => !bookedShiftDays.has(day))
        );
    };

    const selectAllDays = () => {
        setSuccessMessage("");
        setErrorMessage("");
        setSelectedDays(
            WEEK_DAYS.map((day) => day.value).filter(
                (day) => !bookedShiftDays.has(day)
            )
        );
    };

    const clearDays = () => {
        setSuccessMessage("");
        setErrorMessage("");
        setSelectedDays([]);
    };

    const buildShiftFormData = (day) => {
        const formData = new FormData();

        formData.append("day_of_week", day);
        formData.append("start_time", startTime);
        formData.append("end_time", endTime);
        formData.append("is_active", "1");

        return formData;
    };

    const handleCreateShifts = async (event) => {
        event.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");

        if (!selectedEmployeeId) {
            setErrorMessage("Please select an employee.");
            return;
        }

        if (!selectedDays.length) {
            setErrorMessage("Please select at least one day.");
            return;
        }

        if (selectedDays.some((day) => bookedShiftDays.has(day))) {
            setErrorMessage("One or more selected days already have shifts.");
            return;
        }

        if (!startTime || !endTime) {
            setErrorMessage("Please set start and end time.");
            return;
        }

        setIsSubmitting(true);

        try {
            for (const day of selectedDays) {
                await api.post(
                    `/users/${selectedEmployeeId}/shifts`,
                    buildShiftFormData(day)
                );
            }

            setSuccessMessage(
                `${selectedDays.length} shift${selectedDays.length > 1 ? "s" : ""} created for ${getEmployeeName(selectedEmployee)}.`
            );
            fetchEmployeeShifts(selectedEmployeeId);
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    const titleText = isLight ? "text-[#241815]" : "text-white";
    const mutedText = isLight ? "text-[#6B5A52]" : "text-white/50";
    const pageSurface = isLight
        ? "bg-[#FBF6EF] text-[#241815]"
        : "bg-[linear-gradient(145deg,#0A1012_0%,#111A1D_58%,#181316_100%)] text-white";
    const cardSurface = isLight
        ? "border-[#E4CFC3] bg-[#FFF9F2] shadow-[0_18px_44px_rgba(70,45,30,0.10)]"
        : "border-white/10 bg-[linear-gradient(135deg,rgba(28,39,42,0.96)_0%,rgba(24,34,37,0.94)_60%,rgba(37,27,30,0.92)_100%)] shadow-[0_20px_55px_rgba(0,0,0,0.28)] ring-1 ring-white/[0.04]";
    const panelSurface = isLight
        ? "border-[#E4CFC3] bg-[#FFF9F2] shadow-[0_18px_44px_rgba(70,45,30,0.10)]"
        : "border-white/10 bg-[#1B282C] shadow-[0_20px_50px_rgba(0,0,0,0.24)] ring-1 ring-white/[0.03]";
    const panelHeader = isLight
        ? "border-[#E4CFC3] bg-[#FFF4EA]"
        : "border-white/[0.08] bg-white/[0.025]";
    const inputSurface = isLight
        ? "border-[#E4CFC3] bg-white text-[#241815] placeholder:text-[#8B7A72]"
        : "border-white/10 bg-[#0D1214] text-white placeholder:text-white/35";
    const emptySurface = isLight
        ? "border-[#E4CFC3] bg-[#FFF4EA] text-[#7A6A64]"
        : "border-white/15 bg-[#111A1D] text-white/45";
    const goldText = isLight ? "text-[#9A6400]" : "text-[#FFD166]";
    const goldBorder = isLight ? "border-[#D8A22D]/38" : "border-[#FFD166]/30";
    const goldBackground = isLight ? "bg-[#FFF4DA]" : "bg-[#FFD166]/10";

    return (
        <div className={`min-h-full space-y-6 p-4 sm:p-6 lg:p-8 ${pageSurface}`}>
            <section className={`overflow-hidden rounded-[24px] border ${cardSurface}`}>
                <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                        <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl border ${goldBorder} ${goldBackground} ${goldText} shadow-[0_14px_30px_rgba(0,0,0,0.12)] ring-1 ring-white/10`}>
                            <CalendarDays size={25} />
                        </div>
                        <div>
                            <p className={`text-xs font-black uppercase tracking-[0.18em] ${goldText}`}>
                                Staff scheduling
                            </p>
                            <h1 className={`mt-1 text-3xl font-black sm:text-4xl ${titleText}`}>
                                Manage Employee Shifts
                            </h1>
                            <p className={`mt-2 max-w-2xl text-sm font-medium leading-6 ${mutedText}`}>
                                Select an employee and assign the same shift to multiple weekdays.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:w-[300px]">
                        <div className={`rounded-2xl border p-4 ${isLight ? "border-[#E4CFC3] bg-[#FFF4EA]" : "border-white/10 bg-white/[0.055]"}`}>
                            <p className={`text-xs font-black uppercase tracking-[0.12em] ${goldText}`}>Employees</p>
                            <strong className={`mt-2 block text-4xl font-black tabular-nums ${titleText}`}>
                                {isLoading ? "..." : employees.length}
                            </strong>
                        </div>
                        <div className={`rounded-2xl border p-4 ${isLight ? "border-[#E4CFC3] bg-[#FFF4EA]" : "border-white/10 bg-white/[0.055]"}`}>
                            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7F1D1D]">Days</p>
                            <strong className={`mt-2 block text-4xl font-black tabular-nums ${titleText}`}>
                                {selectedDays.length}
                            </strong>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[360px_1fr]">
                <aside className={`self-start overflow-hidden rounded-[24px] border ${panelSurface}`}>
                    <div className={`border-b p-4 ${panelHeader}`}>
                        <div className="flex items-center gap-3">
                            <div className={`grid h-10 w-10 place-items-center rounded-xl border ${goldBorder} ${goldBackground} ${goldText}`}>
                                <UserRoundCheck size={20} />
                            </div>
                            <div>
                                <p className={`text-xs font-black uppercase tracking-[0.16em] ${goldText}`}>
                                    Select employee
                                </p>
                                <h2 className={`text-lg font-black ${titleText}`}>Employees</h2>
                            </div>
                        </div>

                        <div className={`mt-4 flex items-center gap-2 rounded-2xl border px-3 py-2.5 shadow-inner ${inputSurface}`}>
                            <Search size={17} className={`shrink-0 ${goldText}`} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="Search employees..."
                                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
                            />
                        </div>
                    </div>

                    <div className="admin-dashboard-scroll max-h-[540px] space-y-2 overflow-y-auto p-3">
                        {isLoading ? (
                            <div className={`rounded-2xl border border-dashed p-6 text-center text-sm font-semibold ${emptySurface}`}>
                                Loading employees...
                            </div>
                        ) : filteredEmployees.length ? (
                            filteredEmployees.map((employee) => {
                                const isSelected =
                                    String(employee.id) === String(selectedEmployeeId);

                                return (
                                    <button
                                        key={employee.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedEmployeeId(employee.id);
                                            setEditingShiftId("");
                                            setEditStartTime("");
                                            setEditEndTime("");
                                            setPendingDeleteShiftId("");
                                            setSuccessMessage("");
                                            setErrorMessage("");
                                            fetchEmployeeShifts(employee.id);
                                        }}
                                        className={`group flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition active:scale-[0.99] ${
                                            isSelected
                                                ? `${goldBorder} ${goldBackground} ${titleText} shadow-[0_12px_24px_rgba(154,100,0,0.12)]`
                                                : isLight
                                                    ? "border-[#E8D8CE] bg-white/90 text-[#6B5A52] hover:border-[#D8A22D]/35 hover:bg-[#FFF9F2] hover:text-[#241815]"
                                                    : "border-white/8 bg-[#101A1D] text-white/74 hover:border-[#FFD166]/20 hover:bg-[#152226] hover:text-white"
                                        }`}
                                    >
                                        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border text-xs font-black ${
                                            isSelected
                                                ? `${goldBorder} ${goldBackground} ${goldText}`
                                                : isLight
                                                    ? "border-[#E4CFC3] bg-[#FFF4EA] text-[#9A6400]"
                                                    : "border-white/10 bg-white/[0.055] text-[#FFD166]"
                                        }`}>
                                            {getEmployeeInitials(employee)}
                                        </span>

                                        <span className="min-w-0 flex-1">
                                            <span className="line-clamp-1 text-sm font-black">
                                                {getEmployeeName(employee)}
                                            </span>
                                            <span className={`mt-1 flex min-w-0 items-center gap-2 text-xs font-bold ${isSelected ? goldText : mutedText}`}>
                                                <span className="truncate capitalize">
                                                    {getRoleName(employee)}
                                                </span>
                                                <span className="h-1 w-1 shrink-0 rounded-full bg-current opacity-45" />
                                                <span className="shrink-0">EMP-{employee.id}</span>
                                            </span>
                                        </span>
                                        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border transition ${
                                            isSelected
                                                ? "border-[#D8A22D]/40 bg-white/45 text-[#9A6400]"
                                                : isLight
                                                    ? "border-transparent text-transparent group-hover:border-[#E4CFC3] group-hover:text-[#9A6400]"
                                                    : "border-transparent text-transparent group-hover:border-white/10 group-hover:text-[#FFD166]"
                                        }`}>
                                            <CheckCircle2 size={16} />
                                        </span>
                                    </button>
                                );
                            })
                        ) : (
                            <div className={`rounded-2xl border border-dashed p-6 text-center text-sm font-semibold ${emptySurface}`}>
                                No employees found.
                            </div>
                        )}
                    </div>
                </aside>

                <form
                    onSubmit={handleCreateShifts}
                    className={`overflow-hidden rounded-[24px] border ${panelSurface}`}
                >
                    <div className={`border-b p-4 ${panelHeader}`}>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0">
                                <p className={`text-xs font-black uppercase tracking-[0.16em] ${goldText}`}>
                                    Shift details
                                </p>
                                <h2 className={`mt-1 text-3xl font-black ${titleText}`}>
                                    {selectedEmployee ? getEmployeeName(selectedEmployee) : "Select an employee"}
                                </h2>
                                {selectedEmployee && (
                                    <p className={`mt-1 text-sm font-bold ${mutedText}`}>
                                        {getRoleName(selectedEmployee)} · EMP-{selectedEmployee.id}
                                    </p>
                                )}
                            </div>
                            {selectedEmployeeId && (
                                <div className="grid grid-cols-3 gap-2 sm:w-[330px]">
                                    <div className={`rounded-2xl border px-3 py-2 text-center ${isLight ? "border-[#E4CFC3] bg-white" : "border-white/10 bg-white/[0.05]"}`}>
                                        <p className={`text-[10px] font-black uppercase tracking-[0.1em] ${mutedText}`}>Selected</p>
                                        <strong className={`block text-xl font-black tabular-nums ${goldText}`}>{selectedDays.length}</strong>
                                    </div>
                                    <div className={`rounded-2xl border px-3 py-2 text-center ${isLight ? "border-[#15803D]/25 bg-[#F0FDF4]" : "border-emerald-400/20 bg-emerald-400/10"}`}>
                                        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#15803D]">Available</p>
                                        <strong className="block text-xl font-black tabular-nums text-[#15803D]">{availableDaysCount}</strong>
                                    </div>
                                    <div className={`rounded-2xl border px-3 py-2 text-center ${isLight ? "border-[#8C1D18]/25 bg-[#FEF2F2]" : "border-red-300/20 bg-red-300/10"}`}>
                                        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8C1D18]">Booked</p>
                                        <strong className="block text-xl font-black tabular-nums text-[#8C1D18]">{bookedDaysCount}</strong>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-5 p-4">
                        <section>
                            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className={`text-xs font-black uppercase tracking-[0.14em] ${mutedText}`}>
                                        Days of week
                                    </p>
                                    <p className={`mt-1 text-sm font-medium ${mutedText}`}>
                                        {selectedEmployeeId
                                            ? "Choose one or more days for this shift."
                                            : "Select an employee to view available days."}
                                    </p>
                                </div>
                                {selectedEmployeeId && (
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={selectWorkWeek}
                                            className={`rounded-xl border px-3 py-2 text-xs font-black transition ${goldBorder} ${goldBackground} ${goldText}`}
                                        >
                                            Work week
                                        </button>
                                        <button
                                            type="button"
                                            onClick={selectAllDays}
                                            className={`rounded-xl border px-3 py-2 text-xs font-black transition ${
                                                isLight
                                                    ? "border-[#E4CFC3] bg-white text-[#6B5A52] hover:text-[#241815]"
                                                    : "border-white/10 bg-white/[0.05] text-white/70 hover:text-white"
                                            }`}
                                        >
                                            All days
                                        </button>
                                        <button
                                            type="button"
                                            onClick={clearDays}
                                            className="rounded-xl border border-[#7F1D1D]/30 bg-[#7F1D1D]/10 px-3 py-2 text-xs font-black text-[#EF4444] transition hover:bg-[#7F1D1D]/18"
                                        >
                                        Clear
                                    </button>
                                </div>
                            )}
                        </div>

                            {selectedEmployeeId ? (
                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-3 text-xs font-black">
                                        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${isLight ? "border-[#15803D]/20 bg-[#F0FDF4] text-[#15803D]" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"}`}>
                                            <span className="h-1.5 w-5 rounded-full bg-[#15803D]" />
                                            Available
                                        </span>
                                        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${isLight ? "border-[#8C1D18]/20 bg-[#FEF2F2] text-[#8C1D18]" : "border-red-300/20 bg-red-300/10 text-red-200"}`}>
                                            <span className="h-1.5 w-5 rounded-full bg-[#8C1D18]" />
                                            Not available
                                        </span>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-4 xl:grid-cols-7">
                                        {WEEK_DAYS.map((day) => {
                                            const isSelected = selectedDays.includes(day.value);
                                            const isBooked =
                                                bookedShiftDays.has(day.value) ||
                                                hasShiftOnDay(day.value);

                                            return (
                                                <button
                                                    key={day.value}
                                                    type="button"
                                                    onClick={() => toggleDay(day.value)}
                                                    disabled={isBooked}
                                                    title={
                                                        isBooked
                                                            ? `${day.label} already has a shift`
                                                            : `Select ${day.label}`
                                                    }
                                                    className={`relative h-20 overflow-hidden rounded-2xl border px-3 pt-4 text-left transition active:scale-[0.99] disabled:cursor-not-allowed ${
                                                        isBooked
                                                            ? isLight
                                                                ? "border-[#8C1D18]/25 bg-[#FFF7F6] text-[#8C1D18] shadow-[0_12px_26px_rgba(140,29,24,0.08)]"
                                                                : "border-red-300/25 bg-red-300/[0.055] text-red-200 shadow-[0_12px_26px_rgba(127,29,29,0.14)]"
                                                            : isSelected
                                                            ? `${goldBorder} ${goldBackground} ${goldText} shadow-[0_10px_24px_rgba(255,209,102,0.08)]`
                                                            : isLight
                                                                ? "border-[#15803D]/20 bg-white text-[#3F332D] hover:border-[#15803D]/55 hover:text-[#241815]"
                                                                : "border-emerald-400/18 bg-[#101A1D] text-white/65 hover:border-emerald-400/35 hover:text-white"
                                                    }`}
                                                    style={{
                                                        borderTop: `4px solid ${
                                                            isBooked ? "#8C1D18" : "#15803D"
                                                        }`,
                                                    }}
                                                >
                                                    <span className="flex items-center justify-between gap-2">
                                                        <span className="block text-base font-black">
                                                            {day.short}
                                                        </span>
                                                        {isSelected && !isBooked && (
                                                            <CheckCircle2 size={16} className="shrink-0" />
                                                        )}
                                                    </span>
                                                    <span className="mt-1 block text-[11px] font-bold">
                                                        {day.label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className={`grid min-h-[230px] place-items-center rounded-2xl border border-dashed p-6 text-center ${emptySurface}`}>
                                    <div>
                                        <UserRoundCheck size={30} className="mx-auto mb-3 opacity-70" />
                                        <p className="text-sm font-black">Select an employee first</p>
                                        <p className="mt-1 text-xs font-semibold opacity-75">
                                            Available days and shift time will appear here.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </section>

                        {selectedEmployeeId && (
                            <section>
                                <div className="mb-3">
                                    <p className={`text-xs font-black uppercase tracking-[0.14em] ${mutedText}`}>
                                        Shift time
                                    </p>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <label className="block">
                                        <span className={`mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] ${mutedText}`}>
                                            <Clock3 size={14} />
                                            Start
                                        </span>
                                        <input
                                            type="time"
                                            value={startTime}
                                            onChange={(event) => setStartTime(event.target.value)}
                                            className={`h-11 w-full rounded-xl border px-3 text-sm font-black outline-none focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10 ${inputSurface}`}
                                        />
                                    </label>
                                    <label className="block">
                                        <span className={`mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] ${mutedText}`}>
                                            <Clock3 size={14} />
                                            End
                                        </span>
                                        <input
                                            type="time"
                                            value={endTime}
                                            onChange={(event) => setEndTime(event.target.value)}
                                            className={`h-11 w-full rounded-xl border px-3 text-sm font-black outline-none focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10 ${inputSurface}`}
                                        />
                                    </label>
                                </div>
                            </section>
                        )}

                        {errorMessage && (
                            <div className="flex items-start gap-3 rounded-2xl border border-[#7F1D1D]/35 bg-[#7F1D1D]/10 px-4 py-3 text-sm font-bold text-[#EF4444]">
                                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        {successMessage && (
                            <div className="flex items-start gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-300">
                                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                                <span>{successMessage}</span>
                            </div>
                        )}

                        {selectedEmployeeId && (
                            <button
                                type="submit"
                                disabled={isSubmitting || !selectedDays.length}
                                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#7F1D1D] px-5 text-sm font-black text-white shadow-[0_16px_34px_rgba(127,29,29,0.28)] transition hover:-translate-y-0.5 hover:bg-[#681718] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                            >
                                {isSubmitting ? (
                                    <>
                                        <RefreshCw size={18} className="animate-spin" />
                                        Creating shifts...
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Create Shifts
                                    </>
                                )}
                            </button>
                        )}

                        <section className={`rounded-2xl border p-4 ${isLight ? "border-[#E4CFC3] bg-[#FFF9F2]" : "border-white/10 bg-[#101A1D]"}`}>
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <div>
                                    <p className={`text-xs font-black uppercase tracking-[0.14em] ${mutedText}`}>
                                        Current shifts
                                    </p>
                                    <p className={`mt-1 text-sm font-medium ${mutedText}`}>
                                        {selectedEmployee
                                            ? getEmployeeName(selectedEmployee)
                                            : "Select an employee first."}
                                    </p>
                                </div>
                                <div className={`grid h-10 w-10 place-items-center rounded-xl border ${goldBorder} ${goldBackground} ${goldText}`}>
                                    <Clock3 size={18} />
                                </div>
                            </div>

                            {!selectedEmployeeId ? (
                                <div className={`rounded-xl border border-dashed p-4 text-center text-sm font-semibold ${emptySurface}`}>
                                    Select an employee to view shifts.
                                </div>
                            ) : isShiftsLoading ? (
                                <div className={`rounded-xl border border-dashed p-4 text-center text-sm font-semibold ${emptySurface}`}>
                                    Loading shifts...
                                </div>
                            ) : employeeShifts.length ? (
                                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                    {employeeShifts.map((shift, index) => {
                                        const shiftId = getShiftId(shift);
                                        const day = getShiftDay(shift);
                                        const shiftStart =
                                            getShiftStartTime(shift) || "--:--";
                                        const shiftEnd =
                                            getShiftEndTime(shift) || "--:--";
                                        const isEditing =
                                            String(editingShiftId) === String(shiftId);
                                        const isBusy =
                                            String(busyShiftId) === String(shiftId);
                                        const isDeletePending =
                                            String(pendingDeleteShiftId) === String(shiftId);

                                        return (
                                            <div
                                                key={shift?.id ?? `${day}-${index}`}
                                                className={`rounded-xl border p-3 ${
                                                    isDeletePending
                                                        ? "border-[#7F1D1D]/40 bg-[#7F1D1D]/10"
                                                        : isLight
                                                            ? "border-[#E4CFC3] bg-white"
                                                            : "border-white/10 bg-[#172124]"
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <p className={`text-sm font-black capitalize ${titleText}`}>
                                                            {day}
                                                        </p>
                                                        {isEditing ? (
                                                            <div className="mt-2 grid gap-2">
                                                                <input
                                                                    type="time"
                                                                    value={editStartTime}
                                                                    onChange={(event) =>
                                                                        setEditStartTime(event.target.value)
                                                                    }
                                                                    className={`h-10 rounded-xl border px-3 text-sm font-black outline-none focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10 ${inputSurface}`}
                                                                />
                                                                <input
                                                                    type="time"
                                                                    value={editEndTime}
                                                                    onChange={(event) =>
                                                                        setEditEndTime(event.target.value)
                                                                    }
                                                                    className={`h-10 rounded-xl border px-3 text-sm font-black outline-none focus:border-[#FFD166]/70 focus:ring-4 focus:ring-[#FFD166]/10 ${inputSurface}`}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <p className={`mt-1 text-xs font-bold ${mutedText}`}>
                                                                {shiftStart} to {shiftEnd}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex shrink-0 gap-2">
                                                        {isDeletePending ? (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteShift(shift)}
                                                                    disabled={isBusy}
                                                                    className="grid h-9 w-9 place-items-center rounded-xl border border-red-400/60 bg-[#7F1D1D] text-white transition hover:bg-[#9B1C1C] disabled:opacity-60"
                                                                    title="Confirm delete"
                                                                >
                                                                    {isBusy ? (
                                                                        <RefreshCw size={16} className="animate-spin" />
                                                                    ) : (
                                                                        <Trash2 size={16} />
                                                                    )}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={cancelDeleteShift}
                                                                    className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.05] text-white/60 transition hover:bg-white/[0.08] hover:text-white"
                                                                    title="Cancel delete"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            </>
                                                        ) : isEditing ? (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleUpdateShift(shift)}
                                                                    disabled={isBusy}
                                                                    className="grid h-9 w-9 place-items-center rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 transition hover:bg-emerald-400/18 disabled:opacity-60"
                                                                    title="Save shift"
                                                                >
                                                                    {isBusy ? (
                                                                        <RefreshCw size={16} className="animate-spin" />
                                                                    ) : (
                                                                        <CheckCircle2 size={16} />
                                                                    )}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={cancelEditShift}
                                                                    className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.05] text-white/60 transition hover:bg-white/[0.08] hover:text-white"
                                                                    title="Cancel edit"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openEditShift(shift)}
                                                                    className={`grid h-9 w-9 place-items-center rounded-xl border ${goldBorder} ${goldBackground} ${goldText} transition hover:brightness-110`}
                                                                    title="Edit shift"
                                                                >
                                                                    <Pencil size={15} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openDeleteShift(shift)}
                                                                    disabled={isBusy}
                                                                    className="grid h-9 w-9 place-items-center rounded-xl border border-[#7F1D1D]/35 bg-[#7F1D1D]/10 text-[#EF4444] transition hover:bg-[#7F1D1D]/18 disabled:opacity-60"
                                                                    title="Delete shift"
                                                                >
                                                                    <Trash2 size={15} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                {isDeletePending && (
                                                    <div className="mt-3 rounded-xl border border-[#7F1D1D]/30 bg-[#7F1D1D]/10 px-3 py-2 text-xs font-bold text-[#EF4444]">
                                                        Delete this shift? Press the red button to confirm.
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className={`rounded-xl border border-dashed p-4 text-center text-sm font-semibold ${emptySurface}`}>
                                    No shifts found for this employee.
                                </div>
                            )}
                        </section>
                    </div>
                </form>
            </section>
        </div>
    );
}

export default EmployeeShifts;
