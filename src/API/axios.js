import axios from "axios";
import { clearSession, getStoredToken, getStoredUser } from "../utils/auth";

const api = axios.create({
    baseURL: "https://big4.me/api",
});

// Request interceptor
api.interceptors.request.use((config) => {
    const token = getStoredToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Add user context for backend permission checks.
    const user = getStoredUser();

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
