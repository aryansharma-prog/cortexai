import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_SERVER_URL,
    withCredentials: true
});

api.interceptors.request.use((config) => {
    try {
        const sessionId = typeof window !== "undefined" ? localStorage.getItem("cortex_session") : null;
        if (sessionId) {
            config.headers["Authorization"] = `Bearer ${sessionId}`;
            config.headers["x-session-id"] = sessionId;
        }
    } catch (e) {
        console.warn("[axios interceptor]", e);
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;

