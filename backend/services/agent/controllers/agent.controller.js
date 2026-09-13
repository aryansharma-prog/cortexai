import axios from "axios";
import { graph } from "../graph/graph.js";
import { addMessage } from "../config/memory.js";
import redis from "../../../shared/redis/redis.js";
import Execution from "../models/execution.model.js";
import {
  cancelExecution,
  isExecutionCancelled,
  ResearchCancelledError
} from "../orchestration/cancellationManager.js";

/**
 * Main chat / research execution endpoint
 * POST /api/agent/chat
 */
export const agent = async (req, res, next) => {
  const executionId = req.body.executionId || `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  try {
    const { prompt, conversationId, agent: selectedAgent } = req.body;
    const file = req.file;
    const userId = req.headers["x-user-id"] || "anonymous";

    console.log(`[AGENT] Request received: agent=${selectedAgent || "auto"}, userId=${userId}, executionId=${executionId}`);

    const hasValidConv = conversationId && conversationId !== "undefined" && conversationId !== "null" && conversationId.trim() !== "";

    if (hasValidConv) {
      await axios.post(`${process.env.CHAT_SERVICE}/save-message`, {
        conversationId,
        role: "user",
        content: prompt
      }).catch(err => console.warn("[Chat Service save user msg error]", err.message));
    }

    const result = await graph.invoke({
      prompt,
      conversationId: hasValidConv ? conversationId : null,
      agent: selectedAgent || "auto",
      userId,
      file,
      executionId
    });

    console.log(`[AGENT] Graph execution finished successfully for ${executionId}`);

    const wasCancelled = (result?.status === "cancelled") || (await isExecutionCancelled(executionId));

    if (wasCancelled) {
      return res.status(200).json({
        status: "cancelled",
        answer: "Research was stopped by user.",
        executionId,
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
          totalDurationMs: 0,
          estimatedCost: null
        },
        images: [],
        artifacts: []
      });
    }

    if (hasValidConv) {
      await addMessage(conversationId, "user", prompt).catch(() => {});
      await addMessage(conversationId, "assistant", result?.aiResponse || "").catch(() => {});
      await axios.post(`${process.env.CHAT_SERVICE}/save-message`, {
        conversationId,
        role: "assistant",
        content: result?.aiResponse,
        images: result?.images,
        artifacts: result?.artifacts
      }).catch(err => console.warn("[Chat Service save assistant msg error]", err.message));
    }

    return res.status(200).json({
      status: "completed",
      answer: result?.aiResponse || "",
      executionId: result?.executionId || executionId,
      workflow: result?.workflow || {
        executionId,
        taskType: "general",
        complexity: "low",
        executionStrategy: "single",
        subtasks: []
      },
      executionTree: result?.executionTree || result?.workflow?.executionTree || null,
      metrics: result?.metrics || {
        totalAgents: 1,
        completedAgents: 1,
        totalTokens: null,
        totalDurationMs: 0,
        estimatedCost: null
      },
      images: result?.images || [],
      artifacts: result?.artifacts || []
    });
  } catch (error) {
    if (error instanceof ResearchCancelledError || error.name === "ResearchCancelledError") {
      console.log(`[Agent Controller] Gracefully returning cancelled status for ${executionId}`);
      return res.status(200).json({
        status: "cancelled",
        answer: "Research was stopped by user.",
        executionId,
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
          totalDurationMs: 0,
          estimatedCost: null
        },
        images: [],
        artifacts: []
      });
    }

    // Rate-limit user-friendly error formatting
    if (error.message?.includes("429") || error.status === 429) {
      return res.status(429).json({
        message: "Research is temporarily rate-limited. Please retry in a few seconds."
      });
    }

    next(error);
  }
};

/**
 * Cancel an active research execution (Invoked when user clicks [ Stop ])
 * POST /api/agent/executions/:executionId/cancel OR POST /api/agent/cancel
 */
export const cancelExecutionHandler = async (req, res) => {
  try {
    const executionId = req.params.executionId || req.body.executionId;
    if (!executionId) {
      return res.status(400).json({ message: "executionId is required" });
    }

    await cancelExecution(executionId);
    return res.status(200).json({
      success: true,
      status: "cancelled",
      executionId,
      message: "Research task cancellation initiated."
    });
  } catch (error) {
    console.error("[Cancel Execution Error]", error);
    return res.status(500).json({ message: "Failed to cancel execution." });
  }
};

/**
 * Get workflow execution status and details
 * GET /api/agent/executions/:executionId
 */
export const getExecution = async (req, res, next) => {
  try {
    const { executionId } = req.params;
    const userId = req.headers["x-user-id"];

    // 1. Check Redis for active/recent execution state
    const cached = await redis.get(`execution:${executionId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      return res.status(200).json(parsed);
    }

    // 2. Fall back to MongoDB for persistent execution history
    const query = { executionId };
    if (userId && userId !== "anonymous") {
      query.userId = userId;
    }

    const record = await Execution.findOne(query);
    if (!record) {
      return res.status(404).json({ message: "Execution record not found" });
    }

    return res.status(200).json(record);
  } catch (error) {
    next(error);
  }
};

