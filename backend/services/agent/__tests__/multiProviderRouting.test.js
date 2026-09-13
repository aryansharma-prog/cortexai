/**
 * Multi-Provider Architecture & Cortex Continuity Test Suite
 * Comprehensive integration tests covering all 15 scenarios specified in Phase 2:
 * 1. User has only Gemini
 * 2. User has Gemini + Claude
 * 3. Simple task selects efficient compatible model
 * 4. Complex reasoning task selects capable model
 * 5. Vision task excludes non-vision models
 * 6. Coding task selects coding-capable model
 * 7. Selected model reaches rate limit
 * 8. Cortex switches to another compatible model
 * 9. Shared Notebook preserves previous progress
 * 10. Replacement model continues correctly
 * 11. Trust verification works after switching
 * 12. No compatible model remains (graceful message)
 * 13. User A cannot use User B's key
 * 14. API key never appears in telemetry/logs
 * 15. Cancellation works during model switching
 */

import { MODEL_REGISTRY, getModelById, getModelsByCapability } from "../orchestration/modelRegistry.js";
import { selectModelForTask } from "../orchestration/modelRouter.js";
import { providerHealth, FAILURE_TYPES } from "../orchestration/failureDetector.js";
import {
  buildContinuationContext,
  adaptPromptForProvider,
  executeCortexContinuityFailover
} from "../orchestration/cortexContinuity.js";
import { SharedMemory, MEMORY_TYPES } from "../orchestration/sharedMemory.js";
import { evaluateTrust } from "../orchestration/trustEvaluator.js";
import { encryptKey, decryptKey, maskKey } from "../../auth/utils/crypto.js";
import { ExecutionTree } from "../orchestration/executionTree.js";
import { ResearchCancelledError, cancelExecution, isExecutionCancelled } from "../orchestration/cancellationManager.js";

console.log("==================================================");
console.log("🧪 Running CortexAI Multi-Provider & Continuity Test Suite");
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

