import {
    ArrowLeft,
    Camera,
    CalendarDays,
    Clock,
    KeyRound,
    Loader2,
    Mail,
    Moon,
    Pencil,
    Phone,
    Save,
    ShieldCheck,
    Sun,
    UserRound,
    X,
} from "lucide-react";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import api from "../../API/axios";
import { useTheme } from "../../context/ThemeContext";
import { getStoredUser, storeUser } from "../../utils/auth";
import { translateStaticText } from "../../utils/i18n";
import LanguageToggle from "./LanguageToggle";

function getProfileRecord(data) {
    return data?.user ?? data?.data?.user ?? data?.data ?? data ?? {};
}

function getUserName(user) {
    return (
        user?.name ||
        [user?.first_name, user?.father_name, user?.last_name]
            .filter(Boolean)
            .join(" ") ||
        user?.email ||
        "Employee"
    );
}

function getInitials(name) {
    return String(name || "")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
}

function getImageUrl(image) {
    if (!image) return "";
    if (String(image).startsWith("http")) return image;

    const cleanPath = String(image).replace(/^\/+/, "");

    if (cleanPath.startsWith("storage/")) {
        return `https://big4.me/${cleanPath}`;
    }

    return `https://big4.me/storage/${cleanPath}`;
}

function getProfileImage(user) {
    return getImageUrl(
        user?.image ||
            user?.avatar ||
            user?.profile_image ||
            user?.profileImage ||
            user?.photo
    );
}

function getRoleName(user) {
    return user?.role?.name || user?.role_name || user?.roleName || "Employee";
}

function getPhoneNumber(user) {
    return user?.phone_number || user?.phoneNumber || user?.phone || user?.mobile || "";
}

function getDateOfBirth(user) {
    return user?.date_of_birth || user?.dateOfBirth || user?.birth_date || user?.birthDate || "";
}

