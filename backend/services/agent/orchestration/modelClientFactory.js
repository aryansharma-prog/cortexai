/**
 * Model Client Factory
 * Dynamically instantiates LangChain and provider LLM instances using decrypted user credentials.
 * Ensures decrypted credentials are held only in client memory during the invocation.
 */

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import { ChatOpenRouter } from "@langchain/openrouter";
import { resolveDecryptedKey } from "./providerKeyResolver.js";
import { MODEL_CONFIG, groq, gemini } from "../config/llmModels.js";

/**
 * Creates an executable LLM instance for the specified model metadata and user.
 *
 * @param {Object} modelSpec - Model registry entry (id, provider, modelIdentifier, etc.)
 * @param {string} userId - Authenticated user identifier
 * @param {Object} [options] - Options (temperature, maxTokens, etc.)
 * @returns {Promise<{ llm: Object, modelName: string, provider: string, isCustomKey: boolean }>}
 */
export const createModelClient = async (modelSpec = {}, userId = "anonymous", options = {}) => {
  const provider = (modelSpec.provider || "groq").toLowerCase().trim();
  const modelIdentifier = modelSpec.modelIdentifier || modelSpec.id || MODEL_CONFIG.groq.primary;
  const temperature = options.temperature ?? 0.2;
  const maxTokens = options.maxTokens ?? 4000;

  // Resolve decrypted API key securely server-side
  const apiKey = await resolveDecryptedKey(provider, userId);
  const isCustomKey = Boolean(apiKey && !apiKey.includes("placeholder") && apiKey !== process.env.GROQ_API_KEY && apiKey !== process.env.GOOGLE_API_KEY);

  try {
    switch (provider) {
      case "google":
      case "gemini": {
        const key = apiKey || process.env.GOOGLE_API_KEY;
        const llm = new ChatGoogleGenerativeAI({
          model: modelIdentifier,
          apiKey: key || "placeholder_google_api_key",
          temperature
        });
        return { llm, modelName: modelIdentifier, provider: "google", isCustomKey };
      }

      case "groq": {
        const key = apiKey || process.env.GROQ_API_KEY;
        const llm = new ChatGroq({
          model: modelIdentifier,
          apiKey: key || "placeholder_groq_api_key",
          temperature
        });
        return { llm, modelName: modelIdentifier, provider: "groq", isCustomKey };
      }

      case "openrouter": {
        const key = apiKey || process.env.OPENROUTER_API_KEY;
        if (key && !key.includes("placeholder") && !key.includes("your_")) {
          const llm = new ChatOpenRouter({
            model: modelIdentifier,
            apiKey: key,
            temperature,
            maxTokens
          });
          return { llm, modelName: modelIdentifier, provider: "openrouter", isCustomKey };
        }
        return { llm: groq, modelName: MODEL_CONFIG.groq.primary, provider: "groq", isCustomKey: false };
      }

      case "claude": {
        // If user provided OpenRouter or direct key, invoke via OpenRouter
        const openRouterKey = await resolveDecryptedKey("openrouter", userId) || process.env.OPENROUTER_API_KEY;
        if (openRouterKey && !openRouterKey.includes("placeholder")) {
          const openRouterModel = modelIdentifier.startsWith("anthropic/") ? modelIdentifier : `anthropic/${modelIdentifier}`;
          const llm = new ChatOpenRouter({
            model: openRouterModel,
            apiKey: openRouterKey,
            temperature,
            maxTokens
          });
          return { llm, modelName: modelIdentifier, provider: "claude", isCustomKey };
        }
        // Graceful fallback to primary capable model if Claude direct key wrapper is absent
        return { llm: gemini, modelName: MODEL_CONFIG.google.primary, provider: "google", isCustomKey: false };
      }

      case "openai": {
        const openRouterKey = await resolveDecryptedKey("openrouter", userId) || process.env.OPENROUTER_API_KEY;
        if (openRouterKey && !openRouterKey.includes("placeholder")) {
          const openRouterModel = modelIdentifier.startsWith("openai/") ? modelIdentifier : `openai/${modelIdentifier}`;
          const llm = new ChatOpenRouter({
            model: openRouterModel,
            apiKey: openRouterKey,
            temperature,
            maxTokens
          });
          return { llm, modelName: modelIdentifier, provider: "openai", isCustomKey };
        }
        return { llm: groq, modelName: MODEL_CONFIG.groq.primary, provider: "groq", isCustomKey: false };
      }

      case "deepseek": {
        const openRouterKey = await resolveDecryptedKey("openrouter", userId) || process.env.OPENROUTER_API_KEY;
        if (openRouterKey && !openRouterKey.includes("placeholder")) {
          const openRouterModel = modelIdentifier.startsWith("deepseek/") ? modelIdentifier : `deepseek/${modelIdentifier}`;
          const llm = new ChatOpenRouter({
            model: openRouterModel,
            apiKey: openRouterKey,
            temperature,
            maxTokens
          });
          return { llm, modelName: modelIdentifier, provider: "deepseek", isCustomKey };
        }
        return { llm: groq, modelName: MODEL_CONFIG.groq.primary, provider: "groq", isCustomKey: false };
      }

      default:
        return { llm: groq, modelName: MODEL_CONFIG.groq.primary, provider: "groq", isCustomKey: false };
    }
  } catch (err) {
    console.warn(`[modelClientFactory] Failed to instantiate ${provider}/${modelIdentifier}, falling back to Groq:`, err.message);
    return { llm: groq, modelName: MODEL_CONFIG.groq.primary, provider: "groq", isCustomKey: false };
  }
};
