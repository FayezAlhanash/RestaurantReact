import { useState, useEffect } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import DatePicker from "react-datepicker";
import api from "../../API/axios";
import { roleRequiresRestaurantAssignment } from "../../utils/permissionScopes";
import "react-datepicker/dist/react-datepicker.css";

const getList = (data, key) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(data?.data)) return data.data;
    return [];
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
                className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left font-bold text-white outline-none transition-all focus:border-[#FFD166]/70 focus:ring-2 focus:ring-[#FFD166]/10 ${
                    disabled
                        ? "cursor-not-allowed border-white/5 bg-white/[0.03] text-white/30"
                        : "border-white/10 bg-[#0D1214] hover:border-[#FFD166]/35"
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
                    className="absolute left-0 right-0 z-[340] mt-2 max-h-60 overflow-y-auto rounded-2xl border border-white/10 bg-[#11181B] p-1.5 shadow-2xl shadow-black/45"
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
                                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${
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

function AddEmployeeModal({ isOpen, onClose, roles = [] }) {
    const [role, setRole] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState(null);
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [email, setEmail] = useState("");
    const [restaurantId, setRestaurantId] = useState("");
    const [restaurants, setRestaurants] = useState([]);
    const [firstName, setFirstName] = useState("");
    const [fatherName, setFatherName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [gender, setGender] = useState("");
    const [nationalNumber, setNationalNumber] = useState("");
    const [jobTitle, setJobTitle] = useState("");
    const [image, setImage] = useState(null);
    const [modalRoles, setModalRoles] = useState([]);
    const [submitError, setSubmitError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const roleOptions = (roles.length ? roles : modalRoles)
        .filter((item) => {
            const roleName = normalizeRoleName(item.name);

            return Number(item.id) !== 1 && !EXCLUDED_ROLE_NAMES.includes(roleName);
        })
        .sort((firstRole, secondRole) =>
            formatRoleLabel(firstRole).localeCompare(formatRoleLabel(secondRole))
        );
    const selectedRole = roleOptions.find((item) => String(item.id) === role);
    const needsRestaurant = roleRequiresRestaurantAssignment(selectedRole);

    useEffect(() => {
        const fetchModalData = async () => {
            try {
                const [restaurantsResponse, rolesResponse] = await Promise.all([
                    api.get("/restaurants"),
                    roles.length ? Promise.resolve(null) : api.get("/admin/roles"),
                ]);

                setRestaurants(restaurantsResponse.data.restaurants || []);

                if (rolesResponse) {
                    setModalRoles(getList(rolesResponse.data, "roles"));
                }
            } catch (error) {
                console.log(error);
            }
        };

        if (isOpen) {
            fetchModalData();
        }
    }, [isOpen, roles.length]);

    const resetForm = () => {
        setFirstName("");
        setFatherName("");
        setLastName("");
        setPhoneNumber("");
        setGender("male");
        setNationalNumber("");
        setJobTitle("");
        setImage(null);
        setEmail("");
        setPassword("");
        setPasswordConfirmation("");
        setRole("");
        setRestaurantId("");
        setDateOfBirth(null);
        setSubmitError("");
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    const getErrorMessage = (error) => {
        const errors = error.response?.data?.errors;

        if (errors && typeof errors === "object") {
            return Object.values(errors).flat().filter(Boolean).join(" ");
        }

        return error.response?.data?.message || "Could not add employee.";
    };

    const handleAddEmployee = async () => {
        const cleanEmail = email.trim();

        setSubmitError("");

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            setSubmitError("Please enter a valid email address, like name@gmail.com.");
            return;
        }

        if (!role) {
            setSubmitError("Please select a role.");
            return;
        }

        if (password !== passwordConfirmation) {
            setSubmitError("Password confirmation does not match.");
            return;
        }

        if (needsRestaurant && !restaurantId) {
            setSubmitError("Please select a restaurant for this role.");
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();

            formData.append("first_name", firstName.trim());
            formData.append("father_name", fatherName.trim());
            formData.append("last_name", lastName.trim());
            formData.append("email", cleanEmail);
            formData.append("phone_number", phoneNumber.trim());
            formData.append("password", password);
            formData.append("password_confirmation", passwordConfirmation);
            formData.append("role_id", role);
            formData.append("national_number", nationalNumber.trim());
            formData.append("gender", gender);
            if (jobTitle.trim()) {
                formData.append("job_title", jobTitle.trim());
            }
            if (image) {
                formData.append("image", image);
            }
            if (dateOfBirth) {
                formData.append(
                    "date_of_birth",
                    dateOfBirth.toISOString().split("T")[0]
                );
            }
            if (needsRestaurant) {
                formData.append("restaurant_id", restaurantId);
            }

            await api.post(
                "/admin/staff-users",
                formData
            );

            handleClose();
        } catch (error) {
            setSubmitError(getErrorMessage(error));
            console.log(error.response?.data || error);
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <div className="modal-backdrop-enter fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-4">
            <div className="modal-panel-enter w-full max-w-2xl max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-[28px] border border-white/10 bg-[#182124] text-white shadow-2xl">
                <div className="relative border-b border-white/[0.08] bg-[radial-gradient(circle_at_100%_0%,rgba(127,29,29,0.16),transparent_34%),rgba(255,255,255,0.03)] px-6 py-4 text-white">
                    <h2 className="text-2xl font-bold text-center">
                        Add Employee
                    </h2>
                    <button
                        type="button"
                        onClick={handleClose}
                        aria-label="Close add employee"
                        className="absolute right-5 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-white/70 transition duration-200 hover:rotate-90 hover:border-[#FFD166]/35 hover:bg-[#FFD166]/12 hover:text-[#FFD166] active:scale-95"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="bg-[#182124] p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                                First Name
                            </label>

                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-[#0D1214] px-4 py-3 text-white outline-none transition focus:border-[#FFD166]/70 focus:ring-2 focus:ring-[#FFD166]/10"
                            />

                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                                Father Name
                            </label>

                            <input
                                type="text"
                                value={fatherName}
                                onChange={(e) => setFatherName(e.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-[#0D1214] px-4 py-3 text-white outline-none transition focus:border-[#FFD166]/70 focus:ring-2 focus:ring-[#FFD166]/10"
                            />

                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                                last Name
                            </label>

                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-[#0D1214] px-4 py-3 text-white outline-none transition focus:border-[#FFD166]/70 focus:ring-2 focus:ring-[#FFD166]/10"
                            />

                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                                phone Number
                            </label>

                            <input
                                type="phone"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-[#0D1214] px-4 py-3 text-white outline-none transition focus:border-[#FFD166]/70 focus:ring-2 focus:ring-[#FFD166]/10"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                                Gender
                            </label>

                            <select
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-[#0D1214] px-4 py-3 text-white"
                            >
                                <option className="text-gray-400" value="" disabled>

                                </option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                                National Number
                            </label>

                            <input
                                type="text"
                                value={nationalNumber}
                                onChange={(e) => setNationalNumber(e.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-[#0D1214] px-4 py-3 text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                                Job Title <span className="normal-case tracking-normal text-white/35">(optional)</span>
                            </label>

                            <input
                                type="text"
                                value={jobTitle}
                                onChange={(e) => setJobTitle(e.target.value)}
                                placeholder="Cashier, shift lead..."
                                className="w-full rounded-2xl border border-white/10 bg-[#0D1214] px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-[#FFD166]/70 focus:ring-2 focus:ring-[#FFD166]/10"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                                Photo <span className="normal-case tracking-normal text-white/35">(optional)</span>
                            </label>

                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setImage(e.target.files?.[0] || null)}
                                className="w-full rounded-2xl border border-white/10 bg-[#0D1214] px-4 py-3 text-sm text-white file:mr-4 file:rounded-xl file:border-0 file:bg-[#FFD166] file:px-4 file:py-2 file:text-sm file:font-black file:text-[#151A1D]"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 mt-6">
                        <div>
                            <label className="mb-1 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                                Email
                            </label>

                            <input
                                type="email"

                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`w-full rounded-2xl border px-4 py-3 text-white transition-all focus:ring-2 focus:ring-[#FFD166]/10
    ${email.includes("@")
                                        ? "bg-emerald-400/10 border-emerald-400/30"
                                        : "bg-[#0D1214] border-white/10"
                                    }`}
                            />

                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                                Date Of Birth
                            </label>

                            <DatePicker
                                showYearDropdown
                                scrollableYearDropdown
                                yearDropdownItemNumber={100}
                                selected={dateOfBirth}
                                onChange={(date) => setDateOfBirth(date)}
                                placeholderText="Select Date Of Birth"
                                dateFormat="yyyy-MM-dd"
                                wrapperClassName="w-full"
                                className="w-full rounded-2xl border border-white/10 bg-[#0D1214] px-4 py-3 text-white focus:ring-2 focus:ring-[#FFD166]/10"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                                Password
                            </label>

                            <input
                                autoComplete="new-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full rounded-2xl border px-4 py-3 text-white focus:ring-2 focus:ring-[#FFD166]/10
                                        ${password &&
                                        passwordConfirmation &&
                                        password !== passwordConfirmation
                                        ? "bg-[#7F1D1D]/10 border-[#7F1D1D]/30"
                                        : password &&
                                            passwordConfirmation &&
                                            password === passwordConfirmation
                                            ? "bg-emerald-400/10 border-emerald-400/30"
                                            : "bg-[#0D1214] border-white/10"
                                    }`}
                            />

                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                                Password Confirmation
                            </label>

                            <input
                                autoComplete="new-password"
                                type="password"
                                value={passwordConfirmation}
                                onChange={(e) => setPasswordConfirmation(e.target.value)}
                                className={`w-full rounded-2xl border px-4 py-3 text-white focus:ring-2 focus:ring-[#FFD166]/10
                                         ${password &&
                                        passwordConfirmation &&
                                        password !== passwordConfirmation
                                        ? "bg-[#7F1D1D]/10 border-[#7F1D1D]/30"
                                        : password &&
                                            passwordConfirmation &&
                                            password === passwordConfirmation
                                            ? "bg-emerald-400/10 border-emerald-400/30"
                                            : "bg-[#0D1214] border-white/10"
                                    }`}
                            />

                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                                Role
                            </label>

                            <StyledSelect
                                value={role}
                                options={roleOptions}
                                placeholder="Select role"
                                getOptionLabel={formatRoleLabel}
                                onChange={(nextRole) => {
                                    setRole(nextRole);
                                    setRestaurantId("");
                                }}
                                disabled={!roleOptions.length}
                            />
                            {!roleOptions.length && (
                                <p className="mt-2 text-xs font-bold text-[#FFD166]/75">
                                    No assignable roles available.
                                </p>
                            )}
                            {needsRestaurant && (
                                <>
                                    <div>
                                        <label className="mb-1 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                                            Restaurant
                                        </label>

                                        <StyledSelect
                                            value={restaurantId}
                                            options={restaurants}
                                            placeholder="Select Restaurant"
                                            getOptionLabel={(restaurant) => restaurant.name}
                                            onChange={setRestaurantId}
                                            disabled={!restaurants.length}
                                        />
                                    </div>


                                    <h4 className="text-[#7F1D1D]">* NOTICE : This role is linked to a restaurant</h4>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="mt-8 flex flex-col-reverse justify-end gap-3 border-t border-white/[0.08] pt-5 sm:flex-row">
                        {submitError && (
                            <p className="sm:mr-auto rounded-2xl border border-[#7F1D1D]/30 bg-[#7F1D1D]/10 px-4 py-3 text-sm font-bold text-[#7F1D1D]">
                                {submitError}
                            </p>
                        )}

                        <button
                            onClick={handleClose}
                            className="rounded-2xl border border-white/10 px-6 py-3 text-white/65 hover:bg-white/[0.05] hover:text-white"
                        >
                            Cancel
                        </button>

                        <button
                            onClick={handleAddEmployee}
                            disabled={isSubmitting}
                            className="w-full rounded-2xl border border-[#7F1D1D]/35 bg-[#7F1D1D] px-4 py-3 text-white transition-all duration-300 hover:bg-[#681718] focus:ring-2 focus:ring-[#7F1D1D]/20"
                        >
                            {isSubmitting ? "Adding..." : "Add Employee"}
                        </button>

                    </div>
                </div>

            </div>
        </div>
    );
}

export default AddEmployeeModal;
