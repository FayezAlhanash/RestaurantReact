import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import api from "../../API/axios";
import "react-datepicker/dist/react-datepicker.css";
function AddEmployeeModal({ isOpen, onClose }) {
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

    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                const response = await api.get("/restaurants");
                setRestaurants(response.data.restaurants);
            } catch (error) {
                console.log(error);
            }
        };

        fetchRestaurants();
    }, []);
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
    };
    console.log(restaurants);
    if (!isOpen) return null;
    const roleMap = {
        manager: 3,
        cashier: 4,
        delivery: 5,
        chef: 6,
        warehouse: 7,
         waiter: 8,
    };

   

    const handleAddEmployee = async () => {
        try {
            const roleId = roleMap[role];

            const formData = new FormData();

            formData.append("first_name", firstName);
            formData.append("father_name", fatherName);
            formData.append("last_name", lastName);
            formData.append("email", email);
            formData.append("phone_number", phoneNumber);
            formData.append("password", password);
            formData.append("password_confirmation", passwordConfirmation);
            formData.append("role_id", roleId);
            formData.append("national_number", nationalNumber);
            formData.append("gender", gender);
            formData.append(
                "date_of_birth",
                dateOfBirth?.toISOString().split("T")[0]
            );
            if (role === "manager") {
                formData.append("restaurant_id", restaurantId);

            }

            const response = await api.post(
                "/admin/staff-users",
                formData
            );

            resetForm();
            onClose();
        } catch (error) {
            console.log(error.response?.data.errors);
        }
    };
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="bg-[#7F1D1D] text-white px-6 py-4 relative">
                    <h2 className="text-2xl font-bold text-center">
                        Add Employee
                    </h2>
                    <button onClick={onClose}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-2xl" >
                        ✕
                    </button>
                </div>
                <div className="p-6 bg-gray-200">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                First Name
                            </label>

                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg focus:ring-2 focus:ring-[#7F1D1D] focus:border-[#7F1D1D]"
                            />

                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Father Name
                            </label>

                            <input
                                type="text"
                                value={fatherName}
                                onChange={(e) => setFatherName(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg focus:ring-2 focus:ring-[#7F1D1D] focus:border-[#7F1D1D]"
                            />

                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                last Name
                            </label>

                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg focus:ring-2 focus:ring-[#7F1D1D] focus:border-[#7F1D1D]"
                            />

                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                phone Name
                            </label>

                            <input
                                type="phone"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg focus:ring-2 focus:ring-[#7F1D1D] focus:border-[#7F1D1D]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Gender
                            </label>

                            <select
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white">
                                <option className="text-gray-400" value="" disabled>

                                </option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                National Number
                            </label>

                            <input
                                type="text"
                                value={nationalNumber}
                                onChange={(e) => setNationalNumber(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 mt-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Email
                            </label>

                            <input
                                type="email"

                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`w-full border rounded-xl px-4 py-3 transition-all hover:scale-[1.02] hover:shadow-lg focus:ring-2 focus:ring-[#7F1D1D]
    ${email.includes("@")
                                        ? "bg-green-50 border-green-300"
                                        : "bg-white border-gray-300"
                                    }`}
                            />

                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
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
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-[#7F1D1D]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                password
                            </label>

                            <input
                                autoComplete="new-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#7F1D1D]
                                        ${password &&
                                        passwordConfirmation &&
                                        password !== passwordConfirmation
                                        ? "bg-red-50 border-red-300"
                                        : password &&
                                            passwordConfirmation &&
                                            password === passwordConfirmation
                                            ? "bg-green-50 border-green-300"
                                            : "bg-white border-gray-300"
                                    }`}
                            />

                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Password Confirmation
                            </label>

                            <input
                                autoComplete="new-password"
                                type="password"
                                value={passwordConfirmation}
                                onChange={(e) => setPasswordConfirmation(e.target.value)}
                                className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#7F1D1D]
                                         ${password &&
                                        passwordConfirmation &&
                                        password !== passwordConfirmation
                                        ? "bg-red-50 border-red-300"
                                        : password &&
                                            passwordConfirmation &&
                                            password === passwordConfirmation
                                            ? "bg-green-50 border-green-300"
                                            : "bg-white border-gray-300"
                                    }`}
                            />

                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Role
                            </label>

                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg focus:ring-2 focus:ring-[#7F1D1D] focus:border-[#7F1D1D]"

                            >
                                <option className="text-gray-400" value="" disabled>

                                </option>
                                <option value="manager">Manager</option>
                                <option value="cashier">Cashier</option>
                                <option value="warehouse">Warehouse Manager</option>
                                 <option value="waiter">Waiter</option>
                                <option value="chef">Chef</option>
                            </select>
                            {role === "manager" && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Restaurant
                                        </label>

                                        <select
                                            value={restaurantId}
                                            onChange={(e) => setRestaurantId(e.target.value)}
                                            className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white"
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


                                    <h4 className="text-red-950">* NOTICE : Adding Manager to your system is going to Make Changes in the Restaurant System</h4>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-8 border-t pt-5">

                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-100"
                        >
                            Cancel
                        </button>

                        <button
                            onClick={handleAddEmployee}
                            className="w-full border text-white border-red-800 rounded-xl px-4 py-3 bg-red-900 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg focus:ring-2 focus:ring-[#7F1D1D] focus:border-[#7F1D1D]"
                        >
                            Add Employee
                        </button>

                    </div>
                </div>

            </div>
        </div>
    );
}

export default AddEmployeeModal;