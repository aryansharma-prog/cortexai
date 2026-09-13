import redis from "../../../shared/redis/redis.js";
import { analyzeTask } from "./taskAnalyzer.js";
import { getAgentById } from "./agentRegistry.js";
import { searchTool } from "../config/tavily.js";
import { MODEL_CONFIG } from "../config/llmModels.js";
import { chatAgent } from "../agents/chat.agent.js";
import { codingAgent } from "../agents/coding.agent.js";
import { analysisAgent } from "../agents/analysis.agent.js";
import { comparisonAgent } from "../agents/comparison.agent.js";
import { synthesizeMultiAgentResults } from "../agents/synthesizer.agent.js";
import { pdfAgent } from "../agents/pdf.agent.js";
import { pptAgent } from "../agents/ppt.agent.js";
import { visionAgent } from "../agents/vision.agent.js";
import { pdfRag } from "../agents/pdfRag.agent.js";
import { imageAnalyzer } from "../agents/imageAnalyzer.agent.js";
import { aggregateWorkflowMetrics } from "../observability/usageTracker.js";
import { deductCredits } from "../utils/deductCredits.js";
import { checkAgentLimit } from "../config/agentLimit.js";
import { normalizeSearchResults } from "../utils/searchNormalizer.js";
import {
  assertNotCancelled,
  isExecutionCancelled,
  ResearchCancelledError,
  cleanupCancellation
} from "./cancellationManager.js";
import Execution from "../models/execution.model.js";

// Core Recursive Orchestration Modules
import { ExecutionTree } from "./executionTree.js";
import { evaluateTaskComplexity } from "./complexityEvaluator.js";
import { recursivelyDecomposeTasks } from "./taskDecomposer.js";
import { selectDynamicAgent } from "./dynamicAgentSelector.js";
import { SharedMemory } from "./sharedMemory.js";
import { evaluateTrust } from "./trustEvaluator.js";
import { handleTaskEscalation } from "./escalationManager.js";
import { evaluateResponsePolicy } from "./responsePolicyEngine.js";
import { validateAndRefineResponse } from "./responseValidator.js";
import { selectModelForTask } from "./modelRouter.js";
import { executeCortexContinuityFailover } from "./cortexContinuity.js";

/**
 * Publishes real-time execution event to Redis and updates active state.
 */
export const emitExecutionEvent = async (executionId, eventType, data = {}) => {
  if (!executionId) return;

  if (eventType !== "workflow_cancelled" && await isExecutionCancelled(executionId)) {
    return;
  }

  const eventPayload = {
    executionId,
    type: eventType,
    timestamp: new Date().toISOString(),
    ...data
  };

  try {
    const redisKey = `execution:${executionId}`;
    const channelKey = `execution_events:${executionId}`;

    await redis.publish(channelKey, JSON.stringify(eventPayload));

    const current = await redis.get(redisKey);
    let state = current ? JSON.parse(current) : { executionId, events: [], agentStatuses: {} };

    state.events = state.events || [];
    state.events.push(eventPayload);
    if (state.events.length > 50) state.events.shift();

    if (data.agentId || data.subtaskId || data.nodeId) {
      const key = data.nodeId || data.subtaskId || data.agentId;
      state.agentStatuses = state.agentStatuses || {};
      state.agentStatuses[key] = {
        ...(state.agentStatuses[key] || {}),
        ...data,
        updatedAt: new Date().toISOString()
      };
    }

    if (data.executionTree) {
      state.executionTree = data.executionTree;
    }

    if (data.workflowStatus) {
      state.workflowStatus = data.workflowStatus;
    }

    await redis.set(redisKey, JSON.stringify(state), "EX", 3600);
  } catch (err) {
    console.error(`[emitExecutionEvent error for ${executionId}]`, err);
  }
};

/**
 * Dispatches a single leaf task to its selected agent implementation.
 */
