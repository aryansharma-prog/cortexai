import {
  evaluateResponsePolicy,
  detectUserIntentDepth,
  classifyTaskType,
  POLICY_CONFIG
} from "../orchestration/responsePolicyEngine.js";
import {
  estimateTokenCount,
  checkPolicyViolation
} from "../orchestration/responseValidator.js";

console.log("==================================================");
console.log("🧪 Running CortexAI Adaptive Response Policy Engine Test Suite");
console.log("==================================================");

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests += 1;
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    passedTests += 1;
  } else {
    console.error(`❌ [FAIL] ${message}`);
    throw new Error(`Test Assertion Failed: ${message}`);
  }
}

// ---------------- TEST 1: Simple Factual ("What is the capital of India?") ----------------
console.log("\n--- TEST 1: Simple Factual ('What is the capital of India?') ---");
const test1Prompt = "What is the capital of India?";
const test1Type = classifyTaskType(test1Prompt);
assert(test1Type === "FACTUAL", `Task type for simple query must be FACTUAL (got ${test1Type})`);

const test1Policy = evaluateResponsePolicy({
  prompt: test1Prompt,
  taskComplexity: "EASY",
  scores: { complexityScore: 1 }
});

assert(test1Policy.depth === "MINIMAL", `Response depth for simple factual must be MINIMAL (got ${test1Policy.depth})`);
assert(test1Policy.mode === "DIRECT", `Response mode for simple factual must be DIRECT (got ${test1Policy.mode})`);
assert(test1Policy.targetTokens <= 60, `Target tokens for MINIMAL must be <= 60 (got ${test1Policy.targetTokens})`);
assert(test1Policy.allowExecutiveSummary === false, "MINIMAL policy must forbid Executive Summary");
assert(test1Policy.allowStrategicInsights === false, "MINIMAL policy must forbid Strategic Insights");
assert(test1Policy.allowTables === false, "MINIMAL policy must forbid Tables");
assert(test1Policy.allowSections === false, "MINIMAL policy must forbid Sections");

// ---------------- TEST 2: Simple Definition ("What is an API?") ----------------
console.log("\n--- TEST 2: Simple Definition ('What is an API?') ---");
const test2Prompt = "What is an API?";
const test2Policy = evaluateResponsePolicy({
  prompt: test2Prompt,
  taskComplexity: "EASY",
  scores: { complexityScore: 2 }
});

assert(test2Policy.depth === "SHORT" || test2Policy.depth === "MINIMAL", `Response depth for simple definition must be SHORT or MINIMAL (got ${test2Policy.depth})`);
assert(test2Policy.allowExecutiveSummary === false, "SHORT policy must forbid Executive Summary");
assert(test2Policy.allowStrategicInsights === false, "SHORT policy must forbid Strategic Insights");
assert(test2Policy.targetTokens <= 250, `Target tokens for SHORT must be <= 250 (got ${test2Policy.targetTokens})`);

// ---------------- TEST 3: Explicit Short Request ("Explain recursion briefly.") ----------------
console.log("\n--- TEST 3: Explicit Short Request ('Explain recursion briefly.') ---");
const test3Prompt = "Explain recursion briefly.";
const test3Intent = detectUserIntentDepth(test3Prompt);
assert(test3Intent.requestedDepth === "SHORT", `User intent must detect SHORT request (got ${test3Intent.requestedDepth})`);

const test3Policy = evaluateResponsePolicy({
  prompt: test3Prompt,
  taskComplexity: "MEDIUM", // Intrinsic complexity is medium, but user requested brief!
  scores: { complexityScore: 5 }
});
assert(test3Policy.depth === "SHORT", `Explicit short intent must override default MEDIUM complexity (got ${test3Policy.depth})`);
assert(test3Policy.userIntentOverride === true, "userIntentOverride must be true when explicit request is detected");

