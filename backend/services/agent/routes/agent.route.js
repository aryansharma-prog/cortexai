import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  agent,
  cancelExecutionHandler,
  getExecution,
  getExecutionMetrics,
  streamExecution,
  getResearchAnalytics
} from "../controllers/agent.controller.js";
import multer from "../config/multer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const downloadsDir = path.join(__dirname, "../temp/downloads");

const router = express.Router();

// Main chat & research execution endpoint
router.post("/chat", multer.single("file"), agent);

// Stop / Cancel research execution endpoints
router.post("/executions/:executionId/cancel", cancelExecutionHandler);
router.post("/cancel", cancelExecutionHandler);

// Real-time execution status stream
router.get("/executions/:executionId/stream", streamExecution);

// Execution status & graph details
router.get("/executions/:executionId", getExecution);

// Execution metrics (tokens, time, cost)
router.get("/executions/:executionId/metrics", getExecutionMetrics);

// Aggregated research telemetry
router.get("/research/analytics", getResearchAnalytics);

// File downloads endpoint for PDF, PPTX, and Image downloads
router.get("/downloads/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    const safeFilename = path.basename(filename);
    const filePath = path.join(downloadsDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Requested file not found or expired." });
    }

    let contentType = "application/octet-stream";
    if (safeFilename.endsWith(".pdf")) {
      contentType = "application/pdf";
    } else if (safeFilename.endsWith(".pptx")) {
      contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    } else if (safeFilename.endsWith(".png")) {
      contentType = "image/png";
    } else if (safeFilename.endsWith(".jpg") || safeFilename.endsWith(".jpeg")) {
      contentType = "image/jpeg";
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
    return res.sendFile(filePath);
  } catch (error) {
    console.error("[Download Error]", error);
    return res.status(500).json({ message: "Failed to download file." });
  }
});

export default router;