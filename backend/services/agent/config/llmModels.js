import dotenv from "dotenv";
dotenv.config();
import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenRouter } from "@langchain/openrouter";

// Primary ultra-fast Groq reasoning model
const groq = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0.2
});

// Google Gemini multi-modal and large context model
const gemini = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  temperature: 0.2
});

// Configure OpenRouter with fallback safety if key is placeholder
const isOpenRouterConfigured = process.env.OPENROUTER_API_KEY && !process.env.OPENROUTER_API_KEY.includes("add your");

const openrouter = isOpenRouterConfigured
  ? new ChatOpenRouter({
      model: "deepseek/deepseek-chat",
      temperature: 0,
      maxTokens: 2500
    })
  : groq;

export const getModel = async (agent) => {
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
export const getModelWithMeta = async (agent) => {
  const llm = await getModel(agent);
  let modelName = "llama-3.3-70b-versatile";
  let provider = "groq";

  switch (agent) {
    case "coding":
      if (isOpenRouterConfigured) {
        modelName = "deepseek/deepseek-chat";
        provider = "openrouter";
      } else {
        modelName = "llama-3.3-70b-versatile";
        provider = "groq";
      }
      break;
    case "imageAnalyzer":
    case "pdf-rag":
    case "pdfRag":
      modelName = "gemini-1.5-flash";
      provider = "google";
      break;
    default:
      modelName = "llama-3.3-70b-versatile";
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
    modelName: "gemini-1.5-flash",
    provider: "google"
  };
};