// ---------------- TEST 4: Explicit Detailed Request ----------------
console.log("\n--- TEST 4: Explicit Detailed Request ('Explain recursion in detail with examples and common mistakes.') ---");
const test4Prompt = "Explain recursion in detail with examples and common mistakes.";
const test4Intent = detectUserIntentDepth(test4Prompt);
assert(test4Intent.requestedDepth === "DETAILED", `User intent must detect DETAILED request (got ${test4Intent.requestedDepth})`);

const test4Policy = evaluateResponsePolicy({
  prompt: test4Prompt,
  taskComplexity: "EASY", // Intrinsic complexity is low, but user requested detailed!
  scores: { complexityScore: 2 }
});
assert(test4Policy.depth === "DETAILED", `Explicit detailed intent must override EASY default (got ${test4Policy.depth})`);
assert(test4Policy.allowSections === true, "DETAILED policy must allow sections");
assert(test4Policy.allowExamples === true, "DETAILED policy must allow examples");

// ---------------- TEST 5: Medium Comparison ("MongoDB vs PostgreSQL") ----------------
console.log("\n--- TEST 5: Medium Comparison ('MongoDB vs PostgreSQL') ---");
const test5Prompt = "MongoDB vs PostgreSQL";
const test5Type = classifyTaskType(test5Prompt);
assert(test5Type === "COMPARISON", `Task type for vs query must be COMPARISON (got ${test5Type})`);

const test5Policy = evaluateResponsePolicy({
  prompt: test5Prompt,
  taskComplexity: "MEDIUM",
  scores: { complexityScore: 5 }
});
assert(test5Policy.depth === "FOCUSED", `Medium comparison depth must be FOCUSED (got ${test5Policy.depth})`);
assert(test5Policy.allowTables === true, "FOCUSED comparison policy must allow comparison tables");
assert(test5Policy.allowSections === true, "FOCUSED policy must allow sections");

// ---------------- TEST 6: Complex System Design ----------------
console.log("\n--- TEST 6: Complex System Design ('Design the architecture of a scalable YouTube-like platform.') ---");
const test6Prompt = "Design the architecture of a scalable YouTube-like platform.";
const test6Type = classifyTaskType(test6Prompt);
assert(test6Type === "SYSTEM_DESIGN", `Task type must be SYSTEM_DESIGN (got ${test6Type})`);

const test6Policy = evaluateResponsePolicy({
  prompt: test6Prompt,
  taskComplexity: "COMPLEX",
  scores: { complexityScore: 8 }
});
assert(test6Policy.depth === "DETAILED", `Complex system design depth must be DETAILED (got ${test6Policy.depth})`);
assert(test6Policy.targetTokens >= 1000, `Target tokens for DETAILED must be >= 1000 (got ${test6Policy.targetTokens})`);
assert(test6Policy.allowExecutiveSummary === true, "DETAILED system design policy must allow executive summary");
assert(test6Policy.allowStrategicInsights === true, "DETAILED policy must allow strategic insights");

// ---------------- TEST 7: Coding Task ----------------
console.log("\n--- TEST 7: Coding Task ('Fix this C++ syntax error and explain it.') ---");
const test7Prompt = "Fix this C++ syntax error and explain it.";
const test7Type = classifyTaskType(test7Prompt);
assert(test7Type === "CODING", `Task type must be CODING (got ${test7Type})`);

const test7Policy = evaluateResponsePolicy({
  prompt: test7Prompt,
  taskComplexity: "EASY",
  scores: { complexityScore: 2 }
});
assert(test7Policy.depth === "SHORT", `Syntax fix coding depth must be SHORT (got ${test7Policy.depth})`);
assert(test7Policy.allowExecutiveSummary === false, "Targeted coding task must not have executive summaries");

