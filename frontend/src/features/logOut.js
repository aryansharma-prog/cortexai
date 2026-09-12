import api from '../../utils/axios'

async function logOut() {
    try {
        const sessionId = typeof window !== "undefined" ? localStorage.getItem("cortex_session") : null;
        await api.post("/api/auth/logout", { sessionId }).catch(() => api.get("/api/auth/logout"));
    } catch (error) {
        console.log("[logOut error]", error);
    } finally {
        if (typeof window !== "undefined") {
            localStorage.removeItem("cortex_session");
        }
    }
}

export default logOut
