import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getModelWithMeta } from "../config/llmModels.js";
import { getMemory } from "../config/memory.js";
import { deductCredits } from "../utils/deductCredits.js";
import { checkAgentLimit } from "../config/agentLimit.js";
import { invokeWithTracking } from "../observability/usageTracker.js";

export const chatAgent = async (state) => {
  try {
    if (state.userId) {
      await checkAgentLimit(state.userId, "chat").catch(() => {});
    }

    const { llm, modelName, provider } = await getModelWithMeta("chat");
    const history = state.conversationId ? (await getMemory(state.conversationId).catch(() => [])) : [];

    const searchContext = state.searchResults
      ? `\nWeb Search Results:\n${typeof state.searchResults === "string" ? state.searchResults : JSON.stringify(state.searchResults)}\n\nAnswer the user using only the above search results.\n`
      : "";

    const systemPrompt = `You are CortexAI, an intelligent AI assistant.

${searchContext}

${searchContext ? "If searchContext exists:\n- Use search results to answer.\n- Do not mention internal tools.\n" : ""}
Rules:
- For simple questions, greetings, and short queries, respond naturally in plain text.
- For technical, educational, coding, or detailed topics, use clean Markdown.

Formatting:
- Use # for titles and ## for sections.
- Leave a blank line after headings.
- Use bullet points for lists.
- Use numbered lists for steps.
- Use fenced code blocks with language tags for code.
- Keep paragraphs short and readable.
- Never write headings and content on the same line.
- Never generate large walls of text.`;

    const messages = [new SystemMessage(systemPrompt)];

    if (Array.isArray(history)) {
      history.forEach((msg) => {
        if (msg.role === "user") {
          messages.push(new HumanMessage(msg.content));
        }
        if (msg.role === "assistant") {
          messages.push(new AIMessage(msg.content));
        }
      });
    }

    messages.push(new HumanMessage(state.prompt));

    const { response, metrics } = await invokeWithTracking(llm, messages, {
      agentId: "chat",
      modelName,
      provider,
      conversationId: state.conversationId,
      userId: state.userId
    });

    if (state.userId) {
      await deductCredits(state.userId, "chat").catch(() => {});
    }

    return {
      ...state,
      aiResponse: response.content,
      metrics
    };
  } catch (error) {
    console.error("[chatAgent error]", error);
    return {
      ...state,
      aiResponse: error?.data?.message || error?.message || "failed to generate chat"
    };
  }
};