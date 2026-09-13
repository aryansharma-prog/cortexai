/**
 * Intelligent Model Router
 * Dynamically determines which user-configured model is the optimal candidate for a given task.
 * 
 * Formula:
 * RoutingScore = w_cap*CapabilityFit + w_qual*Quality + w_eff*TokenEfficiency + w_avail*Availability + w_rel*Reliability + w_ctx*ContextSuitability
 */

import { MODEL_REGISTRY, getModelById } from "./modelRegistry.js";
import { getUserConnectedProviders } from "./providerKeyResolver.js";
import { providerHealth } from "./failureDetector.js";

const DEFAULT_ROUTER_WEIGHTS = {
  capability: 0.30,
  quality: 0.25,
  tokenEfficiency: 0.20,
  availability: 0.10,
  reliability: 0.10,
  contextSuitability: 0.05
};

/**
 * Calculates Capability Fit Score (0 - 100)
 */
const calculateCapabilityFit = (task = {}, model = {}) => {
  const taskDesc = (task.description || task.prompt || "").toLowerCase();
  const agentType = (task.selectedAgent || task.agentType || task.id || "").toLowerCase();
  const modelCaps = model.capabilities || [];

  // Specialized Tool Exclusion: Tavily is search-only, Pollinations is image-gen only
  if (model.provider === "tavily") {
    return (agentType === "search" || taskDesc.includes("search") || taskDesc.includes("lookup")) ? 100 : 0;
  }
  if (model.provider === "pollinations") {
    return (agentType === "vision" || taskDesc.includes("generate image") || taskDesc.includes("visual artwork")) ? 100 : 0;
  }

  // Vision requirement check
  const requiresVision = agentType.includes("vision") || 
                         agentType.includes("imageanalyzer") || 
                         taskDesc.includes("image") || 
                         taskDesc.includes("photo") || 
                         taskDesc.includes("diagram") ||
                         taskDesc.includes("screenshot");

  if (requiresVision && (agentType.includes("imageanalyzer") || agentType.includes("vision"))) {
    if (!modelCaps.includes("vision") || (model.visionScore || 0) < 50) {
      return 0; // Incompatible: model does not support visual inputs
    }
    return model.visionScore || 90;
  }

  // Search check
  if (agentType === "search") {
    return modelCaps.includes("web_search") ? 100 : 40;
  }

  // Coding check
  if (agentType.includes("coding") || taskDesc.includes("code") || taskDesc.includes("function") || taskDesc.includes("bug")) {
    const score = model.codingScore || 70;
    if (modelCaps.includes("coding")) return Math.min(100, score + 10);
    return Math.max(20, score - 30);
  }

  // Deep Analysis check
  if (agentType.includes("analysis") || agentType.includes("comparison") || taskDesc.includes("compare") || taskDesc.includes("financial")) {
    return modelCaps.includes("analysis") ? (model.reasoningScore || 85) : 70;
  }

  // General Reasoning
  return model.reasoningScore || 80;
};

/**
 * Calculates Token Efficiency Score (0 - 100). Higher efficiency -> higher score.
 */
const calculateTokenEfficiency = (model = {}, complexityScore = 30) => {
  const inputCost = model.costPerInputToken || 0;
  const outputCost = model.costPerOutputToken || 0;
  const totalCost = inputCost + outputCost;
  const speed = model.speedScore || 85;

  let costScore = 80;
  if (totalCost === 0) costScore = 100;
  else if (totalCost <= 0.5) costScore = 95;
  else if (totalCost <= 1.5) costScore = 85;
  else if (totalCost <= 5.0) costScore = 70;
  else costScore = 50;

  // Simple tasks heavily reward fast/low-cost models; complex tasks balance quality
  if (complexityScore < 40) {
    return Number(((costScore * 0.6) + (speed * 0.4)).toFixed(2));
  } else if (complexityScore < 70) {
    return Number(((costScore * 0.5) + (speed * 0.5)).toFixed(2));
  }
  return Number(((costScore * 0.4) + (speed * 0.6)).toFixed(2));
};

/**
 * Calculates Context Suitability Score (0 - 100)
 */
const calculateContextSuitability = (model = {}, contextLength = 0) => {
  const windowSize = model.contextWindow || 128000;
  if (contextLength > windowSize) return 0; // Cannot fit context
  if (contextLength > 500000 && windowSize >= 1000000) return 100; // Ultra long context ideal
  if (contextLength > 100000 && windowSize >= 200000) return 95;
  return 90;
};

/**
 * Selects the optimal available model for a task based on user connections, capabilities, and token efficiency.
 *
 * @param {Object} task - Task node or specification
 * @param {Object} [context] - Context parameters ({ userId, complexityScore, prompt, excludedProviders, excludedModels, requiredModality })
 * @param {Object} [options] - Custom options ({ weights })
 * @returns {Promise<{ selectedModel: Object, modelIdentifier: string, provider: string, routingScore: number, rationale: string, alternativesConsidered: Array, hasCompatibleModel: boolean }>}
 */
