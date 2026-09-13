import dotenv from "dotenv";
dotenv.config();
import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenRouter } from "@langchain/openrouter";
import { createModelClient } from "../orchestration/modelClientFactory.js";
import { getModelById } from "../orchestration/modelRegistry.js";

/**
 * Centralized Model Registry Configuration
 * Supports environment overrides with validated, active default models.
 */
export const MODEL_CONFIG = {
  groq: {
    primary: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
    fallback: "openai/gpt-oss-20b",
    fast: "qwen/qwen3.8-27b"
  },
  google: {
    primary: process.env.GOOGLE_MODEL || "gemini-3.6-flash",
    fallback: "gemini-3.6-flash"
  },
  openrouter: {
    primary: process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat"
  }
};

// Primary Groq reasoning model
export const groq = new ChatGroq({
  model: MODEL_CONFIG.groq.primary,
  apiKey: process.env.GROQ_API_KEY || "placeholder_groq_api_key",
  temperature: 0.2
});

// Google Gemini multi-modal and large context model
export const gemini = new ChatGoogleGenerativeAI({
  model: MODEL_CONFIG.google.primary,
  apiKey: process.env.GOOGLE_API_KEY || "placeholder_google_api_key",
  temperature: 0.2
});

// Configure OpenRouter with fallback safety if key is placeholder
const isOpenRouterConfigured = process.env.OPENROUTER_API_KEY && 
  !process.env.OPENROUTER_API_KEY.includes("add your") && 
  !process.env.OPENROUTER_API_KEY.includes("your_");

export const openrouter = isOpenRouterConfigured
  ? new ChatOpenRouter({
      model: MODEL_CONFIG.openrouter.primary,
      apiKey: process.env.OPENROUTER_API_KEY,
      temperature: 0,
      maxTokens: 2500
    })
  : groq;

export const getModel = async (agent, options = {}) => {
  if (options.modelIdentifier || options.model || options.provider) {
    const spec = getModelById(options.modelIdentifier || options.model) || {
      provider: options.provider || "groq",
      modelIdentifier: options.modelIdentifier || options.model || MODEL_CONFIG.groq.primary
    };
    const client = await createModelClient(spec, options.userId, options);
    return client.llm;
  }

  switch (agent) {
    case "chat":
      return groq;
    case "search":
      return groq;
    case "coding":
      return isOpenRouterConfigured ? openrouter : groq;
    case "imageAnalyzer":
      return gemini;
    case "taskAnalyzer":
    case "router":
      return groq;
    case "synthesizer":
      return groq;
    case "analysis":
    case "comparison":
      return groq;
    case "pdf":
    case "ppt":
      return groq;
    case "image":
    case "vision":
      return groq;
    case "pdf-rag":
    case "pdfRag":
      return gemini;
    default:
      return groq;
  }
};

/**
 * Returns model instance alongside normalized metadata (model name, provider)
 * for observability and token/cost tracking.
 */
export const getModelWithMeta = async (agent, options = {}) => {
  if (options.modelIdentifier || options.model || options.provider) {
    const spec = getModelById(options.modelIdentifier || options.model) || {
      provider: options.provider || "groq",
      modelIdentifier: options.modelIdentifier || options.model || MODEL_CONFIG.groq.primary
    };
    const client = await createModelClient(spec, options.userId, options);
    return {
      llm: client.llm,
      modelName: client.modelName,
      provider: client.provider
    };
  }

  const llm = await getModel(agent, options);
  let modelName = MODEL_CONFIG.groq.primary;
  let provider = "groq";

  switch (agent) {
    case "coding":
      if (isOpenRouterConfigured) {
        modelName = MODEL_CONFIG.openrouter.primary;
        provider = "openrouter";
      } else {
        modelName = MODEL_CONFIG.groq.primary;
        provider = "groq";
      }
      break;
    case "imageAnalyzer":
    case "pdf-rag":
    case "pdfRag":
      modelName = MODEL_CONFIG.google.primary;
      provider = "google";
      break;
    default:
      modelName = MODEL_CONFIG.groq.primary;
      provider = "groq";
      break;
  }

  return {
    llm,
    modelName,
    provider
  };
};

/**
 * High-capacity fallback model (Gemini) when provider TPM quotas are exceeded
 */
export const getFallbackModelWithMeta = async () => {
  return {
    llm: gemini,
    modelName: MODEL_CONFIG.google.primary,
    provider: "google"
  };
};
