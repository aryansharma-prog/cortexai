import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getModelWithMeta } from "../config/llmModels.js";
import { invokeWithTracking } from "../observability/usageTracker.js";
import { deductCredits } from "../utils/deductCredits.js";
import { checkAgentLimit } from "../config/agentLimit.js";

/**
 * Comparison Agent
 * Specializes in multi-entity benchmarking, side-by-side trade-offs, feature matrices, and comparative synthesis.
 */
export const comparisonAgent = async (state, subtask = {}) => {
  const agentId = "comparison";
  const subtaskId = subtask.id || "comparison";

  try {
    if (state.userId) {
      await checkAgentLimit(state.userId, "chat").catch(() => {});
    }

    const { llm, modelName, provider } = await getModelWithMeta("comparison");

    const context = subtask.context || "";
    const subtaskPrompt = subtask.description || state.prompt;

    const systemPrompt = `You are CortexAI Comparative Analysis Agent, an expert in comparative benchmarking, competitive landscape assessment, and trade-off analysis.

Guidelines:
- Compare the requested subjects across key dimensions (e.g., market share, performance, financial metrics, architecture, pros/cons).
- Use structured comparison tables where effective.
- Provide objective, balanced verdicts supported by data.
- Avoid vague statements; highlight concrete differentiators.

Prior Research & Analysis Context:
${context ? context : "No prior subtask context provided."}`;

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(`Execute this comparative task: ${subtaskPrompt}`)
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
    console.error(`[comparisonAgent error]`, error);
    return {
      agentId,
      subtaskId,
      status: "failed",
      output: null,
      error: error.message || "Failed to execute comparison",
      metrics: {
        agentId,
        status: "failed",
        error: error.message || "Failed to execute comparison",
        durationMs: 0
      }
    };
  }
};
