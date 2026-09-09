/**
 * LangGraph Router
 * Distinguishes between manual explicit agent selection, file safety routing,
 * and adaptive multi-agent orchestration for "auto" mode.
 */
export const router = async (state) => {
  const requestedAgent = (state.agent || "auto").toLowerCase().trim();

  // 1. Explicit manual agent selection preserves dedicated single-agent behavior
  if (requestedAgent !== "auto") {
    return {
      ...state,
      agent: requestedAgent
    };
  }

  // 2. Direct file safety checks if a file is present
  if (state.file) {
    if (state.file.mimetype === "application/pdf") {
      return {
        ...state,
        agent: "pdfRag"
      };
    }

    if (state.file.mimetype && state.file.mimetype.startsWith("image/")) {
      return {
        ...state,
        agent: "imageAnalyzer"
      };
    }
  }

  // 3. Auto mode defaults to the intelligent Adaptive Orchestrator
  return {
    ...state,
    agent: "adaptiveOrchestrator"
  };
};