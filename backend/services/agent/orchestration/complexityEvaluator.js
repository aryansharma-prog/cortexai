/**
 * Complexity Evaluator Engine
 * Computes multi-factor complexity for subtasks using the formula:
 * ComplexityScore = 0.30D + 0.20S + 0.20R + 0.15C + 0.15U
 *
 * Factors (each 0 - 100):
 * - D (Dependency): Graph in-degrees, dependency depth, prerequisite outputs
 * - S (Reasoning Steps): Estimated reasoning steps normalized to 0 - 100
 * - R (Retrieval Requirement): Live search, RAG, multi-source evidence needs
 * - C (Computational Difficulty): Coding, math calculation, structured logic
 * - U (Uncertainty): Prompt ambiguity, missing information, open-endedness
 *
 * Classifications:
 * - 0 <= score < 40  -> EASY
 * - 40 <= score < 70 -> MEDIUM
 * - 70 <= score <= 100 -> COMPLEX
 */

/**
 * Normalizes reasoning step count to 0 - 100 using configurable bounds.
 * 1 step -> 20, 2 steps -> 35, 3-4 steps -> 55, 5-6 steps -> 75, 7+ steps -> 95
 */
export const normalizeReasoningSteps = (stepCount = 1) => {
  const count = Number(stepCount) || 1;
  if (count <= 1) return 20;
  if (count === 2) return 35;
  if (count <= 4) return 55;
  if (count <= 6) return 75;
  return Math.min(100, 75 + (count - 6) * 5);
};

/**
 * Evaluates Dependency factor (D) from task graph metadata.
 */
export const evaluateDependencyFactor = (task = {}, parentGraph = null) => {
  const dependencies = Array.isArray(task.dependencies) ? task.dependencies : [];
  const depCount = dependencies.length;
  const depth = Number(task.depth) || 0;

  if (depCount === 0 && depth === 0) {
    return { score: 10, source: "independent_leaf" };
  }

  // Base score: 30 per dependency + 15 per depth level
  const rawScore = (depCount * 30) + (depth * 15);
  const clampedScore = Math.min(100, Math.max(10, rawScore));

  return {
    score: clampedScore,
    source: "dependency_graph"
  };
};

/**
 * Evaluates Retrieval Requirement factor (R) from explicit tool/evidence needs.
 */
export const evaluateRetrievalFactor = (task = {}, prompt = "") => {
  const agentType = (task.agentType || task.id || "").toLowerCase();
  const text = `${task.description || ""} ${prompt || ""}`.toLowerCase();

  if (agentType.includes("search") || agentType.includes("tavily")) {
    return { score: 95, source: "live_search_tool" };
  }

  if (agentType.includes("pdfrag") || agentType.includes("rag") || text.includes("uploaded pdf") || text.includes("document context")) {
    return { score: 90, source: "document_rag" };
  }

  const searchKeywords = ["research", "latest", "current", "news", "market", "pricing", "compare", "stock", "statistics", "source", "cite", "global", "multi-market"];
  const matches = searchKeywords.filter(k => text.includes(k));

  if (matches.length >= 3) {
    return { score: 85, source: "multi_source_keyword_detection" };
  }
  if (matches.length >= 1) {
    return { score: 60, source: "keyword_detection" };
  }

  return { score: 15, source: "internal_knowledge_base" };
};

/**
 * Evaluates Computational Difficulty factor (C) from coding, algorithm, or mathematical signals.
 */
export const evaluateComputationFactor = (task = {}, prompt = "") => {
  const agentType = (task.agentType || task.id || "").toLowerCase();
  const text = `${task.description || ""} ${prompt || ""}`.toLowerCase();

  if (agentType.includes("coding") || agentType.includes("code")) {
    const isComplexCode = text.includes("full-stack") || text.includes("architecture") || text.includes("system design") || text.includes("algorithm");
    return { score: isComplexCode ? 95 : 80, source: "code_engineering_task" };
  }

  const computeKeywords = ["calculate", "formula", "compute", "growth rate", "financial ratio", "benchmark", "metrics", "algorithm", "percentage", "statistics", "modelling", "simulation"];
  const matches = computeKeywords.filter(k => text.includes(k));

  if (matches.length >= 3 || (matches.length >= 2 && (text.includes("code") || text.includes("simulation")))) {
    return { score: 85, source: "heavy_computational_signals" };
  }
  if (matches.length >= 1) {
    return { score: 65, source: "mathematical_reasoning_signals" };
  }

  return { score: 15, source: "standard_transformation" };
};