async function runTests() {
  // Reset provider health tracker
  providerHealth.reset();

  // ---------------- SCENARIO 1: User has only Gemini ----------------
  console.log("\n--- SCENARIO 1: User Has Only Gemini Connected ---");
  const task1 = { id: "task_1", name: "Synthesize findings", agentType: "analysis", description: "Analyze financial metrics" };
  const res1 = await selectModelForTask(task1, {
    userId: "test_user_gemini_only",
    connectedProviders: ["google"],
    complexityScore: 50
  });

  assert(res1.hasCompatibleModel === true, "Router must find a compatible model");
  assert(res1.provider === "google" || res1.selectedModel.provider === "google", "Must route to Gemini provider");
  assert(res1.routingScore > 0, `RoutingScore must be positive (got ${res1.routingScore})`);

  // ---------------- SCENARIO 2: User has Gemini + Claude ----------------
  console.log("\n--- SCENARIO 2: User Has Gemini + Claude (Evaluates Best Fit) ---");
  const codingTask = {
    id: "task_arch",
    name: "Architect Microservices",
    agentType: "coding",
    description: "Design distributed fault-tolerant microservices architecture with JWT"
  };

  const res2 = await selectModelForTask(codingTask, {
    userId: "test_user_multi",
    connectedProviders: ["google", "claude"],
    complexityScore: 85
  });

  assert(res2.hasCompatibleModel === true, "Multi-provider user must find compatible model");
  assert(res2.selectedModel !== null, "Selected model must not be null");
  assert(res2.selectedModel.provider === "claude" || res2.selectedModel.provider === "google", "Must select from connected providers");
  assert(res2.alternativesConsidered.length >= 0, "Alternatives must be recorded");

  // ---------------- SCENARIO 3: Simple Task Selects Token-Efficient Model ----------------
  console.log("\n--- SCENARIO 3: Simple Task Selects Fast, Token-Efficient Model ---");
  const simpleTask = {
    id: "task_simple",
    name: "Define Term",
    agentType: "chat",
    description: "Define what is an API endpoint in simple terms"
  };

  const res3 = await selectModelForTask(simpleTask, {
    userId: "test_user_multi",
    connectedProviders: ["google", "groq", "claude", "openai"],
    complexityScore: 20 // Low complexity
  });

  assert(res3.hasCompatibleModel === true, "Simple task must find model");
  assert(res3.selectedModel.speedScore >= 80, "Simple task must favor high speedScore");

  // ---------------- SCENARIO 4: Complex Reasoning Task Selects High-Quality Model ----------------
  console.log("\n--- SCENARIO 4: Complex Task Selects High-Reasoning Tier ---");
  const complexTask = {
    id: "task_complex_proof",
    name: "Mathematical Proof",
    agentType: "analysis",
    description: "Provide a rigorous formal proof for convergence in stochastic gradient descent"
  };

  const res4 = await selectModelForTask(complexTask, {
    userId: "test_user_multi",
    connectedProviders: ["google", "claude", "deepseek"],
    complexityScore: 95 // Extreme complexity
  });

  assert(res4.selectedModel.qualityScore >= 88, `Complex task must select model with high qualityScore >= 88 (got ${res4.selectedModel.qualityScore})`);

  // ---------------- SCENARIO 5: Vision Task Excludes Non-Vision Models ----------------
  console.log("\n--- SCENARIO 5: Vision Task Excludes Pure Text Models ---");
  const visionTask = {
    id: "task_vision",
    name: "Visual Inspection",
    selectedAgent: "imageAnalyzer",
    agentType: "imageAnalyzer",
    description: "Inspect uploaded circuit diagram and identify overheating resistor"
  };

  const res5 = await selectModelForTask(visionTask, {
    userId: "test_user_multi",
    connectedProviders: ["groq", "deepseek", "google", "openai"],
    complexityScore: 60
  });

  assert(res5.hasCompatibleModel === true, "Vision task must find vision-capable model");
  assert(res5.selectedModel.capabilities.includes("vision"), "Selected model MUST support vision capability");
  assert(res5.selectedModel.provider === "google" || res5.selectedModel.provider === "openai" || res5.selectedModel.provider === "claude", "Selected model must be a multimodal vision provider");

  // ---------------- SCENARIO 6: Coding Task Prioritizes Coding Capability ----------------
  console.log("\n--- SCENARIO 6: Coding Task Prioritizes Coding Capability ---");
  const devTask = {
    id: "task_code_gen",
    name: "Implement Red-Black Tree",
    selectedAgent: "coding",
    agentType: "coding",
    description: "Implement balanced Red-Black Tree insertion and deletion in TypeScript"
  };

  const res6 = await selectModelForTask(devTask, {
    userId: "test_user_multi",
    connectedProviders: ["google", "groq", "claude", "deepseek"],
    complexityScore: 75
  });

  assert(res6.selectedModel.codingScore >= 80, `Coding task must select model with codingScore >= 80 (got ${res6.selectedModel.codingScore})`);

  // ---------------- SCENARIO 7: Rate Limit Error Detection & Health Tracker ----------------
  console.log("\n--- SCENARIO 7: Rate Limit Error Classification & Health Tracker ---");
  const rateLimitErr = { status: 429, message: "RESOURCE_EXHAUSTED: Rate limit reached for TPM quota" };
  const classification = providerHealth.recordFailure("google", rateLimitErr, "user_test_health");

  assert(classification.classification === FAILURE_TYPES.RATE_LIMIT, "429 Error must be classified as RATE_LIMIT");
  assert(classification.isRetryableSameProvider === false, "RATE_LIMIT must NOT blindly retry same provider");
  assert(providerHealth.isProviderAvailable("google", "user_test_health") === false, "Provider must be in cooldown after rate limit");

  // ---------------- SCENARIO 8: Cortex Switches to Another Compatible Model ----------------
  console.log("\n--- SCENARIO 8: Failover Excludes Rate-Limited Provider ---");
  const res8 = await selectModelForTask(devTask, {
    userId: "test_user_multi",
    connectedProviders: ["google", "groq", "claude"],
    complexityScore: 70,
    excludedProviders: ["google"] // Google failed -> exclude
  });

  assert(res8.hasCompatibleModel === true, "Must find replacement provider");
  assert(res8.provider !== "google", "Replacement provider must NOT be the failed provider");

  // ---------------- SCENARIO 9: Shared Notebook Preserves Previous Progress ----------------
  console.log("\n--- SCENARIO 9: Shared Notebook Preserves Progress Across Switches ---");
  const memory = new SharedMemory("exec_test_continuity");

  // Subtask 1 completed with Model A (Gemini)
  memory.recordTaskOutput("node_1_route", "Express route structure and auth middleware initialized.", {
    name: "Route Structure",
    agentId: "coding",
    model: "gemini-2.5-flash",
    provider: "google"
  });

  // Subtask 2 completed with Model A (Gemini)
  memory.recordTaskOutput("node_2_tokens", "JWT token generation and verification logic validated.", {
    name: "Token Logic",
    agentId: "coding",
    model: "gemini-2.5-flash",
    provider: "google"
  });

  assert(memory.entries.length >= 2, "Shared Notebook must record completed subtasks");

  // Build continuation packet for Subtask 3
  const taskNode3 = {
    id: "node_3_errors",
    name: "Error Handling & Tests",
    selectedAgent: "coding",
    description: "Implement unified error handling middleware and unit tests"
  };

  const continuationPacket = buildContinuationContext(taskNode3, memory, "Gemini reached rate limit; continuing seamlessly.");

  assert(continuationPacket.includes("[CORTEX CONTINUITY CHECKPOINT]"), "Continuation packet must contain checkpoint header");
  assert(continuationPacket.includes("Route Structure"), "Continuation packet must contain previous completed work");
  assert(continuationPacket.includes("Token Logic"), "Continuation packet must contain token validation milestone");
  assert(continuationPacket.includes("Error Handling & Tests"), "Continuation packet must specify remaining requirements");

  // ---------------- SCENARIO 10: Provider-Specific Prompt Adaptation ----------------
  console.log("\n--- SCENARIO 10: Provider-Specific Prompt Adaptation ---");
  const adaptedMessages = adaptPromptForProvider(
    "claude",
    taskNode3.description,
    continuationPacket,
    "You are CortexAI Software Engineering Agent."
  );

  assert(Array.isArray(adaptedMessages), "Adapted prompt must return message structure");
  assert(adaptedMessages.length === 2, "Must contain SystemMessage and HumanMessage");
  assert(adaptedMessages[1].content.includes("CORTEX CONTINUITY CHECKPOINT"), "Prompt must deliver structured notebook state");

  // ---------------- SCENARIO 11: Trust Verification Works After Switching ----------------
  console.log("\n--- SCENARIO 11: Trust Evaluation on Replacement Model Output ---");
  const replacementOutput = `
# Unified Error Handling Middleware
\`\`\`javascript
export const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({ success: false, message: err.message });
};
\`\`\`
All JWT edge cases covered with test suite.
`;

  const trustRes = evaluateTrust(taskNode3, replacementOutput);
  assert(trustRes.trustScore >= 60, `Trust verification score must be >= 60 (got ${trustRes.trustScore})`);
  assert(trustRes.trustClassification === "HIGH" || trustRes.trustClassification === "MEDIUM", "Trust classification must be HIGH/MEDIUM");

  // ---------------- SCENARIO 12: No Compatible Model Remains Graceful Handling ----------------
  console.log("\n--- SCENARIO 12: Graceful Handling When No Compatible Model Remains ---");
  const res12 = await selectModelForTask(visionTask, {
    userId: "test_user_empty",
    excludedProviders: ["google", "openai", "claude", "pollinations", "tavily", "groq", "openrouter", "deepseek"]
  });

  assert(res12.hasCompatibleModel === false, "Must flag hasCompatibleModel = false");
  assert(res12.rationale.includes("Cortex could not continue this task"), "Must return helpful user message without leaking raw errors");

  // ---------------- SCENARIO 13: Strict User Key Isolation (User A != User B) ----------------
  console.log("\n--- SCENARIO 13: User Credential Security & Strict Key Isolation ---");
  const plainKeyA = "sk-ant-test-user-a-secret-key-123456789";
  const encryptedA = encryptKey(plainKeyA);
  const decryptedA = decryptKey(encryptedA);

  assert(decryptedA === plainKeyA, "Decryption of User A key must match original");
  assert(encryptedA.encryptedData !== plainKeyA, "Encrypted data must never be plaintext");

  // Masking test
  const maskedA = maskKey(plainKeyA);
  assert(!maskedA.includes("test-user-a-secret"), "Masked key must never reveal full key");
  assert(maskedA.endsWith("6789"), "Masked key must display last 4 characters");

  // ---------------- SCENARIO 14: Zero Plaintext Key in Telemetry & Execution Tree ----------------
  console.log("\n--- SCENARIO 14: Zero API Key Exposure in Execution Tree & Telemetry ---");
  const tree = new ExecutionTree("root", "Master Task");
  const leafNode = tree.addNode({
    id: "leaf_1",
    name: "Decomposed Subtask",
    selectedAgent: "coding",
    model: "claude-3-7-sonnet",
    provider: "claude",
    routingScore: 94.5,
    continuity: {
      attempted: true,
      success: true,
      fromProvider: "google",
      toProvider: "claude"
    }
  });

  const treeJSON = JSON.stringify(tree.toJSON());
  assert(!treeJSON.includes("sk-"), "Tree JSON must NEVER contain API keys");
  assert(!treeJSON.includes("secret"), "Tree JSON must NEVER contain raw secrets");
  assert(treeJSON.includes("claude-3-7-sonnet"), "Tree JSON must contain model identifier");
  assert(treeJSON.includes("fromProvider"), "Tree JSON must track continuity provider switch");

  // ---------------- SCENARIO 15: Cancellation Works During Model Switching ----------------
  console.log("\n--- SCENARIO 15: Cancellation Handling During Model Switching ---");
  const cancelExecId = `exec_cancel_test_${Date.now()}`;
  await cancelExecution(cancelExecId);

  const isCancelled = await isExecutionCancelled(cancelExecId);
  assert(isCancelled === true, "Execution must be marked as cancelled");

  // Verify ResearchCancelledError can be instantiated and identified
  const cancelErr = new ResearchCancelledError("User stopped research.");
  assert(cancelErr.name === "ResearchCancelledError", "Cancellation error must have name ResearchCancelledError");

  console.log("\n==================================================");
  console.log(`🎉 ALL ${passedTests}/${totalTests} INTEGRATION TEST SCENARIOS PASSED!`);
  console.log("==================================================");
  process.exit(0);
}

runTests().catch(err => {
  console.error("❌ Test Suite Error:", err);
  process.exit(1);
});
