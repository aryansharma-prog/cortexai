/**
 * Adaptive Response Policy Engine for CortexAI
 * 
 * Separates Task Complexity (execution resources/reasoning) from
 * Response Complexity (depth, structure, token budget the user needs).
 * 
 * Determines:
 * - responseDepth: MINIMAL | SHORT | FOCUSED | DETAILED
 * - responseMode: DIRECT | CONCISE | FOCUSED | STRUCTURED
 * - targetTokens & maxTokens
 * - allowedSections, allowedTables, allowedExamples, allowExecutiveSummary, allowStrategicInsights, allowSources
 * - verbosity & compressionRequired
 */

// Configurable token limits with sensible defaults
export const POLICY_CONFIG = {
  MINIMAL: {
    targetTokens: 40,
    maxTokens: 100,
    verbosity: "LOW",
    allowSections: false,
    allowTables: false,
    allowExamples: false,
    allowUnrequestedContext: false,
    allowExecutiveSummary: false,
    allowStrategicInsights: false,
    allowSources: false,
    format: "plain"
  },
  SHORT: {
    targetTokens: 120,
    maxTokens: 250,
    verbosity: "LOW",
    allowSections: false,
    allowTables: false,
    allowExamples: true, // 1 brief example allowed
    allowUnrequestedContext: false,
    allowExecutiveSummary: false,
    allowStrategicInsights: false,
    allowSources: false,
    format: "plain"
  },
  FOCUSED: {
    targetTokens: 350,
    maxTokens: 750,
    verbosity: "MEDIUM",
    allowSections: true,
    allowTables: true,
    allowExamples: true,
    allowUnrequestedContext: false,
    allowExecutiveSummary: false,
    allowStrategicInsights: false,
    allowSources: true,
    format: "structured"
  },
  DETAILED: {
    targetTokens: 1200,
    maxTokens: 3000,
    verbosity: "HIGH",
    allowSections: true,
    allowTables: true,
    allowExamples: true,
    allowUnrequestedContext: true,
    allowExecutiveSummary: true,
    allowStrategicInsights: true,
    allowSources: true,
    format: "structured"
  }
};

/**
 * Detects explicit user intent modifiers for response depth.
 * Explicit user requests override complexity defaults.
 */
export const detectUserIntentDepth = (prompt = "") => {
  const lower = prompt.toLowerCase();

  // Explicit SHORT / MINIMAL triggers
  const minimalPatterns = [
    /\b(in\s+one\s+word|one\s+word\s+answer|single\s+word)\b/i,
    /\b(in\s+(?:one|1|2|two|a\s+single)\s+(?:sentence|line)s?)\b/i,
    /\b(just\s+(?:tell\s+me|give\s+me|the\s+name|the\s+answer))\b/i,
    /\b(short\s+answer|quick\s+answer|direct\s+answer|tl;?dr)\b/i
  ];

  const shortPatterns = [
    /\b(briefly|in\s+short|keep\s+it\s+short|concisely|in\s+brief|short\s+summary|quick\s+overview)\b/i,
    /\b(in\s+(?:3|4|5|a\s+few)\s+(?:lines|sentences|bullet\s*points))\b/i,
    /\b(summarize\s+briefly|quick\s+explanation)\b/i
  ];

  // Explicit DETAILED triggers
  const detailedPatterns = [
    /\b(in\s+detail|explain\s+in\s+detail|deep\s+dive|comprehensive|comprehensively)\b/i,
    /\b(step\s+by\s+step|complete\s+guide|detailed\s+explanation|in\s+depth|in-depth)\b/i,
    /\b(with\s+all\s+details|exhaustive|thoroughly|full\s+breakdown|full\s+analysis)\b/i,
    /\b(with\s+examples\s+and\s+common\s+mistakes|detailed\s+architecture|complete\s+tutorial)\b/i
  ];

  // Explicit FOCUSED triggers
  const focusedPatterns = [
    /\b(compare|versus|\bvs\b|difference\s+between|pros\s+and\s+cons|key\s+differences)\b/i,
    /\b(key\s+points|bullet\s+points|structured\s+overview|table\s+comparison)\b/i
  ];

  for (const pat of minimalPatterns) {
    if (pat.test(lower)) {
      return { requestedDepth: "MINIMAL", reason: "Explicit minimal/direct request detected from user" };
    }
  }

  for (const pat of shortPatterns) {
    if (pat.test(lower)) {
      return { requestedDepth: "SHORT", reason: "Explicit short/concise request detected from user" };
    }
  }

  for (const pat of detailedPatterns) {
    if (pat.test(lower)) {
      return { requestedDepth: "DETAILED", reason: "Explicit detailed/deep-dive request detected from user" };
    }
  }

  for (const pat of focusedPatterns) {
    if (pat.test(lower)) {
      return { requestedDepth: "FOCUSED", reason: "Explicit comparison/structured request detected from user" };
    }
  }

  return { requestedDepth: null, reason: "No explicit depth intent override" };
};

