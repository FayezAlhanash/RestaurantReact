import logo from "../assets/Group.svg"
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

                    <p className="text-gray-200">
                        Sign in to manage your restaurant
                    </p>

                </div>

                {/* Bottom Section */}
                <div className="p-10 flex flex-col items-center">

                    <div className="mb-6">

                        <label className="block text-xl mb-2 text-gray-700">
                            USERNAME
                        </label>

                        <div className="w-[400px] border border-gray-400 rounded-xl p-4 flex items-center gap-3">

                            <span>👤</span>

                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="outline-none w-full"
                            />

                        </div>

                    </div>

                    <div className="mb-6">

                        <label className="block mb-2 text-gray-700 text-xl">
                            PASSWORD
                        </label>

                        <div className="w-[400px] border border-gray-400 rounded-xl p-4 flex items-center gap-3">

                            <span>🔒</span>

                            <input
                                type="password"
                                placeholder="Enter your password"
                                className="outline-none w-full"
                            />

                        </div>

                    </div>

                    <div className="w-[400px] flex items-center justify-between mb-6">

                        <div className="flex items-center gap-2">

                            <input type="checkbox" />

                            <p className="text-sm text-gray-600">
                                Remember me
                            </p>

                        </div>

                        <button className="text-sm text-[#7F1D1D] font-semibold">
                            Forgot password?
                        </button>

                    </div>

                    <button
                        className="w-full bg-[#7F1D1D] text-white p-4 rounded-xl text-3xl mt-3"
                    >
                        Sign in
                    </button>

                </div>

            </div>

        </div>
    )
}

export default Login
