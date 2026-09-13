import redis from "../../../shared/redis/redis.js";

/**
 * Estimation heuristic (~4 characters per token average).
 */
const estimateTokens = (text = "") => {
  if (!text || typeof text !== "string") return 0;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const chars = text.length;
  return Math.max(1, Math.round((words * 1.3 + chars / 4) / 2));
};

/**
 * Standard Memory Entry Types
 */
export const MEMORY_TYPES = {
  FACT: "FACT",
  DATA: "DATA",
  CODE: "CODE",
  DECISION: "DECISION",
  RESULT: "RESULT",
  SOURCE: "SOURCE",
  CONSTRAINT: "CONSTRAINT",
  REQUIREMENT: "REQUIREMENT",
  VERIFICATION: "VERIFICATION",
  CONFLICT: "CONFLICT",
  SUMMARY: "SUMMARY"
};

/**
 * Standard Memory Entry Status
 */
export const MEMORY_STATUS = {
  ACTIVE: "ACTIVE",
  VERIFIED: "VERIFIED",
  SUPERSEDED: "SUPERSEDED",
  INVALID: "INVALID"
};

/**
 * Lightweight, cost-aware knowledge extraction from raw agent output
 * (Extracts structured code, tables, facts, and sources without extra LLM calls).
 */
export const extractStructuredKnowledge = (output = "", taskMetadata = {}) => {
  if (!output || typeof output !== "string") return [];
  const entries = [];
  const text = output.trim();

  // 1. Extract Code Blocks
  const codeRegex = /```([a-zA-Z0-9_\-\+]*)\n([\s\S]*?)```/g;
  let codeMatch;
  while ((codeMatch = codeRegex.exec(text)) !== null) {
    const lang = codeMatch[1] || "code";
    const codeBody = codeMatch[2].trim();
    if (codeBody.length > 10) {
      entries.push({
        type: MEMORY_TYPES.CODE,
        content: codeBody,
        summary: `Code snippet (${lang})`,
        tags: [lang, "code", "implementation"],
        importance: 0.85
      });
    }
  }

  // 2. Extract Markdown Tables (Data/Metrics)
  const tableRegex = /((?:\|[^\n]+\|\n?){2,})/g;
  let tableMatch;
  while ((tableMatch = tableRegex.exec(text)) !== null) {
    const tableBody = tableMatch[1].trim();
    if (tableBody.includes("---")) {
      entries.push({
        type: MEMORY_TYPES.DATA,
        content: tableBody,
        summary: "Structured Data / Comparison Table",
        tags: ["data", "table", "metrics"],
        importance: 0.90
      });
    }
  }

  // 3. Extract Verified Sources & Citations
  const sourceRegex = /\[(?:Source|Reference|Ref|\d+)\]\((https?:\/\/[^\)]+)\)|https?:\/\/[^\s\)\>]+/g;
  let sourceMatch;
  const seenUrls = new Set();
  while ((sourceMatch = sourceRegex.exec(text)) !== null) {
    const url = sourceMatch[1] || sourceMatch[0];
    if (!seenUrls.has(url) && url.length < 200) {
      seenUrls.add(url);
      entries.push({
        type: MEMORY_TYPES.SOURCE,
        content: url,
        summary: `Source citation: ${url}`,
        tags: ["source", "citation", "evidence"],
        importance: 0.75
      });
    }
  }

  // 4. Extract Key Quantitative Findings (Percentages, Dollar amounts, CAGR, numbers)
  const metricLines = text.split("\n")
    .filter(line => /\b(?:\$\d+|\d+%\s*CAGR|\d+\s*(?:billion|million|USD|INR)|market size|revenue|growth rate)\b/i.test(line))
    .slice(0, 5); // Limit to top 5 atomic metrics

  metricLines.forEach(line => {
    const cleanLine = line.replace(/^[#\*\-\s]+/, "").trim();
    if (cleanLine.length > 15 && cleanLine.length < 250) {
      entries.push({
        type: MEMORY_TYPES.DATA,
        content: cleanLine,
        summary: "Quantitative Metric / Key Finding",
        tags: ["metric", "finance", "data"],
        importance: 0.88
      });
    }
  });

  return entries;
};

/**
 * Shared Incremental Working Memory
 * Maintains versioned, structured execution state and delivers scoped,
 * delta-based context packets to downstream tasks.
 */
export class SharedMemory {
  constructor(executionId = "default") {
    this.executionId = executionId;
    this.entries = []; // Array of structured memory entries
    this.taskOutputs = new Map(); // taskId -> raw output & metadata
    this.version = 1;
    this.snapshots = new Map(); // snapshotId -> serialized entries
    this.telemetry = {
      totalFullTokensRequested: 0,
      totalSelectedTokensDelivered: 0,
      totalTokensSaved: 0,
      entriesCreated: 0,
      entriesUsed: 0,
      entriesSkipped: 0
    };
  }

  /**
   * Adds a single structured entry to working memory.
   */
  addEntry({
    taskId = "root",
    agentId = "system",
    type = MEMORY_TYPES.FACT,
    content = "",
    summary = "",
    confidence = 0.9,
    importance = 0.8,
    tags = [],
    dependencies = [],
    producer = agentId,
    consumers = [],
    status = MEMORY_STATUS.ACTIVE,
    supersedes = null
  }) {
    if (!content || typeof content !== "string") return null;

    // Increment monotonic version
    this.version += 1;

    // If supersedes is specified, mark superseded entry
    if (supersedes) {
      const oldEntry = this.entries.find(e => e.id === supersedes);
      if (oldEntry) {
        oldEntry.status = MEMORY_STATUS.SUPERSEDED;
        oldEntry.supersededBy = `mem_${this.version}`;
        oldEntry.updatedAt = new Date().toISOString();
      }
    }

    const entryId = `mem_${this.version}_${Math.random().toString(36).substring(2, 6)}`;
    const newEntry = {
      id: entryId,
      taskId,
      agentId,
      type,
      content: content.trim(),
      summary: summary || content.slice(0, 80),
      confidence: Number(confidence) || 0.9,
      importance: Number(importance) || 0.8,
      tags: Array.isArray(tags) ? tags : [],
      dependencies: Array.isArray(dependencies) ? dependencies : [],
      producer: producer || agentId,
      consumers: Array.isArray(consumers) ? consumers : [],
      status: status || MEMORY_STATUS.ACTIVE,
      supersedes: supersedes || null,
      version: this.version,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.entries.push(newEntry);
    this.telemetry.entriesCreated += 1;

    this.syncToRedisSafe();
    return newEntry;
  }

  /**
   * Records a task's full output, extracts structured entries, and records verification state.
   */
  recordTaskOutput(taskId, output, metadata = {}) {
    if (!taskId) return null;

    const agentType = metadata?.agentId || "agent";
    const name = metadata?.name || taskId;
    const dependencies = metadata?.dependencies || [];

    // Store raw output for backward compatibility and archival
    this.taskOutputs.set(taskId, {
      taskId,
      output: output || "",
      metadata,
      version: this.version + 1,
      timestamp: new Date().toISOString()
    });

    // 1. Record primary task result entry
    const mainEntry = this.addEntry({
      taskId,
      agentId: agentType,
      type: MEMORY_TYPES.RESULT,
      content: output,
      summary: `Result of ${name}`,
      dependencies,
      producer: agentType,
      confidence: metadata?.trust?.trustScore ? metadata.trust.trustScore / 100 : 0.9,
      importance: 0.90,
      tags: [agentType, taskId]
    });

    // 2. Extract atomic facts, code blocks, tables, sources without extra LLM overhead
    const extracted = extractStructuredKnowledge(output, metadata);
    extracted.forEach(item => {
      this.addEntry({
        taskId,
        agentId: agentType,
        type: item.type,
        content: item.content,
        summary: item.summary,
        tags: [...item.tags, agentType],
        dependencies,
        producer: agentType,
        importance: item.importance
      });
    });

    // 3. If trust evaluation is present, record verification entry
    if (metadata?.trust) {
      this.addEntry({
        taskId,
        agentId: "trustEvaluator",
        type: MEMORY_TYPES.VERIFICATION,
        content: `Trust Verification Score: ${metadata.trust.trustScore}/100 (${metadata.trust.trustClassification}).`,
        summary: `Verification for ${name}`,
        confidence: metadata.trust.trustScore / 100,
        importance: 0.95,
        status: metadata.trust.trustScore >= 60 ? MEMORY_STATUS.VERIFIED : MEMORY_STATUS.ACTIVE,
        tags: ["trust", "verification", metadata.trust.trustClassification]
      });
    }

    return mainEntry;
  }

  /**
   * Retrieves all new valid entries created or modified since lastSeenVersion.
   */
  getNewSince(sinceVersion = 0) {
    return this.entries.filter(e =>
      e.version > sinceVersion &&
      e.status !== MEMORY_STATUS.SUPERSEDED &&
      e.status !== MEMORY_STATUS.INVALID
    );
  }

  /**
   * Builds an optimized, dependency-aware context packet for an executing agent.
   * Filters out irrelevant and superseded context to minimize input token bloat.
   */
  getRelevantContext({
    taskId = "",
    agentType = "",
    dependencies = [],
    description = "",
    lastSeenVersion = 0
  } = {}) {
    // 1. Baseline: Estimate full naive context size if we dumped everything
    const allRawOutputs = Array.from(this.taskOutputs.values()).map(o => o.output).join("\n\n");
    const fullContextTokensEstimate = estimateTokens(allRawOutputs) + estimateTokens(description);

    // If no outputs recorded yet, return empty packet
    if (this.entries.length === 0) {
      return {
        formattedContext: "",
        telemetry: {
          fullContextTokensEstimate: 0,
          selectedContextTokens: 0,
          tokensSavedEstimate: 0,
          contextReductionPercent: 0,
          entriesUsed: 0,
          entriesSkipped: 0,
          memoryVersion: this.version,
          previousSeenVersion: lastSeenVersion
        }
      };
    }

    const descLower = (description || "").toLowerCase();
    const depSet = new Set(Array.isArray(dependencies) ? dependencies : []);
    const relevantEntries = [];
    let skippedCount = 0;

    // Filter active valid entries
    const candidates = this.entries.filter(e =>
      e.status !== MEMORY_STATUS.SUPERSEDED &&
      e.status !== MEMORY_STATUS.INVALID
    );

    for (const entry of candidates) {
      // Rule 1: Direct parent task dependency
      const isDirectDep = depSet.has(entry.taskId);

      // Rule 2: Explicit consumer targeting
      const isTargetedConsumer = entry.consumers.includes(agentType);

      // Rule 3: Agent domain relevance
      let isDomainRelevant = false;
      const cleanAgent = String(agentType).toLowerCase();

      if (cleanAgent.includes("code") || cleanAgent.includes("coding")) {
        isDomainRelevant = [MEMORY_TYPES.CODE, MEMORY_TYPES.REQUIREMENT, MEMORY_TYPES.CONSTRAINT].includes(entry.type);
      } else if (cleanAgent.includes("analy") || cleanAgent.includes("calc") || cleanAgent.includes("math")) {
        isDomainRelevant = [MEMORY_TYPES.DATA, MEMORY_TYPES.FACT, MEMORY_TYPES.RESULT, MEMORY_TYPES.VERIFICATION].includes(entry.type);
      } else if (cleanAgent.includes("comp") || cleanAgent.includes("market")) {
        isDomainRelevant = [MEMORY_TYPES.DATA, MEMORY_TYPES.FACT, MEMORY_TYPES.RESULT].includes(entry.type);
      } else if (cleanAgent.includes("search")) {
        isDomainRelevant = [MEMORY_TYPES.REQUIREMENT, MEMORY_TYPES.CONSTRAINT].includes(entry.type);
      } else if (cleanAgent.includes("synth")) {
        isDomainRelevant = true; // Synthesizer consumes verified facts & results
      }

      // Rule 4: Substantive keyword / tag match in subtask description
      const substantiveTags = entry.tags.filter(t => !["search", "chat", "agent", "system", "default"].includes(String(t).toLowerCase()));
      const hasTagMatch = substantiveTags.length > 0 && substantiveTags.some(tag => {
        try {
          const wordRegex = new RegExp(`\\b${tag.toLowerCase()}\\b`, "i");
          return wordRegex.test(descLower);
        } catch {
          return descLower.includes(tag.toLowerCase());
        }
      });

      // Decision logic: Keep if direct dependency, targeted consumer, or independent task with explicit domain + tag match
      if (isDirectDep || isTargetedConsumer || (depSet.size === 0 && isDomainRelevant && hasTagMatch)) {
        relevantEntries.push(entry);
      } else {
        skippedCount += 1;
      }
    }

    // Deduplicate and format context
    const contextLines = [];
    const seenContent = new Set();

    relevantEntries.forEach(entry => {
      if (!seenContent.has(entry.content)) {
        seenContent.add(entry.content);
        const header = `[${entry.type}] (from ${entry.producer || entry.agentId} | v${entry.version}):`;
        contextLines.push(`${header}\n${entry.content}`);
      }
    });

    const formattedContext = contextLines.join("\n\n---\n\n");
    const selectedContextTokens = estimateTokens(formattedContext);
    const tokensSavedEstimate = Math.max(0, fullContextTokensEstimate - selectedContextTokens);
    const contextReductionPercent = fullContextTokensEstimate > 0
      ? Number(((tokensSavedEstimate / fullContextTokensEstimate) * 100).toFixed(1))
      : 0;

    // Track aggregate telemetry
    this.telemetry.totalFullTokensRequested += fullContextTokensEstimate;
    this.telemetry.totalSelectedTokensDelivered += selectedContextTokens;
    this.telemetry.totalTokensSaved += tokensSavedEstimate;
    this.telemetry.entriesUsed += relevantEntries.length;
    this.telemetry.entriesSkipped += skippedCount;

    console.log(`[SharedMemory] Scoped context for task="${taskId}" (Agent=${agentType}): ` +
      `Used ${relevantEntries.length} entries, Skipped ${skippedCount} entries. ` +
      `Tokens: ${selectedContextTokens} (Saved ~${tokensSavedEstimate}t | ${contextReductionPercent}% reduction).`);

    return {
      formattedContext,
      telemetry: {
        fullContextTokensEstimate,
        selectedContextTokens,
        tokensSavedEstimate,
        contextReductionPercent,
        entriesUsed: relevantEntries.length,
        entriesSkipped: skippedCount,
        memoryVersion: this.version,
        previousSeenVersion: lastSeenVersion
      }
    };
  }

  /**
   * Backward-compatible helper for legacy calls.
   */
  getDependencyContext(dependencies = []) {
    const res = this.getRelevantContext({ dependencies });
    return res.formattedContext;
  }

  /**
   * Records a detected factual or computational conflict.
   */
  recordConflict(entryAId, entryBId, description = "") {
    const entryA = this.entries.find(e => e.id === entryAId);
    const entryB = this.entries.find(e => e.id === entryBId);

    console.warn(`[SharedMemory] Conflict detected between ${entryAId} and ${entryBId}: ${description}`);

    return this.addEntry({
      type: MEMORY_TYPES.CONFLICT,
      content: `Conflict Detected: ${description}\n- Option A: ${entryA?.content || entryAId}\n- Option B: ${entryB?.content || entryBId}`,
      summary: `Conflict between ${entryAId} and ${entryBId}`,
      importance: 0.99,
      tags: ["conflict", "unresolved"]
    });
  }

  /**
   * Creates an in-memory snapshot for checkpointing.
   */
  createSnapshot(snapshotId = `snap_${Date.now()}`) {
    const snapshotData = {
      snapshotId,
      version: this.version,
      entries: JSON.parse(JSON.stringify(this.entries)),
      timestamp: new Date().toISOString()
    };
    this.snapshots.set(snapshotId, snapshotData);
    return snapshotData;
  }

  /**
   * Returns all recorded task outputs as an array.
   */
  getAllOutputs() {
    return Array.from(this.taskOutputs.values());
  }

  /**
   * Returns global telemetry summary across the entire execution.
   */
  getTelemetrySummary() {
    const full = this.telemetry.totalFullTokensRequested;
    const selected = this.telemetry.totalSelectedTokensDelivered;
    const saved = this.telemetry.totalTokensSaved;
    const reductionPercent = full > 0 ? Number(((saved / full) * 100).toFixed(1)) : 0;

    return {
      memoryVersion: this.version,
      entriesCreated: this.telemetry.entriesCreated,
      entriesUsed: this.telemetry.entriesUsed,
      entriesSkipped: this.telemetry.entriesSkipped,
      fullContextTokensEstimate: full,
      selectedContextTokens: selected,
      tokensSavedEstimate: saved,
      contextReductionPercent: reductionPercent
    };
  }

  /**
   * Safe asynchronous sync to Redis (fail-safe fallback).
   */
  async syncToRedisSafe() {
    if (!this.executionId || !redis || redis.status !== "ready") return;
    try {
      const redisKey = `shared_memory:${this.executionId}`;
      const payload = {
        executionId: this.executionId,
        version: this.version,
        entriesCount: this.entries.length,
        telemetry: this.getTelemetrySummary(),
        updatedAt: new Date().toISOString()
      };
      await redis.set(redisKey, JSON.stringify(payload), "EX", 3600);
    } catch (err) {
      // Non-blocking fail-safe: in-memory state remains canonical
      console.warn(`[SharedMemory] Redis sync skipped for ${this.executionId}: ${err.message}`);
    }
  }

  /**
   * Cleans up working memory.
   */
  clear() {
    this.entries = [];
    this.taskOutputs.clear();
    this.snapshots.clear();
    this.version = 1;
  }
}
