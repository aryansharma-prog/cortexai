import api from '../../utils/axios';

/**
 * Sends research/chat request to backend with AbortController signal support.
 * @param {FormData|Object} payload 
 * @param {AbortSignal} [signal] 
 * @returns {Promise<Object|null>}
 */
async function sendMessage(payload, signal = null) {
  try {
    const config = {
      withCredentials: true
    };
    if (signal) {
      config.signal = signal;
    }

    const { data } = await api.post("/api/agent/chat", payload, config);
    return data;
  } catch (error) {
    if (error.name === "CanceledError" || error.code === "ERR_CANCELED" || signal?.aborted) {
      console.log("[sendMessage] Request cancelled by user via AbortController.");
      return {
        status: "cancelled",
        answer: "Research was stopped by user.",
        isCancelled: true
      };
    }

    console.error("[sendMessage Error]", error);
    const serverMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message;
    return {
      status: "error",
      answer: serverMessage ? `⚠️ Server response: ${serverMessage}` : null,
      error: serverMessage
    };
  }
}

/**
 * Sends explicit cancellation request to backend task manager.
 * @param {string} executionId 
 */
export async function cancelExecutionRequest(executionId) {
  if (!executionId) return;
  try {
    await api.post(`/api/agent/executions/${executionId}/cancel`, { executionId });
    console.log(`[cancelExecutionRequest] Backend task ${executionId} cancellation requested.`);
  } catch (err) {
    console.warn(`[cancelExecutionRequest] Warning:`, err.message);
  }
}

export default sendMessage;
