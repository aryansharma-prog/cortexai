import { calculateCost } from "./pricing.js";

/**
 * Normalizes token usage across various LLM providers and LangChain wrappers.
 * Inspects usage_metadata, response_metadata, additional_kwargs, etc.
 * Returns null for missing fields without inventing counts.
 */
export const normalizeUsage = (response) => {
  if (!response) {
    return { inputTokens: null, outputTokens: null, totalTokens: null };
  }

  // 1. LangChain standard usage_metadata (AIMessage)
  if (response.usage_metadata) {
    const u = response.usage_metadata;
    const input = u.input_tokens ?? u.prompt_tokens ?? u.promptTokens ?? null;
    const output = u.output_tokens ?? u.completion_tokens ?? u.completionTokens ?? null;
    const total = u.total_tokens ?? u.totalTokens ?? (input !== null && output !== null ? input + output : null);

    if (input !== null || output !== null || total !== null) {
      return {
        inputTokens: typeof input === "number" ? input : null,
        outputTokens: typeof output === "number" ? output : null,
        totalTokens: typeof total === "number" ? total : null
      };
    }
  }

  // 2. response_metadata (Groq, OpenRouter, Google GenAI, etc.)
  const rm = response.response_metadata || {};
  const tokenUsage = rm.tokenUsage || rm.usage || rm.usageMetadata || {};

  const input = tokenUsage.promptTokens ?? 
                tokenUsage.prompt_tokens ?? 
                tokenUsage.promptTokenCount ?? 
                tokenUsage.input_tokens ?? 
                null;

  const output = tokenUsage.completionTokens ?? 
                 tokenUsage.completion_tokens ?? 
                 tokenUsage.candidatesTokenCount ?? 
                 tokenUsage.output_tokens ?? 
                 null;

  const total = tokenUsage.totalTokens ?? 
                tokenUsage.total_tokens ?? 
                tokenUsage.totalTokenCount ?? 
                (input !== null && output !== null ? input + output : null);

  if (input !== null || output !== null || total !== null) {
    return {
      inputTokens: typeof input === "number" ? input : null,
      outputTokens: typeof output === "number" ? output : null,
      totalTokens: typeof total === "number" ? total : null
    };
  }

  // 3. additional_kwargs
  const ak = response.additional_kwargs || {};
  const akUsage = ak.usage || ak.tokenUsage || {};
  const akInput = akUsage.prompt_tokens ?? akUsage.input_tokens ?? null;
  const akOutput = akUsage.completion_tokens ?? akUsage.output_tokens ?? null;
  const akTotal = akUsage.total_tokens ?? (akInput !== null && akOutput !== null ? akInput + akOutput : null);

  if (akInput !== null || akOutput !== null || akTotal !== null) {
    return {
      inputTokens: typeof akInput === "number" ? akInput : null,
      outputTokens: typeof akOutput === "number" ? akOutput : null,
      totalTokens: typeof akTotal === "number" ? akTotal : null
    };
  }

  return { inputTokens: null, outputTokens: null, totalTokens: null };
};

/**
 * Executes an LLM invocation with latency, token, and cost tracking.
 * Accepts both options object and (modelName, agentId) parameter signatures.
 *
 * @param {Object} llm - The LangChain model instance
 * @param {any} input - Prompt string or messages array
 * @param {Object|string} optionsOrModelName - { agentId, modelName, provider, conversationId, userId } or modelName string
 * @param {string} [maybeAgentName="unknown"] - Agent identifier if 3rd param was a string
 * @returns {Promise<{ response: any, metrics: Object, usage: Object }>}
 */
export const invokeWithTracking = async (llm, input, optionsOrModelName = {}, maybeAgentName = "unknown") => {
  let agentId = "unknown";
  let modelName = llm?.model || llm?.modelName || "unknown";
  let provider = llm?.provider || "unknown";
  let conversationId = null;
  let userId = null;

  if (typeof optionsOrModelName === "string") {
    modelName = optionsOrModelName;
    agentId = maybeAgentName;
  } else if (typeof optionsOrModelName === "object" && optionsOrModelName !== null) {
    agentId = optionsOrModelName.agentId || agentId;
    modelName = optionsOrModelName.modelName || optionsOrModelName.model || modelName;
    provider = optionsOrModelName.provider || provider;
    conversationId = optionsOrModelName.conversationId || null;
    userId = optionsOrModelName.userId || null;
  }

  const startTime = Date.now();
  let success = true;
  let error = null;
  let response = null;

  try {
    if (!llm || typeof llm.invoke !== "function") {
      throw new Error(`Invalid LLM instance provided to invokeWithTracking (agent: ${agentId})`);
    }
    response = await llm.invoke(input);
  } catch (err) {
    success = false;
    error = err.message || String(err);

    // Extract HTTP status and provider error details safely without leaking API keys
    const status = err?.status || err?.statusCode || err?.response?.status || 500;
    const providerErrorMessage = err?.error?.message || err?.response?.data?.error?.message || err?.message || String(err);

    console.error(`[LLM_ERROR] Service: agent-service | Provider: ${provider} | Model: ${modelName} | Status: ${status} | Error: ${providerErrorMessage}`);

    throw err;
  } finally {
    const endTime = Date.now();
    const durationMs = endTime - startTime;
    const usage = normalizeUsage(response);
    const estimatedCost = calculateCost(modelName, usage.inputTokens, usage.outputTokens);

    const metrics = {
      agentId,
      model: modelName,
      provider,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalTokens: usage.totalTokens,
      durationMs,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date(endTime).toISOString(),
      estimatedCost,
      success,
      error,
      conversationId,
      userId
    };

    if (response) {
      response._metrics = metrics;
    }
  }

  return {
    response,
    metrics: response?._metrics,
    usage: normalizeUsage(response)
  };
};

/**
 * Aggregates workflow-level metrics from a list of agent execution metrics.
 */
export const aggregateWorkflowMetrics = (agentExecutions = []) => {
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalTokens = 0;
  let hasTokenData = false;
  let totalDurationMs = 0;
  let totalCost = 0;
  let hasCostData = false;

  agentExecutions.forEach(exec => {
    if (exec.inputTokens !== null && exec.inputTokens !== undefined) {
      totalInputTokens += exec.inputTokens;
      hasTokenData = true;
    }
    if (exec.outputTokens !== null && exec.outputTokens !== undefined) {
      totalOutputTokens += exec.outputTokens;
      hasTokenData = true;
    }
    if (exec.totalTokens !== null && exec.totalTokens !== undefined) {
      totalTokens += exec.totalTokens;
      hasTokenData = true;
    }
    if (exec.durationMs) {
      totalDurationMs += exec.durationMs;
    }
    if (exec.estimatedCost !== null && exec.estimatedCost !== undefined) {
      totalCost += exec.estimatedCost;
      hasCostData = true;
    }
  });

  return {
    totalAgents: agentExecutions.length,
    completedAgents: agentExecutions.filter(e => e.status === "completed").length,
    failedAgents: agentExecutions.filter(e => e.status === "failed").length,
    inputTokens: hasTokenData ? totalInputTokens : null,
    outputTokens: hasTokenData ? totalOutputTokens : null,
    totalTokens: hasTokenData ? totalTokens : null,
    totalDurationMs,
    totalDurationSec: Number((totalDurationMs / 1000).toFixed(2)),
    estimatedCost: hasCostData ? Number(totalCost.toFixed(6)) : null
  };
};
