/**
 * Centralized Agent Registry
 * Source of truth for agent discovery, capabilities, model mappings,
 * quality scores, pricing, and dynamic selection tiers.
 */

import { MODEL_CONFIG } from "../config/llmModels.js";
import { MODEL_PRICING } from "../observability/pricing.js";

export const AGENT_REGISTRY = [
  {
    agentId: "chat",
    id: "chat",
    name: "General Reasoning Agent",
    description: "General reasoning, knowledge synthesis, explanations, and structured conversations",
    capabilities: ["conversation", "reasoning", "explanation", "qna", "summary", "general"],
    model: MODEL_CONFIG.groq.primary,
    provider: "groq",
    tier: "light",
    qualityScore: 85,
    costPerInputToken: MODEL_PRICING["openai/gpt-oss-120b"]?.inputPerMillion || 0.15,
    costPerOutputToken: MODEL_PRICING["openai/gpt-oss-120b"]?.outputPerMillion || 0.60,
    supportedTools: ["memory"],
    supportsParallel: true,
    available: true,
    defaultActivity: "Generating response..."
  },
  {
    agentId: "search",
    id: "search",
    name: "Web Search & Fact Agent",
    description: "Retrieves current web information, live data, market news, and verified facts via search",
    capabilities: ["web-search", "current-information", "news", "facts", "lookup", "market-data", "research"],
    model: "tavily-search",
    provider: "tavily",
    tier: "light",
    qualityScore: 90,
    costPerInputToken: 0,
    costPerOutputToken: 0,
    supportedTools: ["tavily_search"],
    supportsParallel: true,
    available: true,
    defaultActivity: "Searching current information..."
  },
  {
    agentId: "coding",
    id: "coding",
    name: "Software Engineering Agent",
    description: "Full-stack code generation, debugging, algorithmic problem solving, and architecture design",
    capabilities: ["code", "coding", "debugging", "refactoring", "software-architecture", "html-css-js", "algorithm"],
    model: MODEL_CONFIG.openrouter?.primary || "deepseek/deepseek-chat",
    provider: process.env.OPENROUTER_API_KEY ? "openrouter" : "groq",
    tier: "heavy",
    qualityScore: 95,
    costPerInputToken: MODEL_PRICING["deepseek/deepseek-chat"]?.inputPerMillion || 0.14,
    costPerOutputToken: MODEL_PRICING["deepseek/deepseek-chat"]?.outputPerMillion || 0.28,
    supportedTools: ["monaco_artifact_generator"],
    supportsParallel: true,
    available: true,
    defaultActivity: "Developing code and engineering solution..."
  },
  {
    agentId: "analysis",
    id: "analysis",
    name: "Deep Analysis Agent",
    description: "Performs rigorous analytical, financial, strategic, and domain-specific evaluations",
    capabilities: ["analysis", "financial-analysis", "data-analysis", "market-analysis", "evaluation", "metrics", "calculation"],
    model: MODEL_CONFIG.groq.primary,
    provider: "groq",
    tier: "balanced",
    qualityScore: 90,
    costPerInputToken: MODEL_PRICING["openai/gpt-oss-120b"]?.inputPerMillion || 0.15,
    costPerOutputToken: MODEL_PRICING["openai/gpt-oss-120b"]?.outputPerMillion || 0.60,
    supportedTools: ["structured_analysis"],
    supportsParallel: true,
    available: true,
    defaultActivity: "Analyzing data and strategic factors..."
  },
  {
    agentId: "comparison",
    id: "comparison",
    name: "Comparative Analysis Agent",
    description: "Compares multiple entities, features, companies, benchmarks, and provides side-by-side trade-offs",
    capabilities: ["comparison", "benchmarking", "pros-cons", "feature-matrix", "trade-off-analysis"],
    model: MODEL_CONFIG.groq.primary,
    provider: "groq",
    tier: "balanced",
    qualityScore: 88,
    costPerInputToken: MODEL_PRICING["openai/gpt-oss-120b"]?.inputPerMillion || 0.15,
    costPerOutputToken: MODEL_PRICING["openai/gpt-oss-120b"]?.outputPerMillion || 0.60,
    supportedTools: ["matrix_generator"],
    supportsParallel: true,
    available: true,
    defaultActivity: "Comparing collected results and metrics..."
  },
  {
    agentId: "pdf",
    id: "pdf",
    name: "Document Generation Agent",
    description: "Generates downloadable structured PDF documents and whitepapers",
    capabilities: ["pdf-generation", "document-creation", "export-pdf"],
    model: MODEL_CONFIG.groq.primary,
    provider: "groq",
    tier: "light",
    qualityScore: 88,
    costPerInputToken: MODEL_PRICING["openai/gpt-oss-120b"]?.inputPerMillion || 0.15,
    costPerOutputToken: MODEL_PRICING["openai/gpt-oss-120b"]?.outputPerMillion || 0.60,
    supportedTools: ["pdfkit_generator"],
    supportsParallel: false,
    available: true,
    defaultActivity: "Generating formatted PDF document..."
  },
  {
    agentId: "ppt",
    id: "ppt",
    name: "Presentation Agent",
    description: "Generates downloadable PowerPoint slide decks and presentations",
    capabilities: ["presentation-generation", "slides-creation", "export-pptx"],
    model: MODEL_CONFIG.groq.primary,
    provider: "groq",
    tier: "light",
    qualityScore: 88,
    costPerInputToken: MODEL_PRICING["openai/gpt-oss-120b"]?.inputPerMillion || 0.15,
    costPerOutputToken: MODEL_PRICING["openai/gpt-oss-120b"]?.outputPerMillion || 0.60,
    supportedTools: ["pptxgen_generator"],
    supportsParallel: false,
    available: true,
    defaultActivity: "Creating presentation slide deck..."
  },
  {
    agentId: "vision",
    id: "vision",
    name: "Image Generation Agent",
    description: "Engineers high-fidelity visual prompts and generates AI imagery",
    capabilities: ["image-generation", "visual-design", "artwork"],
    model: "pollinations-ai",
    provider: "pollinations",
    tier: "light",
    qualityScore: 80,
    costPerInputToken: 0,
    costPerOutputToken: 0,
    supportedTools: ["pollinations_api"],
    supportsParallel: true,
    available: true,
    defaultActivity: "Generating visual artwork..."
  },
  {
    agentId: "pdfRag",
    id: "pdfRag",
    name: "Document Context (RAG) Agent",
    description: "Extracts and answers questions grounded strictly in uploaded PDF documents",
    capabilities: ["pdf-rag", "document-qa", "uploaded-pdf", "rag"],
    model: MODEL_CONFIG.google.primary,
    provider: "google",
    tier: "heavy",
    qualityScore: 94,
    costPerInputToken: MODEL_PRICING["gemini-3.6-flash"]?.inputPerMillion || 0.075,
    costPerOutputToken: MODEL_PRICING["gemini-3.6-flash"]?.outputPerMillion || 0.30,
    supportedTools: ["qdrant_vector_store", "pdf_parser"],
    supportsParallel: false,
    available: true,
    defaultActivity: "Analyzing uploaded document context..."
  },
  {
    agentId: "imageAnalyzer",
    id: "imageAnalyzer",
    name: "Visual Analysis Agent",
    description: "Inspects and reasons over uploaded images, diagrams, charts, and visual content",
    capabilities: ["image-qa", "visual-understanding", "ocr", "chart-reading", "visual-analysis"],
    model: MODEL_CONFIG.google.primary,
    provider: "google",
    tier: "heavy",
    qualityScore: 95,
    costPerInputToken: MODEL_PRICING["gemini-3.6-flash"]?.inputPerMillion || 0.075,
    costPerOutputToken: MODEL_PRICING["gemini-3.6-flash"]?.outputPerMillion || 0.30,
    supportedTools: ["multimodal_vision"],
    supportsParallel: false,
    available: true,
    defaultActivity: "Analyzing uploaded image..."
  },
  {
    agentId: "synthesizer",
    id: "synthesizer",
    name: "Synthesis & Report Agent",
    description: "Aggregates diverse multi-agent findings into a cohesive, high-quality final report",
    capabilities: ["synthesis", "aggregation", "final-report", "reconciliation"],
    model: MODEL_CONFIG.groq.primary,
    provider: "groq",
    tier: "heavy",
    qualityScore: 95,
    costPerInputToken: MODEL_PRICING["openai/gpt-oss-120b"]?.inputPerMillion || 0.15,
    costPerOutputToken: MODEL_PRICING["openai/gpt-oss-120b"]?.outputPerMillion || 0.60,
    supportedTools: ["markdown_formatter"],
    supportsParallel: false,
    available: true,
    defaultActivity: "Synthesizing final comprehensive report..."
  }
];

export const getAgentRegistry = () => AGENT_REGISTRY;

export const getAgentById = (id) => {
  if (!id) return null;
  const cleanId = id.toLowerCase().trim();
  return AGENT_REGISTRY.find(a => (a.agentId && a.agentId.toLowerCase() === cleanId) || a.id.toLowerCase() === cleanId) || null;
};

export const findAgentByCapability = (capability) => {
  if (!capability) return null;
  const cleanCap = capability.toLowerCase().trim();
  return AGENT_REGISTRY.find(a => 
    a.id.toLowerCase() === cleanCap || 
    a.capabilities.some(c => c.toLowerCase() === cleanCap || cleanCap.includes(c.toLowerCase()))
  ) || null;
};

export const getAgentsPromptDescription = () => {
  return AGENT_REGISTRY
    .filter(a => a.id !== "synthesizer")
    .map(a => `- ${a.id} (${a.name}): ${a.description} [Tier: ${a.tier}, Quality: ${a.qualityScore}/100, Capabilities: ${a.capabilities.join(", ")}]`)
    .join("\n");
};
