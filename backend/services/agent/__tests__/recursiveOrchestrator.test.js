import { evaluateTaskComplexity, normalizeReasoningSteps } from "../orchestration/complexityEvaluator.js";
import { selectDynamicAgent } from "../orchestration/dynamicAgentSelector.js";
import { ExecutionTree } from "../orchestration/executionTree.js";
import { shouldStopDecomposition, getMaxDecompositionDepth } from "../orchestration/taskDecomposer.js";
import { SharedMemory } from "../orchestration/sharedMemory.js";
import { evaluateTrust } from "../orchestration/trustEvaluator.js";
import { handleTaskEscalation, findStrongerAgent } from "../orchestration/escalationManager.js";
import { CostTracker } from "../observability/costTracker.js";
import { getAgentRegistry, getAgentById } from "../orchestration/agentRegistry.js";

console.log("==================================================");
console.log("🧪 Running CortexAI Recursive Dynamic Orchestration Test Suite");
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

// ---------------- TEST 1: Easy Task ----------------
console.log("\n--- TEST 1: Easy Task ('What is React?') ---");
const easyTask = {
  id: "task_easy_1",
  name: "React Explanation",
  description: "What is React?",
  agentType: "chat",
  dependencies: [],
  depth: 1
};
const easyComplexity = evaluateTaskComplexity(easyTask, { prompt: "What is React?", stepCount: 1 });
assert(easyComplexity.complexityScore < 40, `Easy task score (${easyComplexity.complexityScore}) must be < 40`);
assert(easyComplexity.classification === "EASY", `Easy task classification must be EASY (got ${easyComplexity.classification})`);

const easyAgent = selectDynamicAgent(easyTask, easyComplexity.complexityScore);
assert(easyAgent.selectedAgent === "chat", `Easy task must select cheap/lightweight chat agent (got ${easyAgent.selectedAgent})`);
assert(easyAgent.reason.length > 0, "Agent selection must contain explainable reason");

// ---------------- TEST 2: Medium Task ----------------
console.log("\n--- TEST 2: Medium Task (Multi-step Reasoning) ---");
const medTask = {
  id: "task_med_1",
  name: "Compare Pinecone and Qdrant Vector Stores",
  description: "Compare Pinecone and Qdrant vector database features, pricing, and latency benchmarks",
  agentType: "comparison",
  dependencies: ["search_1"],
  depth: 1
};
const medComplexity = evaluateTaskComplexity(medTask, { prompt: medTask.description, stepCount: 3 });
assert(medComplexity.complexityScore >= 40 && medComplexity.complexityScore < 70, `Medium task score (${medComplexity.complexityScore}) must be between 40 and 69`);
assert(medComplexity.classification === "MEDIUM", `Medium task classification must be MEDIUM (got ${medComplexity.classification})`);

const medAgent = selectDynamicAgent(medTask, medComplexity.complexityScore);
assert(medAgent.selectedAgent === "comparison" || medAgent.selectedAgent === "analysis" || medAgent.selectedAgent === "chat", `Medium task must select capable agent (got ${medAgent.selectedAgent})`);

// ---------------- TEST 3: Complex Task & Recursive Stop Conditions ----------------
console.log("\n--- TEST 3: Complex Task (Multi-market research & financial calculation) ---");
const complexTask = {
  id: "task_complex_1",
  name: "Global EV Market Financial Modelling & Algorithmic Growth",
  description: "Research latest global electric vehicle adoption rates across China, US, and Europe, calculate compound annual growth rate formulas, compare competitor margins, and develop full-stack simulation code",
  agentType: "analysis",
  dependencies: ["dep1", "dep2"],
  depth: 1
};
const complexComplexity = evaluateTaskComplexity(complexTask, { prompt: complexTask.description, stepCount: 6 });
assert(complexComplexity.complexityScore >= 70, `Complex task score (${complexComplexity.complexityScore}) must be >= 70`);
assert(complexComplexity.classification === "COMPLEX", `Complex task classification must be COMPLEX (got ${complexComplexity.classification})`);

const stopCheckAtDepth1 = shouldStopDecomposition(complexTask, 1, complexComplexity);
assert(stopCheckAtDepth1.stop === false, "Complex task at depth 1 must be eligible for recursive decomposition");

const stopCheckAtMaxDepth = shouldStopDecomposition(complexTask, 3, complexComplexity);
assert(stopCheckAtMaxDepth.stop === true, "Task at max depth (3) must stop recursion");

// ---------------- TEST 4: Mixed Execution Tree Construction ----------------
console.log("\n--- TEST 4: Hierarchical Execution Tree with Mixed Children ---");
const tree = new ExecutionTree("root", "Master Objective", "Research and build EV dashboard");

// Add complex node
const branch1 = tree.addNode({
  id: "branch_1",
  name: "EV Financial Analysis",
  description: "In-depth financial modelling",
  complexityScore: 78,
  classification: "COMPLEX",
  isLeaf: false
}, "root");

// Add easy leaf child to branch
const child1 = tree.addNode({
  id: "child_easy_1",
  name: "Fetch Market Stats",
  description: "Search latest EV delivery numbers",
  agentType: "search",
  complexityScore: 32,
  classification: "EASY",
  isLeaf: true
}, branch1.id);