/**
 * List past task executions with status, strategy, and telemetry
 * GET /api/agent/executions
 */
export const listExecutions = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const query = {};
    if (userId && userId !== "anonymous") {
      query.userId = userId;
    }

    const records = await Execution.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("executionId prompt taskType complexity executionStrategy scores totalTokens totalDurationMs estimatedCost agentExecutions sharedMemorySummary responsePolicy executionTree success createdAt");

    return res.status(200).json(records);
  } catch (error) {
    next(error);
  }
};


/**
 * Get execution token, latency, and cost metrics
 * GET /api/agent/executions/:executionId/metrics
 */
export const getExecutionMetrics = async (req, res, next) => {
  try {
    const { executionId } = req.params;
    const userId = req.headers["x-user-id"];

    const query = { executionId };
    if (userId && userId !== "anonymous") {
      query.userId = userId;
    }

    const record = await Execution.findOne(query);
    if (!record) {
      const cached = await redis.get(`execution:${executionId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        return res.status(200).json({
          executionId,
          metrics: parsed.metrics || {},
          agentStatuses: parsed.agentStatuses || {}
        });
      }
      return res.status(404).json({ message: "Execution metrics not found" });
    }

    return res.status(200).json({
      executionId: record.executionId,
      taskType: record.taskType,
      complexity: record.complexity,
      executionStrategy: record.executionStrategy,
      scores: record.scores,
      totalTokens: record.totalTokens,
      totalDurationMs: record.totalDurationMs,
      estimatedCost: record.estimatedCost,
      agentExecutions: record.agentExecutions,
      success: record.success
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Real-time Server-Sent Events (SSE) stream for live agent execution progress
 * GET /api/agent/executions/:executionId/stream
 */
export const streamExecution = async (req, res) => {
  const { executionId } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  res.write(`data: ${JSON.stringify({ type: "stream_connected", executionId })}\n\n`);

  try {
    const cached = await redis.get(`execution:${executionId}`);
    if (cached) {
      res.write(`data: ${JSON.stringify({ type: "state_snapshot", state: JSON.parse(cached) })}\n\n`);
    }
  } catch (e) {
    console.error("[SSE snapshot read error]", e);
  }

  const subRedis = redis.duplicate();
  const channelKey = `execution_events:${executionId}`;

  try {
    await subRedis.subscribe(channelKey);

    subRedis.on("message", (channel, message) => {
      if (channel === channelKey) {
        res.write(`data: ${message}\n\n`);
        try {
          const parsed = JSON.parse(message);
          if (
            parsed.type === "workflow_completed" ||
            parsed.type === "workflow_failed" ||
            parsed.type === "workflow_cancelled"
          ) {
            setTimeout(() => {
              subRedis.unsubscribe(channelKey).catch(() => {});
              subRedis.quit().catch(() => {});
              res.end();
            }, 500);
          }
        } catch (err) {}
      }
    });
  } catch (subErr) {
    console.error("[SSE redis subscribe error]", subErr);
  }

  req.on("close", () => {
    subRedis.unsubscribe(channelKey).catch(() => {});
    subRedis.quit().catch(() => {});
    res.end();
  });
};

/**
 * Aggregated analytics for research paper experiments:
 * Single Agent vs Fixed Multi-Agent vs Adaptive Multi-Agent
 * GET /api/agent/research/analytics
 */
export const getResearchAnalytics = async (req, res, next) => {
  try {
    const totalCount = await Execution.countDocuments();

    // 1. Calculate aggregated real token efficiency metrics across all runs
    const tokenEfficiencyStats = await Execution.aggregate([
      {
        $group: {
          _id: null,
          totalExecutions: { $sum: 1 },
          totalTokensUsed: { $sum: { $ifNull: ["$totalTokens", 0] } },
          totalTokensSaved: { $sum: { $ifNull: ["$sharedMemorySummary.tokensSavedEstimate", 0] } },
          totalFullContextRequested: { $sum: { $ifNull: ["$sharedMemorySummary.fullContextTokensEstimate", 0] } },
          totalSelectedTokensDelivered: { $sum: { $ifNull: ["$sharedMemorySummary.selectedContextTokens", 0] } },
          totalCompressionSaved: {
            $sum: {
              $cond: [
                { $and: ["$responsePolicy.compressionTriggered", { $gt: ["$responsePolicy.originalTokens", "$responsePolicy.finalTokens"] }] },
                { $subtract: ["$responsePolicy.originalTokens", "$responsePolicy.finalTokens"] },
                0
              ]
            }
          },
          avgDurationMs: { $avg: "$totalDurationMs" }
        }
      }
    ]);

    const efficiency = tokenEfficiencyStats[0] || {
      totalExecutions: totalCount,
      totalTokensUsed: 0,
      totalTokensSaved: 0,
      totalFullContextRequested: 0,
      totalSelectedTokensDelivered: 0,
      totalCompressionSaved: 0,
      avgDurationMs: 0
    };

    // Calculate aggregated context reduction percentage
    const combinedFullContext = efficiency.totalFullContextRequested > 0
      ? efficiency.totalFullContextRequested
      : (efficiency.totalTokensUsed + efficiency.totalTokensSaved);

    const aggregateReductionPercent = combinedFullContext > 0
      ? Number(((efficiency.totalTokensSaved / combinedFullContext) * 100).toFixed(1))
      : 0;

    const strategyStats = await Execution.aggregate([
      {
        $group: {
          _id: "$executionStrategy",
          count: { $sum: 1 },
          avgTokens: { $avg: "$totalTokens" },
          avgDurationMs: { $avg: "$totalDurationMs" },
          avgCost: { $avg: "$estimatedCost" },
          successCount: { $sum: { $cond: ["$success", 1, 0] } }
        }
      }
    ]);

    const complexityStats = await Execution.aggregate([
      {
        $group: {
          _id: "$complexity",
          count: { $sum: 1 },
          avgTokens: { $avg: "$totalTokens" },
          avgDurationMs: { $avg: "$totalDurationMs" }
        }
      }
    ]);

    const taskTypeStats = await Execution.aggregate([
      {
        $group: {
          _id: "$taskType",
          count: { $sum: 1 },
          avgTokens: { $avg: "$totalTokens" },
          avgDurationMs: { $avg: "$totalDurationMs" }
        }
      }
    ]);

    const recentExecutions = await Execution.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .select("executionId taskType complexity executionStrategy scores totalTokens totalDurationMs sharedMemorySummary responsePolicy success createdAt");

    return res.status(200).json({
      summary: {
        totalExecutions: totalCount,
        tokensSaved: efficiency.totalTokensSaved,
        contextReductionPercent: aggregateReductionPercent,
        fullContextTokens: combinedFullContext,
        deliveredContextTokens: efficiency.totalSelectedTokensDelivered || efficiency.totalTokensUsed,
        compressionTokensSaved: efficiency.totalCompressionSaved,
        avgDurationMs: Math.round(efficiency.avgDurationMs || 0)
      },
      tokenEfficiency: {
        tokensSaved: efficiency.totalTokensSaved,
        contextReductionPercent: aggregateReductionPercent,
        totalExecutions: totalCount,
        fullContextEstimate: combinedFullContext,
        cortexContext: efficiency.totalSelectedTokensDelivered || efficiency.totalTokensUsed,
        mechanisms: {
          sharedMemory: {
            name: "Shared Incremental Memory",
            description: "Eliminates redundant agent context retransmission by sharing delta memory states.",
            tokensSaved: efficiency.totalTokensSaved,
            active: true
          },
          selectiveContext: {
            name: "Selective Context Scoping",
            description: "Delivers only strictly required dependency outputs rather than full chat history.",
            active: true
          },
          adaptiveRouting: {
            name: "Adaptive Agent Routing",
            description: "Routes subtasks to lightweight capable models (e.g. Llama 3 8B) for lower footprint.",
            active: true
          },
          responseOptimization: {
            name: "Response Policy Engine",
            description: "Dynamically constrains token budgets and applies semantic compression for concise answers.",
            tokensSaved: efficiency.totalCompressionSaved,
            active: true
          }
        }
      },
      strategyBreakdown: strategyStats,
      complexityBreakdown: complexityStats,
      taskTypeBreakdown: taskTypeStats,
      recentExecutions
    });
  } catch (error) {
    next(error);
  }
};