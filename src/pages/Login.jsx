import logo from "../assets/Group.svg"
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LockIcon from '@mui/icons-material/Lock';
import Button from '@mui/material/Button';

function Login() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F5F1EB] to-[#DDD6CE] flex items-center justify-center">

            <div className="w-[550px] bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden">

                {/* Top Section */}
                <div className="bg-gradient-to-b from-[#8B1E1E] to-[#6E1414] h-64 flex flex-col items-center justify-center text-white">

                    <img
                        src={logo}
                        alt="logo"
                        className="w-24 mb-4"
                    />
                    <h1 className="font-['lemon'] text-4xl font-bold mb-2">
                        Welcome back sir
                    </h1>

                    <p className="font-['lemon'] text-gray-200">
                        Sign in to manage your restaurant
                    </p>

                </div>

                {/* Bottom Section */}
                <div className="p-10 flex flex-col items-center">
                    <div className="mb-6">

                        <label className="block text-xl font-['lemon'] mb-2 text-gray-700">
                            USERNAME
                        </label>

                        <div className="w-[400px]  border border-gray-400 rounded-xl p-4 flex items-center gap-3 focus-within:border-[#7F1D1D] transition duration-300">

                            <AccountCircleIcon className="text-yellow-600" />

                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="outline-none w-full font-['lemon']"
                            />

                        </div>

                    </div>
                    <div className="mb-6">

                        <label className="block  font-['lemon'] mb-2 text-gray-700 text-xl">
                            PASSWORD
                        </label>

                        <div className="w-[400px] border border-gray-400 rounded-xl p-4 flex items-center gap-3 focus-within:border-[#7F1D1D] transition duration-300">

                            <LockIcon className="text-yellow-600" />
                            <input
                                type="password"
                                placeholder="Enter your password"
                                className="outline-none w-full font-['lemon'] "
                            />

                        </div>

                    </div>
                    <div className="w-[400px] flex items-center justify-between mb-6">

                        <div className="flex items-center gap-2">

                            <input type="checkbox" />

                            <p className="font-['lemon'] text-sm text-gray-600">
                                Remember me
                            </p>

                        </div>

                        <button className="font-['lemon'] text-sm text-[#7F1D1D] font-semibold">
                            Forgot password?
                        </button>

                    </div>
                    <Button
                        variant="contained"
                        fullWidth
                        sx={{
                            backgroundColor: "#7F1D1D",
                            padding: "14px",
                            borderRadius: "14px",
                            fontSize: "30px",
                            fontFamily: "lemon",
                            textTransform: "none",
                            marginTop: "10px",

                            "&:hover": {
                                backgroundColor: "#6E1414",
                            },
                        }}
                    >
                        Sign in
                    </Button>
                   
                </div>

            </div>

        </div>
    )
}

export default Login