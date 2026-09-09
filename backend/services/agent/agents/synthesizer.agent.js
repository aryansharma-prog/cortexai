import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getModelWithMeta, getFallbackModelWithMeta } from "../config/llmModels.js";
import { invokeWithTracking } from "../observability/usageTracker.js";
import { normalizeSearchResults } from "../utils/searchNormalizer.js";

/**
 * Final Synthesizer Agent
 * Aggregates all multi-agent outputs, verified facts, web research, and subtask analyses
 * into an executive-grade, structured, comprehensive response.
 */
export const synthesizeMultiAgentResults = async ({
  userPrompt,
  agentOutputs = [],
  searchResults = null,
  taskAnalysis = null,
  conversationId = null,
  userId = null,
  executionId = null
}) => {
  const agentId = "synthesizer";

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

  const systemPrompt = `You are CortexAI Executive Research & Synthesis Engine.
Your job is to transform multi-agent findings and verified research data into a polished, authoritative, highly structured final report.

RESPONSE STRUCTURE REQUIREMENTS:
1. Executive Summary: Provide a direct, high-impact summary of key findings.
2. Structured Overview / Comparisons:
   - If comparing items (e.g. Electric vs CNG, College Rankings, Company Metrics, Algorithms), ALWAYS include clean, well-aligned Markdown tables with concrete numbers, metrics, and parameters.
3. Detailed Thematic Sections:
   - Use clear ## Headings and ### Subsections.
   - Use bullet points for feature breakdowns, regional adoption, or technical details.
4. Key Insights & Strategic Takeaways:
   - Provide numbered, actionable takeaways (1., 2., 3.).
5. Strict Cleanliness Rules:
   - NEVER output raw JSON, internal search scores, request IDs, tool IDs, or debug traces.
   - Do NOT include internal agent metadata or chain-of-thought commentary.
   - If any generated assets (PDF, PPT, Images) are present in the findings, preserve their download links cleanly under a "📁 Generated Assets & Downloads" section at the end.`;

  const userMessageContent = `User Inquiry:
${userPrompt}

Collected Agent Subtask Findings:
${cleanedSubtaskOutputs || "No direct subtask findings."}

${searchSummaryText ? `Verified Research Context:\n${searchSummaryText}` : ""}

Please generate the comprehensive, beautifully structured executive research report following the required structure.`;

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

    // Append formatted sources cleanly at the bottom if available and not already included
    if (formattedSourcesSection && !finalOutput.includes("Verified Sources & References") && !finalOutput.includes("### 📚 Sources")) {
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
      if (formattedSourcesSection && !finalOutput.includes("Verified Sources & References") && !finalOutput.includes("### 📚 Sources")) {
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