// ---------------- TEST 8: Calculation Task ----------------
console.log("\n--- TEST 8: Calculation Task ('What is 1234 * 5678?') ---");
const test8Prompt = "What is 1234 * 5678?";
const test8Type = classifyTaskType(test8Prompt);
assert(test8Type === "CALCULATION", `Task type must be CALCULATION (got ${test8Type})`);

const test8Policy = evaluateResponsePolicy({
  prompt: test8Prompt,
  taskComplexity: "EASY",
  scores: { complexityScore: 1 }
});
assert(test8Policy.depth === "MINIMAL", `Math calculation depth must be MINIMAL (got ${test8Policy.depth})`);
assert(test8Policy.mode === "DIRECT", `Mode must be DIRECT (got ${test8Policy.mode})`);

// ---------------- TEST 9: Document QA Task ----------------
console.log("\n--- TEST 9: Document QA Task ('According to this PDF, what is the refund period?') ---");
const test9Prompt = "According to this PDF, what is the refund period?";
const test9Type = classifyTaskType(test9Prompt, { taskType: "document-qa" });
assert(test9Type === "DOCUMENT_QA", `Task type must be DOCUMENT_QA (got ${test9Type})`);

const test9Policy = evaluateResponsePolicy({
  prompt: test9Prompt,
  taskComplexity: "EASY",
  scores: { complexityScore: 2 },
  taskAnalysis: { taskType: "document-qa" }
});
assert(test9Policy.depth === "SHORT" || test9Policy.depth === "MINIMAL", `Document QA depth must be SHORT/MINIMAL (got ${test9Policy.depth})`);

// ---------------- TEST 10: Response Validator - Policy Violation Check ----------------
console.log("\n--- TEST 10: Response Validator & Token Estimation ---");
const shortSampleText = "New Delhi is the capital of India.";
const estimatedTokens = estimateTokenCount(shortSampleText);
assert(estimatedTokens > 0 && estimatedTokens < 20, `Token estimation for short sentence should be ~7-10 (got ${estimatedTokens})`);

// Case A: Compliant minimal response
const compliantCheck = checkPolicyViolation(shortSampleText, test1Policy);
assert(compliantCheck.violates === false, "Clean 1-sentence response must pass validation without violation");

// Case B: Bloated response with Executive Summary for MINIMAL query
const bloatedResponse = `## Executive Summary
India is a sovereign country in South Asia with New Delhi as its capital.

## Structured Overview
| Parameter | Value |
|---|---|
| Capital | New Delhi |
| Population | 30M+ |

## Key Insights & Strategic Takeaways
1. New Delhi serves as the administrative hub.`;

const bloatedCheck = checkPolicyViolation(bloatedResponse, test1Policy);
assert(bloatedCheck.violates === true, "Bloated response for MINIMAL query must trigger policy violation");
assert(bloatedCheck.reason.includes("forbidden report sections") || bloatedCheck.reason.includes("Token count"), "Violation reason must be descriptive");

// ---------------- TEST 11: Generalization Check (No Hardcoding) ----------------
console.log("\n--- TEST 11: Generalization Check (No Hardcoding) ---");
const arbitraryQueries = [
  { q: "What is the capital of France?", expectedDepth: "MINIMAL" },
  { q: "What is the capital of Japan?", expectedDepth: "MINIMAL" },
  { q: "Calculate 999 * 888", expectedDepth: "MINIMAL" },
  { q: "Explain microservices architecture in 3 lines", expectedDepth: "SHORT" },
  { q: "Give a comprehensive deep dive into quantum computing algorithms with examples", expectedDepth: "DETAILED" }
];

for (const item of arbitraryQueries) {
  const policy = evaluateResponsePolicy({
    prompt: item.q,
    taskComplexity: item.expectedDepth === "DETAILED" ? "COMPLEX" : "EASY"
  });
  assert(policy.depth === item.expectedDepth, `Query '${item.q}' should evaluate to ${item.expectedDepth} (got ${policy.depth})`);
}

console.log("\n==================================================");
console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log("==================================================");