// Add medium leaf child to branch
const child2 = tree.addNode({
  id: "child_med_2",
  name: "Growth Rate Calculation",
  description: "Compute CAGR formulas",
  agentType: "analysis",
  complexityScore: 55,
  classification: "MEDIUM",
  isLeaf: true
}, branch1.id);

const leaves = tree.getLeafNodes();
assert(leaves.length === 2, `Tree must extract exactly 2 leaf nodes (got ${leaves.length})`);
assert(tree.getMaxDepth() === 2, `Tree max depth must be 2 (got ${tree.getMaxDepth()})`);

const easySelection = selectDynamicAgent(child1, child1.complexityScore);
assert(easySelection.selectedAgent === "search", `Search leaf must assign search agent (got ${easySelection.selectedAgent})`);

// ---------------- TEST 5: Shared Incremental Memory ----------------
console.log("\n--- TEST 5: Shared Incremental Memory Context Scoping ---");
const memory = new SharedMemory("test_exec_1");
memory.recordTaskOutput("child_easy_1", "Tesla delivered 1.8M vehicles; BYD delivered 3.0M vehicles.", { name: "Search Stats" });

const contextForChild2 = memory.getDependencyContext(["child_easy_1"]);
assert(contextForChild2.includes("Tesla delivered 1.8M vehicles"), "Shared memory must pass prerequisite dependency context");

const contextForIndependent = memory.getDependencyContext([]);
assert(contextForIndependent === "", "Independent task with no dependencies must receive empty dependency context");

// ---------------- TEST 6: Trust Evaluation & Controlled Escalation ----------------
console.log("\n--- TEST 6: Trust Evaluation & Targeted Single-Leaf Escalation ---");
const mockCodingTask = {
  id: "code_task_1",
  name: "React Dashboard",
  description: "Write React dashboard component",
  agentType: "coding",
  selectedAgent: "chat" // light agent initially assigned
};

// Fixture 1: Poor/incomplete response -> LOW TRUST
const lowTrustResult = evaluateTrust(mockCodingTask, "I cannot generate full code right now.", { artifacts: [] });
assert(lowTrustResult.trustScore < 60, `Incomplete response must yield trust < 60 (got ${lowTrustResult.trustScore})`);
assert(lowTrustResult.trustClassification === "LOW", `Must be classified as LOW (got ${lowTrustResult.trustClassification})`);

// Fixture 2: Valid multi-file artifact -> HIGH TRUST
const highTrustResult = evaluateTrust(mockCodingTask, "Code generated successfully.", {
  artifacts: [{ id: 1, files: [{ name: "App.jsx", content: "export default function App() {}" }] }]
});
assert(highTrustResult.trustScore >= 85, `Valid multi-file artifact must yield trust >= 85 (got ${highTrustResult.trustScore})`);
assert(highTrustResult.trustClassification === "HIGH", `Must be classified as HIGH (got ${highTrustResult.trustClassification})`);

// Test Escalation Agent Selection
const strongerAgent = findStrongerAgent("chat", mockCodingTask);
assert(strongerAgent.id === "coding" || strongerAgent.tier === "heavy" || strongerAgent.qualityScore > 85, `Escalation must choose stronger agent (got ${strongerAgent.id})`);

// ---------------- TEST 7: Cost Tracker Metrics ----------------
console.log("\n--- TEST 7: Fine-Grained Cost & Usage Telemetry ---");
const costTracker = new CostTracker("test_exec_1");
costTracker.recordTaskMetric({
  taskId: "t1",
  agentId: "chat",
  modelName: "openai/gpt-oss-120b",
  provider: "groq",
  inputTokens: 1000,
  outputTokens: 500,
  durationMs: 450
});
costTracker.recordTaskMetric({
  taskId: "t2",
  agentId: "coding",
  modelName: "deepseek/deepseek-chat",
  provider: "openrouter",
  inputTokens: 2000,
  outputTokens: 1500,
  durationMs: 1200,
  isEscalation: true
});

const costSummary = costTracker.getAggregateMetrics();
assert(costSummary.totalTokens === 5000, `Total tokens must be 5000 (got ${costSummary.totalTokens})`);
assert(costSummary.escalations === 1, `Escalation count must be 1 (got ${costSummary.escalations})`);
assert(costSummary.estimatedCost > 0, `Estimated cost must be positive number (got ${costSummary.estimatedCost})`);

// ---------------- TEST 8: Backward Compatibility & Registry Discovery ----------------
console.log("\n--- TEST 8: Backward Compatibility & Agent Registry Discovery ---");
const registry = getAgentRegistry();
assert(registry.length >= 10, `Registry must contain all core agents (got ${registry.length})`);

const searchAgentMeta = getAgentById("search");
assert(searchAgentMeta && searchAgentMeta.capabilities.includes("web-search"), "Search agent must retain capabilities");

const pdfRagMeta = getAgentById("pdfRag");
assert(pdfRagMeta && pdfRagMeta.capabilities.includes("pdf-rag"), "PDF RAG agent must retain capabilities");

console.log("\n==================================================");
console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log("==================================================");
process.exit(0);
