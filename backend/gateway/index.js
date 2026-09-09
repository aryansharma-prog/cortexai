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

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.FRONTEND_URL
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith("http://localhost:")) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}))

app.use(morgan("dev"))
app.use(cookieParser())

// Public file downloads endpoint (PDF, PPT, Images)
app.use("/api/agent/downloads", proxy(process.env.AGENT_SERVICE || "http://localhost:8003", {
  proxyReqPathResolver: (req) => `/downloads${req.url}`
}))

app.use("/api/auth", proxy(process.env.AUTH_SERVICE))
app.use("/api/chat", protect, proxyWithHeader(process.env.CHAT_SERVICE))
app.use("/api/agent", protect, proxyWithHeader(process.env.AGENT_SERVICE))
app.use("/api/billing", protect, proxyWithHeader(process.env.BILLING_SERVICE))
app.get("/api/me", protect, getCurrentUser)
app.get("/", (req, res) => {
  res.json({ message: "hello from gateway v5" })
})

app.listen(port, () => {
  console.log(`gateway started at ${port}`)
})
