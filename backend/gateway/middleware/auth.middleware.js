import redis from "../../shared/redis/redis.js"

const protect = async (req, res, next) => {
    try {
        const sessionId = req.cookies?.session;
        if (!sessionId) {
            console.warn(`[AUTH_MIDDLEWARE] Missing session cookie on ${req.method} ${req.originalUrl}`);
            return res.status(400).json({ message: "unauthorized" });
        }
        const session = await redis.get(`session-${sessionId}`);
        if (!session) {
            console.warn(`[AUTH_MIDDLEWARE] Session not found or expired in Redis for session ${sessionId}`);
            return res.status(400).json({ message: "session expired" });
        }
        req.user = JSON.parse(session);
        next();
    } catch (error) {
        console.error("[AUTH_MIDDLEWARE Error]", error);
        return res.status(500).json({ message: `protect error ${error.message || error}` });
    }
};

export default protect;