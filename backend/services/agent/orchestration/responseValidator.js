import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getModelWithMeta, getFallbackModelWithMeta } from "../config/llmModels.js";
import { invokeWithTracking } from "../observability/usageTracker.js";

/**
 * Lightweight token estimation utility (~4 characters per token average).
 */
export const estimateTokenCount = (text = "") => {
  if (!text || typeof text !== "string") return 0;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const charCount = text.length;
  // Blend word count * 1.33 and char count / 4
  return Math.max(1, Math.round((wordCount * 1.3 + charCount / 4) / 2));
};

/**
 * Checks if a response violates the assigned response policy constraints.
 */
export const checkPolicyViolation = (responseText = "", policy = {}) => {
  if (!responseText || !policy) return { violates: false, reason: null };

  const estimatedTokens = estimateTokenCount(responseText);
  const maxTokens = policy.maxTokens || 1000;
  const depth = policy.depth || "FOCUSED";

  // Check 1: Significant token overshoot (exceeds maxTokens by 25% or more)
  if (estimatedTokens > maxTokens * 1.25) {
    return {
      violates: true,
      reason: `Token count (${estimatedTokens}) exceeds max budget (${maxTokens}) for ${depth} depth.`,
      estimatedTokens
    };
  }

  // Check 2: Forbidden executive/fluff sections in MINIMAL or SHORT responses
  if (!policy.allowExecutiveSummary || !policy.allowStrategicInsights || !policy.allowSections) {
    const hasForbiddenHeaders = /(?:^|\n)##\s*(?:Executive Summary|Structured Overview|Strategic Takeaways|Key Insights|Historical Context|Demographic Details|Administrative Significance)/i.test(responseText);
    if (hasForbiddenHeaders && (depth === "MINIMAL" || depth === "SHORT")) {
      return {
        violates: true,
        reason: `Generated response contains forbidden report sections (Executive Summary / Overviews) for ${depth} policy.`,
        estimatedTokens
      };
    }
  }

  return { violates: false, reason: null, estimatedTokens };
};

/**
 * Performs targeted semantic compression when a synthesized response
 * violates the assigned Response Policy.
 * 
 * Never truncates blindly with .substring()!
 */
export const validateAndRefineResponse = async ({
  rawResponse = "",
  responsePolicy = {},
  prompt = "",
  conversationId = null,
  userId = null
}) => {
  if (!rawResponse || typeof rawResponse !== "string") {
    return {
      output: rawResponse,
      compressionTriggered: false,
      originalTokens: 0,
      finalTokens: 0
    };
  }

  const violation = checkPolicyViolation(rawResponse, responsePolicy);
  const originalTokens = violation.estimatedTokens || estimateTokenCount(rawResponse);

  if (!violation.violates) {
    return {
      output: rawResponse,
      compressionTriggered: false,
      originalTokens,
      finalTokens: originalTokens
    };
  }

  console.log(`[ResponseValidator] Policy violation detected: ${violation.reason}. Initiating semantic compression...`);

  const compressionSystemPrompt = `You are CortexAI Response Compression & Refinement Engine.
Your task is to refine and condense a verbose draft answer into a clean, direct, high-quality response strictly matching the assigned response policy.

ASSIGNED POLICY:
- Depth: ${responsePolicy.depth || "MINIMAL"}
- Target Tokens: ~${responsePolicy.targetTokens || 40} tokens
- Max Tokens: ${responsePolicy.maxTokens || 100} tokens
- Allowed Sections: ${responsePolicy.allowSections ? "YES" : "NO"}
- Allowed Tables: ${responsePolicy.allowTables ? "YES" : "NO"}
- Allowed Examples: ${responsePolicy.allowExamples ? "YES (max 1 brief)" : "NO"}
- Verbosity: ${responsePolicy.verbosity || "LOW"}

STRICT REFINEMENT RULES:
1. PRESERVE:
   - The direct, factual, and correct answer to the user's inquiry.
   - Essential reasoning or mathematical calculations.
   - Required code snippets (if this is a coding task).
   - Any necessary download links, citations, or sources.
2. ELIMINATE:
   - "Executive Summary", "Structured Overview", "Strategic Takeaways", "Key Insights" headings.
   - Historical background, demographic trivia, and unsolicited context.
   - Repetition, conversational filler, and generic conclusions.
3. FORMAT:
   - If depth is MINIMAL: Answer directly in 1-2 concise, clear sentences. No headings or tables.
   - If depth is SHORT: 1 short paragraph, at most 1 brief code/example if strictly necessary.
   - If depth is FOCUSED: Compact bullet points or focused explanation without fluff.
   - Natural, crisp, professional output.`;

  const compressionUserPrompt = `User's Original Inquiry:
${prompt}

Draft Response (Too verbose / structurally misaligned):
${rawResponse}

Please provide the refined, appropriately sized final answer adhering strictly to the ${responsePolicy.depth} policy:`;

  const messages = [
    new SystemMessage(compressionSystemPrompt),
    new HumanMessage(compressionUserPrompt)
  ];

  try {
    const { llm, modelName, provider } = await getModelWithMeta("synthesizer");
    const { response, metrics } = await invokeWithTracking(llm, messages, {
      agentId: "response_validator",
      modelName,
      provider,
      conversationId,
      userId
    });

    const compressedOutput = response.content?.trim() || rawResponse;
    const finalTokens = estimateTokenCount(compressedOutput);

    console.log(`[ResponseValidator] Compression complete. Tokens: ${originalTokens} -> ${finalTokens}`);

    return {
      output: compressedOutput,
      compressionTriggered: true,
      originalTokens,
      finalTokens,
      metrics
    };
  } catch (err) {
    console.warn("[ResponseValidator] Error during LLM compression, attempting fallback...", err.message);

    try {
      const { llm: fallbackLlm, modelName: fbModel, provider: fbProvider } = await getFallbackModelWithMeta();
      const { response: fbResponse, metrics: fbMetrics } = await invokeWithTracking(fallbackLlm, messages, {
        agentId: "response_validator",
        modelName: fbModel,
        provider: fbProvider,
        conversationId,
        userId
      });

      const compressedOutput = fbResponse.content?.trim() || rawResponse;
      const finalTokens = estimateTokenCount(compressedOutput);

      return {
        output: compressedOutput,
        compressionTriggered: true,
        originalTokens,
        finalTokens,
        metrics: fbMetrics
      };
    } catch (fallbackErr) {
      console.error("[ResponseValidator] Fallback compression failed. Returning raw response.", fallbackErr);
      return {
        output: rawResponse,
        compressionTriggered: false,
        originalTokens,
        finalTokens: originalTokens
      };
    }
  }
};
