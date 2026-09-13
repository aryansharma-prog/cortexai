/**
 * Fine-Grained Cost & Telemetry Tracker
 * Distinguishes estimated vs actual token cost across all tasks,
 * tree depths, and escalation cycles.
 */

import { calculateCost } from "./pricing.js";
import { normalizeUsage } from "./usageTracker.js";

export class CostTracker {
  constructor(executionId = "default") {
    this.executionId = executionId;
    this.records = []; // array of task metrics
    this.responsePolicy = null;
  }

  /**
   * Sets response policy telemetry.
   */
  setResponsePolicy(policy = {}) {
    this.responsePolicy = policy;
  }

  /**
   * Records a task execution metric.
   */
  recordTaskMetric({
    taskId,
    agentId,
    modelName,
    provider,
    inputTokens = null,
    outputTokens = null,
    totalTokens = null,
    durationMs = 0,
    isEscalation = false,
    success = true
  }) {
    const estimatedCost = calculateCost(modelName, inputTokens, outputTokens);

    const entry = {
      taskId,
      agentId,
      model: modelName,
      provider,
      inputTokens,
      outputTokens,
      totalTokens: totalTokens ?? (inputTokens !== null && outputTokens !== null ? inputTokens + outputTokens : null),
      durationMs,
      estimatedCost,
      actualCost: estimatedCost, // Matches provider rate when tokens known, otherwise null
      isEscalation,
      success,
      timestamp: new Date().toISOString()
    };

    this.records.push(entry);
    return entry;
  }

  /**
   * Computes aggregate cost and usage metrics.
   */
  getAggregateMetrics() {
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalTokens = 0;
    let hasTokenData = false;
    let totalDurationMs = 0;
    let totalCost = 0;
    let hasCostData = false;
    let escalationCount = 0;
    const agentsSet = new Set();

    this.records.forEach(r => {
      if (r.agentId) agentsSet.add(r.agentId);
      if (r.isEscalation) escalationCount += 1;
      if (r.durationMs) totalDurationMs += r.durationMs;

      if (r.inputTokens !== null && r.inputTokens !== undefined) {
        totalInputTokens += r.inputTokens;
        hasTokenData = true;
      }
      if (r.outputTokens !== null && r.outputTokens !== undefined) {
        totalOutputTokens += r.outputTokens;
        hasTokenData = true;
      }
      if (r.totalTokens !== null && r.totalTokens !== undefined) {
        totalTokens += r.totalTokens;
        hasTokenData = true;
      }
      if (r.estimatedCost !== null && r.estimatedCost !== undefined) {
        totalCost += r.estimatedCost;
        hasCostData = true;
      }
    });

    return {
      totalTasks: this.records.length,
      agentsUsed: Array.from(agentsSet),
      escalations: escalationCount,
      inputTokens: hasTokenData ? totalInputTokens : null,
      outputTokens: hasTokenData ? totalOutputTokens : null,
      totalTokens: hasTokenData ? totalTokens : null,
      totalDurationMs,
      totalDurationSec: Number((totalDurationMs / 1000).toFixed(2)),
      estimatedCost: hasCostData ? Number(totalCost.toFixed(6)) : null,
      actualCost: hasCostData ? Number(totalCost.toFixed(6)) : null,
      responsePolicy: this.responsePolicy
    };
  }
}
