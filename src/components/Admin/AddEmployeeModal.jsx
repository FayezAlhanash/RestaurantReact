import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import api from "../../API/axios";
import { isRestaurantRole } from "../../utils/permissionScopes";
import "react-datepicker/dist/react-datepicker.css";

const getList = (data, key) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(data?.data)) return data.data;
    return [];
};

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
    const [modalRoles, setModalRoles] = useState([]);
    const [submitError, setSubmitError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const roleOptions = (roles.length ? roles : modalRoles).filter(
        (item) => String(item.name ?? "").toLowerCase() !== "customer"
    );
    const selectedRole = roleOptions.find((item) => String(item.id) === role);
    const needsRestaurant = isRestaurantRole(selectedRole);

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
        setEmail("");
        setPassword("");
        setPasswordConfirmation("");
        setRole("");
        setRestaurantId("");
        setDateOfBirth(null);
        setSubmitError("");
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

            resetForm();
            onClose();
        } catch (error) {
            setSubmitError(getErrorMessage(error));
            console.log(error.response?.data || error);
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-4">
            <div className="modal-panel-enter w-full max-w-2xl max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-[28px] border border-white/10 bg-[#182124] text-white shadow-2xl">
                <div className="relative border-b border-white/[0.08] bg-[radial-gradient(circle_at_100%_0%,rgba(127,29,29,0.16),transparent_34%),rgba(255,255,255,0.03)] px-6 py-4 text-white">
                    <h2 className="text-2xl font-bold text-center">
                        Add Employee
                    </h2>
                    <button onClick={onClose}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-2xl" >
                        ✕
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
                                phone Name
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
                                password
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

                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-[#0D1214] px-4 py-3 text-white transition-all focus:ring-2 focus:ring-[#FFD166]/10"

                            >
                                <option className="text-gray-400" value="" disabled>

                                </option>
                                {roleOptions.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                            {needsRestaurant && (
                                <>
                                    <div>
                                        <label className="mb-1 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                                            Restaurant
                                        </label>

                                        <select
                                            value={restaurantId}
                                            onChange={(e) => setRestaurantId(e.target.value)}
                                            className="w-full rounded-2xl border border-white/10 bg-[#0D1214] px-4 py-3 text-white"
                                        >
                                            <option value="">Select Restaurant</option>

                                            {restaurants.map((restaurant) => (
                                                <option
                                                    key={restaurant.id}
                                                    value={restaurant.id}
                                                >
                                                    {restaurant.name}
                                                </option>
                                            ))}
                                        </select>
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
                            onClick={onClose}
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
