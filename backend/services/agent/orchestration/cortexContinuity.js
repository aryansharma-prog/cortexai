/**
 * Cortex Continuity & Context Handoff Engine
 * Coordinates zero-disruption model switching when a model encounters a rate limit,
 * quota exhaustion, or temporary failure, preserving task state via the Shared Notebook.
 */

import { selectModelForTask } from "./modelRouter.js";
import { providerHealth, FAILURE_TYPES } from "./failureDetector.js";
import { evaluateTrust } from "./trustEvaluator.js";
import { createModelClient } from "./modelClientFactory.js";
import { invokeWithTracking } from "../observability/usageTracker.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

/**
 * Builds a model-independent structured continuation packet from the Shared Notebook.
 *
 * @param {Object} taskNode - Leaf task that encountered an issue
 * @param {Object} sharedMemory - Incremental working memory instance
 * @param {string} failureReason - Non-alarming failure reason
 * @returns {string} Formatted continuation context
 */
export const buildContinuationContext = (taskNode, sharedMemory, failureReason = "Temporary rate limit reached") => {
  const allOutputs = sharedMemory.getAllOutputs();
  const completedEntries = allOutputs.filter(o => o.taskId !== taskNode.id);

  const completedList = completedEntries.length > 0
    ? completedEntries.map(e => `✓ [${e.metadata?.name || e.taskId}]: ${e.output ? e.output.slice(0, 300) : "Completed"}`).join("\n")
    : "✓ Initial decomposition and task scoping completed.";

  return `
[CORTEX CONTINUITY CHECKPOINT]
=========================================
TASK OBJECTIVE:
${taskNode.description || taskNode.name}

COMPLETED MILESTONES:
${completedList}

REMAINING REQUIREMENTS FOR THIS STEP:
- Deliver complete, high-quality output for: ${taskNode.name}
- Ensure factual accuracy and rigorous adherence to constraints.

HANDOVER CONTEXT:
${failureReason}
=========================================
`;
};

/**
 * Adapts internal task representation to provider-specific prompt format.
 *
 * @param {string} provider - Target provider ("google", "claude", "groq", "deepseek", "openai")
 * @param {string} taskPrompt - Subtask prompt
 * @param {string} continuationContext - Structured notebook context
 * @param {string} [systemInstructions] - Optional system guidelines
 * @returns {Array<HumanMessage|SystemMessage>|string} Provider-formatted messages
 */
export const adaptPromptForProvider = (provider = "groq", taskPrompt = "", continuationContext = "", systemInstructions = "") => {
  const baseSystem = systemInstructions || "You are CortexAI Autonomous Multi-Provider Agent. Solve the assigned task thoroughly.";
  const combinedPrompt = `${continuationContext}\n\nTask Instructions:\n${taskPrompt}`;

  return [
    new SystemMessage(baseSystem),
    new HumanMessage(combinedPrompt)
  ];
};

/**
 * Handles seamless failover to a replacement model when a provider fails.
 *
 * @param {Object} params
 * @param {Object} params.taskNode - Leaf task node
 * @param {Error|Object} params.error - Caught provider error
 * @param {Object} params.currentModelMeta - Metadata of the failed model ({ model, provider })
 * @param {Object} params.state - Execution state
 * @param {Object} params.sharedMemory - Working memory
 * @param {Function} [params.emitEvent] - SSE event emitter
 * @returns {Promise<Object>} Refined execution result
 */
