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

/**
 * Publishes real-time execution event to Redis and updates active state.
 */
export const emitExecutionEvent = async (executionId, eventType, data = {}) => {
  if (!executionId) return;

  // If already cancelled, do not emit further progress events except workflow_cancelled
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

    if (data.agentId || data.subtaskId) {
      const key = data.subtaskId || data.agentId;
      state.agentStatuses = state.agentStatuses || {};
      state.agentStatuses[key] = {
        ...(state.agentStatuses[key] || {}),
        ...data,
        updatedAt: new Date().toISOString()
      };
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
 * Dispatches a single subtask to its mapped agent implementation with cancellation checks.
 */
const executeSubtask = async (subtask, state, executionId, accumulatedOutputs) => {
  // Pre-check cancellation
  await assertNotCancelled(executionId);

  const { id: subtaskId, agentType, name, description, activitySummary } = subtask;
  const agentInfo = getAgentById(agentType) || { name: name || agentType, id: agentType };

  const startedAt = Date.now();

  await emitExecutionEvent(executionId, "agent_started", {
    subtaskId,
    agentId: agentType,
    agentName: agentInfo.name,
    status: "running",
    activitySummary: activitySummary || `Executing ${agentInfo.name}...`
  });

  // Prepare dependency context from completed prior subtasks
  let dependencyContext = "";
  if (Array.isArray(subtask.dependencies) && subtask.dependencies.length > 0) {
    dependencyContext = subtask.dependencies
      .map(depId => {
        const depResult = accumulatedOutputs[depId];
        if (depResult && depResult.output) {
          return `### Context from ${depResult.name || depId}:\n${depResult.output}`;
        }
        return null;
      })
      .filter(Boolean)
      .join("\n\n");
  }

  const subtaskContext = {
    ...subtask,
    context: dependencyContext,
    description: description || state.prompt,
    executionId
  };

  try {
    let result = null;

    // Check cancellation immediately before executing agent
    await assertNotCancelled(executionId);

    switch (agentType) {
      case "search": {
        if (state.userId) {
          await checkAgentLimit(state.userId, "search").catch(() => {});
        }
        const searchStartTime = Date.now();
        let rawSearchResults = null;

        try {
          rawSearchResults = await searchTool.invoke({ query: description || state.prompt });
        } catch (searchErr) {
          console.warn("[Search Tool Error]", searchErr.message);
          rawSearchResults = `Search query for "${description || state.prompt}" could not be completed via live tool. Using internal knowledge base.`;
        }

        // Post-check cancellation (handles race condition where user clicked Stop while search was pending)
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
        const codingState = await codingAgent({ ...state, prompt: description || state.prompt, executionId });
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
        const pdfState = await pdfAgent({ ...state, prompt: description || state.prompt, executionId });
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
        const pptState = await pptAgent({ ...state, prompt: description || state.prompt, executionId });
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
        const visionState = await visionAgent({ ...state, prompt: description || state.prompt, executionId });
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
        const ragState = await pdfRag({ ...state, prompt: description || state.prompt, executionId });
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
        const imgState = await imageAnalyzer({ ...state, prompt: description || state.prompt, executionId });
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
          prompt: description || state.prompt,
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

    await emitExecutionEvent(executionId, "agent_completed", {
      subtaskId,
      agentId: agentType,
      agentName: agentInfo.name,
      status: "completed",
      metrics: finalMetrics
    });

    return {
      subtaskId,
      agentId: agentType,
      name: agentInfo.name,
      status: "completed",
      output: result?.output || "",
      images: result?.images || [],
      artifacts: result?.artifacts || [],
      searchResults: result?.searchResults || null,
      metrics: finalMetrics
    };
  } catch (err) {
    if (err instanceof ResearchCancelledError || err.name === "ResearchCancelledError") {
      throw err;
    }

    console.error(`[Error executing subtask ${subtaskId}]`, err);
    const durationMs = Date.now() - startedAt;

    const failedMetrics = {
      agentId: agentType,
      subtaskId,
      name: agentInfo.name,
      status: "failed",
      error: err.message,
      durationMs
    };

    await emitExecutionEvent(executionId, "agent_failed", {
      subtaskId,
      agentId: agentType,
      agentName: agentInfo.name,
      status: "failed",
      error: err.message,
      metrics: failedMetrics
    });

    return {
      subtaskId,
      agentId: agentType,
      name: agentInfo.name,
      status: "failed",
      error: err.message,
      output: null,
      images: [],
      artifacts: [],
      metrics: failedMetrics
    };
  }
};

/**
 * Adaptive Multi-Agent Orchestrator
 * Main intelligence layer for dynamic workflow resolution, DAG execution,
 * telemetry tracking, and final synthesis.
 */
export const runAdaptiveOrchestration = async (state) => {
  const executionId = state.executionId || `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const startTime = Date.now();

  try {
    // 0. Pre-execution cancellation check
    await assertNotCancelled(executionId);

    // 1. Analyze task complexity, decomposability, and dependencies
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

    // 2. Initialize live execution state
    await emitExecutionEvent(executionId, "workflow_started", {
      executionId,
      taskType,
      complexity,
      executionStrategy,
      scores,
      subtasks,
      selectedAgents,
      workflowStatus: "running"
    });

    const accumulatedOutputs = {};
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

    // 3. Execution based on strategy
    if (!requiresMultipleAgents || subtasks.length === 1) {
      // --- Single Agent Fast Path ---
      const singleSubtask = subtasks[0] || {
        id: "main_task",
        agentType: "chat",
        name: "Reasoning Agent",
        description: state.prompt
      };

      const result = await executeSubtask(singleSubtask, state, executionId, accumulatedOutputs);
      await assertNotCancelled(executionId);

      accumulatedOutputs[result.subtaskId] = result;
      if (result.metrics) executedAgentMetrics.push(result.metrics);
      if (result.images?.length) allImages.push(...result.images);
      if (result.artifacts?.length) allArtifacts.push(...result.artifacts);
      if (result.searchResults) accumulatedSearchResults = result.searchResults;

      const totalDurationMs = Date.now() - startTime;
      const metricsSummary = aggregateWorkflowMetrics(executedAgentMetrics);

      const workflowResponse = {
        executionId,
        taskType,
        complexity,
        executionStrategy: "single",
        scores,
        selectedAgents,
        subtasks: [
          {
            ...singleSubtask,
            status: result.status,
            metrics: result.metrics
          }
        ]
      };

      await emitExecutionEvent(executionId, "workflow_completed", {
        executionId,
        workflowStatus: "completed",
        metrics: metricsSummary,
        totalDurationMs
      });

      Execution.create({
        executionId,
        userId: state.userId || "anonymous",
        conversationId: state.conversationId,
        prompt: state.prompt,
        taskType,
        complexity,
        executionStrategy: "single",
        scores,
        selectedAgents,
        subtasks: workflowResponse.subtasks,
        agentExecutions: executedAgentMetrics,
        totalTokens: metricsSummary.totalTokens,
        totalDurationMs,
        estimatedCost: metricsSummary.estimatedCost,
        success: result.status === "completed",
        finalAnswer: result.output
      }).catch(err => console.error("[MongoDB Execution Save Error]", err));

      cleanupCancellation(executionId);

      return {
        ...state,
        executionId,
        aiResponse: result.output,
        images: allImages,
        artifacts: allArtifacts,
        searchResults: accumulatedSearchResults,
        taskAnalysis,
        workflow: workflowResponse,
        metrics: metricsSummary
      };
    }

    // --- Multi-Agent Execution (Parallel / Sequential / Hybrid DAG) ---
    const remainingSubtasks = [...subtasks];
    const completedSubtaskIds = new Set();

    while (remainingSubtasks.length > 0) {
      await assertNotCancelled(executionId);

      // Find subtasks whose dependencies are all completed
      const readyBatch = remainingSubtasks.filter(st => {
        if (!st.dependencies || st.dependencies.length === 0) return true;
        return st.dependencies.every(depId => completedSubtaskIds.has(depId));
      });

      if (readyBatch.length === 0) {
        // Break potential circular dependency
        const fallbackSubtask = remainingSubtasks.shift();
        readyBatch.push(fallbackSubtask);
      } else {
        readyBatch.forEach(st => {
          const idx = remainingSubtasks.findIndex(r => r.id === st.id);
          if (idx !== -1) remainingSubtasks.splice(idx, 1);
        });
      }

      // Execute ready batch in parallel
      const batchPromises = readyBatch.map(st =>
        executeSubtask(st, state, executionId, accumulatedOutputs)
      );

      const batchResults = await Promise.allSettled(batchPromises);

      // Check cancellation immediately after batch resolves
      await assertNotCancelled(executionId);

      batchResults.forEach((settledRes, index) => {
        const subtaskMeta = readyBatch[index];
        if (settledRes.status === "fulfilled") {
          const res = settledRes.value;
          accumulatedOutputs[res.subtaskId] = res;
          completedSubtaskIds.add(res.subtaskId);
          if (res.metrics) executedAgentMetrics.push(res.metrics);
          if (res.images?.length) allImages.push(...res.images);
          if (res.artifacts?.length) allArtifacts.push(...res.artifacts);
          if (res.searchResults) accumulatedSearchResults = res.searchResults;
        } else {
          completedSubtaskIds.add(subtaskMeta.id);
          const errorMetrics = {
            agentId: subtaskMeta.agentType,
            subtaskId: subtaskMeta.id,
            name: subtaskMeta.name,
            status: "failed",
            error: settledRes.reason?.message || "Subtask promise rejected",
            durationMs: 0
          };
          executedAgentMetrics.push(errorMetrics);
        }
      });
    }

    // 4. Final Synthesis of multi-agent findings
    await assertNotCancelled(executionId);

    await emitExecutionEvent(executionId, "agent_started", {
      subtaskId: "synthesis_stage",
      agentId: "synthesizer",
      agentName: "Synthesis & Report Agent",
      status: "running",
      activitySummary: "Synthesizing comprehensive executive report..."
    });

    const agentOutputsList = Object.values(accumulatedOutputs);
    const synthesisResult = await synthesizeMultiAgentResults({
      userPrompt: state.prompt,
      agentOutputs: agentOutputsList,
      searchResults: accumulatedSearchResults,
      taskAnalysis,
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

    const totalDurationMs = Date.now() - startTime;
    const metricsSummary = aggregateWorkflowMetrics(executedAgentMetrics);

    const workflowResponse = {
      executionId,
      taskType,
      complexity,
      executionStrategy,
      scores,
      selectedAgents,
      subtasks: subtasks.map(st => {
        const out = accumulatedOutputs[st.id];
        return {
          ...st,
          status: out?.status || "completed",
          metrics: out?.metrics || null
        };
      })
    };

    await emitExecutionEvent(executionId, "workflow_completed", {
      executionId,
      workflowStatus: "completed",
      metrics: metricsSummary,
      totalDurationMs
    });

    Execution.create({
      executionId,
      userId: state.userId || "anonymous",
      conversationId: state.conversationId,
      prompt: state.prompt,
      taskType,
      complexity,
      executionStrategy,
      scores,
      selectedAgents,
      subtasks: workflowResponse.subtasks,
      agentExecutions: executedAgentMetrics,
      totalTokens: metricsSummary.totalTokens,
      totalDurationMs,
      estimatedCost: metricsSummary.estimatedCost,
      success: true,
      finalAnswer: synthesisResult.output
    }).catch(err => console.error("[MongoDB Execution Save Error]", err));

    cleanupCancellation(executionId);

    return {
      ...state,
      executionId,
      aiResponse: synthesisResult.output,
      images: allImages,
      artifacts: allArtifacts,
      searchResults: accumulatedSearchResults,
      taskAnalysis,
      workflow: workflowResponse,
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