/**
 * Maps task type and query characteristics to intrinsic task nature.
 */
export const classifyTaskType = (prompt = "", taskAnalysis = {}) => {
  const lower = prompt.toLowerCase().trim();

  // Factual queries (capital of X, who is president of Y, when did Z happen, atomic mass of X)
  const isFactual = /^(what is the capital of|who is the (president|prime minister|ceo|founder|author) of|when was .+ born|when did .+ happen|what is the atomic (number|mass) of|what currency is used in|where is .+ located)\b/i.test(lower)
    || /^(who wrote|who discovered|who invented|what is the tallest|what is the longest|what year did)\b/i.test(lower)
    || (/^(what is|who is|where is)\s+([a-zA-Z0-9_\-\s]{2,25})\??$/i.test(lower) && !lower.includes("how") && !lower.includes("why"));

  if (isFactual) return "FACTUAL";

  // Calculations / Math
  const isMath = /^(calculate|compute|solve|what is)\s+[\d\s\+\-\*\/\^\(\)\.\%x×÷]+(?:\s*\?)?$/i.test(lower)
    || /^\d+[\s]*[\+\-\*\/x×÷][\s]*\d+/.test(lower);
  if (isMath) return "CALCULATION";

  // Coding tasks
  const isCoding = /\b(fix this|syntax error|runtime error|compile error|type error|stack trace|nullpointer|segmentation fault|write a function|write a script|write a class|write a query|write a regex|implement|debug|algorithm|code snippet)\b/i.test(lower)
    || /(?:^|\s)(?:c\+\+|cpp|python|javascript|typescript|java|golang|rust|sql|html|css|php|ruby|swift|kotlin)(?:\s|$|[,\.\?!])/i.test(lower)
    || /\b(fix|debug|refactor|optimize)\s+(?:this|the|my)?\s*(?:[a-z0-9\+\#\s]+)?(?:code|syntax|error|bug|issue|function|class|method)\b/i.test(lower);
  if (isCoding) return "CODING";

  // System Design
  const isSystemDesign = /\b(system design|design (the )?architecture|architect|design a scalable|scalable architecture|high-availability|microservices architecture)\b/i.test(lower);
  if (isSystemDesign) return "SYSTEM_DESIGN";

  // Comparison
  const isComparison = /\b(compare|versus|\bvs\b|difference between|pros and cons)\b/i.test(lower);
  if (isComparison) return "COMPARISON";

  // Document QA
  const isDocQA = /\b(in this (pdf|document|file)|according to (this|the) (pdf|document|file)|refund (policy|period)|contract)\b/i.test(lower)
    || (taskAnalysis.taskType === "document-qa");
  if (isDocQA) return "DOCUMENT_QA";

  // Explanation
  const isExplanation = /^(explain|how does|why is|what does .+ mean|what is)\b/i.test(lower);
  if (isExplanation) return "EXPLANATION";

  // Research / In-depth analysis
  const isResearch = /\b(research|market report|adoption trends|comprehensive analysis|deep dive)\b/i.test(lower)
    || (taskAnalysis.taskType === "research");
  if (isResearch) return "RESEARCH";

  // Fallback to taskAnalysis taskType if provided
  if (taskAnalysis?.taskType) {
    const norm = String(taskAnalysis.taskType).toUpperCase().replace(/-/g, "_");
    if (["FACTUAL", "CALCULATION", "CODING", "EXPLANATION", "RESEARCH", "COMPARISON", "SYSTEM_DESIGN", "DOCUMENT_QA", "CREATIVE"].includes(norm)) {
      return norm;
    }
  }

  return "GENERAL_CHAT";
};

/**
 * Normalizes complexity level to EASY, MEDIUM, or COMPLEX.
 */
export const normalizeComplexity = (complexity, scores = {}) => {
  if (typeof complexity === "number") {
    if (complexity < 40) return "EASY";
    if (complexity < 70) return "MEDIUM";
    return "COMPLEX";
  }

  const str = String(complexity || "").toUpperCase();
  if (str === "LOW" || str === "EASY") return "EASY";
  if (str === "MEDIUM") return "MEDIUM";
  if (str === "HIGH" || str === "COMPLEX") return "COMPLEX";

  const score = scores.complexityScore || 1;
  if (score <= 3) return "EASY";
  if (score <= 6) return "MEDIUM";
  return "COMPLEX";
};

/**
 * Core Adaptive Response Policy Evaluator
 * 
 * Determines response depth, structure, token ceilings, and section permissions.
 */
export const evaluateResponsePolicy = ({
  prompt = "",
  taskComplexity = "EASY",
  scores = {},
  taskType = null,
  taskAnalysis = null,
  executionTree = null,
  leafTaskCount = 1
}) => {
  const normComplexity = normalizeComplexity(taskComplexity, scores);
  const detectedTaskType = taskType || classifyTaskType(prompt, taskAnalysis || {});
  const userIntent = detectUserIntentDepth(prompt);

  let selectedDepth = "FOCUSED";
  let mode = "STRUCTURED";
  let reason = "";

  // 1. Explicit user intent has highest priority
  if (userIntent.requestedDepth) {
    selectedDepth = userIntent.requestedDepth;
    reason = `User intent override: ${userIntent.reason} (${selectedDepth})`;
  } else {
    // 2. Intrinsic task type defaults
    switch (detectedTaskType) {
      case "FACTUAL":
      case "CALCULATION":
        selectedDepth = "MINIMAL";
        reason = `Task type is ${detectedTaskType} (simple direct answer required)`;
        break;

      case "DOCUMENT_QA":
        selectedDepth = normComplexity === "COMPLEX" ? "FOCUSED" : "SHORT";
        reason = `Document QA query: direct answer based on retrieved evidence`;
        break;

      case "CODING":
        // Fix syntax / short code -> SHORT/FOCUSED; full implementation -> FOCUSED/DETAILED
        if (normComplexity === "EASY" || /fix this|syntax error|one line/i.test(prompt)) {
          selectedDepth = "SHORT";
          reason = `Targeted coding query: corrected code with concise explanation`;
        } else if (normComplexity === "COMPLEX") {
          selectedDepth = "DETAILED";
          reason = `Complex implementation/architecture task`;
        } else {
          selectedDepth = "FOCUSED";
          reason = `Standard coding task with explanation`;
        }
        break;

      case "EXPLANATION":
        if (normComplexity === "EASY") {
          selectedDepth = "SHORT";
          reason = `Simple concept explanation (definition and basic clarification)`;
        } else if (normComplexity === "COMPLEX") {
          selectedDepth = "DETAILED";
          reason = `Complex multi-part technical explanation`;
        } else {
          selectedDepth = "FOCUSED";
          reason = `Standard conceptual explanation`;
        }
        break;

      case "COMPARISON":
        selectedDepth = normComplexity === "COMPLEX" ? "DETAILED" : "FOCUSED";
        reason = `Comparison query: structured comparison matrix/points`;
        break;

      case "SYSTEM_DESIGN":
      case "RESEARCH":
        selectedDepth = "DETAILED";
        reason = `High-depth task (${detectedTaskType}) requiring comprehensive breakdown`;
        break;

      case "GENERAL_CHAT":
      default:
        if (normComplexity === "EASY") {
          selectedDepth = "MINIMAL";
          reason = `EASY general query (minimal response sufficient)`;
        } else if (normComplexity === "MEDIUM") {
          selectedDepth = "FOCUSED";
          reason = `MEDIUM complexity query (focused response)`;
        } else {
          selectedDepth = "DETAILED";
          reason = `COMPLEX multi-stage query (detailed report)`;
        }
        break;
    }
  }

  // Determine mode based on depth
  switch (selectedDepth) {
    case "MINIMAL":
      mode = "DIRECT";
      break;
    case "SHORT":
      mode = "CONCISE";
      break;
    case "FOCUSED":
      mode = "FOCUSED";
      break;
    case "DETAILED":
    default:
      mode = "STRUCTURED";
      break;
  }

  const baseConfig = POLICY_CONFIG[selectedDepth] || POLICY_CONFIG.FOCUSED;

  // Build policy object
  const policy = {
    depth: selectedDepth,
    mode,
    taskComplexity: normComplexity,
    taskType: detectedTaskType,
    targetTokens: baseConfig.targetTokens,
    maxTokens: baseConfig.maxTokens,
    verbosity: baseConfig.verbosity,
    allowSections: baseConfig.allowSections,
    allowTables: baseConfig.allowTables,
    allowExamples: baseConfig.allowExamples,
    allowUnrequestedContext: baseConfig.allowUnrequestedContext,
    allowExecutiveSummary: baseConfig.allowExecutiveSummary,
    allowStrategicInsights: baseConfig.allowStrategicInsights,
    allowSources: baseConfig.allowSources,
    format: baseConfig.format,
    compressionRequired: false,
    reason,
    userIntentOverride: !!userIntent.requestedDepth
  };

  console.log(`[ResponsePolicy] Evaluated policy -> Depth: ${policy.depth} | Mode: ${policy.mode} | Target: ~${policy.targetTokens} tok | Reason: ${policy.reason}`);

  return policy;
};
