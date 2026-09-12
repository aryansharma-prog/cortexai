/**
 * Shared Incremental Working Memory
 * Provides tasks with scoped, relevant context from direct dependencies
 * and newly generated delta facts, avoiding unnecessary context window bloat.
 */

export class SharedMemory {
  constructor(executionId = "default") {
    this.executionId = executionId;
    this.taskOutputs = new Map(); // taskId -> { output, metadata, timestamp, version }
    this.facts = [];
    this.version = 1;
  }

  /**
   * Records output from a completed task node.
   */
  recordTaskOutput(taskId, output, metadata = {}) {
    if (!taskId) return;
    this.version += 1;
    this.taskOutputs.set(taskId, {
      taskId,
      output: output || "",
      metadata,
      version: this.version,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Retrieves clean context exclusively from requested prerequisite dependencies.
   *
   * @param {Array<string>} dependencies - Array of parent subtask IDs
   * @returns {string} Formatted context snippet
   */
  getDependencyContext(dependencies = []) {
    if (!Array.isArray(dependencies) || dependencies.length === 0) {
      return "";
    }

    const contextSnippets = dependencies
      .map(depId => {
        const entry = this.taskOutputs.get(depId);
        if (entry && entry.output) {
          const title = entry.metadata?.name || entry.metadata?.agentId || depId;
          return `### Context from Completed Prerequisite [${title}]:\n${entry.output}`;
        }
        return null;
      })
      .filter(Boolean);

    return contextSnippets.join("\n\n---\n\n");
  }

  /**
   * Records an important atomic fact or metric into working memory.
   */
  recordFact(fact) {
    if (fact && typeof fact === "string") {
      this.facts.push({ fact: fact.trim(), timestamp: new Date().toISOString() });
    }
  }

  /**
   * Returns all recorded task outputs as an array.
   */
  getAllOutputs() {
    return Array.from(this.taskOutputs.values());
  }

  /**
   * Cleans up session memory.
   */
  clear() {
    this.taskOutputs.clear();
    this.facts = [];
    this.version = 1;
  }
}
