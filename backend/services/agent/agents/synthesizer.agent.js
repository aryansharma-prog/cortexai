import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getModelWithMeta, getFallbackModelWithMeta } from "../config/llmModels.js";
import { invokeWithTracking } from "../observability/usageTracker.js";
import { normalizeSearchResults } from "../utils/searchNormalizer.js";

/**
 * Generates an adaptive system prompt based on the Response Policy.
 */
const buildAdaptiveSystemPrompt = (responsePolicy = {}) => {
  const depth = responsePolicy.depth || "FOCUSED";
  const targetTokens = responsePolicy.targetTokens || 350;
  const maxTokens = responsePolicy.maxTokens || 750;

  let prompt = `You are CortexAI Adaptive Response & Synthesis Engine.\n`;

  switch (depth) {
    case "MINIMAL":
      prompt += `POLICY LEVEL: MINIMAL (Direct, highly concise answer)
TARGET LENGTH: ~${targetTokens} tokens (Max: ${maxTokens} tokens).

CRITICAL INSTRUCTIONS:
1. Provide the direct, accurate answer to the user's question in 1 to 2 clear sentences.
2. Provide ONLY the minimum sufficient information necessary to fully satisfy the user's inquiry.
3. STRICTLY PROHIBITED (DO NOT INCLUDE):
   - Executive Summary
   - Structured Overview or Headings
   - Markdown Tables
   - Historical Context or Timeline
   - Demographic / Geographic / Administrative trivia
   - Key Insights & Strategic Takeaways
   - Generic conclusions or recommendations
4. Tone: Natural, crisp, direct, factual.`;
      break;

    case "SHORT":
      prompt += `POLICY LEVEL: SHORT (Concise summary/explanation)
TARGET LENGTH: ~${targetTokens} tokens (Max: ${maxTokens} tokens).

CRITICAL INSTRUCTIONS:
1. Provide a concise, clear explanation or answer (1 to 2 short paragraphs).
2. If this is a coding question, provide the corrected code snippet and a 1-2 sentence explanation of the fix.
3. At most one short example or calculation breakdown if strictly necessary.
4. DO NOT add unnecessary headings, executive summaries, strategic takeaways, or extensive background.`;
      break;

    case "FOCUSED":
      prompt += `POLICY LEVEL: FOCUSED (Structured, relevant, and clean)
TARGET LENGTH: ~${targetTokens} tokens (Max: ${maxTokens} tokens).

CRITICAL INSTRUCTIONS:
1. Provide a well-structured, focused response directly answering the prompt.
2. Use concise Markdown headings (##) and bullet points where helpful.
3. If comparing concepts or options, provide a compact, clean Markdown table with concrete metrics.
4. Keep the content strictly relevant to the question—exclude conversational filler and speculative fluff.`;
      break;

    case "DETAILED":
    default:
      prompt += `POLICY LEVEL: DETAILED (Comprehensive Executive Report)
TARGET LENGTH: ~${targetTokens}+ tokens (Max: ${maxTokens} tokens).

RESPONSE STRUCTURE REQUIREMENTS:
1. Executive Summary: Provide a direct, high-impact summary of key findings.
2. Structured Overview / Comparisons:
   - If comparing items, include clean, well-aligned Markdown tables with concrete numbers, metrics, and parameters.
3. Detailed Thematic Sections:
   - Use clear ## Headings and ### Subsections.
   - Use bullet points for feature breakdowns, regional adoption, or technical details.
4. Key Insights & Strategic Takeaways:
   - Provide numbered, actionable takeaways (1., 2., 3.).`;
      break;
  }

  prompt += `\n
STRICT CLEANLINESS RULES:
- NEVER output raw JSON, internal search scores, request IDs, tool IDs, or debug traces.
- Do NOT include internal agent metadata or chain-of-thought commentary.
- If any generated assets (PDF, PPT, Images) are present in the findings, preserve their download links cleanly under a "📁 Generated Assets & Downloads" section at the end.`;

  return prompt;
};

/**
 * Final Synthesizer Agent
 * Aggregates all multi-agent outputs, verified facts, web research, and subtask analyses
 * into an adaptive response adhering strictly to the assigned Response Policy.
 */
