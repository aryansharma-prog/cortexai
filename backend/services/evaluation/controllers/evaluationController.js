import evaluationService from "../services/evaluationService.js";

const VALID_CATEGORIES = ["coding", "research", "mathematics", "strategy"];
const VALID_DIFFICULTIES = ["easy", "medium", "complex"];
const VALID_EXPERIMENT_TYPES = [
  "baseline-comparison",
  "ablation",
  "complexity-validation",
  "agent-selection",
  "memory",
  "custom"
];
const VALID_EXPERIMENT_STATUSES = ["draft", "running", "completed", "failed"];
const VALID_SYSTEMS = ["single-agent", "fixed-multi-agent", "cortex-ai"];
const VALID_RUN_STATUSES = ["pending", "running", "completed", "failed"];

export const getHealth = (req, res) => {
  return res.status(200).json({
    success: true,
    service: "evaluation",
    status: "healthy"
  });
};

// ==================== BENCHMARKS ====================

export const getBenchmarks = async (req, res, next) => {
  try {
    const { category, difficulty, search, benchmarkId, page, limit } = req.query;
    const result = await evaluationService.getBenchmarks(
      { category, difficulty, search, benchmarkId },
      { page, limit }
    );
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export const createBenchmark = async (req, res, next) => {
  try {
    const {
      benchmarkId,
      category,
      difficulty,
      prompt,
      expectedCapabilities,
      requiresDecomposition,
      metadata
    } = req.body;

    if (!benchmarkId || typeof benchmarkId !== "string" || !benchmarkId.trim()) {
      return res.status(400).json({
        success: false,
        message: "benchmarkId is required"
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "category is required"
      });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`
      });
    }

    if (!difficulty) {
      return res.status(400).json({
        success: false,
        message: "difficulty is required"
      });
    }

    if (!VALID_DIFFICULTIES.includes(difficulty)) {
      return res.status(400).json({
        success: false,
        message: `Invalid difficulty. Must be one of: ${VALID_DIFFICULTIES.join(", ")}`
      });
    }

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: "prompt is required"
      });
    }

    const benchmark = await evaluationService.createBenchmark({
      benchmarkId: benchmarkId.trim(),
      category,
      difficulty,
      prompt: prompt.trim(),
      expectedCapabilities: Array.isArray(expectedCapabilities) ? expectedCapabilities : [],
      requiresDecomposition: Boolean(requiresDecomposition),
      metadata: metadata || {}
    });

    return res.status(201).json({
      success: true,
      message: "Benchmark created successfully",
      data: benchmark
    });
  } catch (error) {
    next(error);
  }
};

// ==================== EXPERIMENTS ====================

export const getExperiments = async (req, res, next) => {
  try {
    const { type, status, search, experimentId, page, limit } = req.query;
    const result = await evaluationService.getExperiments(
      { type, status, search, experimentId },
      { page, limit }
    );
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export const createExperiment = async (req, res, next) => {
  try {
    const {
      experimentId,
      name,
      description,
      type,
      configuration,
      systems,
      status,
      metadata
    } = req.body;

    if (!experimentId || typeof experimentId !== "string" || !experimentId.trim()) {
      return res.status(400).json({
        success: false,
        message: "experimentId is required"
      });
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "name is required"
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "type is required"
      });
    }

    if (!VALID_EXPERIMENT_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid type. Must be one of: ${VALID_EXPERIMENT_TYPES.join(", ")}`
      });
    }

    if (status && !VALID_EXPERIMENT_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${VALID_EXPERIMENT_STATUSES.join(", ")}`
      });
    }

    if (systems && !Array.isArray(systems)) {
      return res.status(400).json({
        success: false,
        message: "systems must be an array of strings"
      });
    }

    const experiment = await evaluationService.createExperiment({
      experimentId: experimentId.trim(),
      name: name.trim(),
      description: description || "",
      type,
      configuration: configuration || {},
      systems: systems || ["single-agent", "fixed-multi-agent", "cortex-ai"],
      status: status || "draft",
      metadata: metadata || {}
    });

    return res.status(201).json({
      success: true,
      message: "Experiment created successfully",
      data: experiment
    });
  } catch (error) {
    next(error);
  }
};

// ==================== EVALUATION RUNS ====================

export const getRuns = async (req, res, next) => {
  try {
    const { experimentId, benchmarkId, system, status, category, difficulty, page, limit } = req.query;
    const result = await evaluationService.getEvaluationRuns(
      { experimentId, benchmarkId, system, status, category, difficulty },
      { page, limit }
    );
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export const getRunById = async (req, res, next) => {
  try {
    const { runId } = req.params;
    if (!runId) {
      return res.status(400).json({
        success: false,
        message: "runId parameter is required"
      });
    }

    const run = await evaluationService.getEvaluationRunById(runId);
    if (!run) {
      return res.status(404).json({
        success: false,
        message: `Evaluation run '${runId}' not found`
      });
    }

    return res.status(200).json({
      success: true,
      data: run
    });
  } catch (error) {
    next(error);
  }
};

export const createRun = async (req, res, next) => {
  try {
    const {
      runId,
      experimentId,
      benchmarkId,
      system,
      category,
      difficulty,
      prompt,
      answer,
      status,
      metrics,
      routing,
      trust,
      memory,
      modelInfo,
      error,
      metadata,
      startedAt,
      completedAt
    } = req.body;

    const generatedRunId = runId && typeof runId === "string" && runId.trim()
      ? runId.trim()
      : `RUN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    if (!experimentId || typeof experimentId !== "string" || !experimentId.trim()) {
      return res.status(400).json({
        success: false,
        message: "experimentId is required"
      });
    }

    if (!benchmarkId || typeof benchmarkId !== "string" || !benchmarkId.trim()) {
      return res.status(400).json({
        success: false,
        message: "benchmarkId is required"
      });
    }

    if (!system) {
      return res.status(400).json({
        success: false,
        message: "system is required"
      });
    }

    if (!VALID_SYSTEMS.includes(system)) {
      return res.status(400).json({
        success: false,
        message: `Invalid system. Must be one of: ${VALID_SYSTEMS.join(", ")}`
      });
    }

    if (status && !VALID_RUN_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${VALID_RUN_STATUSES.join(", ")}`
      });
    }

    const run = await evaluationService.createEvaluationRun({
      runId: generatedRunId,
      experimentId: experimentId.trim(),
      benchmarkId: benchmarkId.trim(),
      system,
      category: category || "",
      difficulty: difficulty || "",
      prompt: prompt || "",
      answer: answer || "",
      status: status || "pending",
      metrics: metrics || {},
      routing: routing || {},
      trust: trust || {},
      memory: memory || {},
      modelInfo: modelInfo || {},
      error: error || null,
      metadata: metadata || {},
      startedAt: startedAt ? new Date(startedAt) : undefined,
      completedAt: completedAt ? new Date(completedAt) : undefined
    });

    return res.status(201).json({
      success: true,
      message: "Evaluation run created successfully",
      data: run
    });
  } catch (error) {
    next(error);
  }
};
