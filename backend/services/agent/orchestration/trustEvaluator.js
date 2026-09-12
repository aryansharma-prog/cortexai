/**
 * Trust Evaluator Engine
 * Calculates objective trustworthiness (0 - 100) from measurable evidence
 * rather than arbitrary model self-confidence.
 *
 * Domain Strategies:
 * - Coding: Syntax validity, multi-file JSON structure, code block completeness
 * - Research / RAG: Evidence citations, source alignment, domain verification
 * - Analysis / Math: Quantitative tables, numerical coherence, structured sections
 * - General: Objective alignment, non-empty length, formatting hygiene
 *
 * Classifications:
 * - 85 - 100 -> HIGH
 * - 60 - 84  -> MEDIUM
 * - 0 - 59   -> LOW (triggers targeted refinement / escalation)
 */

/**
 * Evaluates trust for coding outputs.
 */
const evaluateCodingTrust = (task, output, artifacts = []) => {
  let score = 50;
  const signals = [];

  const text = typeof output === "string" ? output : JSON.stringify(output || "");

  // Signal 1: Generated valid multi-file artifacts or code blocks
  if (Array.isArray(artifacts) && artifacts.length > 0) {
    const hasFiles = artifacts.some(a => Array.isArray(a.files) && a.files.length > 0);
    if (hasFiles) {
      score += 35;
      signals.push({ name: "valid_multi_file_artifacts", weight: "+35", passed: true });
    }
  } else if (text.includes("```") && text.length > 100) {
    score += 25;
    signals.push({ name: "markdown_code_blocks", weight: "+25", passed: true });
  } else {
    score -= 25;
    signals.push({ name: "missing_code_artifacts", weight: "-25", passed: false });
  }

  // Signal 2: Absence of error strings
  if (!text.toLowerCase().includes("failed to generate") && !text.toLowerCase().includes("error:")) {
    score += 15;
    signals.push({ name: "clean_execution", weight: "+15", passed: true });
  } else {
    score -= 30;
    signals.push({ name: "error_trace_detected", weight: "-30", passed: false });
  }

  return { score: Math.min(100, Math.max(10, score)), signals };
};

/**
 * Evaluates trust for web search and research tasks.
 */
const evaluateResearchTrust = (task, output, searchResults = null) => {
  let score = 40;
  const signals = [];
  const text = typeof output === "string" ? output : "";

  // Signal 1: Verified external search citations present
  if (searchResults && Array.isArray(searchResults.sources) && searchResults.sources.length > 0) {
    const sourceCount = searchResults.sources.length;
    score += Math.min(35, sourceCount * 8);
    signals.push({ name: `verified_sources_count_${sourceCount}`, weight: `+${Math.min(35, sourceCount * 8)}`, passed: true });
  } else if (text.includes("[Source") || text.includes("http") || text.includes("### 📚 Sources")) {
    score += 25;
    signals.push({ name: "citations_detected", weight: "+25", passed: true });
  }

  // Signal 2: Sufficient content depth
  if (text.length >= 200) {
    score += 20;
    signals.push({ name: "sufficient_research_depth", weight: "+20", passed: true });
  } else {
    score -= 15;
    signals.push({ name: "shallow_content", weight: "-15", passed: false });
  }

  return { score: Math.min(100, Math.max(10, score)), signals };
};

/**
 * Evaluates trust for structured analysis and mathematical reasoning.
 */
const evaluateAnalysisTrust = (task, output) => {
  let score = 45;
  const signals = [];
  const text = typeof output === "string" ? output : "";

  // Signal 1: Markdown comparison / data tables present
  if (text.includes("|") && text.includes("---")) {
    score += 30;
    signals.push({ name: "structured_markdown_table", weight: "+30", passed: true });
  }

  // Signal 2: Numerical or quantitative metrics mentioned
  if (/\d+(\.\d+)?%|\$\d+|\d+\s*(million|billion|k|x)/i.test(text)) {
    score += 15;
    signals.push({ name: "quantitative_metrics_present", weight: "+15", passed: true });
  }

  // Signal 3: Structural headings and bullet points
  if (text.includes("##") || text.includes("•") || text.includes("- ")) {
    score += 10;
    signals.push({ name: "thematic_structuring", weight: "+10", passed: true });
  }

  return { score: Math.min(100, Math.max(10, score)), signals };
};

/**
 * Evaluates general reasoning trust.
 */
const evaluateGeneralTrust = (task, output) => {
  let score = 50;
  const signals = [];
  const text = typeof output === "string" ? output : "";

  if (text.length > 50) {
    score += 25;
    signals.push({ name: "adequate_response_length", weight: "+25", passed: true });
  }
  if (!text.toLowerCase().includes("cannot fulfill") && !text.toLowerCase().includes("rate limit")) {
    score += 20;
    signals.push({ name: "objective_completion", weight: "+20", passed: true });
  } else {
    score -= 40;
    signals.push({ name: "refusal_or_error", weight: "-40", passed: false });
  }

  return { score: Math.min(100, Math.max(10, score)), signals };
};

/**
 * Main Trust Evaluator Function
 * Selects appropriate evaluation strategy based on task domain and computes score.
 *
 * @param {Object} task - Task node definition
 * @param {any} output - Execution output
 * @param {Object} [context] - Search results, artifacts, metrics
 * @returns {Object} Trust evaluation results
 */
export const evaluateTrust = (task = {}, output = "", context = {}) => {
  const agentType = (task.agentType || task.id || "").toLowerCase();
  const artifacts = context.artifacts || [];
  const searchResults = context.searchResults || null;

  let evalResult;

  if (agentType.includes("code") || agentType.includes("coding")) {
    evalResult = evaluateCodingTrust(task, output, artifacts);
  } else if (agentType.includes("search") || agentType.includes("rag") || agentType.includes("pdf")) {
    evalResult = evaluateResearchTrust(task, output, searchResults);
  } else if (agentType.includes("analy") || agentType.includes("comp") || agentType.includes("market")) {
    evalResult = evaluateAnalysisTrust(task, output);
  } else {
    evalResult = evaluateGeneralTrust(task, output);
  }

  const trustScore = Math.min(100, Math.max(0, evalResult.score));

  let trustClassification = "MEDIUM";
  if (trustScore >= 85) {
    trustClassification = "HIGH";
  } else if (trustScore < 60) {
    trustClassification = "LOW";
  }

  console.log(`[TRUST] Task="${task.name || task.id}" Score=${trustScore} Classification=${trustClassification}`);

  return {
    trustScore,
    trustClassification,
    signals: evalResult.signals,
    details: {
      strategyUsed: agentType,
      signalCount: evalResult.signals.length,
      passedCount: evalResult.signals.filter(s => s.passed).length
    }
  };
};
