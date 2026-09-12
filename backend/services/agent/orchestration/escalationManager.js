/**
 * Escalation Manager
 * Selectively refines or escalates low-trust leaf tasks (trustScore < 60)
 * to a stronger capable agent without regenerating the entire workflow.
 */

import { AGENT_REGISTRY, getAgentById } from "./agentRegistry.js";
import { evaluateTrust } from "./trustEvaluator.js";

const MAX_TASK_ESCALATIONS = 2;

/**
 * Finds a stronger alternative agent capable of fulfilling the task.
 */
export const findStrongerAgent = (currentAgentId, task = {}) => {
  const current = getAgentById(currentAgentId) || { tier: "light", qualityScore: 70 };
  const currentTier = current.tier || "light";

  // Identify candidates with higher qualityScore or stronger tier
  const candidates = AGENT_REGISTRY.filter(a => {
    if (!a.available || a.id === "synthesizer" || a.id === currentAgentId) return false;
    if (currentTier === "light" && (a.tier === "balanced" || a.tier === "heavy")) return true;
    if (currentTier === "balanced" && a.tier === "heavy") return true;
    return a.qualityScore > (current.qualityScore || 75);
  });

  if (candidates.length === 0) {
    // Fallback to primary reasoning or coding agent
    return getAgentById(task.agentType === "coding" ? "coding" : "chat");
  }

  // Sort by quality score descending
  candidates.sort((a, b) => b.qualityScore - a.qualityScore);
  return candidates[0];
};

/**
 * Handles targeted escalation of a low-trust leaf task.
 *
 * @param {Object} leafNode - ExecutionTreeNode with trustScore < 60
 * @param {Function} executeFn - Function to execute the subtask
 * @param {Object} state - Current execution state
 * @param {Object} sharedMemory - Incremental working memory
 * @param {Object} costTracker - Cost tracker instance
 * @returns {Promise<Object>} Refined execution result and updated trust
 */
export const handleTaskEscalation = async (leafNode, executeFn, state, sharedMemory, costTracker) => {
  const currentEscalations = leafNode._escalationCount || 0;

  if (currentEscalations >= MAX_TASK_ESCALATIONS) {
    console.warn(`[ESCALATION] Task="${leafNode.name}" reached max escalation attempts (${MAX_TASK_ESCALATIONS}). Keeping current result.`);
    return {
      escalated: false,
      reason: "Max escalation attempts reached."
    };
  }

  const strongerAgent = findStrongerAgent(leafNode.selectedAgent, leafNode);
  console.log(`[ESCALATION] Task="${leafNode.name}" Trust=${leafNode.trustScore} (< 60). Escalating from ${leafNode.selectedAgent} to ${strongerAgent.id}...`);

  leafNode._escalationCount = currentEscalations + 1;
  leafNode.escalated = true;
  leafNode.status = "running";
  leafNode.selectedAgent = strongerAgent.id;
  leafNode.model = strongerAgent.model;
  leafNode.provider = strongerAgent.provider;

  // Prepare refined task prompt emphasizing precision & evidence
  const refinedTask = {
    ...leafNode,
    agentType: strongerAgent.id,
    description: `[HIGH ACCURACY REFINEMENT] ${leafNode.description}\nNote: Prior attempt lacked required depth or verification. Provide a complete, rigorous, well-verified response.`
  };

  try {
    const rerunResult = await executeFn(refinedTask, state, state.executionId, sharedMemory);

    // Re-evaluate trust
    const newTrust = evaluateTrust(refinedTask, rerunResult.output, {
      artifacts: rerunResult.artifacts,
      searchResults: rerunResult.searchResults
    });

    leafNode.output = rerunResult.output;
    leafNode.status = rerunResult.status || "completed";
    leafNode.metrics = rerunResult.metrics;
    leafNode.trustScore = newTrust.trustScore;
    leafNode.trustClassification = newTrust.trustClassification;
    leafNode.trustDetails = newTrust.details;

    // Update shared memory
    sharedMemory.recordTaskOutput(leafNode.id, rerunResult.output, {
      name: leafNode.name,
      agentId: strongerAgent.id,
      escalated: true
    });

    console.log(`[ESCALATION] Task="${leafNode.name}" Rerun complete. New Trust=${newTrust.trustScore} (${newTrust.trustClassification})`);

    return {
      escalated: true,
      strongerAgent: strongerAgent.id,
      newTrustScore: newTrust.trustScore,
      result: rerunResult
    };
  } catch (err) {
    console.error(`[ESCALATION Error for ${leafNode.name}]`, err);
    return {
      escalated: false,
      error: err.message
    };
  }
};
