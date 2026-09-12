/**
 * Dynamic Agent Selector
 * Selects the cheapest capable agent based on normalized scoring:
 * AgentScore = w_cap*CapabilityMatch + w_qual*Quality + w_suit*TaskSuitability + w_tool*ToolCompatibility - w_cost*CostPenalty
 *
 * Principle: Select the cheapest agent that is capable of satisfying the task's
 * requirements at the required quality level (not simply Easy->cheap, Complex->expensive).
 */

import { AGENT_REGISTRY, getAgentById } from "./agentRegistry.js";

// Configurable weights
const DEFAULT_WEIGHTS = {
  capability: 0.35,
  quality: 0.25,
  suitability: 0.20,
  toolCompatibility: 0.10,
  costPenalty: 0.10
};

/**
 * Calculates capability match score (0 - 100) between task requirements and candidate agent.
 */
const calculateCapabilityMatch = (task = {}, agent = {}) => {
  const agentType = (task.agentType || task.id || "").toLowerCase();
  const description = (task.description || "").toLowerCase();
  const agentCapabilities = agent.capabilities || [];

  // Direct ID match
  if (agent.id.toLowerCase() === agentType || agent.agentId?.toLowerCase() === agentType) {
    return 100;
  }

  // Capability intersection
  let matchCount = 0;
  agentCapabilities.forEach(cap => {
    if (description.includes(cap.toLowerCase()) || agentType.includes(cap.toLowerCase())) {
      matchCount += 1;
    }
  });

  if (matchCount >= 2) return 90;
  if (matchCount === 1) return 70;

  // Domain specific soft matches
  if ((agentType.includes("chat") || agentType.includes("reasoning")) && agent.id === "chat") return 95;
  if (agentType.includes("search") && agent.id === "search") return 95;
  if (agentType.includes("coding") && agent.id === "coding") return 95;
  if (agentType.includes("analy") && (agent.id === "analysis" || agent.id === "chat")) return 80;
  if (agentType.includes("comp") && (agent.id === "comparison" || agent.id === "chat")) return 80;

  return 30; // low capability match
};

/**
 * Calculates task suitability score (0 - 100) considering task complexity vs agent tier.
 */
const calculateSuitability = (complexityScore = 30, agent = {}) => {
  const tier = agent.tier || "light";

  if (complexityScore < 40) {
    // EASY tasks: light tiers are ideal, heavy tiers penalized for overkill
    if (tier === "light") return 95;
    if (tier === "balanced") return 80;
    return 60; // heavy tier overkill penalty
  }

  if (complexityScore < 70) {
    // MEDIUM tasks: balanced or capable light agents are ideal
    if (tier === "balanced") return 95;
    if (tier === "light") return 85;
    return 75;
  }

  // COMPLEX tasks: balanced and heavy tiers are preferred
  if (tier === "heavy") return 95;
  if (tier === "balanced") return 90;
  return 65; // light tier might struggle with extreme complexity
};

/**
 * Calculates tool compatibility score (0 - 100).
 */
const calculateToolCompatibility = (task = {}, agent = {}) => {
  const agentType = (task.agentType || task.id || "").toLowerCase();
  const desc = (task.description || "").toLowerCase();

  if (desc.includes("search") || agentType.includes("search")) {
    return agent.supportedTools?.includes("tavily_search") ? 100 : 20;
  }
  if (desc.includes("pdf") && (desc.includes("upload") || agentType.includes("pdfrag"))) {
    return agent.supportedTools?.includes("pdf_parser") ? 100 : 20;
  }
  if (desc.includes("code") || agentType.includes("coding")) {
    return agent.supportedTools?.includes("monaco_artifact_generator") ? 100 : 40;
  }
  return 85; // neutral tool requirement
};

/**
 * Calculates normalized cost penalty (0 - 100). Higher cost -> higher penalty.
 */