/**
 * Evaluates Uncertainty factor (U) from query ambiguity or missing constraints.
 */
export const evaluateUncertaintyFactor = (task = {}, prompt = "") => {
  const text = `${task.description || ""} ${prompt || ""}`.trim();
  const lower = text.toLowerCase();

  // Multi-hypothesis / strategic analysis queries
  const ambiguityKeywords = ["recommend", "best approach", "explore", "options", "pros and cons", "what should i do", "evaluate strategy", "strategy", "modelling", "predict", "forecast"];
  const matches = ambiguityKeywords.filter(k => lower.includes(k));

  if (matches.length >= 2) {
    return { score: 75, source: "multi_hypothesis_strategic_inquiry" };
  }
  if (matches.length === 1) {
    return { score: 55, source: "exploratory_inquiry" };
  }

  // Very short or underspecified queries have higher ambiguity
  if (text.length < 25 && !lower.includes("what is") && !lower.includes("hi")) {
    return { score: 70, source: "short_underspecified_prompt" };
  }

  return { score: 20, source: "clearly_specified_task" };
};

/**
 * Main Complexity Evaluator
 * Computes hybrid factors D, S, R, C, U, weighted score, and classification.
 *
 * @param {Object} task - Task object with description, dependencies, agentType, etc.
 * @param {Object} [options] - Additional context (prompt, graph, stepCount)
 * @returns {Object} Complexity evaluation result
 */
export const evaluateTaskComplexity = (task = {}, options = {}) => {
  const prompt = options.prompt || task.description || "";
  const rawStepCount = options.stepCount || task.estimatedSteps || (task.description && task.description.length > 100 ? 4 : 2);

  // 1. Compute individual factors (0 - 100)
  const dResult = evaluateDependencyFactor(task, options.graph);
  const sScore = normalizeReasoningSteps(rawStepCount);
  const rResult = evaluateRetrievalFactor(task, prompt);
  const cResult = evaluateComputationFactor(task, prompt);
  const uResult = evaluateUncertaintyFactor(task, prompt);

  const D = dResult.score;
  const S = sScore;
  const R = rResult.score;
  const C = cResult.score;
  const U = uResult.score;

  // 2. Calculate weighted complexity score:
  // ComplexityScore = 0.30D + 0.20S + 0.20R + 0.15C + 0.15U
  const rawScore = (0.30 * D) + (0.20 * S) + (0.20 * R) + (0.15 * C) + (0.15 * U);
  const complexityScore = Number(Math.min(100, Math.max(0, rawScore)).toFixed(1));

  // 3. Classify:
  // 0 <= score < 40  -> EASY
  // 40 <= score < 70 -> MEDIUM
  // 70 <= score <= 100 -> COMPLEX
  let classification = "MEDIUM";
  if (complexityScore < 40) {
    classification = "EASY";
  } else if (complexityScore >= 70) {
    classification = "COMPLEX";
  }

  const result = {
    dependency: D,
    reasoning: S,
    retrieval: R,
    computation: C,
    uncertainty: U,
    complexityScore,
    classification,
    factorSources: {
      dependency: dResult.source,
      reasoning: "step_normalization_heuristic",
      retrieval: rResult.source,
      computation: cResult.source,
      uncertainty: uResult.source
    }
  };

  console.log(`[COMPLEXITY] Task="${task.name || task.id || 'unnamed'}" D=${D} S=${S} R=${R} C=${C} U=${U} Score=${complexityScore} Class=${classification}`);

  return result;
};