export const synthesizeMultiAgentResults = async ({
  userPrompt,
  agentOutputs = [],
  searchResults = null,
  taskAnalysis = null,
  responsePolicy = null,
  conversationId = null,
  userId = null,
  executionId = null
}) => {
  const agentId = "synthesizer";

  // Fallback default policy if not provided
  const policy = responsePolicy || {
    depth: "FOCUSED",
    mode: "STRUCTURED",
    targetTokens: 350,
    maxTokens: 750,
    allowSections: true,
    allowTables: true,
    allowExamples: true,
    allowSources: true
  };

  // Normalize search context
  let searchSummaryText = "";
  let formattedSourcesSection = "";

  if (searchResults) {
    if (typeof searchResults === "object" && searchResults.summaryContext) {
      searchSummaryText = searchResults.summaryContext;
      formattedSourcesSection = searchResults.formattedSourcesMarkdown || "";
    } else {
      const normalized = normalizeSearchResults(searchResults);
      searchSummaryText = normalized.summaryContext;
      formattedSourcesSection = normalized.formattedSourcesMarkdown;
    }
  }

  // Filter and clean subtask outputs
  const cleanedSubtaskOutputs = agentOutputs
    .filter(o => o.status === "completed" && o.output)
    .map(o => {
      let text = String(o.output).trim();
      // Remove raw JSON search dumps if present
      text = text.replace(/\{\s*"query":[\s\S]*"results":\s*\[[\s\S]*\]\s*\}/g, "");
      return `### Contribution from ${o.name || o.agentId}:\n${text}`;
    })
    .filter(Boolean)
    .join("\n\n---\n\n");

  const systemPrompt = buildAdaptiveSystemPrompt(policy);

  const userMessageContent = `User Inquiry:
${userPrompt}

Collected Agent Subtask Findings:
${cleanedSubtaskOutputs || "No direct subtask findings."}

${searchSummaryText ? `Verified Research Context:\n${searchSummaryText}` : ""}

Please generate the final response adhering strictly to the assigned ${policy.depth} policy:`;

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(userMessageContent)
  ];

  try {
    const { llm, modelName, provider } = await getModelWithMeta("synthesizer");

    const { response, metrics } = await invokeWithTracking(llm, messages, {
      agentId,
      modelName,
      provider,
      conversationId,
      userId
    });

    let finalOutput = response.content;

    // Append formatted sources cleanly if allowed by policy and available
    if (policy.allowSources && formattedSourcesSection && !finalOutput.includes("Verified Sources & References") && !finalOutput.includes("### 📚 Sources")) {
      finalOutput = `${finalOutput}\n\n---\n\n${formattedSourcesSection}`;
    }

    return {
      output: finalOutput,
      metrics
    };
  } catch (error) {
    console.warn("[Synthesizer primary model error, attempting fallback to Gemini]", error.message);

    try {
      const { llm: fallbackLlm, modelName: fbModel, provider: fbProvider } = await getFallbackModelWithMeta();
      const { response: fbResponse, metrics: fbMetrics } = await invokeWithTracking(fallbackLlm, messages, {
        agentId,
        modelName: fbModel,
        provider: fbProvider,
        conversationId,
        userId
      });

      let finalOutput = fbResponse.content;
      if (policy.allowSources && formattedSourcesSection && !finalOutput.includes("Verified Sources & References") && !finalOutput.includes("### 📚 Sources")) {
        finalOutput = `${finalOutput}\n\n---\n\n${formattedSourcesSection}`;
      }

      return {
        output: finalOutput,
        metrics: fbMetrics
      };
    } catch (fallbackError) {
      console.error("[Synthesizer fallback error, direct formatted merge]", fallbackError);

      if (fallbackError.message?.includes("429") || error.message?.includes("429")) {
        return {
          output: "⚠️ Research service is temporarily experiencing high demand (rate limited). Please retry in a few moments.",
          metrics: { agentId, status: "failed", error: "Rate limit reached", durationMs: 0 }
        };
      }

      const directMerge = agentOutputs
        .filter(o => o.status === "completed" && o.output)
        .map(o => String(o.output).replace(/\{\s*"query":[\s\S]*"results":\s*\[[\s\S]*\]\s*\}/g, "").trim())
        .filter(Boolean)
        .join("\n\n---\n\n");

      return {
        output: directMerge || "Completed research execution.",
        metrics: {
          agentId,
          status: "completed_with_fallback",
          durationMs: 0
        }
      };
    }
  }
};