const calculateCostPenalty = (agent = {}) => {
  const inputCost = agent.costPerInputToken || 0;
  const outputCost = agent.costPerOutputToken || 0;
  const totalRate = inputCost + outputCost;

  if (totalRate === 0) return 0; // zero cost (e.g. search tool or local)
  if (totalRate <= 0.4) return 20; // low cost
  if (totalRate <= 0.8) return 40; // moderate cost
  if (totalRate <= 2.0) return 70; // high cost
  return 90; // very high cost
};

/**
 * Dynamically selects the cheapest capable agent for a given task node.
 *
 * @param {Object} task - Task node to assign an agent to
 * @param {number} [complexityScore=30] - Evaluated task complexity (0 - 100)
 * @param {Object} [options] - Optional custom weights and forced overrides
 * @returns {Object} Selection result with score, rationale, and alternatives
 */
export const selectDynamicAgent = (task = {}, complexityScore = 30, options = {}) => {
  const weights = { ...DEFAULT_WEIGHTS, ...(options.weights || {}) };
  const requestedType = (task.agentType || task.id || "chat").toLowerCase();

  const candidatePool = AGENT_REGISTRY.filter(a => a.available && a.id !== "synthesizer");

  const scoredCandidates = candidatePool.map(agent => {
    const capabilityMatch = calculateCapabilityMatch(task, agent);
    const quality = agent.qualityScore || 80;
    const suitability = calculateSuitability(complexityScore, agent);
    const toolCompat = calculateToolCompatibility(task, agent);
    const costPenalty = calculateCostPenalty(agent);

    // Filter out completely incapable agents (< 50 capability match unless direct request)
    const isDirectMatch = agent.id.toLowerCase() === requestedType || agent.agentId?.toLowerCase() === requestedType;
    if (capabilityMatch < 50 && !isDirectMatch) {
      return {
        agentId: agent.id,
        name: agent.name,
        model: agent.model,
        provider: agent.provider,
        tier: agent.tier,
        score: -1,
        capable: false,
        reason: `Insufficient capability match (${capabilityMatch}%) for task requirements.`
      };
    }

    const totalScore = Number((
      (weights.capability * capabilityMatch) +
      (weights.quality * quality) +
      (weights.suitability * suitability) +
      (weights.toolCompatibility * toolCompat) -
      (weights.costPenalty * costPenalty)
    ).toFixed(2));

    const reason = `Capability Match: ${capabilityMatch}%, Quality: ${quality}, Tier: ${agent.tier}, Cost: $${(agent.costPerInputToken || 0).toFixed(3)}/1M tokens.`;

    return {
      agentId: agent.id,
      name: agent.name,
      model: agent.model,
      provider: agent.provider,
      tier: agent.tier,
      score: totalScore,
      capable: true,
      reason,
      qualityScore: quality,
      costRate: (agent.costPerInputToken || 0) + (agent.costPerOutputToken || 0)
    };
  });

  // Sort capable candidates by score descending
  const viable = scoredCandidates.filter(c => c.capable).sort((a, b) => b.score - a.score);

  const selected = viable.length > 0 ? viable[0] : {
    agentId: "chat",
    name: "General Reasoning Agent",
    model: "openai/gpt-oss-120b",
    provider: "groq",
    score: 75.0,
    reason: "Fallback to default General Reasoning Agent."
  };

  const alternatives = scoredCandidates
    .filter(c => c.agentId !== selected.agentId)
    .slice(0, 3)
    .map(alt => ({
      agent: alt.name || alt.agentId,
      agentId: alt.agentId,
      score: alt.score > 0 ? alt.score : 0,
      reason: alt.reason
    }));

  const rationale = `Selected ${selected.name} (${selected.model}) because it offers the highest capability match (${selected.score} pts) and best cost-efficiency for complexity level ${complexityScore}/100.`;

  console.log(`[AGENT SELECTOR] Task="${task.name || task.id}" Selected=${selected.agentId} Score=${selected.score} Reason="${rationale}"`);

  return {
    selectedAgent: selected.agentId,
    name: selected.name,
    model: selected.model,
    provider: selected.provider,
    agentScore: selected.score,
    reason: rationale,
    alternativesConsidered: alternatives
  };
};
