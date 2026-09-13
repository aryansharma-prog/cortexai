/**
 * Failure Detection & Provider Health Tracker
 * Classifies runtime model/provider errors and maintains circuit-breaker health status
 * to prevent blind retries and facilitate intelligent failover.
 */

export const FAILURE_TYPES = {
  RATE_LIMIT: "RATE_LIMIT",
  KEY_CONFIGURATION: "KEY_CONFIGURATION",
  CAPABILITY_MISMATCH: "CAPABILITY_MISMATCH",
  RETRYABLE: "RETRYABLE",
  NON_RETRYABLE: "NON_RETRYABLE"
};

/**
 * In-memory provider health tracker
 * Map<string, { failureCount: number, status: string, cooldownUntil: number, lastError: string }>
 */
class ProviderHealthTracker {
  constructor() {
    this.healthMap = new Map();
  }

  getProviderKey(provider, userId = "global") {
    return `${provider.toLowerCase().trim()}:${userId}`;
  }

  /**
   * Classifies an error caught during model invocation.
   *
   * @param {Error|Object|string} error - The caught error
   * @returns {{ classification: string, status: number, reason: string, isRetryableSameProvider: boolean }}
   */
  classifyError(error) {
    if (!error) {
      return {
        classification: FAILURE_TYPES.NON_RETRYABLE,
        status: 500,
        reason: "Unknown error",
        isRetryableSameProvider: false
      };
    }

    const message = (error.message || error.error?.message || error.response?.data?.error?.message || String(error)).toLowerCase();
    const status = error.status || error.statusCode || error.response?.status || 500;

    // 1. Rate Limits & Quota Exhaustion
    if (
      status === 429 ||
      message.includes("429") ||
      message.includes("rate limit") ||
      message.includes("rate_limit") ||
      message.includes("quota") ||
      message.includes("resource_exhausted") ||
      message.includes("tpm") ||
      message.includes("rpm") ||
      message.includes("too many requests")
    ) {
      return {
        classification: FAILURE_TYPES.RATE_LIMIT,
        status: 429,
        reason: "Provider rate limit or quota exceeded",
        isRetryableSameProvider: false
      };
    }

    // 2. Key / Authentication Issues
    if (
      status === 401 ||
      status === 403 ||
      message.includes("api key") ||
      message.includes("unauthorized") ||
      message.includes("invalid key") ||
      message.includes("forbidden") ||
      message.includes("authentication") ||
      message.includes("permission_denied")
    ) {
      return {
        classification: FAILURE_TYPES.KEY_CONFIGURATION,
        status: 401,
        reason: "Invalid or unauthorized API key configuration",
        isRetryableSameProvider: false
      };
    }

    // 3. Capability / Context Limits
    if (
      message.includes("context length") ||
      message.includes("maximum context") ||
      message.includes("token limit") ||
      message.includes("unsupported modality") ||
      message.includes("vision not supported") ||
      message.includes("image input not supported")
    ) {
      return {
        classification: FAILURE_TYPES.CAPABILITY_MISMATCH,
        status: 400,
        reason: "Task requirements exceed model capability or context window",
        isRetryableSameProvider: false
      };
    }

    // 4. Temporary / Network / Gateway errors
    if (
      status === 502 ||
      status === 503 ||
      status === 504 ||
      message.includes("timeout") ||
      message.includes("econnreset") ||
      message.includes("etimedout") ||
      message.includes("network error") ||
      message.includes("service unavailable") ||
      message.includes("bad gateway") ||
      message.includes("gateway timeout")
    ) {
      return {
        classification: FAILURE_TYPES.RETRYABLE,
        status: status || 503,
        reason: "Temporary provider or network timeout",
        isRetryableSameProvider: true
      };
    }

    // 5. Default Non-Retryable
    return {
      classification: FAILURE_TYPES.NON_RETRYABLE,
      status,
      reason: message.slice(0, 150),
      isRetryableSameProvider: false
    };
  }

  /**
   * Records a failure and puts provider into cooldown if necessary.
   */
  recordFailure(provider, error, userId = "global") {
    const key = this.getProviderKey(provider, userId);
    const classification = this.classifyError(error);
    const existing = this.healthMap.get(key) || { failureCount: 0, status: "healthy", cooldownUntil: 0 };

    existing.failureCount += 1;
    existing.lastError = classification.reason;
    existing.lastClassification = classification.classification;
    existing.updatedAt = Date.now();

    if (classification.classification === FAILURE_TYPES.RATE_LIMIT) {
      // 60s cooldown for rate limits
      existing.status = "rate_limited";
      existing.cooldownUntil = Date.now() + 60 * 1000;
    } else if (classification.classification === FAILURE_TYPES.KEY_CONFIGURATION) {
      // 5 min cooldown for bad keys
      existing.status = "auth_error";
      existing.cooldownUntil = Date.now() + 300 * 1000;
    } else if (existing.failureCount >= 2) {
      // Cooldown for repeated failures
      existing.status = "degraded";
      existing.cooldownUntil = Date.now() + 30 * 1000;
    }

    this.healthMap.set(key, existing);
    console.warn(`[FAILURE_DETECTOR] Provider "${provider}" (user: ${userId}) failed: ${classification.classification} -> status=${existing.status}`);
    return classification;
  }

  /**
   * Records a successful execution and clears cooldown.
   */
  recordSuccess(provider, userId = "global") {
    const key = this.getProviderKey(provider, userId);
    this.healthMap.set(key, {
      failureCount: 0,
      status: "healthy",
      cooldownUntil: 0,
      updatedAt: Date.now()
    });
  }

  /**
   * Checks if a provider is currently available for execution.
   */
  isProviderAvailable(provider, userId = "global") {
    const key = this.getProviderKey(provider, userId);
    const health = this.healthMap.get(key);
    if (!health) return true;

    if (health.cooldownUntil && Date.now() < health.cooldownUntil) {
      return false;
    }
    return true;
  }

  /**
   * Resets all provider health states (useful for testing).
   */
  reset() {
    this.healthMap.clear();
  }
}

export const providerHealth = new ProviderHealthTracker();