export const executeLeafTask = async (taskNode, state, executionId, sharedMemory) => {
  await assertNotCancelled(executionId);

  const subtaskId = taskNode.id;
  const agentType = taskNode.selectedAgent || taskNode.agentType || "chat";
  const agentInfo = getAgentById(agentType) || { name: taskNode.name || agentType, id: agentType, model: "openai/gpt-oss-120b", provider: "groq" };

  // Decision 2: Model Router dynamically selects best available compatible model
  const routerSelection = await selectModelForTask(taskNode, {
    userId: state.userId,
    complexityScore: taskNode.complexityScore || 40,
    prompt: taskNode.description || state.prompt
  });

  const effectiveModel = routerSelection.hasCompatibleModel ? routerSelection.modelIdentifier : (taskNode.model || agentInfo.model);
  const effectiveProvider = routerSelection.hasCompatibleModel ? routerSelection.provider : (taskNode.provider || agentInfo.provider);

  taskNode.model = effectiveModel;
  taskNode.provider = effectiveProvider;
  taskNode.routingScore = routerSelection.routingScore;
  taskNode.selectionReason = routerSelection.rationale;
  taskNode.alternativesConsidered = routerSelection.alternativesConsidered;

  const startedAt = Date.now();
  console.log(`[EXECUTION] Starting task node="${taskNode.name}" (Agent=${agentType}, Model=${effectiveModel}, Provider=${effectiveProvider})`);

  await emitExecutionEvent(executionId, "agent_started", {
    subtaskId,
    nodeId: subtaskId,
    agentId: agentType,
    agentName: agentInfo.name,
    model: effectiveModel,
    provider: effectiveProvider,
    routingScore: routerSelection.routingScore,
    status: "running",
    activitySummary: taskNode.activitySummary || `Executing ${agentInfo.name}...`
  });

  // Pull scoped prerequisite context from SharedMemory
  const memoryContextResult = sharedMemory.getRelevantContext({
    taskId: subtaskId,
    agentType,
    dependencies: taskNode.dependencies || [],
    description: taskNode.description || state.prompt,
    lastSeenVersion: taskNode.lastSeenVersion || 0
  });

  const dependencyContext = memoryContextResult.formattedContext;
  const memoryTelemetry = memoryContextResult.telemetry;

  const subtaskContext = {
    ...taskNode,
    context: dependencyContext,
    description: taskNode.description || state.prompt,
    memoryTelemetry,
    executionId
  };

  try {
    let result = null;
    await assertNotCancelled(executionId);

    switch (agentType) {
      case "search": {
        if (state.userId) {
          await checkAgentLimit(state.userId, "search").catch(() => {});
        }
        const searchStartTime = Date.now();
        let rawSearchResults = null;

        try {
          rawSearchResults = await searchTool.invoke({ query: taskNode.description || state.prompt });
        } catch (searchErr) {
          console.warn("[Search Tool Error]", searchErr.message);
          rawSearchResults = `Search query for "${taskNode.description || state.prompt}" could not be completed via live tool. Using internal knowledge base.`;
        }

        await assertNotCancelled(executionId);

        if (state.userId) {
          await deductCredits(state.userId, "search").catch(() => {});
        }

        const normalized = normalizeSearchResults(rawSearchResults);
        const durationMs = Date.now() - searchStartTime;

        result = {
          agentId: "search",
          subtaskId,
          status: "completed",
          output: normalized.summaryContext,
          searchResults: normalized,
          images: normalized.images,
          metrics: {
            agentId: "search",
            model: "tavily-search",
            provider: "tavily",
            inputTokens: null,
            outputTokens: null,
            totalTokens: null,
            durationMs,
            estimatedCost: 0,
            status: "completed"
          }
        };
        break;
      }

      case "analysis": {
        result = await analysisAgent({ ...state, executionId }, subtaskContext);
        await assertNotCancelled(executionId);
        break;
      }

      case "comparison": {
        result = await comparisonAgent({ ...state, executionId }, subtaskContext);
        await assertNotCancelled(executionId);
        break;
      }

      case "coding": {
        const codingState = await codingAgent({ ...state, prompt: taskNode.description || state.prompt, executionId });
        await assertNotCancelled(executionId);
        result = {
          agentId: "coding",
          subtaskId,
          status: "completed",
          output: codingState.aiResponse,
          artifacts: codingState.artifacts || [],
          metrics: {
            agentId: "coding",
            model: "deepseek/deepseek-chat",
            provider: "openrouter",
            inputTokens: null,
            outputTokens: null,
            totalTokens: null,
            durationMs: Date.now() - startedAt,
            status: "completed"
          }
        };
        break;
      }

      case "pdf": {
        const pdfState = await pdfAgent({ ...state, prompt: taskNode.description || state.prompt, executionId });
        await assertNotCancelled(executionId);
        result = {
          agentId: "pdf",
          subtaskId,
          status: "completed",
          output: pdfState.aiResponse,
          metrics: {
            agentId: "pdf",
            model: MODEL_CONFIG.groq.primary,
            provider: "groq",
            durationMs: Date.now() - startedAt,
            status: "completed"
          }
        };
        break;
      }

      case "ppt": {
        const pptState = await pptAgent({ ...state, prompt: taskNode.description || state.prompt, executionId });
        await assertNotCancelled(executionId);
        result = {
          agentId: "ppt",
          subtaskId,
          status: "completed",
          output: pptState.aiResponse,
          metrics: {
            agentId: "ppt",
            model: MODEL_CONFIG.groq.primary,
            provider: "groq",
            durationMs: Date.now() - startedAt,
            status: "completed"
          }
        };
        break;
      }

      case "vision": {
        const visionState = await visionAgent({ ...state, prompt: taskNode.description || state.prompt, executionId });
        await assertNotCancelled(executionId);
        result = {
          agentId: "vision",
          subtaskId,
          status: "completed",
          output: visionState.aiResponse,
          images: visionState.images || [],
          metrics: {
            agentId: "vision",
            model: "pollinations-ai",
            provider: "pollinations",
            durationMs: Date.now() - startedAt,
            status: "completed"
          }
        };
        break;
      }

      case "pdfRag": {
        const ragState = await pdfRag({ ...state, prompt: taskNode.description || state.prompt, executionId });
        await assertNotCancelled(executionId);
        result = {
          agentId: "pdfRag",
          subtaskId,
          status: "completed",
          output: ragState.aiResponse,
          metrics: {
            agentId: "pdfRag",
            model: MODEL_CONFIG.google.primary,
            provider: "google",
            durationMs: Date.now() - startedAt,
            status: "completed"
          }
        };
        break;
      }

      case "imageAnalyzer": {
        const imgState = await imageAnalyzer({ ...state, prompt: taskNode.description || state.prompt, executionId });
        await assertNotCancelled(executionId);
        result = {
          agentId: "imageAnalyzer",
          subtaskId,
          status: "completed",
          output: imgState.aiResponse,
          metrics: {
            agentId: "imageAnalyzer",
            model: MODEL_CONFIG.google.primary,
            provider: "google",
            durationMs: Date.now() - startedAt,
            status: "completed"
          }
        };
        break;
      }

      case "chat":
      default: {
        const chatRes = await chatAgent({
          ...state,
          prompt: taskNode.description || state.prompt,
          searchResults: state.searchResults,
          executionId
        });
        await assertNotCancelled(executionId);
        result = {
          agentId: "chat",
          subtaskId,
          status: "completed",
          output: chatRes.aiResponse,
          metrics: {
            agentId: "chat",
            model: MODEL_CONFIG.groq.primary,
            provider: "groq",
            durationMs: Date.now() - startedAt,
            status: "completed"
          }
        };
        break;
      }
    }

    await assertNotCancelled(executionId);

    const durationMs = Date.now() - startedAt;
    const finalMetrics = {
      ...(result?.metrics || {}),
      agentId: agentType,
      subtaskId,
      name: agentInfo.name,
      status: result?.status || "completed",
      durationMs: result?.metrics?.durationMs || durationMs
    };

    // Evaluate Trust Score for the executed result
    const trustResult = evaluateTrust(taskNode, result?.output || "", {
      artifacts: result?.artifacts,
      searchResults: result?.searchResults
    });

    console.log(`[EXECUTION] Task node="${taskNode.name}" completed in ${durationMs}ms with Trust=${trustResult.trustScore}/100 (${trustResult.trustClassification})`);

    // Record to SharedMemory
    sharedMemory.recordTaskOutput(subtaskId, result?.output || "", {
      name: agentInfo.name,
      agentId: agentType,
      dependencies: taskNode.dependencies || [],
      metrics: finalMetrics,
      trust: trustResult
    });

    await emitExecutionEvent(executionId, "agent_completed", {
      subtaskId,
      nodeId: subtaskId,
      agentId: agentType,
      agentName: agentInfo.name,
      status: "completed",
      metrics: finalMetrics,
      trust: trustResult,
      memory: memoryTelemetry
    });

    return {
      subtaskId,
      nodeId: subtaskId,
      agentId: agentType,
      name: agentInfo.name,
      status: "completed",
      output: result?.output || "",
      images: result?.images || [],
      artifacts: result?.artifacts || [],
      searchResults: result?.searchResults || null,
      metrics: finalMetrics,
      trust: trustResult,
      memory: memoryTelemetry
    };
  } catch (err) {
    if (err instanceof ResearchCancelledError || err.name === "ResearchCancelledError") {
      throw err;
    }

    console.error(`[Error executing task ${subtaskId}]`, err);

    // Trigger Cortex Continuity seamless failover
    const continuityResult = await executeCortexContinuityFailover({
      taskNode,
      error: err,
      currentModelMeta: { model: taskNode.model || agentInfo.model, provider: taskNode.provider || agentInfo.provider },
      state,
      sharedMemory,
      emitEvent: emitExecutionEvent
    });

    if (continuityResult && continuityResult.status === "completed") {
      console.log(`[CORTEX CONTINUITY SUCCESS] Task "${taskNode.name}" recovered seamlessly from notebook state.`);
      return continuityResult;
    }

    const durationMs = Date.now() - startedAt;

    const failedMetrics = {
      agentId: agentType,
      subtaskId,
      name: agentInfo.name,
      status: "failed",
      error: continuityResult?.error || err.message,
      durationMs
    };

    const trustFailed = {
      trustScore: 10,
      trustClassification: "LOW",
      signals: [{ name: "execution_error", passed: false }]
    };

    await emitExecutionEvent(executionId, "agent_failed", {
      subtaskId,
      nodeId: subtaskId,
      agentId: agentType,
      agentName: agentInfo.name,
      status: "failed",
      error: continuityResult?.error || err.message,
      metrics: failedMetrics,
      trust: trustFailed
    });

    return {
      subtaskId,
      nodeId: subtaskId,
      agentId: agentType,
      name: agentInfo.name,
      status: "failed",
      error: continuityResult?.error || err.message,
      output: continuityResult?.output || null,
      images: [],
      artifacts: [],
      metrics: failedMetrics,
      trust: trustFailed,
      continuity: continuityResult?.continuity || null
    };
  }
};

