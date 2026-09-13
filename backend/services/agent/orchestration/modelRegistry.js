/**
 * Centralized Model Capability Registry
 * Source of truth for model specifications, provider mappings, multi-modal capabilities,
 * context limits, benchmark scores, token pricing, and runtime availability.
 */

import { MODEL_PRICING } from "../observability/pricing.js";

export const MODEL_REGISTRY = [
  // --- GOOGLE GEMINI MODELS ---
  {
    id: "gemini-2.5-flash",
    provider: "google",
    name: "Gemini 2.5 Flash",
    modelIdentifier: "gemini-2.5-flash",
    description: "Ultra-fast, high-efficiency multimodal model with long-context reasoning",
    capabilities: ["reasoning", "vision", "analysis", "general", "long_context", "tool_calling", "fast"],
    reasoningScore: 88,
    codingScore: 85,
    visionScore: 95,
    speedScore: 96,
    qualityScore: 89,
    contextWindow: 1000000,
    supportedTools: ["multimodal_vision", "pdf_parser", "qdrant_vector_store"],
    costPerInputToken: MODEL_PRICING["gemini-2.5-flash"]?.inputPerMillion || 0.075,
    costPerOutputToken: MODEL_PRICING["gemini-2.5-flash"]?.outputPerMillion || 0.30,
    tier: "light",
    availability: "active"
  },
  {
    id: "gemini-3.6-flash",
    provider: "google",
    name: "Gemini 3.6 Flash",
    modelIdentifier: "gemini-3.6-flash",
    description: "Advanced lightweight multimodal model optimized for low-latency synthesis and tool execution",
    capabilities: ["reasoning", "vision", "analysis", "general", "long_context", "tool_calling", "fast"],
    reasoningScore: 90,
    codingScore: 88,
    visionScore: 96,
    speedScore: 95,
    qualityScore: 91,
    contextWindow: 1000000,
    supportedTools: ["multimodal_vision", "pdf_parser", "qdrant_vector_store"],
    costPerInputToken: MODEL_PRICING["gemini-3.6-flash"]?.inputPerMillion || 0.075,
    costPerOutputToken: MODEL_PRICING["gemini-3.6-flash"]?.outputPerMillion || 0.30,
    tier: "balanced",
    availability: "active"
  },
  {
    id: "gemini-2.5-pro",
    provider: "google",
    name: "Gemini 2.5 Pro",
    modelIdentifier: "gemini-2.5-pro",
    description: "State-of-the-art multimodal reasoning, deep research, and massive 2M token context",
    capabilities: ["reasoning", "coding", "vision", "analysis", "deep_research", "long_context", "tool_calling"],
    reasoningScore: 97,
    codingScore: 94,
    visionScore: 98,
    speedScore: 78,
    qualityScore: 97,
    contextWindow: 2000000,
    supportedTools: ["multimodal_vision", "pdf_parser", "qdrant_vector_store", "monaco_artifact_generator"],
    costPerInputToken: MODEL_PRICING["gemini-1.5-pro"]?.inputPerMillion || 1.25,
    costPerOutputToken: MODEL_PRICING["gemini-1.5-pro"]?.outputPerMillion || 5.00,
    tier: "heavy",
    availability: "active"
  },

  // --- ANTHROPIC CLAUDE MODELS ---
  {
    id: "claude-3-7-sonnet",
    provider: "claude",
    name: "Claude 3.7 Sonnet",
    modelIdentifier: "claude-3-7-sonnet",
    description: "Industry-leading hybrid reasoning, advanced software engineering, and architectural synthesis",
    capabilities: ["reasoning", "coding", "vision", "analysis", "deep_research", "software_architecture", "tool_calling"],
    reasoningScore: 98,
    codingScore: 99,
    visionScore: 94,
    speedScore: 82,
    qualityScore: 99,
    contextWindow: 200000,
    supportedTools: ["monaco_artifact_generator", "multimodal_vision", "structured_analysis"],
    costPerInputToken: MODEL_PRICING["claude-3-7-sonnet"]?.inputPerMillion || 3.00,
    costPerOutputToken: MODEL_PRICING["claude-3-7-sonnet"]?.outputPerMillion || 15.00,
    tier: "heavy",
    availability: "active"
  },
  {
    id: "claude-3-5-haiku",
    provider: "claude",
    name: "Claude 3.5 Haiku",
    modelIdentifier: "claude-3-5-haiku",
    description: "Ultra-responsive, cost-effective reasoning and coding assistant",
    capabilities: ["reasoning", "coding", "analysis", "general", "fast", "tool_calling"],
    reasoningScore: 89,
    codingScore: 90,
    visionScore: 80,
    speedScore: 94,
    qualityScore: 88,
    contextWindow: 200000,
    supportedTools: ["monaco_artifact_generator"],
    costPerInputToken: MODEL_PRICING["claude-3-5-haiku"]?.inputPerMillion || 0.80,
    costPerOutputToken: MODEL_PRICING["claude-3-5-haiku"]?.outputPerMillion || 4.00,
    tier: "light",
    availability: "active"
  },

  // --- GROQ LPU MODELS ---
  {
    id: "llama-3.3-70b-versatile",
    provider: "groq",
    name: "Llama 3.3 70B (Groq)",
    modelIdentifier: "llama-3.3-70b-versatile",
    description: "Ultra-low-latency LPU inference with strong reasoning and broad knowledge",
    capabilities: ["reasoning", "analysis", "general", "fast", "tool_calling"],
    reasoningScore: 91,
    codingScore: 87,
    visionScore: 0,
    speedScore: 99,
    qualityScore: 90,
    contextWindow: 128000,
    supportedTools: ["memory", "structured_analysis"],
    costPerInputToken: MODEL_PRICING["llama-3.3-70b-versatile"]?.inputPerMillion || 0.59,
    costPerOutputToken: MODEL_PRICING["llama-3.3-70b-versatile"]?.outputPerMillion || 0.79,
    tier: "balanced",
    availability: "active"
  },
  {
    id: "openai/gpt-oss-120b",
    provider: "groq",
    name: "GPT-OSS 120B (Groq)",
    modelIdentifier: "openai/gpt-oss-120b",
    description: "High-throughput open reasoning model powering default Cortex fast orchestration",
    capabilities: ["reasoning", "analysis", "general", "fast"],
    reasoningScore: 88,
    codingScore: 84,
    visionScore: 0,
    speedScore: 98,
    qualityScore: 87,
    contextWindow: 128000,
    supportedTools: ["memory", "structured_analysis"],
    costPerInputToken: MODEL_PRICING["openai/gpt-oss-120b"]?.inputPerMillion || 0.15,
    costPerOutputToken: MODEL_PRICING["openai/gpt-oss-120b"]?.outputPerMillion || 0.60,
    tier: "light",
    availability: "active"
  },

  // --- DEEPSEEK MODELS ---
  {
    id: "deepseek-chat",
    provider: "deepseek",
    name: "DeepSeek V3 (Chat)",
    modelIdentifier: "deepseek/deepseek-chat",
    description: "High-efficiency coding, mathematical reasoning, and general software architecture",
    capabilities: ["reasoning", "coding", "analysis", "math", "software_architecture", "fast"],
    reasoningScore: 93,
    codingScore: 96,
    visionScore: 0,
    speedScore: 90,
    qualityScore: 94,
    contextWindow: 128000,
    supportedTools: ["monaco_artifact_generator"],
    costPerInputToken: MODEL_PRICING["deepseek/deepseek-chat"]?.inputPerMillion || 0.14,
    costPerOutputToken: MODEL_PRICING["deepseek/deepseek-chat"]?.outputPerMillion || 0.28,
    tier: "balanced",
    availability: "active"
  },
  {
    id: "deepseek-r1",
    provider: "deepseek",
    name: "DeepSeek R1",
    modelIdentifier: "deepseek/deepseek-r1",
    description: "Reinforcement-learning reasoning model for complex logic, algorithms, and deep proofs",
    capabilities: ["reasoning", "coding", "deep_research", "math", "analysis"],
    reasoningScore: 98,
    codingScore: 96,
    visionScore: 0,
    speedScore: 72,
    qualityScore: 98,
    contextWindow: 128000,
    supportedTools: ["monaco_artifact_generator"],
    costPerInputToken: MODEL_PRICING["deepseek/deepseek-r1"]?.inputPerMillion || 0.55,
    costPerOutputToken: MODEL_PRICING["deepseek/deepseek-r1"]?.outputPerMillion || 2.19,
    tier: "heavy",
    availability: "active"
  },

  // --- OPENAI MODELS ---
  {
    id: "gpt-4o",
    provider: "openai",
    name: "OpenAI GPT-4o",
    modelIdentifier: "gpt-4o",
    description: "Omni-modal model with advanced vision, coding, and tool calling",
    capabilities: ["reasoning", "coding", "vision", "analysis", "tool_calling"],
    reasoningScore: 95,
    codingScore: 94,
    visionScore: 94,
    speedScore: 88,
    qualityScore: 95,
    contextWindow: 128000,
    supportedTools: ["monaco_artifact_generator", "multimodal_vision"],
    costPerInputToken: MODEL_PRICING["gpt-4o"]?.inputPerMillion || 2.50,
    costPerOutputToken: MODEL_PRICING["gpt-4o"]?.outputPerMillion || 10.00,
    tier: "heavy",
    availability: "active"
  },
  {
    id: "gpt-4o-mini",
    provider: "openai",
    name: "OpenAI GPT-4o Mini",
    modelIdentifier: "gpt-4o-mini",
    description: "Fast, cost-efficient multimodal intelligence for high-volume subtasks",
    capabilities: ["reasoning", "coding", "vision", "analysis", "fast", "tool_calling"],
    reasoningScore: 86,
    codingScore: 85,
    visionScore: 88,
    speedScore: 96,
    qualityScore: 86,
    contextWindow: 128000,
    supportedTools: ["monaco_artifact_generator", "multimodal_vision"],
    costPerInputToken: MODEL_PRICING["gpt-4o-mini"]?.inputPerMillion || 0.15,
    costPerOutputToken: MODEL_PRICING["gpt-4o-mini"]?.outputPerMillion || 0.60,
    tier: "light",
    availability: "active"
  },

  // --- OPENROUTER UNIVERSAL ROUTER ---
  {
    id: "openrouter-auto",
    provider: "openrouter",
    name: "OpenRouter Dynamic Router",
    modelIdentifier: "openrouter/auto",
    description: "Dynamic multi-provider failover routing across 100+ open-source models",
    capabilities: ["reasoning", "coding", "analysis", "general"],
    reasoningScore: 88,
    codingScore: 90,
    visionScore: 0,
    speedScore: 88,
    qualityScore: 89,
    contextWindow: 128000,
    supportedTools: ["monaco_artifact_generator"],
    costPerInputToken: 0.20,
    costPerOutputToken: 0.60,
    tier: "balanced",
    availability: "active"
  },

  // --- SPECIALIZED TOOL PROVIDERS ---
  {
    id: "tavily-search",
    provider: "tavily",
    name: "Tavily Real-time Search",
    modelIdentifier: "tavily-search",
    description: "Live web search, verification, and real-time knowledge retrieval",
    capabilities: ["web_search", "current_information", "news", "facts"],
    reasoningScore: 90,
    codingScore: 0,
    visionScore: 0,
    speedScore: 92,
    qualityScore: 90,
    contextWindow: 64000,
    supportedTools: ["tavily_search"],
    costPerInputToken: 0,
    costPerOutputToken: 0,
    tier: "light",
    availability: "active"
  },
  {
    id: "pollinations-ai",
    provider: "pollinations",
    name: "Pollinations Visual Engine",
    modelIdentifier: "pollinations-ai",
    description: "High-fidelity AI image synthesis and prompt rendering",
    capabilities: ["image_generation", "visual_design"],
    reasoningScore: 80,
    codingScore: 0,
    visionScore: 90,
    speedScore: 85,
    qualityScore: 82,
    contextWindow: 32000,
    supportedTools: ["pollinations_api"],
    costPerInputToken: 0,
    costPerOutputToken: 0,
    tier: "light",
    availability: "active"
  }
];

export const getModelRegistry = () => MODEL_REGISTRY;

export const getModelById = (id) => {
  if (!id) return null;
  const cleanId = id.toLowerCase().trim();
  return MODEL_REGISTRY.find(m => 
    m.id.toLowerCase() === cleanId || 
    m.modelIdentifier.toLowerCase() === cleanId
  ) || null;
};

export const getModelsByProvider = (provider) => {
  if (!provider) return [];
  const cleanProv = provider.toLowerCase().trim();
  return MODEL_REGISTRY.filter(m => m.provider.toLowerCase() === cleanProv && m.availability === "active");
};

export const getModelsByCapability = (capability) => {
  if (!capability) return [];
  const cleanCap = capability.toLowerCase().trim();
  return MODEL_REGISTRY.filter(m => 
    m.availability === "active" && 
    m.capabilities.some(c => c.toLowerCase() === cleanCap)
  );
};
