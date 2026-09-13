/**
 * Centralized Model Capability Registry
 * Source of truth for all supported models across providers, their capabilities,
 * context windows, pricing, tiers, and capability flags.
 */

export const MODEL_REGISTRY = [
  // Google Gemini Models
  {
    modelId: "gemini-2.5-pro",
    provider: "gemini",
    name: "Gemini 2.5 Pro",
    tier: "heavy",
    qualityScore: 96,
    tokenEfficiencyScore: 88,
    reliabilityScore: 94,
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    capabilities: ["reasoning", "coding", "vision", "long_context", "multimodal", "analysis", "synthesis", "document_qa"],
    supportsVision: true,
    supportsTools: true,
    supportsCodeArtifacts: true,
    costPerInputMillion: 1.25,
    costPerOutputMillion: 5.00,
    defaultFor: ["vision", "pdfRag", "imageAnalyzer"]
  },
  {
    modelId: "gemini-3.6-flash",
    provider: "gemini",
    name: "Gemini 3.6 Flash",
    tier: "balanced",
    qualityScore: 91,
    tokenEfficiencyScore: 95,
    reliabilityScore: 95,
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    capabilities: ["reasoning", "coding", "vision", "long_context", "fast_inference", "multimodal"],
    supportsVision: true,
    supportsTools: true,
    supportsCodeArtifacts: true,
    costPerInputMillion: 0.075,
    costPerOutputMillion: 0.30,
    defaultFor: ["imageAnalyzer", "pdfRag"]
  },

  // Groq LPU Models
  {
    modelId: "openai/gpt-oss-120b",
    provider: "groq",
    name: "Groq GPT-OSS 120B",
    tier: "heavy",
    qualityScore: 92,
    tokenEfficiencyScore: 94,
    reliabilityScore: 92,
    contextWindow: 128000,
    maxOutputTokens: 4096,
    capabilities: ["reasoning", "coding", "analysis", "comparison", "fast_inference", "synthesis"],
    supportsVision: false,
    supportsTools: true,
    supportsCodeArtifacts: true,
    costPerInputMillion: 0.15,
    costPerOutputMillion: 0.60,
    defaultFor: ["chat", "analysis", "comparison", "synthesizer"]
  },
  {
    modelId: "llama-3.3-70b-versatile",
    provider: "groq",
    name: "Groq Llama 3.3 70B",
    tier: "balanced",
    qualityScore: 90,
    tokenEfficiencyScore: 96,
    reliabilityScore: 93,
    contextWindow: 128000,
    maxOutputTokens: 4096,
    capabilities: ["reasoning", "coding", "fast_inference", "analysis", "comparison"],
    supportsVision: false,
    supportsTools: true,
    supportsCodeArtifacts: true,
    costPerInputMillion: 0.10,
    costPerOutputMillion: 0.40,
    defaultFor: ["chat", "search"]
  },
  {
    modelId: "qwen/qwen3.8-27b",
    provider: "groq",
    name: "Groq Qwen 3.8 27B",
    tier: "light",
    qualityScore: 84,
    tokenEfficiencyScore: 98,
    reliabilityScore: 90,
    contextWindow: 128000,
    maxOutputTokens: 4096,
    capabilities: ["reasoning", "fast_inference", "summary", "general"],
    supportsVision: false,
    supportsTools: false,
    supportsCodeArtifacts: false,
    costPerInputMillion: 0.05,
    costPerOutputMillion: 0.20,
    defaultFor: ["search"]
  },

  // Anthropic Claude Models
  {
    modelId: "claude-3-7-sonnet",
    provider: "claude",
    name: "Claude 3.7 Sonnet",
    tier: "heavy",
    qualityScore: 98,
    tokenEfficiencyScore: 90,
    reliabilityScore: 96,
    contextWindow: 200000,
    maxOutputTokens: 8192,
    capabilities: ["reasoning", "coding", "architecture", "vision", "long_context", "synthesis", "analysis"],
    supportsVision: true,
    supportsTools: true,
    supportsCodeArtifacts: true,
    costPerInputMillion: 3.00,
    costPerOutputMillion: 15.00,
    defaultFor: ["coding", "synthesizer"]
  },
  {
    modelId: "claude-3-5-haiku",
    provider: "claude",
    name: "Claude 3.5 Haiku",
    tier: "light",
    qualityScore: 88,
    tokenEfficiencyScore: 97,
    reliabilityScore: 95,
    contextWindow: 200000,
    maxOutputTokens: 4096,
    capabilities: ["reasoning", "fast_inference", "coding", "summary"],
    supportsVision: true,
    supportsTools: true,
    supportsCodeArtifacts: true,
    costPerInputMillion: 0.80,
    costPerOutputMillion: 4.00,
    defaultFor: ["chat"]
  },

  // OpenAI Models
  {
    modelId: "gpt-4o",
    provider: "openai",
    name: "OpenAI GPT-4o",
    tier: "heavy",
    qualityScore: 95,
    tokenEfficiencyScore: 91,
    reliabilityScore: 95,
    contextWindow: 128000,
    maxOutputTokens: 4096,
    capabilities: ["reasoning", "coding", "vision", "multimodal", "tool_calling", "analysis"],
    supportsVision: true,
    supportsTools: true,
    supportsCodeArtifacts: true,
    costPerInputMillion: 2.50,
    costPerOutputMillion: 10.00,
    defaultFor: ["coding", "imageAnalyzer"]
  },
  {
    modelId: "gpt-4o-mini",
    provider: "openai",
    name: "OpenAI GPT-4o Mini",
    tier: "light",
    qualityScore: 87,
    tokenEfficiencyScore: 97,
    reliabilityScore: 96,
    contextWindow: 128000,
    maxOutputTokens: 4096,
    capabilities: ["reasoning", "fast_inference", "vision", "coding"],
    supportsVision: true,
    supportsTools: true,
    supportsCodeArtifacts: true,
    costPerInputMillion: 0.15,
    costPerOutputMillion: 0.60,
    defaultFor: ["chat"]
  },

  // DeepSeek Models
  {
    modelId: "deepseek/deepseek-chat",
    provider: "deepseek",
    name: "DeepSeek V3",
    tier: "balanced",
    qualityScore: 93,
    tokenEfficiencyScore: 96,
    reliabilityScore: 92,
    contextWindow: 64000,
    maxOutputTokens: 4096,
    capabilities: ["reasoning", "coding", "mathematics", "analysis"],
    supportsVision: false,
    supportsTools: true,
    supportsCodeArtifacts: true,
    costPerInputMillion: 0.14,
    costPerOutputMillion: 0.28,
    defaultFor: ["coding"]
  },
  {
    modelId: "deepseek/deepseek-r1",
    provider: "deepseek",
    name: "DeepSeek R1",
    tier: "heavy",
    qualityScore: 96,
    tokenEfficiencyScore: 92,
    reliabilityScore: 91,
    contextWindow: 64000,
    maxOutputTokens: 8192,
    capabilities: ["reasoning", "deep_thinking", "mathematics", "coding", "algorithm"],
    supportsVision: false,
    supportsTools: false,
    supportsCodeArtifacts: true,
    costPerInputMillion: 0.55,
    costPerOutputMillion: 2.19,
    defaultFor: ["analysis"]
  },

  // OpenRouter Fallback Router
  {
    modelId: "openrouter/auto",
    provider: "openrouter",
    name: "OpenRouter Multi-Provider",
    tier: "balanced",
    qualityScore: 90,
    tokenEfficiencyScore: 90,
    reliabilityScore: 90,
    contextWindow: 128000,
    maxOutputTokens: 4096,
    capabilities: ["reasoning", "coding", "fallback_routing"],
    supportsVision: true,
    supportsTools: true,
    supportsCodeArtifacts: true,
    costPerInputMillion: 0.50,
    costPerOutputMillion: 1.50,
    defaultFor: []
  }
];

