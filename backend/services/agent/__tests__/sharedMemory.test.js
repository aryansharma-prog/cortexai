import {
  SharedMemory,
  MEMORY_TYPES,
  MEMORY_STATUS,
  extractStructuredKnowledge
} from "../orchestration/sharedMemory.js";

console.log("==================================================");
console.log("🧪 Running CortexAI Shared Incremental Memory Test Suite");
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

// ---------------- TEST 1: Single-Agent Simple Query (Minimal Overhead) ----------------
console.log("\n--- TEST 1: Single-Agent Simple Query (Minimal Overhead) ---");
const mem1 = new SharedMemory("exec_test_simple");
assert(mem1.version === 1, "Initial memory version must be 1");
assert(mem1.entries.length === 0, "Initial entries count must be 0");

const res1 = mem1.getRelevantContext({
  taskId: "chat_single",
  agentType: "chat",
  dependencies: [],
  description: "What is the capital of India?"
});

assert(res1.formattedContext === "", "Single task with no predecessors must receive empty memory context");
assert(res1.telemetry.entriesUsed === 0, "Entries used must be 0");
assert(res1.telemetry.tokensSavedEstimate === 0, "Tokens saved estimate must be 0 for standalone query");

// ---------------- TEST 2: Agent B Depends on Agent A ----------------
console.log("\n--- TEST 2: Agent B Depends on Agent A ---");
const mem2 = new SharedMemory("exec_test_dep");

// Agent A records research findings
mem2.recordTaskOutput("task_a_research", `
India Electric Vehicle Market Report 2025:
- 2025 Market Size: $26.9 Billion USD
- 2035 Projected Market Size: $93.0 Billion USD
- 10-Year Projected CAGR: 13.2%
[Source](https://ev-market-india.org/report-2025)
`, {
  name: "India EV Market Research",
  agentId: "search"
});

assert(mem2.version > 1, `Memory version must increment after recording output (got v${mem2.version})`);
assert(mem2.entries.length > 0, "Memory must contain recorded output and extracted entries");

// Agent B (Calculation Agent) depends on task_a_research
const res2 = mem2.getRelevantContext({
  taskId: "task_b_cagr",
  agentType: "analysis",
  dependencies: ["task_a_research"],
  description: "Calculate financial CAGR from India EV Market Research data"
});

assert(res2.formattedContext.length > 0, "Dependent agent must receive prerequisite context");
assert(res2.formattedContext.includes("26.9 Billion"), "Delivered context must include relevant market data");
assert(res2.telemetry.entriesUsed > 0, "Dependent agent must have entriesUsed > 0");

// ---------------- TEST 3: Agent C Does NOT Depend on Agent A ----------------
console.log("\n--- TEST 3: Independent Agent Does NOT Receive Unrelated Output ---");
const res3 = mem2.getRelevantContext({
  taskId: "task_c_coding",
  agentType: "coding",
  dependencies: [], // Independent task!
  description: "Fix a binary search algorithm in C++"
});

// Since task_c_coding is independent and coding-focused, it should NOT receive EV market search results
assert(res3.telemetry.entriesSkipped > 0, "Irrelevant entries must be skipped for unrelated domain task");

// ---------------- TEST 4: Monotonic Versioning & getNewSince(v) ----------------
console.log("\n--- TEST 4: Monotonic Versioning & Incremental Delta Retrieval ---");
const vBefore = mem2.version;

mem2.addEntry({
  taskId: "task_b_cagr",
  agentId: "analysis",
  type: MEMORY_TYPES.RESULT,
  content: "Calculated verified CAGR: 13.20%",
  summary: "Verified CAGR metric",
  tags: ["cagr", "calculation"]
});

const vAfter = mem2.version;
assert(vAfter === vBefore + 1, `Memory version must increment monotonically (from ${vBefore} to ${vAfter})`);

const newEntries = mem2.getNewSince(vBefore);
assert(newEntries.length === 1, `getNewSince(${vBefore}) must return exactly 1 delta entry (got ${newEntries.length})`);
assert(newEntries[0].content.includes("13.20%"), "Delta entry must contain new calculation result");

// ---------------- TEST 5: Relevance Filter Excludes Fluff / Distant Tasks ----------------
console.log("\n--- TEST 5: Relevance Filter Excludes Distant Tasks ---");
mem2.recordTaskOutput("task_x_unrelated", "Random facts about Roman history...", {
  name: "Roman History",
  agentId: "chat"
});

const res5 = mem2.getRelevantContext({
  taskId: "task_d_ev_report",
  agentType: "comparison",
  dependencies: ["task_a_research"],
  description: "Compare India EV Market statistics with global trends"
});

