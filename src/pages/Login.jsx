import logo from "../assets/Group.svg";
import { Eye, Loader2, Lock, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    clearSession,
    getHomePath,
    getRoleId,
    storeToken,
    storeUser,
} from "../utils/auth";

function Login() {
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(() => {
        const sessionMessage = sessionStorage.getItem("sessionMessage") || "";

        sessionStorage.removeItem("sessionMessage");
        return sessionMessage;
    });

    const navigate = useNavigate();

    const handleLogin = async (event) => {
        event?.preventDefault();
        setIsLoading(true);
        setErrorMessage("");

        try {
            const formData = new FormData();

            formData.append("login", login.trim());
            formData.append("password", password);

            // تسجيل الدخول
            const response = await axios.post(
                "https://big4.me/api/login",
                formData
            );

            const token = response.data.token;
            const user = response.data.user;

            // حفظ التوكن أولاً
            storeToken(token);

            // جلب صلاحيات المستخدم
            const profileResponse = await axios.get(
                "https://big4.me/api/profile/permissions",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const profile = profileResponse.data;
            const profileData = profile.data ?? profile;
            const sessionUser = {
                ...user,
                role: profileData.role ?? profileData.user?.role ?? user.role,
                permissions:
                    profileData.permissions ??
                    profileData.user?.permissions ??
                    [],
                role_permissions:
                    profileData.role_permissions ??
                    profileData.rolePermissions ??
                    profileData.user?.role_permissions ??
                    profileData.user?.rolePermissions ??
                    [],
                user_permissions:
                    profileData.user_permissions ??
                    profileData.userPermissions ??
                    profileData.permissions ??
                    profileData.user?.user_permissions ??
                    profileData.user?.userPermissions ??
                    profileData.user?.permissions ??
                    [],
            };
            const roleId = getRoleId(sessionUser);
            const homePath = getHomePath(roleId, sessionUser);

            if (!homePath) {
                clearSession();
                setErrorMessage("ليس لديك صلاحية للدخول إلى النظام");
                return;
            }

            // حفظ المستخدم مع الرول والصلاحيات
            storeUser(sessionUser, profile);

            navigate(homePath, { replace: true });
        } catch (error) {
            console.log(error.response?.data);

            clearSession();

            setErrorMessage(
                error.response?.data?.message ||
                    "بيانات تسجيل الدخول غير صحيحة"
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex min-h-dvh items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(127,29,29,0.13),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(247,201,72,0.18),transparent_30%),linear-gradient(135deg,#f8f5ef_0%,#ebe3d8_100%)] px-4 py-8 font-merriweather text-stone-950">
            <section className="w-full max-w-[540px] overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_24px_70px_rgba(69,48,35,0.16)]">
                <div className="bg-[#7F1D1D] px-8 py-9 text-center text-white">
                    <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-3xl bg-white/12 shadow-lg shadow-stone-950/15 ring-1 ring-white/18">
                        <img src={logo} alt="Big-4" className="h-12 w-12" />
                    </div>
                    <h1 className="text-3xl font-black tracking-normal">
                        Welcome back
                    </h1>
                    <p className="mt-2 text-sm font-bold text-white/72">
                        Sign in to manage today&apos;s service.
                    </p>
                </div>

                <div className="px-6 py-7 sm:px-9 sm:py-9">
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="mb-2 block text-sm font-black text-stone-700">
                                Email or username
                            </label>
                            <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-[#fbfaf8] px-4 py-3.5 shadow-sm transition duration-200 focus-within:border-[#7F1D1D] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#7F1D1D]/10">
                                <User size={19} className="shrink-0 text-stone-400" />
                                <input
                                    type="text"
                                    placeholder="name@big4.me"
                                    value={login}
                                    onChange={(e) => setLogin(e.target.value)}
                                    className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-stone-400"
                                    autoComplete="username"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-black text-stone-700">
                                Password
                            </label>
                            <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-[#fbfaf8] px-4 py-3.5 shadow-sm transition duration-200 focus-within:border-[#7F1D1D] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#7F1D1D]/10">
                                <Lock size={19} className="shrink-0 text-stone-400" />
                                <input
                                    type={isPasswordVisible ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-stone-400"
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    aria-label="Hold to show password"
                                    title="Hold to show password"
                                    onMouseDown={() => setIsPasswordVisible(true)}
                                    onMouseUp={() => setIsPasswordVisible(false)}
                                    onMouseLeave={() => setIsPasswordVisible(false)}
                                    onTouchStart={() => setIsPasswordVisible(true)}
                                    onTouchEnd={() => setIsPasswordVisible(false)}
                                    onTouchCancel={() => setIsPasswordVisible(false)}
                                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-stone-400 transition hover:bg-stone-100 hover:text-[#7F1D1D] active:scale-95"
                                >
                                    <Eye size={18} />
                                </button>
                            </div>
                        </div>

                        {errorMessage && (
                            <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                {errorMessage}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#7F1D1D] px-5 text-sm font-black text-white shadow-xl shadow-[#7F1D1D]/18 transition duration-200 hover:-translate-y-0.5 hover:bg-[#681718] active:translate-y-0 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none"
                        >
                            {isLoading && <Loader2 size={18} className="animate-spin" />}
                            {isLoading ? "Signing in..." : "Sign in"}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-xs font-bold text-stone-400">
                        Your workspace opens automatically after login.
                    </p>
                </div>
            </section>
        </main>
    );
}

export default Login;
