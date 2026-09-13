import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDb from "./config/db.js";
import evaluationRoutes from "./routes/evaluationRoutes.js";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.EVALUATION_PORT || process.env.PORT || 8005;

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount Routes (supporting both /api/evaluation prefix and root mount)
app.use("/api/evaluation", evaluationRoutes);
app.use("/", evaluationRoutes);

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found on Evaluation Service`
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(`[Evaluation Service Error] ${req.method} ${req.originalUrl}:`, err.message || err);

  // Mongoose duplicate key error (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists.`
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join(", ")
    });
  }

  // JSON syntax parse error
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON payload"
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error"
  });
});

// Start Server
const server = app.listen(port, () => {
  console.log(`==================================================`);
  console.log(`📊 CortexAI Evaluation Service running on port ${port}`);
  console.log(`==================================================`);
  connectDb();
});

export { app, server };
export default app;
