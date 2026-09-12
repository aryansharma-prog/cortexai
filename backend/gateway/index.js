import express from "express"
import dotenv from "dotenv"
import proxy from "express-http-proxy"
dotenv.config()
import cors from "cors"
import cookieParser from "cookie-parser"
import { getCurrentUser } from "./controllers/user.controller.js"
import protect from "./middleware/auth.middleware.js"
import { proxyWithHeader } from "./utils/proxyWithHeader.js"
import morgan from "morgan"
const port = process.env.PORT || 8000

const app = express()
app.set("trust proxy", 1)

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.FRONTEND_URL
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app") || origin.startsWith("http://localhost:")) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "x-session-id", "x-user-id", "Accept", "Origin"]
}))

app.use(morgan("dev"))
app.use(cookieParser())

// Diagnostic logging for incoming gateway requests
app.use((req, res, next) => {
  console.log(`[GATEWAY] ${req.method} ${req.url} (cookies present: ${Boolean(req.cookies?.session)})`);
  next();
});

// Public file downloads endpoint (PDF, PPT, Images)
app.use("/api/agent/downloads", proxy(process.env.AGENT_SERVICE || "http://localhost:8003", {
  proxyReqPathResolver: (req) => `/downloads${req.url}`
}))

app.use("/api/auth", proxy(process.env.AUTH_SERVICE || "http://localhost:8001"))
app.use("/api/chat", protect, proxyWithHeader(process.env.CHAT_SERVICE || "http://localhost:8002"))
app.use("/api/agent", protect, proxyWithHeader(process.env.AGENT_SERVICE || "http://localhost:8003"))
app.use("/api/billing", protect, proxyWithHeader(process.env.BILLING_SERVICE || "http://localhost:8004"))
app.get("/api/me", protect, getCurrentUser)
app.get("/", (req, res) => {
  res.json({ message: "hello from gateway v5", status: "online" })
})

app.listen(port, () => {
  console.log(`gateway started at ${port}`)
})