/**
 * Find model metadata by model identifier
 */
export function getModelMetadata(modelId) {
  if (!modelId) return null;
  const clean = modelId.toLowerCase().trim();
  return MODEL_REGISTRY.find(m => m.modelId.toLowerCase() === clean || m.name.toLowerCase() === clean) || null;
}

/**
 * Find all models for a specific provider
 */
export function getModelsByProvider(provider) {
  if (!provider) return [];
  const clean = provider.toLowerCase().trim();
  return MODEL_REGISTRY.filter(m => m.provider.toLowerCase() === clean);
}

/**
 * Filter models matching required capability flags (e.g. vision, coding, long_context)
 */
export function getModelsWithCapabilities(requiredCapabilities = []) {
  if (!requiredCapabilities || requiredCapabilities.length === 0) return MODEL_REGISTRY;
  return MODEL_REGISTRY.filter(model => {
    return requiredCapabilities.every(reqCap => {
      const clean = reqCap.toLowerCase();
      if (clean === "vision") return model.supportsVision;
      if (clean === "tools") return model.supportsTools;
      if (clean === "code" || clean === "coding") return model.supportsCodeArtifacts || model.capabilities.includes("coding");
      return model.capabilities.some(c => c.includes(clean) || clean.includes(c));
    });
  });
}
