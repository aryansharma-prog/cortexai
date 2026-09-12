/**
 * Recursive Task Decomposer
 * Decomposes complex tasks (complexityScore >= 70) into smaller subtasks recursively
 * up to MAX_DECOMPOSITION_DEPTH, evaluating each child independently.
 *
 * Stop Conditions:
 * 1. Task becomes EASY or MEDIUM (complexity < 70)
 * 2. Maximum depth reached (MAX_DECOMPOSITION_DEPTH)
 * 3. Further decomposition would not produce useful independent work
 * 4. Task is already atomic/actionable
 * 5. Decomposition creates duplicate or trivial subtasks
 * 6. Decomposition cost exceeds expected benefit
 */

import { getModelWithMeta } from "../config/llmModels.js";
import { invokeWithTracking } from "../observability/usageTracker.js";
import { evaluateTaskComplexity } from "./complexityEvaluator.js";
import { selectDynamicAgent } from "./dynamicAgentSelector.js";

const DEFAULT_MAX_DEPTH = 3;

export const getMaxDecompositionDepth = () => {
  const envVal = parseInt(process.env.MAX_DECOMPOSITION_DEPTH, 10);
  return !isNaN(envVal) && envVal > 0 ? envVal : DEFAULT_MAX_DEPTH;
};

/**
 * Checks if a task should stop decomposing.
 */
export const shouldStopDecomposition = (task, depth, complexityResult) => {
  const maxDepth = getMaxDecompositionDepth();

  if (depth >= maxDepth) {
    return { stop: true, reason: `Max decomposition depth (${maxDepth}) reached.` };
  }

  if (complexityResult.complexityScore < 70) {
    return { stop: true, reason: `Task complexity (${complexityResult.complexityScore}) is ${complexityResult.classification} (< 70).` };
  }

  const desc = (task.description || "").toLowerCase();
  // Atomic tasks (e.g., direct search query, single code snippet, specific single file parsing)
  if (desc.length < 40 && !desc.includes(" and ") && !desc.includes("compare")) {
    return { stop: true, reason: "Task is already atomic and directly actionable." };
  }

  return { stop: false, reason: "Task is complex and can benefit from decomposition." };
};

/**
 * Decomposes a single complex task into 2 - 4 distinct, smaller child subtasks via LLM.
 */
export const decomposeSubtask = async (task, context = {}) => {
  const { llm, modelName, provider } = await getModelWithMeta("taskAnalyzer");

  const systemPrompt = `You are CortexAI Recursive Task Decomposer.
Your objective is to break down a complex subtask into 2 to 3 smaller, highly focused, actionable atomic child subtasks.

Rules:
1. Every child subtask must have a distinct, non-overlapping objective.
2. Dependencies should specify parent subtask IDs if one child strictly needs data from another.
3. Available agentTypes: "search", "analysis", "comparison", "chat", "coding", "pdf", "ppt", "vision".
4. Do NOT create duplicate, redundant, or trivial subtasks.

Return ONLY valid JSON with this exact schema:
{
  "children": [
    {
      "id": "unique_child_id",
      "name": "Human Readable Step Name",
      "description": "Precise, concrete goal for this subtask",
      "agentType": "search | analysis | comparison | chat | coding",
      "dependencies": [],
      "activitySummary": "Executing..."
    }
  ]
}`;

  const userPrompt = `Complex Subtask to decompose:
Name: "${task.name || task.id}"
Description: "${task.description}"
Current Depth: ${task.depth || 1}
Parent Context: "${context.prompt || ""}"`;

  try {
    const { response } = await invokeWithTracking(
      llm,
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      {
        agentId: "taskDecomposer",
        modelName,
        provider,
        conversationId: context.conversationId,
        userId: context.userId
      }
    );

    let cleanJson = response.content.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```(json)?\n?/, "").replace(/\n?```$/, "").trim();
    }

    const parsed = JSON.parse(cleanJson);
    if (Array.isArray(parsed.children) && parsed.children.length > 0) {
      return parsed.children.map((c, idx) => ({
        id: c.id || `${task.id}_child_${idx + 1}`,
        name: c.name || `Subtask ${idx + 1}`,
        description: c.description || task.description,
        agentType: c.agentType || task.agentType || "chat",
        dependencies: Array.isArray(c.dependencies) ? c.dependencies : [],
        activitySummary: c.activitySummary || `Executing ${c.name || 'subtask'}...`
      }));
    }
  } catch (err) {
    console.warn(`[taskDecomposer] LLM decomposition failed for ${task.id}, using heuristic split:`, err.message);
  }

  // Heuristic split fallback if LLM decomposition errors
  return [
    {
      id: `${task.id}_part1`,
      name: `${task.name || 'Task'} - Data Gathering`,
      description: `Gather facts, references, and baseline information for: ${task.description}`,
      agentType: task.agentType === "coding" ? "coding" : "search",
      dependencies: [],
      activitySummary: "Gathering required data and context..."
    },
    {
      id: `${task.id}_part2`,
      name: `${task.name || 'Task'} - In-Depth Analysis`,
      description: `Perform rigorous analytical synthesis and evaluation for: ${task.description}`,
      agentType: task.agentType === "coding" ? "coding" : "analysis",
      dependencies: [`${task.id}_part1`],
      activitySummary: "Analyzing findings and finalizing output..."
    }
  ];
};

/**
 * Recursively builds and decomposes a task tree starting from initial subtasks.
 *
 * @param {Array} initialTasks - Initial list of subtasks from Task Analyzer
 * @param {Object} tree - ExecutionTree instance
 * @param {string} parentId - Parent node ID in tree
 * @param {number} depth - Current recursion depth
 * @param {Object} context - Execution context (prompt, file, userId, conversationId)
 */
export const recursivelyDecomposeTasks = async (initialTasks = [], tree, parentId = "root", depth = 1, context = {}) => {
  for (const task of initialTasks) {
    // 1. Evaluate complexity for this task node
    const complexityResult = evaluateTaskComplexity(task, { prompt: context.prompt, graph: tree });

    // 2. Dynamic agent selection based on complexity & capability
    const agentSelection = selectDynamicAgent(task, complexityResult.complexityScore);

    // 3. Add task node to execution tree
    const node = tree.addNode({
      id: task.id,
      parentId,
      depth,
      name: task.name || task.id,
      description: task.description,
      agentType: task.agentType || "chat",
      dependencies: task.dependencies || [],
      complexityFactors: complexityResult,
      complexityScore: complexityResult.complexityScore,
      classification: complexityResult.classification,
      selectedAgent: agentSelection.selectedAgent,
      model: agentSelection.model,
      provider: agentSelection.provider,
      selectionReason: agentSelection.reason,
      alternativesConsidered: agentSelection.alternativesConsidered,
      activitySummary: task.activitySummary,
      status: "pending",
      isLeaf: true
    }, parentId);

    // 4. Check stop conditions for recursion
    const stopCheck = shouldStopDecomposition(task, depth, complexityResult);

    if (!stopCheck.stop) {
      console.log(`[DECOMPOSITION] Task="${task.name}" (Score=${complexityResult.complexityScore}) is COMPLEX at depth ${depth}. Decomposing recursively...`);

      const children = await decomposeSubtask(task, context);

      if (children.length > 0) {
        node.isLeaf = false;
        node.status = "decomposed";

        // Recursively decompose and add children
        await recursivelyDecomposeTasks(children, tree, node.id, depth + 1, context);
      }
    } else {
      console.log(`[DECOMPOSITION] Task="${task.name}" (Score=${complexityResult.complexityScore}) stopped decomposition: ${stopCheck.reason}`);
    }
  }
};
