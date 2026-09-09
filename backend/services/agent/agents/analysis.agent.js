import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getModelWithMeta } from "../config/llmModels.js";
import { invokeWithTracking } from "../observability/usageTracker.js";
import { deductCredits } from "../utils/deductCredits.js";
import { checkAgentLimit } from "../config/agentLimit.js";

/**
 * Analysis Agent
 * Specializes in in-depth domain analysis, financial calculations, market dynamics, and deep-dive evaluation.
 */
export const analysisAgent = async (state, subtask = {}) => {
  const agentId = "analysis";
  const subtaskId = subtask.id || "analysis";

  try {
    if (state.userId) {
      await checkAgentLimit(state.userId, "chat").catch(() => {});
    }

    const { llm, modelName, provider } = await getModelWithMeta("analysis");

    const context = subtask.context || (state.searchResults ? JSON.stringify(state.searchResults) : "");
    const subtaskPrompt = subtask.description || state.prompt;

    const systemPrompt = `You are CortexAI Deep Analysis Agent, an expert in analytical reasoning, financial analysis, technical evaluation, and data interpretation.

Guidelines:
- Deliver precise, structured analytical assessments.
- Highlight quantitative metrics, market dynamics, strengths, risks, and strategic implications where relevant.
- Do NOT fabricate facts. Rely on provided contextual findings or standard domain principles.
- Use clean Markdown with clear headings and bullet points.

Contextual Data:
${context ? context : "No external search context provided."}`;

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(`Perform the following analysis: ${subtaskPrompt}`)
    ];

    const { response, metrics } = await invokeWithTracking(llm, messages, {
      agentId,
      modelName,
      provider,
      conversationId: state.conversationId,
      userId: state.userId
    });

    if (state.userId) {
      await deductCredits(state.userId, "chat").catch(() => {});
    }

    return {
      agentId,
      subtaskId,
      status: "completed",
      output: response.content,
      metrics
    };
  } catch (error) {
    console.error(`[analysisAgent error]`, error);
    return {
      agentId,
      subtaskId,
      status: "failed",
      output: null,
      error: error.message || "Failed to complete analysis",
      metrics: {
        agentId,
        status: "failed",
        error: error.message || "Failed to complete analysis",
        durationMs: 0
      }
    };
  }
};
