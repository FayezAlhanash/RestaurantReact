import axios from "axios";
import { getStoredToken, getStoredUser } from "../utils/auth";

const api = axios.create({
    baseURL: "https://big4.me/api",
});

// 🔐 REQUEST INTERCEPTOR
api.interceptors.request.use((config) => {
    const token = getStoredToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // 🧠 نضيف معلومات المستخدم (اختياري مفيد جداً للباك)
    const user = getStoredUser();

    if (user) {
        config.headers["X-User-Id"] = user.id;
        config.headers["X-Role-Id"] = user.role_id ?? user.role?.id;
    }

    return config;
});

export default api;
