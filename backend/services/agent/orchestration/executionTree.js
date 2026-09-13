/**
 * Execution Tree Data Structure
 * Represents hierarchical task decompositions, node execution states,
 * complexity factors, selected agents, trust scores, and metrics.
 */

export class ExecutionTreeNode {
  constructor({
    id,
    parentId = null,
    depth = 0,
    name = "",
    description = "",
    agentType = "chat",
    dependencies = [],
    complexityFactors = null,
    complexityScore = null,
    classification = "EASY",
    selectedAgent = null,
    model = null,
    provider = null,
    selectionReason = "",
    alternativesConsidered = [],
    status = "pending", // pending, running, completed, failed, escalated, cancelled
    output = null,
    metrics = null,
    trustScore = null,
    trustClassification = null,
    trustDetails = null,
    children = [],
    isLeaf = true,
    escalated = false,
    activitySummary = "",
    memory = null
  }) {
    this.id = id || `node_${Math.random().toString(36).substring(2, 8)}`;
    this.parentId = parentId;
    this.depth = depth;
    this.name = name || id;
    this.description = description;
    this.agentType = agentType;
    this.dependencies = Array.isArray(dependencies) ? dependencies : [];
    this.complexityFactors = complexityFactors;
    this.complexityScore = complexityScore;
    this.classification = classification;
    this.selectedAgent = selectedAgent || agentType;
    this.model = model;
    this.provider = provider;
    this.selectionReason = selectionReason;
    this.alternativesConsidered = alternativesConsidered;
    this.status = status;
    this.output = output;
    this.metrics = metrics;
    this.trustScore = trustScore;
    this.trustClassification = trustClassification;
    this.trustDetails = trustDetails;
    this.children = children;
    this.isLeaf = isLeaf;
    this.escalated = escalated;
    this.activitySummary = activitySummary;
    this.memory = memory;
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  addChild(childNode) {
    childNode.parentId = this.id;
    childNode.depth = this.depth + 1;
    this.children.push(childNode);
    this.isLeaf = false;
    this.updatedAt = new Date().toISOString();
  }

  update(patch = {}) {
    Object.assign(this, patch);
    this.updatedAt = new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      parentId: this.parentId,
      depth: this.depth,
      name: this.name,
      description: this.description,
      agentType: this.agentType,
      dependencies: this.dependencies,
      complexityFactors: this.complexityFactors,
      complexityScore: this.complexityScore,
      classification: this.classification,
      selectedAgent: this.selectedAgent,
      model: this.model,
      provider: this.provider,
      selectionReason: this.selectionReason,
      alternativesConsidered: this.alternativesConsidered,
      status: this.status,
      output: this.output,
      metrics: this.metrics,
      trustScore: this.trustScore,
      trustClassification: this.trustClassification,
      trustDetails: this.trustDetails,
      memory: this.memory,
      children: this.children.map(c => (c instanceof ExecutionTreeNode ? c.toJSON() : c)),
      isLeaf: this.isLeaf,
      escalated: this.escalated,
      activitySummary: this.activitySummary
    };
  }
}

export class ExecutionTree {
  constructor(rootId = "root", rootName = "Main Task", description = "") {
    this.root = new ExecutionTreeNode({
      id: rootId,
      name: rootName,
      description,
      depth: 0
    });
    this.nodesMap = new Map();
    this.nodesMap.set(this.root.id, this.root);
  }

  addNode(nodeData, parentId = null) {
    const parent = parentId ? this.getNode(parentId) : this.root;
    const node = new ExecutionTreeNode({
      ...nodeData,
      parentId: parent ? parent.id : null,
      depth: parent ? parent.depth + 1 : 0
    });

    if (parent) {
      parent.addChild(node);
    }
    this.nodesMap.set(node.id, node);
    return node;
  }

  getNode(id) {
    return this.nodesMap.get(id) || null;
  }

  updateNode(id, patch) {
    const node = this.getNode(id);
    if (node) {
      node.update(patch);
    }
    return node;
  }

  /**
   * Returns all leaf nodes in the tree (the actual actionable units of execution).
   */
  getLeafNodes() {
    const leaves = [];
    const traverse = (node) => {
      if (node.isLeaf && node.id !== this.root.id) {
        leaves.push(node);
      } else {
        node.children.forEach(traverse);
      }
    };
    traverse(this.root);
    return leaves;
  }

  /**
   * Returns maximum depth reached in the tree.
   */
  getMaxDepth() {
    let max = 0;
    for (const node of this.nodesMap.values()) {
      if (node.depth > max) max = node.depth;
    }
    return max;
  }

  /**
   * Computes tree-wide metrics summary.
   */
  getMetricsSummary() {
    const allNodes = Array.from(this.nodesMap.values()).filter(n => n.id !== this.root.id);
    const leafNodes = this.getLeafNodes();
    const completedLeaves = leafNodes.filter(n => n.status === "completed");
    const failedLeaves = leafNodes.filter(n => n.status === "failed");
    const escalatedNodes = allNodes.filter(n => n.escalated);

    let totalTokens = 0;
    let totalDurationMs = 0;
    let estimatedCost = 0;
    let trustSum = 0;
    let trustCount = 0;
    let totalContextTokensSaved = 0;
    let totalContextTokensSelected = 0;
    const agentsUsedSet = new Set();

    leafNodes.forEach(leaf => {
      if (leaf.selectedAgent) agentsUsedSet.add(leaf.selectedAgent);
      if (leaf.metrics) {
        if (leaf.metrics.totalTokens) totalTokens += leaf.metrics.totalTokens;
        if (leaf.metrics.durationMs) totalDurationMs += leaf.metrics.durationMs;
        if (leaf.metrics.estimatedCost) estimatedCost += leaf.metrics.estimatedCost;
      }
      if (leaf.trustScore !== null && leaf.trustScore !== undefined) {
        trustSum += leaf.trustScore;
        trustCount += 1;
      }
      if (leaf.memory) {
        if (leaf.memory.tokensSavedEstimate) totalContextTokensSaved += leaf.memory.tokensSavedEstimate;
        if (leaf.memory.selectedContextTokens) totalContextTokensSelected += leaf.memory.selectedContextTokens;
      }
    });

    const averageTrust = trustCount > 0 ? Number((trustSum / trustCount).toFixed(1)) : null;

    return {
      totalTasks: allNodes.length,
      leafTasks: leafNodes.length,
      completedTasks: completedLeaves.length,
      failedTasks: failedLeaves.length,
      maxDepth: this.getMaxDepth(),
      agentsUsed: Array.from(agentsUsedSet),
      escalations: escalatedNodes.length,
      totalTokens: totalTokens > 0 ? totalTokens : null,
      totalDurationMs,
      estimatedCost: Number(estimatedCost.toFixed(6)),
      actualCost: Number(estimatedCost.toFixed(6)),
      averageTrust,
      totalContextTokensSaved,
      totalContextTokensSelected
    };
  }

  toJSON() {
    return this.root.toJSON();
  }
}
