import redis from "../../../shared/redis/redis.js";

/**
 * Dedicated error class for user-initiated research cancellation.
 */
export class ResearchCancelledError extends Error {
  constructor(executionId = "unknown", message = "Research task was cancelled by user.") {
    super(message);
    this.name = "ResearchCancelledError";
    this.executionId = executionId;
    this.isCancelled = true;
  }
}

// In-memory active cancellation set for ultra-fast local checks
const inMemoryCancelledTasks = new Set();

/**
 * Cancels an ongoing execution across local memory and distributed Redis cache.
 * @param {string} executionId 
 */
export const cancelExecution = async (executionId) => {
  if (!executionId) return;

  inMemoryCancelledTasks.add(executionId);

  if (redis && redis.status === "ready") {
    try {
      const redisKey = `cancellation:${executionId}`;
      const channelKey = `execution_events:${executionId}`;

      await redis.set(redisKey, "cancelled", "EX", 3600); // 1 hour TTL
      await redis.publish(channelKey, JSON.stringify({
        executionId,
        type: "workflow_cancelled",
        timestamp: new Date().toISOString(),
        message: "Research task was cancelled by user."
      }));

      console.log(`[CancellationManager] Execution ${executionId} marked as cancelled.`);
    } catch (err) {
      console.warn(`[CancellationManager] Redis cancellation publish warning for ${executionId}:`, err.message);
    }
  }
};

/**
 * Checks if an execution has been marked as cancelled.
 * @param {string} executionId 
 * @returns {Promise<boolean>}
 */
export const isExecutionCancelled = async (executionId) => {
  if (!executionId) return false;

  if (inMemoryCancelledTasks.has(executionId)) {
    return true;
  }

  if (redis && redis.status === "ready") {
    try {
      const status = await redis.get(`cancellation:${executionId}`);
      if (status === "cancelled") {
        inMemoryCancelledTasks.add(executionId);
        return true;
      }
    } catch (err) {
      // If Redis check fails, fallback to in-memory set
    }
  }

  return false;
};

/**
 * Helper that throws ResearchCancelledError if execution is cancelled.
 * Call this before and after all async/expensive operations.
 * @param {string} executionId 
 */
export const assertNotCancelled = async (executionId) => {
  if (await isExecutionCancelled(executionId)) {
    throw new ResearchCancelledError(executionId);
  }
};

/**
 * Cleans up memory references after task completion.
 * @param {string} executionId 
 */
export const cleanupCancellation = (executionId) => {
  if (executionId) {
    setTimeout(() => {
      inMemoryCancelledTasks.delete(executionId);
    }, 60000); // Retain for 1 min to catch late-arriving async responses
  }
};
