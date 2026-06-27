import logo from "../assets/Group.svg"
import { User, Lock } from "lucide-react";
import Button from '@mui/material/Button';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
function Login() {

    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();

    const handleLogin = async () => {
        try {

            const formData = new FormData();

            formData.append("login", login);
            formData.append("password", password);

            const response = await axios.post(
                "https://big4.me/api/login",
                formData
            );

            console.log(response.data.user);
            console.table(response.data.user);
            localStorage.setItem(
                "token",
                response.data.token
            );
            localStorage.setItem("user", JSON.stringify(response.data.user));

            const roleId = response.data.user.role_id;

            switch (roleId) {
                case 1:
                    navigate("/dashboard");
                    break;

                case 4:
                    navigate("/cashier");
                    break;

                case 7:
                    navigate("/warehouse");
                    break;

                default:
                    alert("ليس لديك صلاحية للدخول");
            }

        } catch (error) {

            console.log(error.response?.data);

        }
    };
    return (
        <div className="min-h-dvh px-3 py-6 sm:px-4 bg-gradient-to-br from-[#F5F1EB] to-[#DDD6CE] flex items-center justify-center font-[raleway]">
            <div className="w-full max-w-[550px] bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden">
                {/* Top Section */}
                <div className="bg-gradient-to-b from-[#8B1E1E] to-[#6E1414] min-h-48 sm:h-64 px-5 py-8 flex flex-col items-center justify-center text-center text-white">
                    <img
                        src={logo}
                        alt="logo"
                        className="w-24 mb-4"
                    />
                    <h1 className="text-2xl sm:text-4xl font-bold mb-2">
                        Welcome back sir
                    </h1>

                    <p className="text-gray-200">
                        Sign in to manage your restaurant
                    </p>

                </div>

                {/* Bottom Section */}
                <div className="p-5 sm:p-10 flex flex-col items-stretch">
                    <div className="mb-6">
                        <label className="block text-xl  mb-2 text-gray-700">
                            USERNAME
                        </label>

                        <div className="w-full px-5 py-4 text-base border border-gray-300 rounded-xl flex items-center gap-3 focus-within:border-[#7F1D1D]">                            <User size={18} className="text-gray-500" />

                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={login}
                                onChange={(e) => setLogin(e.target.value)}
                                className="outline-none w-full text-sm sm:text-base"
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block mb-2 text-gray-700 text-xl">
                            PASSWORD
                        </label>

                        <div className="w-full px-5 py-4 text-base border border-gray-300 rounded-xl flex items-center gap-3 focus-within:border-[#7F1D1D]">                            <Lock size={18} className="text-gray-500" />

                            <input
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="outline-none w-full text-sm sm:text-base"
                            />
                        </div>
                    </div>

                    <Button
                        onClick={handleLogin}
                        variant="contained"
                        fullWidth
                        sx={{
                            backgroundColor: "#7F1D1D",
                            padding: "14px",
                            borderRadius: "14px",
                            fontSize: "18px",
                            textTransform: "none",
                            marginTop: "10px",
                        }}
                    >
                        Sign in
                    </Button>

                </div>

            </div>

        </div >
    )
}

export default Login
