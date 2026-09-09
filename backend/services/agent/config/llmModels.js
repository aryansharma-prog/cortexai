import dotenv from "dotenv";
dotenv.config();
import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenRouter } from "@langchain/openrouter";

const groq = new ChatGroq({
  model: "openai/gpt-oss-120b"
});

const gemini = new ChatGoogleGenerativeAI({
  model: "gemini-3.6-flash"
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
  let modelName = "openai/gpt-oss-120b";
  let provider = "groq";

  switch (agent) {
    case "coding":
      if (isOpenRouterConfigured) {
        modelName = "deepseek/deepseek-chat";
        provider = "openrouter";
      } else {
        modelName = "openai/gpt-oss-120b";
        provider = "groq";
      }
      break;
    case "imageAnalyzer":
    case "pdf-rag":
      modelName = "gemini-3.6-flash";
      provider = "google";
      break;
    default:
      modelName = "openai/gpt-oss-120b";
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
    modelName: "gemini-3.6-flash",
    provider: "google"
  };
};