function formatDate(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleDateString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

const dayNames = {
    sunday: "Sunday",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
};

const dayOrder = Object.keys(dayNames);

function normalizeDay(value) {
    return String(value || "").trim().toLowerCase();
}

function formatShiftDay(value) {
    const day = normalizeDay(value);
    return dayNames[day] || String(value || "");
}

function formatShiftTime(value) {
    if (!value) return "--:--";
    return String(value).slice(0, 5);
}

function timeToMinutes(value) {
    const [hours, minutes] = String(value || "").split(":").map(Number);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

    return hours * 60 + minutes;
}

function getShiftList(data) {
    const shifts =
        data?.data?.shifts ??
        data?.data?.employee_shifts ??
        data?.shifts ??
        data?.employee_shifts ??
        data?.data ??
        data;

    return Array.isArray(shifts) ? shifts : [];
}

function sortShifts(shifts) {
    return [...shifts].sort((first, second) => {
        const firstIndex = dayOrder.indexOf(normalizeDay(first?.day_of_week ?? first?.day));
        const secondIndex = dayOrder.indexOf(normalizeDay(second?.day_of_week ?? second?.day));

        return (firstIndex === -1 ? 99 : firstIndex) - (secondIndex === -1 ? 99 : secondIndex);
    });
}

function isShiftHappeningNow(shift, now = new Date()) {
    if ((shift?.is_active ?? true) !== true) return false;

    const shiftDay = normalizeDay(shift?.day_of_week ?? shift?.day);
    const startMinutes = timeToMinutes(shift?.start_time ?? shift?.startTime);
    const endMinutes = timeToMinutes(shift?.end_time ?? shift?.endTime);

    if (!shiftDay || startMinutes === null || endMinutes === null) return false;

    const today = dayOrder[now.getDay()];
    const previousDay = dayOrder[(now.getDay() + 6) % 7];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (startMinutes <= endMinutes) {
        return shiftDay === today &&
            currentMinutes >= startMinutes &&
            currentMinutes < endMinutes;
    }

    return (
        (shiftDay === today && currentMinutes >= startMinutes) ||
        (shiftDay === previousDay && currentMinutes < endMinutes)
    );
}

function buildFormState(user) {
    return {
        first_name: user?.first_name || "",
        father_name: user?.father_name || "",
        last_name: user?.last_name || "",
    };
}

const emptyPasswordForm = {
    current_password: "",
    password: "",
    password_confirmation: "",
};

function ThemeSwitch({ isLight, onToggle }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            aria-label={translateStaticText(isLight ? "Switch to dark mode" : "Switch to light mode")}
            className={`profile-theme-switch relative h-8 w-[62px] shrink-0 overflow-hidden rounded-full border p-1 shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition duration-200 hover:scale-[1.05] active:scale-95 ${
                isLight
                    ? "!border-[#F59E0B] !bg-[#F59E0B]"
                    : "border-white/10 bg-[#080A0C]"
            }`}
        >
            <span
                className={`absolute top-1/2 -translate-y-1/2 transition duration-300 ${
                    isLight
                        ? "left-2.5 text-white opacity-100"
                        : "left-2.5 text-white/25 opacity-60"
                }`}
            >
                <Sun size={14} />
            </span>
            <span
                className={`absolute top-1/2 -translate-y-1/2 transition duration-300 ${
                    isLight
                        ? "right-2.5 text-white/35 opacity-60"
                        : "right-2.5 text-[#FFD166] opacity-100"
                }`}
            >
                <Moon size={13} />
            </span>
            <span
                className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-[0_5px_14px_rgba(0,0,0,0.24)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isLight ? "translate-x-[30px]" : "translate-x-0"
                }`}
            />
        </button>
    );
}

export default function EmployeeProfileButton({ compact = false, floatingPanel = false }) {
    const fileInputRef = useRef(null);
    const profileRootRef = useRef(null);
    const { isLight, toggleTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [isShown, setIsShown] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [activePanel, setActivePanel] = useState("profile");
    const [passwordStep, setPasswordStep] = useState("current");
    const [profile, setProfile] = useState(() => getStoredUser() || {});
    const [form, setForm] = useState(() => buildFormState(getStoredUser() || {}));
    const [isEditingName, setIsEditingName] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [shifts, setShifts] = useState([]);
    const [shiftEmployee, setShiftEmployee] = useState(null);
    const [isLoadingShifts, setIsLoadingShifts] = useState(false);
    const [shiftError, setShiftError] = useState("");
    const [shiftNow, setShiftNow] = useState(() => new Date());
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const displayUser = profile || {};
    const text = translateStaticText;
    const userName = getUserName(displayUser);
    const roleName = getRoleName(displayUser);
    const phoneNumber = getPhoneNumber(displayUser);
    const dateOfBirth = getDateOfBirth(displayUser);
    const initials = getInitials(userName);
    const profileImage = imagePreview || getProfileImage(displayUser);
    const panelClass = isLight
        ? "border-[#E4CFC3] bg-[#FFF9F2] text-[#241815] shadow-[0_28px_70px_rgba(70,45,30,0.18)] ring-1 ring-[#7F1D1D]/10"
        : "border-white/10 bg-[#151C1F] text-white shadow-[0_28px_70px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.04]";
    const dividerClass = isLight ? "border-[#E4CFC3]" : "border-white/10";
    const mutedTextClass = isLight ? "text-[#7A6A64]" : "text-white/45";
    const softTextClass = isLight ? "text-[#5F514B]" : "text-white/58";
    const titleTextClass = isLight ? "text-[#241815]" : "text-white";
    const iconTileClass = isLight
        ? "border-[#D8A22D]/40 bg-[#FFF4DA] text-[#9A6400]"
        : "border-[#FFD166]/25 bg-[#FFD166]/10 text-[#FFD166]";
    const fieldClass = isLight
        ? "h-10 rounded-xl border border-[#E4CFC3] bg-white px-3 text-sm font-bold text-[#241815] outline-none transition placeholder:text-[#9A8A82] focus:border-[#D8A22D]/60 focus:ring-4 focus:ring-[#D8A22D]/12"
        : "h-10 rounded-xl border border-white/10 bg-white/[0.06] px-3 text-sm font-bold text-white outline-none transition placeholder:text-white/35 focus:border-[#FFD166]/45 focus:ring-4 focus:ring-[#FFD166]/10";
    const nameFieldClass =
        "profile-name-input block h-10 w-full rounded-xl border border-[#E4CFC3] bg-white px-3 text-sm font-bold text-[#241815] outline-none transition focus:border-[#D8A22D]/60 focus:ring-4 focus:ring-[#D8A22D]/12";
    const closeButtonClass = isLight
        ? "grid h-9 w-9 place-items-center rounded-xl border border-[#E4CFC3] bg-white text-[#7A6A64] transition hover:bg-[#FFF4EA] hover:text-[#7F1D1D]"
        : "grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white";
    const openProfile = async () => {
        window.dispatchEvent(new CustomEvent("big4:close-notifications"));
        setIsOpen(true);
        setIsShown(false);
        setIsClosing(false);
        setActivePanel("profile");
        setPasswordStep("current");
        setIsEditingName(false);
        setMessage("");
        setError("");
        setShiftError("");
        setIsLoading(true);

        requestAnimationFrame(() => {
            setIsShown(true);
        });

        try {
            const response = await api.get("/profile");
            const nextProfile = {
                ...(getStoredUser() || {}),
                ...getProfileRecord(response.data),
            };

            setProfile(nextProfile);
            setForm(buildFormState(nextProfile));
            setIsEditingName(false);
            setImageFile(null);
            setImagePreview("");
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                    text("Could not load profile details.")
            );
        } finally {
            setIsLoading(false);
        }
    };

    const closeProfile = () => {
        setIsShown(false);
        setIsClosing(true);
        setMessage("");
        setError("");
        setPasswordForm(emptyPasswordForm);
        setPasswordStep("current");

        window.setTimeout(() => {
            setIsOpen(false);
            setIsShown(false);
            setIsClosing(false);
            setActivePanel("profile");
            setPasswordStep("current");
            setIsEditingName(false);
        }, 180);
    };

    const openShiftsPanel = async () => {
        setMessage("");
        setError("");
        setShiftError("");
        setIsEditingName(false);
        setPasswordStep("current");
        setActivePanel("shifts");
        setShiftNow(new Date());
        setIsLoadingShifts(true);

        try {
            const response = await api.get("/employee/my-shifts");

            setShifts(sortShifts(getShiftList(response.data)));
            setShiftEmployee(response.data?.employee ?? response.data?.data?.employee ?? null);
        } catch (requestError) {
            setShiftError(
                requestError.response?.data?.message ||
                    text("Could not load your shifts.")
            );
        } finally {
            setIsLoadingShifts(false);
        }
    };

    useEffect(() => {
        const handleCloseProfile = () => {
            if (isOpen) closeProfile();
        };

        window.addEventListener("big4:close-profile", handleCloseProfile);

        return () => {
            window.removeEventListener("big4:close-profile", handleCloseProfile);
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return undefined;

        const handlePointerDown = (event) => {
            if (profileRootRef.current?.contains(event.target)) return;
            closeProfile();
        };

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                closeProfile();
            }
        };

        document.addEventListener("pointerdown", handlePointerDown, true);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown, true);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    useEffect(() => {
        if (activePanel !== "shifts") return undefined;

        const intervalId = window.setInterval(() => {
            setShiftNow(new Date());
        }, 60000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [activePanel]);

    const handleFieldChange = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handlePasswordFieldChange = (field, value) => {
        setPasswordForm((current) => ({ ...current, [field]: value }));
    };

    const continueToNewPassword = async () => {
        setMessage("");
        setError("");

        if (!passwordForm.current_password) {
            setError(text("Write your current password first."));
            return;
        }

        const loginValue =
            displayUser.email || displayUser.login || displayUser.username || "";

        if (!loginValue) {
            setError(text("Could not verify this account password."));
            return;
        }

        setIsVerifyingPassword(true);

        try {
            const formData = new FormData();

            formData.append("login", loginValue);
            formData.append("password", passwordForm.current_password);

            await axios.post("https://big4.me/api/login", formData);
            setPasswordStep("new");
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                    text("Current password is incorrect.")
            );
        } finally {
            setIsVerifyingPassword(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage("");
        setError("");

        try {
            const formData = new FormData();

            formData.append("first_name", form.first_name.trim());
            formData.append("father_name", form.father_name.trim());
            formData.append("last_name", form.last_name.trim());

            if (imageFile) {
                formData.append("image", imageFile);
            }

            const updateResponse = await api.post("/profile/update", formData);
            const profileResponse = await api.get("/profile").catch(() => null);
            const serverProfile = profileResponse
                ? getProfileRecord(profileResponse.data)
                : getProfileRecord(updateResponse.data);
            const updatedProfile = {
                ...displayUser,
                ...form,
                ...serverProfile,
            };

            setProfile(updatedProfile);
            setImageFile(null);
            setImagePreview("");
            setIsEditingName(false);
            setActivePanel("profile");
            storeUser(updatedProfile, { data: updatedProfile });
            setMessage(text("Profile updated."));
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                    text("Could not update profile.")
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        setMessage("");
        setError("");

        if (
            !passwordForm.current_password ||
            !passwordForm.password ||
            !passwordForm.password_confirmation
        ) {
            setError(text("Fill all password fields."));
            return;
        }

        if (passwordForm.password !== passwordForm.password_confirmation) {
            setError(text("New password and confirmation do not match."));
            return;
        }

        setIsChangingPassword(true);

        try {
            const formData = new FormData();

            formData.append("current_password", passwordForm.current_password);
            formData.append("password", passwordForm.password);
            formData.append(
                "password_confirmation",
                passwordForm.password_confirmation
            );

            await api.post("/change-password", formData);
            setPasswordForm(emptyPasswordForm);
            setPasswordStep("current");
            setMessage(text("Password changed."));
            setActivePanel("profile");
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                    text("Could not change password.")
            );
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <div ref={profileRootRef} className="relative z-[120]">
            <button
                type="button"
                onClick={isOpen ? closeProfile : openProfile}
                className={`flex h-11 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.07] px-2.5 text-left shadow-sm transition duration-200 hover:scale-[1.03] hover:border-[#FFD166]/35 hover:bg-white/10 active:scale-[0.98] ${
                    compact ? "" : "sm:min-w-[190px] sm:px-3"
                }`}
            >
                <div className="grid h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-[#7F1D1D] text-xs font-black text-white">
                    {profileImage ? (
                        <img
                            src={profileImage}
                            alt={userName}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <span className="grid place-items-center">
                            {initials || <UserRound size={16} />}
                        </span>
                    )}
                </div>
                <div className="hidden min-w-0 sm:block">
                    <p className="truncate text-sm font-black leading-4 text-white">
                        {userName}
                    </p>
                    <p className="truncate text-[11px] font-bold uppercase tracking-wide text-white/45">
                        {roleName}
                    </p>
                </div>
            </button>

            {isOpen && (
                <div className={`${floatingPanel ? "fixed right-4 top-20 z-[120]" : "absolute right-0 top-[calc(100%+0.65rem)] z-50"} w-[min(92vw,340px)] origin-top-right overflow-hidden rounded-2xl border transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isClosing || !isShown
                        ? "translate-y-1 scale-95 opacity-0"
                        : "translate-y-0 scale-100 opacity-100"
                } ${panelClass}`}>
                    <div className={`flex items-start justify-between gap-3 border-b px-3.5 py-3 ${dividerClass}`}>
                        <div className={`min-w-0 flex-1 ${activePanel === "profile" ? "flex flex-col gap-2" : "flex items-center gap-3"}`}>
                            <div className="min-w-0">
                                <p className="break-words text-sm font-black leading-5 text-[#FFD166]">
                                    {activePanel === "password"
                                        ? text("Change password")
                                        : activePanel === "name"
                                            ? text("Edit name")
                                            : activePanel === "shifts"
                                                ? text("My shifts")
                                                : text("Employee profile")}
                                </p>
                                <p className={`break-words text-xs font-bold leading-4 ${mutedTextClass}`}>
                                    {activePanel === "password"
                                        ? text("Secure your account")
                                        : activePanel === "name"
                                            ? text("Update personal name")
                                            : activePanel === "shifts"
                                                ? text("Weekly work hours")
                                                : text("Personal information")}
                                </p>
                            </div>
                            {activePanel === "profile" && (
                                <div className="flex shrink-0 items-center gap-2">
                                    <ThemeSwitch
                                        isLight={isLight}
                                        onToggle={toggleTheme}
                                    />
                                    <LanguageToggle compact variant={isLight ? "light" : "dark"} />
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={closeProfile}
                            className={`${closeButtonClass} hover:scale-110 active:scale-95`}
                            aria-label={text("Close profile")}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className={`relative overflow-hidden p-3.5 transition-[min-height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        activePanel === "password"
                            ? "min-h-[330px]"
                            : activePanel === "name"
                                ? "min-h-[360px]"
                                : activePanel === "shifts"
                                    ? "min-h-[390px]"
                                    : "min-h-0"
                    }`}>
                        <div
                            className={`transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                                activePanel === "profile"
                                    ? "translate-x-0 opacity-100"
                                    : "-translate-x-8 opacity-0 pointer-events-none absolute"
                            }`}
                        >
                        <div className="flex min-w-0 items-center gap-3">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="profile-avatar-button group relative grid h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[#FFD166]/30 bg-[#7F1D1D] text-lg font-black text-white transition duration-200 hover:scale-[1.04] active:scale-95"
                            >
                                {profileImage ? (
                                    <img
                                        src={profileImage}
                                        alt={userName}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="grid place-items-center">
                                        {initials || <UserRound size={22} />}
                                    </span>
                                )}
                                <span className="absolute inset-0 grid place-items-center bg-black/45 opacity-0 transition group-hover:opacity-100">
                                    <Camera size={20} />
                                </span>
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />

                            <div className="min-w-0 flex-1">
                                <h2 className={`truncate text-lg font-black ${titleTextClass}`}>
                                    {userName}
                                </h2>
                                <p className={`mt-1 flex min-w-0 items-center gap-2 text-xs font-bold ${softTextClass}`}>
                                    <ShieldCheck size={15} className="shrink-0 text-[#FFD166]" />
                                    <span className="truncate">{roleName}</span>
                                </p>
                                {displayUser.email && (
                                    <p className={`mt-1 flex min-w-0 items-center gap-2 text-xs font-bold ${mutedTextClass}`}>
                                        <Mail size={15} className="shrink-0" />
                                        <span className="truncate">{displayUser.email}</span>
                                    </p>
                                )}
                            </div>
                        </div>

                        {isLoading ? (
                            <div className={`mt-4 flex items-center justify-center gap-2 rounded-2xl border px-4 py-4 text-sm font-black ${
                                isLight
                                    ? "border-[#E4CFC3] bg-white text-[#7A6A64]"
                                    : "border-white/10 bg-white/[0.05] text-white/55"
                            }`}>
                                <Loader2 size={17} className="animate-spin" />
                                {text("Loading profile...")}
                            </div>
                        ) : (
                            <div className="mt-4 grid gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMessage("");
                                        setError("");
                                        setIsEditingName(true);
                                        setActivePanel("name");
                                    }}
                                    className={`w-full rounded-2xl border p-3 text-left transition duration-200 hover:scale-[1.015] active:scale-[0.99] ${
                                        isLight
                                            ? "border-[#E4CFC3] bg-white"
                                            : "border-white/10 bg-white/[0.05]"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className={`text-xs font-bold ${mutedTextClass}`}>
                                                {text("Full name")}
                                            </p>
                                            <p className={`mt-1 break-words text-base font-black ${titleTextClass}`}>
                                                {userName}
                                            </p>
                                        </div>
                                        <span
                                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition hover:scale-105 active:scale-95 ${
                                                isLight
                                                    ? "border-[#D8A22D]/35 bg-[#FFF4DA] text-[#7A4F00]"
                                                    : "border-[#FFD166]/25 bg-[#FFD166]/10 text-[#FFD166]"
                                            }`}
                                        >
                                            <Pencil size={16} />
                                        </span>
                                    </div>
                                </button>

                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <div
                                        className={`rounded-2xl border p-3 ${
                                            isLight
                                                ? "border-[#E4CFC3] bg-white"
                                                : "border-white/10 bg-white/[0.05]"
                                        }`}
                                    >
                                        <p className={`flex items-center gap-2 text-xs font-bold ${mutedTextClass}`}>
                                            <Phone size={14} />
                                            {text("Phone")}
                                        </p>
                                        <p className={`mt-1 break-words text-sm font-black ${titleTextClass}`}>
                                            {phoneNumber || text("Not provided")}
                                        </p>
                                    </div>
                                    <div
                                        className={`rounded-2xl border p-3 ${
                                            isLight
                                                ? "border-[#E4CFC3] bg-white"
                                                : "border-white/10 bg-white/[0.05]"
                                        }`}
                                    >
                                        <p className={`flex items-center gap-2 text-xs font-bold ${mutedTextClass}`}>
                                            <CalendarDays size={14} />
                                            {text("Date of birth")}
                                        </p>
                                        <p className={`mt-1 break-words text-sm font-black ${titleTextClass}`}>
                                            {formatDate(dateOfBirth) || text("Not provided")}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={openShiftsPanel}
                                    className={`profile-shifts-button flex h-11 w-full items-center justify-between rounded-xl border px-3 text-left transition duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                                        isLight
                                            ? "border-[#D8A22D]/35 bg-[#FFF4DA] text-[#7A4F00] hover:bg-[#FFE9B5]"
                                            : "border-[#FFD166]/25 bg-[#FFD166]/10 text-[#FFD166] hover:bg-[#FFD166]/16"
                                    }`}
                                >
                                    <span className="flex min-w-0 items-center gap-2">
                                        <CalendarDays size={17} />
                                        <span className="font-black">{text("My shifts")}</span>
                                    </span>
                                    <span className={`text-[11px] font-black ${isLight ? "text-[#9A6400]" : "text-[#FFD166]/75"}`}>
                                        {text("View")}
                                    </span>
                                </button>
                            </div>
                        )}

                        {message && (
                            <p className="mt-4 rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-sm font-black text-emerald-200">
                                {message}
                            </p>
                        )}
                        {error && (
                            <p className="mt-4 rounded-xl border border-[#7F1D1D]/35 bg-[#7F1D1D]/16 px-3 py-2 text-sm font-black text-[#ffb4b4]">
                                {error}
                            </p>
                        )}

                        {imageFile && (
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isLoading || isSaving}
                                className="profile-save-button mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#7F1D1D] text-sm font-black text-white shadow-[0_14px_28px_rgba(127,29,29,0.22)] transition duration-200 hover:scale-[1.02] hover:bg-[#681718] hover:shadow-[0_18px_34px_rgba(127,29,29,0.26)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:scale-100"
                            >
                                {isSaving ? (
                                    <Loader2 size={17} className="animate-spin" />
                                ) : (
                                    <Save size={17} />
                                )}
                                {text("Save profile")}
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => {
                                setMessage("");
                                setError("");
                                setPasswordStep("current");
                                setIsEditingName(false);
                                setActivePanel("password");
                            }}
                            className={`profile-password-button mt-3 flex h-11 w-full items-center justify-between rounded-xl border px-3 text-left transition duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                                isLight
                                    ? "border-[#D8A22D]/35 bg-[#FFF4DA] text-[#7A4F00] hover:bg-[#FFE9B5]"
                                    : "border-[#FFD166]/25 bg-[#FFD166]/10 text-[#FFD166] hover:bg-[#FFD166]/16"
                            }`}
                        >
                            <span className="flex min-w-0 items-center gap-2">
                                <KeyRound size={17} />
                                <span className="font-black">{text("Change password")}</span>
                            </span>
                        </button>
                        </div>

                        <div
                            className={`transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                                activePanel === "name"
                                    ? "translate-x-0 opacity-100"
                                    : "translate-x-8 opacity-0 pointer-events-none absolute"
                            }`}
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    setMessage("");
                                    setError("");
                                    setIsEditingName(false);
                                    setForm(buildFormState(displayUser));
                                    setActivePanel("profile");
                                }}
                                className={`mb-3 flex h-9 items-center gap-2 rounded-xl px-2.5 text-xs font-black transition duration-200 hover:scale-[1.04] active:scale-95 ${
                                    isLight
                                        ? "border border-[#D8A22D]/35 bg-[#FFF4DA] text-[#7A4F00] hover:bg-[#FFE9B5]"
                                        : "bg-[#FFD166]/10 text-[#FFD166] hover:bg-[#FFD166]/16"
                                }`}
                            >
                                <ArrowLeft size={15} />
                                {text("Profile details")}
                            </button>

                            <div className={`mb-3 rounded-2xl border p-3 ${dividerClass}`}>
                                <p className={`text-xs font-bold ${mutedTextClass}`}>
                                    {text("Current full name")}
                                </p>
                                <p className={`mt-1 break-words text-base font-black ${titleTextClass}`}>
                                    {userName}
                                </p>
                            </div>

                            <div
                                className={`profile-name-editor grid gap-2.5 rounded-2xl border p-3 ${
                                    isLight
                                        ? "border-[#D8A22D]/40 bg-[#FFF4DA]"
                                        : "border-[#FFD166]/20 bg-[#FFD166]/8"
                                }`}
                            >
                                <div>
                                    <p className={`profile-name-label mb-1.5 text-xs font-bold ${softTextClass}`}>
                                        {text("First name")}
                                    </p>
                                    <input
                                        value={form.first_name}
                                        onChange={(event) =>
                                            handleFieldChange(
                                                "first_name",
                                                event.target.value
                                            )
                                        }
                                        className={nameFieldClass}
                                    />
                                </div>
                                <div>
                                    <p className={`profile-name-label mb-1.5 text-xs font-bold ${softTextClass}`}>
                                        {text("Father name")}
                                    </p>
                                    <input
                                        value={form.father_name}
                                        onChange={(event) =>
                                            handleFieldChange(
                                                "father_name",
                                                event.target.value
                                            )
                                        }
                                        className={nameFieldClass}
                                    />
                                </div>
                                <div>
                                    <p className={`profile-name-label mb-1.5 text-xs font-bold ${softTextClass}`}>
                                        {text("Last name")}
                                    </p>
                                    <input
                                        value={form.last_name}
                                        onChange={(event) =>
                                            handleFieldChange(
                                                "last_name",
                                                event.target.value
                                            )
                                        }
                                        className={nameFieldClass}
                                    />
                                </div>
                            </div>

                            {message && (
                                <p className="mt-3 rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-sm font-black text-emerald-200">
                                    {message}
                                </p>
                            )}
                            {error && (
                                <p className="mt-3 rounded-xl border border-[#7F1D1D]/35 bg-[#7F1D1D]/16 px-3 py-2 text-sm font-black text-[#ffb4b4]">
                                    {error}
                                </p>
                            )}

                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isLoading || isSaving || !isEditingName}
                                className="profile-save-button mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#7F1D1D] text-sm font-black text-white shadow-[0_14px_28px_rgba(127,29,29,0.22)] transition duration-200 hover:scale-[1.02] hover:bg-[#681718] hover:shadow-[0_18px_34px_rgba(127,29,29,0.26)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:scale-100"
                            >
                                {isSaving ? (
                                    <Loader2 size={17} className="animate-spin" />
                                ) : (
                                    <Save size={17} />
                                )}
                                {text("Save name")}
                            </button>
                        </div>

                        <div
                            className={`transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                                activePanel === "shifts"
                                    ? "translate-x-0 opacity-100"
                                    : "translate-x-8 opacity-0 pointer-events-none absolute"
                            }`}
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    setShiftError("");
                                    setActivePanel("profile");
                                }}
                                className={`mb-3 flex h-9 items-center gap-2 rounded-xl px-2.5 text-xs font-black transition duration-200 hover:scale-[1.04] active:scale-95 ${
                                    isLight
                                        ? "border border-[#D8A22D]/35 bg-[#FFF4DA] text-[#7A4F00] hover:bg-[#FFE9B5]"
                                        : "bg-[#FFD166]/10 text-[#FFD166] hover:bg-[#FFD166]/16"
                                }`}
                            >
                                <ArrowLeft size={15} />
                                {text("Profile details")}
                            </button>

                            <div className={`mb-3 flex items-center gap-2 rounded-2xl border p-3 ${dividerClass}`}>
                                <div className={`grid h-9 w-9 place-items-center rounded-xl border ${iconTileClass}`}>
                                    <CalendarDays size={17} />
                                </div>
                                <div className="min-w-0">
                                    <p className={`truncate text-sm font-black ${titleTextClass}`}>
                                        {text("Weekly schedule")}
                                    </p>
                                    <p className={`truncate text-xs font-bold ${mutedTextClass}`}>
                                        {shiftEmployee?.name || userName}
                                    </p>
                                </div>
                            </div>

                            {isLoadingShifts ? (
                                <div className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-6 text-sm font-black ${
                                    isLight
                                        ? "border-[#E4CFC3] bg-white text-[#7A6A64]"
                                        : "border-white/10 bg-white/[0.05] text-white/55"
                                }`}>
                                    <Loader2 size={17} className="animate-spin" />
                                    {text("Loading shifts...")}
                                </div>
                            ) : shiftError ? (
                                <p className="rounded-xl border border-[#7F1D1D]/35 bg-[#7F1D1D]/16 px-3 py-2 text-sm font-black text-[#ffb4b4]">
                                    {shiftError}
                                </p>
                            ) : shifts.length ? (
                                <div className="grid max-h-[260px] gap-2 overflow-y-auto pr-1">
                                    {shifts.map((shift, index) => {
                                        const day = shift?.day_of_week ?? shift?.day ?? "";
                                        const isActive = shift?.is_active ?? true;
                                        const isCurrentShift = isShiftHappeningNow(shift, shiftNow);

                                        return (
                                            <div
                                                key={shift?.id ?? `${day}-${index}`}
                                                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 ${
                                                    isCurrentShift
                                                        ? isLight
                                                            ? "border-emerald-400 bg-emerald-50 shadow-[0_10px_24px_rgba(16,185,129,0.18)]"
                                                            : "border-emerald-300/45 bg-emerald-400/12 shadow-[0_10px_26px_rgba(16,185,129,0.14)]"
                                                        : isLight
                                                        ? "border-[#E4CFC3] bg-white"
                                                        : "border-white/10 bg-white/[0.05]"
                                                }`}
                                            >
                                                <div className="min-w-0">
                                                    <p className={`truncate text-sm font-black ${titleTextClass}`}>
                                                        {text(formatShiftDay(day))}
                                                    </p>
                                                    <p className={`mt-0.5 flex items-center gap-1.5 text-xs font-bold ${mutedTextClass}`}>
                                                        <Clock size={13} />
                                                        {formatShiftTime(shift?.start_time ?? shift?.startTime)}
                                                        {" - "}
                                                        {formatShiftTime(shift?.end_time ?? shift?.endTime)}
                                                    </p>
                                                </div>
                                                <span className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-black ${
                                                    isCurrentShift
                                                        ? isLight
                                                            ? "bg-emerald-600 text-white"
                                                            : "bg-emerald-300 text-[#062016]"
                                                        : isActive
                                                        ? isLight
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : "bg-emerald-400/12 text-emerald-200"
                                                        : isLight
                                                            ? "bg-[#F3E7DF] text-[#7A6A64]"
                                                            : "bg-white/8 text-white/45"
                                                }`}>
                                                    {text(isCurrentShift ? "Now" : isActive ? "Active" : "Inactive")}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className={`rounded-2xl border px-4 py-6 text-center text-sm font-black ${
                                    isLight
                                        ? "border-[#E4CFC3] bg-white text-[#7A6A64]"
                                        : "border-white/10 bg-white/[0.05] text-white/55"
                                }`}>
                                    {text("No shifts found.")}
                                </div>
                            )}
                        </div>

                        <div
                            className={`transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                                activePanel === "password"
                                    ? "translate-x-0 opacity-100"
                                    : "translate-x-8 opacity-0 pointer-events-none absolute"
                            }`}
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    setMessage("");
                                    setError("");
                                    setPasswordStep("current");
                                    setPasswordForm(emptyPasswordForm);
                                    setActivePanel("profile");
                                }}
                                className={`mb-3 flex h-9 items-center gap-2 rounded-xl px-2.5 text-xs font-black transition duration-200 hover:scale-[1.04] active:scale-95 ${
                                    isLight
                                        ? "bg-[#FFF4DA] text-[#7A4F00] hover:bg-[#FFE9B5]"
                                        : "bg-[#FFD166]/10 text-[#FFD166] hover:bg-[#FFD166]/16"
                                }`}
                            >
                                <ArrowLeft size={15} />
                                {text("Profile details")}
                            </button>

                            <div className={`mb-3 flex items-center gap-2 rounded-2xl border p-3 ${dividerClass}`}>
                                <div className={`grid h-9 w-9 place-items-center rounded-xl border ${iconTileClass}`}>
                                    <KeyRound size={17} />
                                </div>
                                <div>
                                    <p className={`text-sm font-black ${titleTextClass}`}>
                                        {text("Change password")}
                                    </p>
                                    <p className={`text-xs font-bold ${mutedTextClass}`}>
                                        {text("Update your account password")}
                                    </p>
                                </div>
                            </div>

                            <div className="relative min-h-[126px] overflow-hidden">
                                <div
                                    className={`grid gap-2.5 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                                        passwordStep === "current"
                                            ? "translate-x-0 opacity-100"
                                            : "-translate-x-8 opacity-0 pointer-events-none absolute inset-x-0 top-0"
                                    }`}
                                >
                                    <input
                                        type="password"
                                        name="profile_current_password_input"
                                        autoComplete="current-password"
                                        value={passwordForm.current_password}
                                        onChange={(event) =>
                                            handlePasswordFieldChange(
                                                "current_password",
                                                event.target.value
                                            )
                                        }
                                        placeholder={text("Current password")}
                                        className={fieldClass}
                                    />
                                    <button
                                        type="button"
                                        onClick={continueToNewPassword}
                                        disabled={isVerifyingPassword}
                                        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#7F1D1D] text-sm font-black text-white shadow-[0_14px_28px_rgba(127,29,29,0.18)] transition duration-200 hover:scale-[1.02] hover:bg-[#681718] hover:shadow-[0_18px_34px_rgba(127,29,29,0.24)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:scale-100"
                                    >
                                        {isVerifyingPassword && (
                                            <Loader2 size={17} className="animate-spin" />
                                        )}
                                        {isVerifyingPassword
                                            ? text("Checking...")
                                            : text("Continue")}
                                    </button>
                                </div>

                                <div
                                    className={`grid gap-2.5 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                                        passwordStep === "new"
                                            ? "translate-x-0 opacity-100"
                                            : "translate-x-8 opacity-0 pointer-events-none absolute inset-x-0 top-0"
                                    }`}
                                >
                                    <input
                                        type="password"
                                        name="profile_new_password_input"
                                        autoComplete="new-password"
                                        value={passwordForm.password}
                                        onChange={(event) =>
                                            handlePasswordFieldChange(
                                                "password",
                                                event.target.value
                                            )
                                        }
                                        placeholder={text("New password")}
                                        className={fieldClass}
                                    />
                                    <input
                                        type="password"
                                        name="profile_confirm_password_input"
                                        autoComplete="new-password"
                                        value={passwordForm.password_confirmation}
                                        onChange={(event) =>
                                            handlePasswordFieldChange(
                                                "password_confirmation",
                                                event.target.value
                                            )
                                        }
                                        placeholder={text("Confirm new password")}
                                        className={fieldClass}
                                    />
                                </div>
                            </div>

                            {message && (
                                <p className="mt-3 rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-sm font-black text-emerald-200">
                                    {message}
                                </p>
                            )}
                            {error && (
                                <p className="mt-3 rounded-xl border border-[#7F1D1D]/35 bg-[#7F1D1D]/16 px-3 py-2 text-sm font-black text-[#ffb4b4]">
                                    {error}
                                </p>
                            )}

                            {passwordStep === "new" && (
                                <button
                                    type="button"
                                    onClick={handleChangePassword}
                                    disabled={isLoading || isChangingPassword}
                                    className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#7F1D1D] text-sm font-black text-white shadow-[0_14px_28px_rgba(127,29,29,0.18)] transition duration-200 hover:scale-[1.02] hover:bg-[#681718] hover:shadow-[0_18px_34px_rgba(127,29,29,0.24)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:scale-100"
                                >
                                    {isChangingPassword ? (
                                        <Loader2 size={17} className="animate-spin" />
                                    ) : (
                                        <KeyRound size={17} />
                                    )}
                                    {text("Change password")}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

