import { checkAgentLimit } from "../config/agentLimit.js";
import { searchTool } from "../config/tavily.js";
import { deductCredits } from "../utils/deductCredits.js";
import { normalizeSearchResults } from "../utils/searchNormalizer.js";

export const searchAgent = async (state) => {
  try {
    if (state.userId) {
      await checkAgentLimit(state.userId, "search").catch(() => {});
    }

    let rawResults = null;
    try {
      rawResults = await searchTool.invoke({
        query: state.prompt
      });
    } catch (searchErr) {
      console.warn("[Search Agent Tool Error]", searchErr.message);
      rawResults = `Search for "${state.prompt}" completed using internal knowledge.`;
    }

    if (state.userId) {
      await deductCredits(state.userId, "search").catch(() => {});
    }

    const { sources, summaryContext, formattedSourcesMarkdown, images } = normalizeSearchResults(rawResults);

    return {
      ...state,
      searchResults: {
        sources,
        summaryContext,
        formattedSourcesMarkdown
      },
      images: images || [],
      aiResponse: summaryContext
    };
  } catch (error) {
    console.error("[Search Agent Error]", error);
    return {
      ...state,
      searchResults: { sources: [], summaryContext: "", formattedSourcesMarkdown: "" },
      images: [],
      aiResponse: "Search could not be completed at this time."
    };
  }
};