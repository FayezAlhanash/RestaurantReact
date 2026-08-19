import logo from "../assets/Group.svg";
import diningImage from "../assets/onboarding-dining.jpg";
import {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    Eye,
    Info,
    Loader2,
    Lock,
    Sparkles,
    User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
    clearSession,
    getHomePath,
    getRoleId,
    storeToken,
    storeUser,
} from "../utils/auth";

function Login() {
    const location = useLocation();
    const arrivedFromHelp = Boolean(location.state?.fromHelp);

    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [isSignInOpen, setIsSignInOpen] = useState(() =>
        Boolean(location.state?.openSignIn)
    );

    const [errorMessage, setErrorMessage] = useState(() => {
        const sessionMessage =
            sessionStorage.getItem("sessionMessage") || "";

        sessionStorage.removeItem("sessionMessage");

        return sessionMessage;
    });

    const loginInputRef = useRef(null);

    const navigate = useNavigate();

    useEffect(() => {
        if (!location.state?.openSignIn) return undefined;

        setIsSignInOpen(true);

        const focusTimer = window.setTimeout(() => {
            loginInputRef.current?.focus();
        }, 520);

        return () => window.clearTimeout(focusTimer);
    }, [location.state?.openSignIn]);

    const handleLogin = async (event) => {
        event?.preventDefault();

        setIsLoading(true);
        setErrorMessage("");

        try {
            const formData = new FormData();

            formData.append("login", login.trim());
            formData.append("password", password);

            const response = await axios.post(
                "https://big4.me/api/login",
                formData
            );

            const token = response.data.token;
            const user = response.data.user;

            storeToken(token);

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

                role:
                    profileData.role ??
                    profileData.user?.role ??
                    user.role,

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

                revoked_permissions:
                    profileData.revoked_permissions ??
                    profileData.revokedPermissions ??
                    profileData.removed_permissions ??
                    profileData.removedPermissions ??
                    profileData.denied_permissions ??
                    profileData.deniedPermissions ??
                    profileData.excluded_permissions ??
                    profileData.excludedPermissions ??
                    profileData.permission_overrides?.denied ??
                    profileData.permissionOverrides?.denied ??
                    profileData.user?.revoked_permissions ??
                    profileData.user?.revokedPermissions ??
                    profileData.user?.removed_permissions ??
                    profileData.user?.removedPermissions ??
                    profileData.user?.denied_permissions ??
                    profileData.user?.deniedPermissions ??
                    profileData.user?.excluded_permissions ??
                    profileData.user?.excludedPermissions ??
                    [],
            };

            const roleId = getRoleId(sessionUser);
            const homePath = getHomePath(roleId, sessionUser);

            if (!homePath) {
                clearSession();

                setErrorMessage(
                    "You do not have permission to access the system."
                );

                return;
            }

            storeUser(sessionUser, profile);

            navigate(homePath, {
                replace: true,
            });
        } catch (error) {
            console.log(error.response?.data);

            clearSession();

            setErrorMessage(
                error.response?.data?.message ||
                    "Invalid login credentials."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main
            className={`login-screen relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#160f0d] px-4 py-8 font-merriweather text-stone-950 ${
                arrivedFromHelp ? "is-arriving-from-help" : ""
            }`}
        >
            <img
                src={diningImage}
                alt=""
                className="login-backdrop-image absolute inset-0 h-full w-full object-cover"
                aria-hidden="true"
            />

            <div className="login-backdrop-shade absolute inset-0" />
            <div className="login-backdrop-warm absolute inset-0" />

            {/* Top buttons */}
            <div className="absolute right-5 top-5 z-20 flex items-center gap-3">
                <Link
                    to="/ready-orders"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#FFD166]/65 bg-[#7F1D1D]/90 px-4 text-sm font-black text-[#FFE8A3] shadow-lg backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#981010] active:translate-y-0"
                >
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#FFD166]/15">
                        <CheckCircle2 size={17} />
                    </span>

                    Ready Orders
                </Link>

                <Link
                    to="/info"
                    className="login-help-button inline-flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black transition hover:-translate-y-0.5 active:translate-y-0"
                >
                    <span className="login-help-button-icon grid h-7 w-7 place-items-center rounded-lg">
                        <Info size={17} />
                    </span>

                    Info
                </Link>
            </div>

            <section
                className={`login-shell relative grid w-full overflow-hidden rounded-[26px] ${
                    isSignInOpen ? "is-open" : "is-intro"
                }`}
            >
                <div className="login-visual-panel relative hidden min-h-[520px] overflow-hidden p-8 lg:flex lg:flex-col lg:justify-center">
                    <img
                        src={diningImage}
                        alt=""
                        className="login-panel-image absolute inset-0 h-full w-full object-cover"
                        aria-hidden="true"
                    />

                    <div className="login-panel-shade absolute inset-0" />
                    <div className="login-panel-warm absolute inset-0" />

                    <div className="relative">
                        <div className="login-glass-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.16em]">
                            <Sparkles size={15} />
                            Big-4 Control
                        </div>

                        <h2 className="login-contrast mt-7 max-w-[420px] text-4xl font-black leading-tight">
                            Welcome, ready for your shift?
                        </h2>

                        <p className="login-muted mt-4 max-w-[390px] text-sm font-bold leading-6">
                            Sign in to manage orders, tables, and kitchen
                            flow with confidence.
                        </p>

                        <button
                            type="button"
                            onClick={() => setIsSignInOpen(true)}
                            className="login-intro-button mt-8 inline-flex h-14 items-center justify-center gap-3 rounded-2xl px-6 text-sm font-black transition duration-300 hover:-translate-y-0.5 active:translate-y-0"
                        >
                            Sign in

                            <span className="login-intro-button-icon">
                                <ArrowRight size={18} />
                            </span>
                        </button>
                    </div>
                </div>

                <div className="login-form-wrap p-3 sm:p-4">
                    <div className="login-card overflow-hidden rounded-[24px]">
                        <div className="login-card-header relative overflow-hidden px-8 py-9 text-center">
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD166]/90 to-transparent" />

                            <div className="absolute -right-10 -top-14 h-40 w-40 rounded-full bg-[#FFD166]/18 blur-2xl" />

                            <div className="login-form-logo relative mx-auto mb-5 grid h-20 w-20 place-items-center rounded-3xl bg-white/16 shadow-lg shadow-stone-950/20 ring-1 ring-white/22">
                                <img
                                    src={logo}
                                    alt="Big-4"
                                    className="h-12 w-12"
                                />
                            </div>

                            <h1 className="login-contrast relative text-3xl font-black tracking-normal">
                                Welcome back
                            </h1>

                            <p className="login-muted relative mt-2 text-sm font-bold">
                                Sign in to manage today&apos;s service.
                            </p>
                        </div>

                        <div className="px-6 py-7 sm:px-8 sm:py-8">
                            <form
                                onSubmit={handleLogin}
                                className="space-y-5"
                            >
                                <div>
                                    <label className="mb-2 block text-sm font-black text-stone-700">
                                        Email or phone number
                                    </label>

                                    <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-[#fffaf5] px-4 py-3.5 shadow-[0_10px_24px_rgba(69,48,35,0.06)] transition duration-200 focus-within:border-[#7F1D1D] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#7F1D1D]/10">
                                        <User
                                            size={19}
                                            className="shrink-0 text-stone-400"
                                        />

                                        <input
                                            ref={loginInputRef}
                                            type="text"
                                            placeholder="name@big4.me or 0999999999"
                                            value={login}
                                            onChange={(event) =>
                                                setLogin(event.target.value)
                                            }
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

                                    <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-[#fffaf5] px-4 py-3.5 shadow-[0_10px_24px_rgba(69,48,35,0.06)] transition duration-200 focus-within:border-[#7F1D1D] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#7F1D1D]/10">
                                        <Lock
                                            size={19}
                                            className="shrink-0 text-stone-400"
                                        />

                                        <input
                                            type={
                                                isPasswordVisible
                                                    ? "text"
                                                    : "password"
                                            }
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(event) =>
                                                setPassword(
                                                    event.target.value
                                                )
                                            }
                                            className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-stone-400"
                                            autoComplete="current-password"
                                            required
                                        />

                                        <button
                                            type="button"
                                            aria-label="Hold to show password"
                                            title="Hold to show password"
                                            onMouseDown={() =>
                                                setIsPasswordVisible(true)
                                            }
                                            onMouseUp={() =>
                                                setIsPasswordVisible(false)
                                            }
                                            onMouseLeave={() =>
                                                setIsPasswordVisible(false)
                                            }
                                            onTouchStart={() =>
                                                setIsPasswordVisible(true)
                                            }
                                            onTouchEnd={() =>
                                                setIsPasswordVisible(false)
                                            }
                                            onTouchCancel={() =>
                                                setIsPasswordVisible(false)
                                            }
                                            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-stone-400 transition hover:bg-stone-100 hover:text-[#7F1D1D] active:scale-95"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </div>
                                </div>

                                {errorMessage && (
                                    <div
                                        role="alert"
                                        className="modal-panel-enter flex items-start gap-3 rounded-2xl border border-[#DC2626]/25 bg-[#FFF1F1] px-4 py-3.5 text-[#7F1D1D] shadow-[0_14px_30px_rgba(127,29,29,0.10)] ring-1 ring-[#DC2626]/10"
                                    >
                                        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#DC2626]/10 text-[#B91C1C]">
                                            <AlertCircle size={18} />
                                        </span>

                                        <span className="min-w-0">
                                            <span className="block text-sm font-black leading-5">
                                                Sign in failed
                                            </span>

                                            <span className="mt-0.5 block text-sm font-bold leading-5 text-[#9F1D1D]">
                                                {errorMessage}
                                            </span>
                                        </span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[linear-gradient(135deg,#9B2C2C_0%,#7F1D1D_58%,#5F1515_100%)] px-5 text-sm font-black text-white shadow-xl shadow-[#7F1D1D]/20 transition duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-[#7F1D1D]/24 active:translate-y-0 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:bg-none disabled:shadow-none"
                                >
                                    {isLoading && (
                                        <Loader2
                                            size={18}
                                            className="animate-spin"
                                        />
                                    )}

                                    {isLoading
                                        ? "Signing in..."
                                        : "Sign in"}
                                </button>
                            </form>

                            <p className="mt-6 text-center text-xs font-bold text-stone-400">
                                Your workspace opens automatically after
                                login.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default Login;