export const selectModelForTask = async (task = {}, context = {}, options = {}) => {
  const weights = { ...DEFAULT_ROUTER_WEIGHTS, ...(options.weights || {}) };
  const userId = context.userId || task.userId || "anonymous";
  const complexityScore = Number(context.complexityScore ?? task.complexityScore ?? 40);
  const excludedProviders = new Set((context.excludedProviders || []).map(p => p.toLowerCase().trim()));
  const excludedModels = new Set((context.excludedModels || []).map(m => m.toLowerCase().trim()));

  // 1. Retrieve providers connected by the user (or available platform defaults)
  let connectedProviderSet;
  if (Array.isArray(context.connectedProviders)) {
    connectedProviderSet = new Set(context.connectedProviders.map(p => p.toLowerCase().trim()));
  } else {
    const connectedProvidersList = await getUserConnectedProviders(userId);
    connectedProviderSet = new Set(connectedProvidersList.map(p => p.provider.toLowerCase().trim()));
  }

  // 2. Filter Candidate Models
  const candidatePool = MODEL_REGISTRY.filter(model => {
    const prov = model.provider.toLowerCase();
    const modelId = model.id.toLowerCase();
    const modelIdent = model.modelIdentifier.toLowerCase();

    // Provider must be connected
    if (!connectedProviderSet.has(prov)) return false;

    // Excluded provider / model filter (e.g. during failover)
    if (excludedProviders.has(prov)) return false;
    if (excludedModels.has(modelId) || excludedModels.has(modelIdent)) return false;

    // Provider health / cooldown check
    if (!providerHealth.isProviderAvailable(prov, userId)) return false;

    // Model availability
    if (model.availability !== "active") return false;

    return true;
  });

  // 3. Score Candidates
  const scored = candidatePool.map(model => {
    const capabilityFit = calculateCapabilityFit(task, model);
    const quality = model.qualityScore || 85;
    const tokenEfficiency = calculateTokenEfficiency(model, complexityScore);
    const availability = model.availability === "active" ? 100 : 40;
    const reliability = 95; // base reliability
    const contextSuitability = calculateContextSuitability(model, context.contextLength || 0);

    // If completely incapable (e.g. non-vision model for image analysis)
    if (capabilityFit === 0) {
      return {
        model,
        score: -1,
        capable: false,
        reason: "Incapable of satisfying task modality/requirements."
      };
    }

    const totalScore = Number((
      (weights.capability * capabilityFit) +
      (weights.quality * quality) +
      (weights.tokenEfficiency * tokenEfficiency) +
      (weights.availability * availability) +
      (weights.reliability * reliability) +
      (weights.contextSuitability * contextSuitability)
    ).toFixed(2));

    const rationale = `Capability: ${capabilityFit}%, Quality: ${quality}, Efficiency: ${tokenEfficiency}%, Speed: ${model.speedScore || 85}`;

    return {
      model,
      score: totalScore,
      capable: true,
      reason: rationale,
      provider: model.provider,
      modelIdentifier: model.modelIdentifier
    };
  });

  // Filter capable models and sort by score descending
  const viable = scored.filter(c => c.capable && c.score > 0).sort((a, b) => b.score - a.score);

  if (viable.length === 0) {
    // If no candidate matches, check if we have any fallback
    const agentType = task.selectedAgent || task.agentType || "chat";
    const isVision = agentType.includes("image") || agentType.includes("vision");
    const isSearch = agentType === "search";

    const errorReason = `Cortex could not continue this task because no connected model currently supports the remaining requirements (${isVision ? "Vision" : isSearch ? "Search" : "Reasoning"}).`;

    return {
      selectedModel: null,
      modelIdentifier: null,
      provider: null,
      routingScore: 0,
      rationale: errorReason,
      alternativesConsidered: [],
      hasCompatibleModel: false,
      connectedProviders: Array.from(connectedProviderSet)
    };
  }

  const topPick = viable[0];
  const alternatives = viable.slice(1, 4).map(alt => ({
    model: alt.model.name,
    modelIdentifier: alt.model.modelIdentifier,
    provider: alt.model.provider,
    score: alt.score,
    reason: alt.reason
  }));

  const rationale = `Selected ${topPick.model.name} (${topPick.model.provider}) with RoutingScore ${topPick.score} pts [Capability: ${topPick.model.qualityScore}/100, Efficiency Tier: ${topPick.model.tier}].`;

  console.log(`[MODEL_ROUTER] Task="${task.name || task.id}" -> Model="${topPick.model.modelIdentifier}" (${topPick.model.provider}) Score=${topPick.score}`);

  return {
    selectedModel: topPick.model,
    modelIdentifier: topPick.model.modelIdentifier,
    provider: topPick.model.provider,
    routingScore: topPick.score,
    rationale,
    alternativesConsidered: alternatives,
    hasCompatibleModel: true,
    connectedProviders: Array.from(connectedProviderSet)
  };
};
