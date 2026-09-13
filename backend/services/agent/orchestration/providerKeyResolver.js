/**
 * User Provider Key Resolver
 * Resolves user-specific BYOK API keys securely using AES-256-GCM decryption.
 * Guarantees strict user isolation: User A cannot use User B's keys.
 * Never outputs plain text API keys in logs, metrics, or telemetry.
 */

import mongoose from "mongoose";
import { decryptKey } from "../../auth/utils/crypto.js";

// Lazy-load User model if mongoose is connected
let UserModel = null;
const getUserModel = () => {
  if (!UserModel && mongoose.models.User) {
    UserModel = mongoose.models.User;
  }
  return UserModel;
};

/**
 * Gets list of providers connected by the specified user (metadata only, NO decrypted keys).
 *
 * @param {string} userId - Authenticated user identifier
 * @returns {Promise<Array<{ provider: string, status: string, isBYOK: boolean }>>}
 */
export const getUserConnectedProviders = async (userId) => {
  const connected = [];

  // 1. Platform fallback providers (available to all users if env configured)
  if (process.env.GOOGLE_API_KEY && !process.env.GOOGLE_API_KEY.includes("placeholder") && !process.env.GOOGLE_API_KEY.includes("your_")) {
    connected.push({ provider: "google", status: "connected", isBYOK: false, source: "platform" });
  }
  if (process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes("placeholder") && !process.env.GROQ_API_KEY.includes("your_")) {
    connected.push({ provider: "groq", status: "connected", isBYOK: false, source: "platform" });
  }
  if (process.env.OPENROUTER_API_KEY && !process.env.OPENROUTER_API_KEY.includes("placeholder") && !process.env.OPENROUTER_API_KEY.includes("your_")) {
    connected.push({ provider: "openrouter", status: "connected", isBYOK: false, source: "platform" });
  }
  if (process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes("placeholder") && !process.env.ANTHROPIC_API_KEY.includes("your_")) {
    connected.push({ provider: "claude", status: "connected", isBYOK: false, source: "platform" });
  }
  if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes("placeholder") && !process.env.OPENAI_API_KEY.includes("your_")) {
    connected.push({ provider: "openai", status: "connected", isBYOK: false, source: "platform" });
  }
  // Deepseek fallback via openrouter or direct env
  if (process.env.DEEPSEEK_API_KEY && !process.env.DEEPSEEK_API_KEY.includes("placeholder")) {
    connected.push({ provider: "deepseek", status: "connected", isBYOK: false, source: "platform" });
  }

  // Tavily & Pollinations are standard platform tools
  connected.push({ provider: "tavily", status: "connected", isBYOK: false, source: "platform" });
  connected.push({ provider: "pollinations", status: "connected", isBYOK: false, source: "platform" });

  // 2. Fetch authenticated user's custom BYOK connected providers
  if (userId && userId !== "anonymous" && userId !== "undefined") {
    try {
      const User = getUserModel();
      if (User) {
        const userDoc = await User.findById(userId).select("connectedProviders");
        if (userDoc && Array.isArray(userDoc.connectedProviders)) {
          userDoc.connectedProviders.forEach(p => {
            if (p.status === "connected") {
              const existingIdx = connected.findIndex(c => c.provider.toLowerCase() === p.provider.toLowerCase());
              const byokEntry = {
                provider: p.provider.toLowerCase(),
                status: "connected",
                isBYOK: true,
                keyMask: p.keyMask,
                source: "user_byok"
              };
              if (existingIdx >= 0) {
                connected[existingIdx] = byokEntry; // User BYOK overrides platform default
              } else {
                connected.push(byokEntry);
              }
            }
          });
        }
      }
    } catch (err) {
      console.warn(`[providerKeyResolver] Warning fetching user providers for ${userId}:`, err.message);
    }
  }

  return connected;
};

/**
 * Internal secure decryption helper for a specific provider and user.
 * Plaintext keys NEVER leave this server-side execution context.
 *
 * @param {string} provider - Provider name e.g. "google", "groq", "claude", "deepseek", "openai", "openrouter"
 * @param {string} userId - Authenticated user identifier
 * @returns {Promise<string|null>} Decrypted API key string or null
 */
export const resolveDecryptedKey = async (provider, userId) => {
  if (!provider) return null;
  const cleanProvider = provider.toLowerCase().trim();

  // 1. Check User BYOK Key
  if (userId && userId !== "anonymous" && userId !== "undefined") {
    try {
      const User = getUserModel();
      if (User) {
        const userDoc = await User.findById(userId).select("connectedProviders");
        if (userDoc && Array.isArray(userDoc.connectedProviders)) {
          const userProvider = userDoc.connectedProviders.find(
            p => p.provider.toLowerCase() === cleanProvider && p.status === "connected" && p.encryptedKey
          );
          if (userProvider && userProvider.encryptedKey) {
            const decrypted = decryptKey(userProvider.encryptedKey);
            if (decrypted && decrypted.trim().length > 0) {
              return decrypted.trim();
            }
          }
        }
      }
    } catch (err) {
      console.error(`[providerKeyResolver] Error decrypting user key for ${cleanProvider}:`, err.message);
    }
  }

  // 2. Fallback to platform environment variable
  switch (cleanProvider) {
    case "google":
    case "gemini":
      return process.env.GOOGLE_API_KEY || null;
    case "groq":
      return process.env.GROQ_API_KEY || null;
    case "claude":
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY || process.env.OPENROUTER_API_KEY || null;
    case "openai":
      return process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || null;
    case "deepseek":
      return process.env.DEEPSEEK_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY || null;
    case "openrouter":
      return process.env.OPENROUTER_API_KEY || null;
    case "tavily":
      return process.env.TAVILY_API_KEY || null;
    case "pollinations":
      return "pollinations_public";
    default:
      return null;
  }
};