export const executeCortexContinuityFailover = async ({
  taskNode,
  error,
  currentModelMeta = {},
  state = {},
  sharedMemory,
  emitEvent = async () => {}
}) => {
  const executionId = state.executionId || "exec_fallback";
  const failedProvider = currentModelMeta.provider || "unknown";
  const failedModelName = currentModelMeta.model || currentModelMeta.modelName || "unknown";

  // 1. Classify failure and update provider health
  const failureClassification = providerHealth.recordFailure(failedProvider, error, state.userId || "anonymous");
  console.warn(`[CORTEX CONTINUITY] Provider "${failedProvider}" failed (${failureClassification.classification}): ${failureClassification.reason}`);

  // 2. Emit continuity started event
  await emitEvent(executionId, "cortex_continuity_started", {
    subtaskId: taskNode.id,
    nodeId: taskNode.id,
    failedProvider,
    failedModel: failedModelName,
    reason: failureClassification.reason,
    classification: failureClassification.classification,
    message: `${failedModelName} became temporarily unavailable. Continuing with another compatible model...`
  });

  // 3. Inspect remaining compatible models excluding the failed provider
  const routerResult = await selectModelForTask(taskNode, {
    userId: state.userId,
    complexityScore: taskNode.complexityScore || 40,
    excludedProviders: [failedProvider],
    excludedModels: [failedModelName]
  });

  if (!routerResult.hasCompatibleModel || !routerResult.selectedModel) {
    const safeErrorMsg = `Cortex could not continue this task because no connected model currently supports the remaining requirements. Please connect an additional provider key (e.g. Gemini, Groq, Claude, OpenAI).`;
    
    console.error(`[CORTEX CONTINUITY] No compatible replacement model available for task "${taskNode.name}".`);

    await emitEvent(executionId, "cortex_continuity_failed", {
      subtaskId: taskNode.id,
      nodeId: taskNode.id,
      message: safeErrorMsg
    });

    return {
      subtaskId: taskNode.id,
      nodeId: taskNode.id,
      agentId: taskNode.selectedAgent || "chat",
      name: taskNode.name,
      status: "failed",
      error: safeErrorMsg,
      output: safeErrorMsg,
      continuity: {
        attempted: true,
        success: false,
        fromProvider: failedProvider,
        toProvider: null,
        reason: "No compatible connected model remaining."
      }
    };
  }

  const replacementModel = routerResult.selectedModel;
  console.log(`[CORTEX CONTINUITY] Switching from ${failedProvider} (${failedModelName}) to ${replacementModel.provider} (${replacementModel.name})...`);

  // 4. Emit model switched event
  await emitEvent(executionId, "model_switched", {
    subtaskId: taskNode.id,
    nodeId: taskNode.id,
    fromProvider: failedProvider,
    fromModel: failedModelName,
    toProvider: replacementModel.provider,
    toModel: replacementModel.name,
    routingScore: routerResult.routingScore,
    reason: routerResult.rationale
  });

  // 5. Build structured continuation context from Shared Notebook
  const continuationContext = buildContinuationContext(
    taskNode,
    sharedMemory,
    `${failedModelName} encountered a rate limit / temporary unavailability; seamless failover initiated.`
  );

  // 6. Generate provider-specific prompt adaptation
  const messages = adaptPromptForProvider(
    replacementModel.provider,
    taskNode.description || state.prompt,
    continuationContext,
    `You are CortexAI ${taskNode.selectedAgent || "Reasoning"} Agent. Deliver a verified, complete response.`
  );

  // 7. Instantiate replacement model client & execute
  const startTime = Date.now();
  try {
    const { llm } = await createModelClient(replacementModel, state.userId);
    const { response, metrics } = await invokeWithTracking(llm, messages, {
      agentId: taskNode.selectedAgent || "chat",
      modelName: replacementModel.modelIdentifier,
      provider: replacementModel.provider,
      conversationId: state.conversationId,
      userId: state.userId
    });

    // 8. Verify with Trust Evaluator
    const trustResult = evaluateTrust(taskNode, response.content || "", {
      searchResults: state.searchResults
    });

    // 9. Record to Shared Notebook
    sharedMemory.recordTaskOutput(taskNode.id, response.content || "", {
      name: taskNode.name,
      agentId: taskNode.selectedAgent || "chat",
      model: replacementModel.modelIdentifier,
      provider: replacementModel.provider,
      continuity: true,
      switchedFrom: failedProvider,
      trust: trustResult
    });

    // 10. Record success for replacement provider
    providerHealth.recordSuccess(replacementModel.provider, state.userId || "anonymous");

    const continuationMetrics = {
      ...metrics,
      agentId: taskNode.selectedAgent || "chat",
      subtaskId: taskNode.id,
      name: taskNode.name,
      status: "completed",
      switchedFrom: failedProvider,
      switchedTo: replacementModel.provider,
      durationMs: Date.now() - startTime
    };

    await emitEvent(executionId, "cortex_continuity_completed", {
      subtaskId: taskNode.id,
      nodeId: taskNode.id,
      fromProvider: failedProvider,
      toProvider: replacementModel.provider,
      status: "completed",
      metrics: continuationMetrics,
      trust: trustResult
    });

    return {
      subtaskId: taskNode.id,
      nodeId: taskNode.id,
      agentId: taskNode.selectedAgent || "chat",
      name: taskNode.name,
      status: "completed",
      output: response.content || "",
      metrics: continuationMetrics,
      trust: trustResult,
      continuity: {
        attempted: true,
        success: true,
        fromProvider: failedProvider,
        fromModel: failedModelName,
        toProvider: replacementModel.provider,
        toModel: replacementModel.modelIdentifier,
        routingScore: routerResult.routingScore
      }
    };
  } catch (continuationErr) {
    console.error(`[CORTEX CONTINUITY] Secondary execution error with ${replacementModel.provider}:`, continuationErr.message);

    return {
      subtaskId: taskNode.id,
      nodeId: taskNode.id,
      agentId: taskNode.selectedAgent || "chat",
      name: taskNode.name,
      status: "failed",
      error: continuationErr.message,
      output: null,
      continuity: {
        attempted: true,
        success: false,
        fromProvider: failedProvider,
        toProvider: replacementModel.provider,
        error: continuationErr.message
      }
    };
  }
};