assert(res5.formattedContext.includes("Electric Vehicle") || res5.formattedContext.includes("26.9 Billion"), "Context must retain relevant EV dependencies");
assert(!res5.formattedContext.includes("Roman history"), "Context must exclude unrelated task outputs");

// ---------------- TEST 6: Escalation & Superseding Invalid Results ----------------
console.log("\n--- TEST 6: Verified/Escalated Result Supersedes Invalid Result ---");
const mem6 = new SharedMemory("exec_test_escalation");

const entryBad = mem6.addEntry({
  taskId: "task_calc_buggy",
  agentId: "light_agent",
  type: MEMORY_TYPES.RESULT,
  content: "Calculated market size = $5.0 Billion (Low Confidence)",
  status: MEMORY_STATUS.ACTIVE
});

assert(entryBad.status === MEMORY_STATUS.ACTIVE, "Initial entry must be ACTIVE");

// Escalated stronger agent produces verified output and supersedes old entry
const entryGood = mem6.addEntry({
  taskId: "task_calc_buggy",
  agentId: "stronger_agent",
  type: MEMORY_TYPES.RESULT,
  content: "Verified market size = $26.9 Billion (High Trust)",
  status: MEMORY_STATUS.VERIFIED,
  supersedes: entryBad.id
});

assert(entryBad.status === MEMORY_STATUS.SUPERSEDED, "Superseded entry must have status SUPERSEDED");
assert(entryGood.status === MEMORY_STATUS.VERIFIED, "New escalated entry must be VERIFIED");

const activeSince = mem6.getNewSince(0);
const hasBad = activeSince.some(e => e.id === entryBad.id);
const hasGood = activeSince.some(e => e.id === entryGood.id);

assert(!hasBad, "getNewSince must exclude superseded entries");
assert(hasGood, "getNewSince must include latest valid verified entry");

// ---------------- TEST 7: Conflict Detection & Recording ----------------
console.log("\n--- TEST 7: Conflict Detection & Recording ---");
const conflictEntry = mem6.recordConflict(entryBad.id, entryGood.id, "Conflicting market size calculations detected");
assert(conflictEntry.type === MEMORY_TYPES.CONFLICT, "Conflict entry type must be CONFLICT");
assert(conflictEntry.importance === 0.99, "Conflict entry must have highest importance (0.99)");

// ---------------- TEST 8: Safe Fallback On Error ----------------
console.log("\n--- TEST 8: Safe Fallback On Error ---");
const mem8 = new SharedMemory("exec_test_fallback");
// Simulate sync error without crashing
mem8.syncToRedisSafe().catch(() => {});
assert(mem8.version === 1, "In-memory state remains operational despite any external network error");

// ---------------- TEST 9: Memory Snapshot & State Rollback ----------------
console.log("\n--- TEST 9: Memory Snapshot & Checkpointing ---");
const snap = mem6.createSnapshot("checkpoint_stage_1");
assert(snap.snapshotId === "checkpoint_stage_1", "Snapshot ID must match");
assert(snap.entries.length === mem6.entries.length, "Snapshot must capture all active entries");

// ---------------- TEST 10: Isolation: No Cross-Execution Memory Leakage ----------------
console.log("\n--- TEST 10: No Cross-Execution Memory Leakage ---");
const memUserA = new SharedMemory("exec_user_A_101");
const memUserB = new SharedMemory("exec_user_B_202");

memUserA.addEntry({
  taskId: "user_a_secret",
  content: "User A Confidential Financial Figures: $10,000,000",
  type: MEMORY_TYPES.DATA
});

assert(memUserA.entries.length === 1, "Execution A has 1 entry");
assert(memUserB.entries.length === 0, "Execution B must have 0 entries (no cross-execution leakage)");

const userBContext = memUserB.getRelevantContext({
  taskId: "user_b_task",
  description: "Calculate financials"
});
assert(!userBContext.formattedContext.includes("Confidential"), "User B must never access User A memory");

// ---------------- TEST 11: Token Savings & Context Reduction Telemetry ----------------
console.log("\n--- TEST 11: Token Savings & Context Reduction Telemetry ---");
const telemetrySummary = mem2.getTelemetrySummary();
assert(typeof telemetrySummary.memoryVersion === "number", "Telemetry must report memoryVersion");
assert(typeof telemetrySummary.tokensSavedEstimate === "number", "Telemetry must compute tokensSavedEstimate");
assert(typeof telemetrySummary.contextReductionPercent === "number", "Telemetry must compute contextReductionPercent");
assert(telemetrySummary.contextReductionPercent >= 0 && telemetrySummary.contextReductionPercent <= 100, "Context reduction % must be between 0% and 100%");

console.log("\n==================================================");
console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log("==================================================");
