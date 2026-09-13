/**
 * Validates an API key against the corresponding provider's lightweight validation endpoint
 * using native Node.js fetch (Node 18+).
 * Never logs or echoes the raw API key.
 * 
 * @param {string} provider - "gemini" | "groq" | "openai" | "claude" | "deepseek" | "openrouter"
 * @param {string} apiKey - Plaintext API key to validate
 * @returns {Promise<{ valid: boolean, message: string, latencyMs?: number }>}
 */
export async function validateProviderApiKey(provider, apiKey) {
  if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length < 8) {
    return {
      valid: false,
      message: "API key is too short or invalid format."
    };
  }

  const cleanKey = apiKey.trim();
  const normalizedProvider = provider.toLowerCase();
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    switch (normalizedProvider) {
      case "gemini":
      case "google": {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(cleanKey)}`;
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        const latencyMs = Date.now() - startTime;

        if (res.ok) {
          return { valid: true, message: "Gemini API key validated successfully.", latencyMs };
        }
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData?.error?.message || "Invalid API key";
        return { valid: false, message: `Google Gemini rejected key: ${errMsg}`, latencyMs };
      }

      case "groq": {
        const res = await fetch("https://api.groq.com/openai/v1/models", {
          headers: { Authorization: `Bearer ${cleanKey}` },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const latencyMs = Date.now() - startTime;

        if (res.ok) {
          return { valid: true, message: "Groq API key validated successfully.", latencyMs };
        }
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData?.error?.message || "Invalid API key";
        return { valid: false, message: `Groq rejected key: ${errMsg}`, latencyMs };
      }

      case "openai": {
        const res = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${cleanKey}` },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const latencyMs = Date.now() - startTime;

        if (res.ok) {
          return { valid: true, message: "OpenAI API key validated successfully.", latencyMs };
        }
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData?.error?.message || "Invalid API key";
        return { valid: false, message: `OpenAI rejected key: ${errMsg}`, latencyMs };
      }

      case "claude":
      case "anthropic": {
        const res = await fetch("https://api.anthropic.com/v1/models", {
          headers: {
            "x-api-key": cleanKey,
            "anthropic-version": "2023-06-01"
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const latencyMs = Date.now() - startTime;

        if (res.ok) {
          return { valid: true, message: "Claude API key validated successfully.", latencyMs };
        }
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData?.error?.message || "Invalid API key";
        return { valid: false, message: `Anthropic rejected key: ${errMsg}`, latencyMs };
      }

      case "deepseek": {
        const res = await fetch("https://api.deepseek.com/models", {
          headers: { Authorization: `Bearer ${cleanKey}` },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const latencyMs = Date.now() - startTime;

        if (res.ok) {
          return { valid: true, message: "DeepSeek API key validated successfully.", latencyMs };
        }
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData?.error?.message || "Invalid API key";
        return { valid: false, message: `DeepSeek rejected key: ${errMsg}`, latencyMs };
      }

      case "openrouter": {
        const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
          headers: { Authorization: `Bearer ${cleanKey}` },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const latencyMs = Date.now() - startTime;

        if (res.ok) {
          return { valid: true, message: "OpenRouter API key validated successfully.", latencyMs };
        }
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData?.error?.message || "Invalid API key";
        return { valid: false, message: `OpenRouter rejected key: ${errMsg}`, latencyMs };
      }

      default:
        clearTimeout(timeoutId);
        return { valid: true, message: `${provider} key format accepted.` };
    }
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    // Gracefully handle abort or network errors in offline/dev environments
    if (error.name === "AbortError" || error.code === "ENOTFOUND" || error.cause?.code === "ENOTFOUND") {
      console.warn(`[VALIDATOR] Network check for ${provider} timed out or offline; falling back to format check.`);
      return {
        valid: true,
        message: `${provider} key format accepted (remote validation unreachable).`,
        latencyMs,
        isWarning: true
      };
    }

    return {
      valid: false,
      message: `Failed to validate ${provider} key: ${error.message || "Connection error"}.`,
      latencyMs
    };
  }
}
