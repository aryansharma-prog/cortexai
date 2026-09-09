/**
 * Model Pricing Configuration (in USD per 1,000,000 tokens)
 * Standard pricing references for cost estimation.
 */
export const MODEL_PRICING = {
  "openai/gpt-oss-120b": {
    inputPerMillion: 0.15,
    outputPerMillion: 0.60,
    provider: "groq"
  },
  "llama-3.3-70b-versatile": {
    inputPerMillion: 0.59,
    outputPerMillion: 0.79,
    provider: "groq"
  },
  "gemini-2.5-flash": {
    inputPerMillion: 0.075,
    outputPerMillion: 0.30,
    provider: "google"
  },
  "gemini-1.5-flash": {
    inputPerMillion: 0.075,
    outputPerMillion: 0.30,
    provider: "google"
  },
  "gemini-1.5-pro": {
    inputPerMillion: 1.25,
    outputPerMillion: 5.00,
    provider: "google"
  },
  "deepseek/deepseek-chat": {
    inputPerMillion: 0.14,
    outputPerMillion: 0.28,
    provider: "openrouter"
  },
  "deepseek/deepseek-r1": {
    inputPerMillion: 0.55,
    outputPerMillion: 2.19,
    provider: "openrouter"
  }
};

/**
 * Calculate estimated cost based on model and token counts.
 * Returns null if model pricing is not configured or token count is missing.
 */
export const calculateCost = (modelName, inputTokens, outputTokens) => {
  if (!modelName || inputTokens === null || inputTokens === undefined || outputTokens === null || outputTokens === undefined) {
    return null;
  }

  const key = Object.keys(MODEL_PRICING).find(k => 
    modelName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(modelName.toLowerCase())
  );
  
  if (!key) {
    return null;
  }

  const pricing = MODEL_PRICING[key];
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillion;
  const totalCost = Number((inputCost + outputCost).toFixed(6));

  return totalCost;
};
