import express from "express";
import {
  getHealth,
  getBenchmarks,
  createBenchmark,
  getExperiments,
  createExperiment,
  getRuns,
  getRunById,
  createRun
} from "../controllers/evaluationController.js";

const router = express.Router();

// Health check
router.get("/health", getHealth);

// Benchmarks
router.get("/benchmarks", getBenchmarks);
router.post("/benchmarks", createBenchmark);

// Experiments
router.get("/experiments", getExperiments);
router.post("/experiments", createExperiment);

// Evaluation Runs
router.get("/runs", getRuns);
router.post("/runs", createRun);
router.get("/runs/:runId", getRunById);

export default router;
