import axios from "axios";
import { clearSession, getStoredToken, getStoredUser } from "../utils/auth";
import { getAppLanguage } from "../utils/language";

const api = axios.create({
    baseURL: "https://big4.me/api",
});

// Request interceptor
api.interceptors.request.use((config) => {
    config.headers = config.headers || {};
    const shouldSkipUserContext = config.headers["X-Skip-User-Context"];

    if (shouldSkipUserContext) {
        delete config.headers["X-Skip-User-Context"];
    }

    const token = getStoredToken();

    if (token && !shouldSkipUserContext && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (!config.headers["Accept-Language"]) {
        config.headers["Accept-Language"] = getAppLanguage();
    }

    if (!config.headers.Accept) {
        config.headers.Accept = "application/json";
    }

    // Add user context for backend permission checks.
    const user = shouldSkipUserContext ? null : getStoredUser();

    if (user) {
        config.headers["X-User-Id"] = user.id;
        config.headers["X-Role-Id"] = user.role_id ?? user.role?.id;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && getStoredToken()) {
            clearSession();
            sessionStorage.setItem(
                "sessionMessage",
                "Your account was deleted or your session expired. Please contact an admin."
            );

            if (window.location.pathname !== "/") {
                window.location.replace("/");
            }
        }

        return Promise.reject(error);
    }
);

export default api;