/**
 * Adaptive Multi-Agent Orchestrator
 * Full pipeline: Task Analyzer -> Recursive Complexity Tree -> Dynamic Agent Selection ->
 * DAG Execution -> Shared Memory -> Trust Evaluation & Escalation -> Final Synthesis.
 */
export const runAdaptiveOrchestration = async (state) => {
  const executionId = state.executionId || `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const startTime = Date.now();

  try {
    await assertNotCancelled(executionId);

    // 1. Initial Task Analysis & Breakdown
    const taskAnalysis = await analyzeTask({
      prompt: state.prompt,
      file: state.file,
      conversationId: state.conversationId,
      userId: state.userId
    });

    await assertNotCancelled(executionId);

    const {
      taskType,
      complexity,
      requiresMultipleAgents,
      executionStrategy,
      scores,
      subtasks,
      selectedAgents,
      analyzerMetrics
    } = taskAnalysis;

    // 2. Initialize Execution Tree & Shared Memory & Cost Tracker
    const tree = new ExecutionTree("root", "User Objective", state.prompt);
    const sharedMemory = new SharedMemory(executionId);
    const costTracker = new CostTracker(executionId);

    // 3. Evaluate Adaptive Response Policy
    const responsePolicy = evaluateResponsePolicy({
      prompt: state.prompt,
      taskComplexity: complexity,
      scores,
      taskType,
      taskAnalysis,
      executionTree: null,
      leafTaskCount: subtasks?.length || 1
    });
    costTracker.setResponsePolicy(responsePolicy);

    // 4. Build & Recursively Decompose Execution Tree
    console.log(`[ORCHESTRATOR] Building hierarchical execution tree for query: "${state.prompt.slice(0, 80)}..."`);
    await recursivelyDecomposeTasks(subtasks, tree, "root", 1, {
      prompt: state.prompt,
      file: state.file,
      userId: state.userId,
      conversationId: state.conversationId
    });

    const leafNodes = tree.getLeafNodes();
    console.log(`[ORCHESTRATOR] Tree generated with ${tree.nodesMap.size - 1} total tasks, ${leafNodes.length} executable leaf nodes, max depth=${tree.getMaxDepth()}.`);

    // Emit live execution tree initialization & response policy event
    await emitExecutionEvent(executionId, "tree_initialized", {
      executionId,
      taskType,
      complexity,
      executionStrategy,
      scores,
      responsePolicy,
      executionTree: tree.toJSON(),
      totalTasks: tree.nodesMap.size - 1,
      leafTasks: leafNodes.length,
      maxDepth: tree.getMaxDepth(),
      workflowStatus: "running"
    });

    await emitExecutionEvent(executionId, "response_policy_evaluated", {
      executionId,
      responsePolicy
    });

    const executedAgentMetrics = [];
    const allImages = [];
    const allArtifacts = [];
    let accumulatedSearchResults = null;

    if (analyzerMetrics && analyzerMetrics.totalTokens > 0) {
      executedAgentMetrics.push({
        agentId: "taskAnalyzer",
        name: "Task Analyzer",
        subtaskId: "task_analyzer",
        status: "completed",
        ...analyzerMetrics
      });
    }

    // 4. Execute Leaf Tasks Respecting Topological Dependencies
    const remainingLeaves = [...leafNodes];
    const completedNodeIds = new Set();

    while (remainingLeaves.length > 0) {
      await assertNotCancelled(executionId);

      // Extract ready batch
      const readyBatch = remainingLeaves.filter(node => {
        if (!node.dependencies || node.dependencies.length === 0) return true;
        return node.dependencies.every(depId => completedNodeIds.has(depId));
      });

      if (readyBatch.length === 0) {
        // Break potential cycle
        const fallback = remainingLeaves.shift();
        readyBatch.push(fallback);
      } else {
        readyBatch.forEach(node => {
          const idx = remainingLeaves.findIndex(r => r.id === node.id);
          if (idx !== -1) remainingLeaves.splice(idx, 1);
        });
      }

      // Execute ready batch in parallel
      const batchPromises = readyBatch.map(node =>
        executeLeafTask(node, state, executionId, sharedMemory)
      );

      const batchResults = await Promise.allSettled(batchPromises);
      await assertNotCancelled(executionId);

      for (let i = 0; i < batchResults.length; i++) {
        const settled = batchResults[i];
        const leafNode = readyBatch[i];

        if (settled.status === "fulfilled") {
          const res = settled.value;
          completedNodeIds.add(res.nodeId);

          // Update tree node state
          tree.updateNode(leafNode.id, {
            status: res.status,
            output: res.output,
            metrics: res.metrics,
            model: leafNode.model || res.metrics?.model,
            provider: leafNode.provider || res.metrics?.provider,
            routingScore: leafNode.routingScore,
            continuity: res.continuity || leafNode.continuity,
            trustScore: res.trust?.trustScore,
            trustClassification: res.trust?.trustClassification,
            trustDetails: res.trust?.details,
            memory: res.memory
          });

          if (res.metrics) executedAgentMetrics.push(res.metrics);
          if (res.images?.length) allImages.push(...res.images);
          if (res.artifacts?.length) allArtifacts.push(...res.artifacts);
          if (res.searchResults) accumulatedSearchResults = res.searchResults;

          // 5. Trust Evaluation & Targeted Escalation
          if (res.trust && res.trust.trustScore < 60) {
            console.log(`[ORCHESTRATOR] Leaf task "${leafNode.name}" produced LOW TRUST (${res.trust.trustScore}). Triggering escalation...`);

            await emitExecutionEvent(executionId, "node_escalation_started", {
              nodeId: leafNode.id,
              subtaskId: leafNode.id,
              agentId: leafNode.selectedAgent,
              trustScore: res.trust.trustScore,
              status: "escalating"
            });

            const escalationResult = await handleTaskEscalation(leafNode, executeLeafTask, state, sharedMemory, costTracker);

            if (escalationResult.escalated) {
              await emitExecutionEvent(executionId, "node_escalation_completed", {
                nodeId: leafNode.id,
                subtaskId: leafNode.id,
                agentId: escalationResult.strongerAgent,
                newTrustScore: escalationResult.newTrustScore,
                status: "completed"
              });
            }
          }
        } else {
          completedNodeIds.add(leafNode.id);
          tree.updateNode(leafNode.id, {
            status: "failed",
            trustScore: 0,
            trustClassification: "LOW"
          });
        }
      }
    }

    // 6. Synthesis Stage
    await assertNotCancelled(executionId);

    await emitExecutionEvent(executionId, "agent_started", {
      subtaskId: "synthesis_stage",
      agentId: "synthesizer",
      agentName: "Synthesis & Report Agent",
      status: "running",
      activitySummary: `Synthesizing ${responsePolicy.depth} response...`
    });

    const allOutputs = sharedMemory.getAllOutputs();
    const synthesisResult = await synthesizeMultiAgentResults({
      userPrompt: state.prompt,
      agentOutputs: allOutputs.map(o => ({
        output: o.output,
        name: o.metadata?.name || o.taskId,
        agentId: o.metadata?.agentId,
        status: "completed"
      })),
      searchResults: accumulatedSearchResults,
      taskAnalysis,
      responsePolicy,
      conversationId: state.conversationId,
      userId: state.userId,
      executionId
    });

    await assertNotCancelled(executionId);

    if (synthesisResult.metrics) {
      executedAgentMetrics.push({
        agentId: "synthesizer",
        name: "Synthesis & Report Agent",
        subtaskId: "synthesis_stage",
        status: "completed",
        ...synthesisResult.metrics
      });
    }

    await emitExecutionEvent(executionId, "agent_completed", {
      subtaskId: "synthesis_stage",
      agentId: "synthesizer",
      agentName: "Synthesis & Report Agent",
      status: "completed",
      metrics: synthesisResult.metrics
    });

    // 7. Response Validation & Targeted Semantic Compression
    await assertNotCancelled(executionId);
    const validationResult = await validateAndRefineResponse({
      rawResponse: synthesisResult.output,
      responsePolicy,
      prompt: state.prompt,
      conversationId: state.conversationId,
      userId: state.userId
    });

    const finalAnswer = validationResult.output;
    responsePolicy.actualTokens = validationResult.finalTokens;
    responsePolicy.compressionTriggered = validationResult.compressionTriggered;
    responsePolicy.originalTokens = validationResult.originalTokens;
    responsePolicy.finalTokens = validationResult.finalTokens;

    if (validationResult.metrics) {
      executedAgentMetrics.push({
        agentId: "response_validator",
        name: "Response Validator & Compression Agent",
        subtaskId: "validation_stage",
        status: "completed",
        ...validationResult.metrics
      });
    }

    const totalDurationMs = Date.now() - startTime;
    const treeSummary = tree.getMetricsSummary();
    const sharedMemorySummary = sharedMemory.getTelemetrySummary();

    const metricsSummary = {
      ...aggregateWorkflowMetrics(executedAgentMetrics),
      ...treeSummary,
      responsePolicy,
      sharedMemorySummary,
      totalDurationMs
    };

    const workflowResponse = {
      executionId,
      taskType,
      complexity,
      executionStrategy,
      scores,
      responsePolicy,
      sharedMemorySummary,
      selectedAgents,
      totalTasks: treeSummary.totalTasks,
      leafTasks: treeSummary.leafTasks,
      maxDepth: treeSummary.maxDepth,
      escalations: treeSummary.escalations,
      averageTrust: treeSummary.averageTrust,
      executionTree: tree.toJSON(),
      subtasks: leafNodes.map(node => ({
        id: node.id,
        name: node.name,
        description: node.description,
        agentType: node.selectedAgent || node.agentType,
        dependencies: node.dependencies,
        complexityScore: node.complexityScore,
        classification: node.classification,
        selectedAgent: node.selectedAgent,
        model: node.model,
        provider: node.provider,
        routingScore: node.routingScore,
        selectionReason: node.selectionReason,
        status: node.status,
        metrics: node.metrics,
        trustScore: node.trustScore,
        trustClassification: node.trustClassification,
        escalated: node.escalated,
        continuity: node.continuity,
        switches: node.switches,
        memory: node.memory
      }))
    };

    await emitExecutionEvent(executionId, "workflow_completed", {
      executionId,
      workflowStatus: "completed",
      metrics: metricsSummary,
      responsePolicy,
      sharedMemorySummary,
      executionTree: workflowResponse.executionTree,
      totalDurationMs
    });

    // Save Execution to MongoDB
    Execution.create({
      executionId,
      userId: state.userId || "anonymous",
      conversationId: state.conversationId,
      prompt: state.prompt,
      taskType,
      complexity,
      responsePolicy,
      sharedMemorySummary,
      executionStrategy,
      scores,
      selectedAgents,
      subtasks: workflowResponse.subtasks,
      agentExecutions: executedAgentMetrics,
      totalTokens: metricsSummary.totalTokens,
      totalDurationMs,
      estimatedCost: metricsSummary.estimatedCost,
      actualCost: metricsSummary.actualCost,
      totalTasks: treeSummary.totalTasks,
      leafTasks: treeSummary.leafTasks,
      maxDepth: treeSummary.maxDepth,
      escalations: treeSummary.escalations,
      averageTrust: treeSummary.averageTrust,
      executionTree: workflowResponse.executionTree,
      success: true,
      finalAnswer
    }).catch(err => console.error("[MongoDB Execution Save Error]", err));

    cleanupCancellation(executionId);

    return {
      ...state,
      executionId,
      aiResponse: finalAnswer,
      images: allImages,
      artifacts: allArtifacts,
      searchResults: accumulatedSearchResults,
      taskAnalysis,
      responsePolicy,
      sharedMemorySummary,
      workflow: workflowResponse,
      executionTree: workflowResponse.executionTree,
      metrics: metricsSummary
    };
  } catch (error) {
    if (error instanceof ResearchCancelledError || error.name === "ResearchCancelledError") {
      console.log(`[Orchestrator] Execution ${executionId} aborted via user cancellation.`);

      await emitExecutionEvent(executionId, "workflow_cancelled", {
        executionId,
        workflowStatus: "cancelled",
        totalDurationMs: Date.now() - startTime
      });

      Execution.create({
        executionId,
        userId: state.userId || "anonymous",
        conversationId: state.conversationId,
        prompt: state.prompt,
        taskType: "cancelled",
        complexity: "low",
        executionStrategy: "cancelled",
        scores: {},
        selectedAgents: [],
        subtasks: [],
        agentExecutions: [],
        totalTokens: 0,
        totalDurationMs: Date.now() - startTime,
        estimatedCost: 0,
        success: false,
        finalAnswer: "Research was stopped by user."
      }).catch(() => {});

      cleanupCancellation(executionId);

      return {
        ...state,
        executionId,
        status: "cancelled",
        aiResponse: "Research was stopped by user.",
        workflow: {
          executionId,
          taskType: "cancelled",
          complexity: "low",
          executionStrategy: "cancelled",
          workflowStatus: "cancelled",
          subtasks: []
        },
        metrics: {
          totalAgents: 0,
          completedAgents: 0,
          totalTokens: null,
          totalDurationMs: Date.now() - startTime,
          estimatedCost: null
        }
      };
    }

    console.error("[runAdaptiveOrchestration fatal error]", error);

    const fallbackChat = await chatAgent(state);
    return {
      ...state,
      executionId,
      aiResponse: fallbackChat.aiResponse,
      workflow: {
        executionId,
        taskType: "fallback",
        complexity: "low",
        executionStrategy: "single",
        subtasks: []
      },
      metrics: {
        totalAgents: 1,
        completedAgents: 1,
        totalTokens: null,
        totalDurationMs: Date.now() - startTime,
        estimatedCost: null
      }
    };
  }
};
