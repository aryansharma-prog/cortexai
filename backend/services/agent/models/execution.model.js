import mongoose from "mongoose";

const agentExecutionSchema = new mongoose.Schema({
  agentId: { type: String, required: true },
  name: { type: String },
  subtaskId: { type: String },
  model: { type: String },
  provider: { type: String },
  inputTokens: { type: Number, default: null },
  outputTokens: { type: Number, default: null },
  totalTokens: { type: Number, default: null },
  durationMs: { type: Number, default: 0 },
  estimatedCost: { type: Number, default: null },
  status: { type: String, enum: ["pending", "running", "completed", "failed", "skipped", "escalated"], default: "completed" },
  startedAt: { type: Date },
  completedAt: { type: Date },
  error: { type: String, default: null }
}, { _id: false });

const subtaskSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String },
  description: { type: String },
  agentType: { type: String },
  dependencies: [{ type: String }],
  activitySummary: { type: String },
  status: { type: String, default: "completed" },
  complexityScore: { type: Number },
  classification: { type: String },
  selectedAgent: { type: String },
  model: { type: String },
  provider: { type: String },
  selectionReason: { type: String },
  trustScore: { type: Number },
  trustClassification: { type: String },
  escalated: { type: Boolean, default: false },
  metrics: { type: mongoose.Schema.Types.Mixed, default: null }
}, { _id: false });

const executionSchema = new mongoose.Schema({
  executionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  conversationId: {
    type: String,
    index: true
  },
  prompt: {
    type: String,
    required: true
  },
  taskType: {
    type: String,
    default: "general"
  },
  complexity: {
    type: String,
    enum: ["low", "medium", "high", "EASY", "MEDIUM", "COMPLEX", "cancelled", "fallback"],
    default: "low"
  },
  executionStrategy: {
    type: String,
    default: "single"
  },
  scores: {
    complexityScore: { type: Number, default: 1 },
    decomposabilityScore: { type: Number, default: 1 },
    dependencyScore: { type: Number, default: 1 },
    toolRequirementScore: { type: Number, default: 1 },
    riskScore: { type: Number, default: 1 }
  },
  selectedAgents: [{ type: String }],
  subtasks: [subtaskSchema],
  executionTree: { type: mongoose.Schema.Types.Mixed, default: null },
  totalTasks: { type: Number, default: 1 },
  leafTasks: { type: Number, default: 1 },
  maxDepth: { type: Number, default: 1 },
  escalations: { type: Number, default: 0 },
  averageTrust: { type: Number, default: null },
  agentExecutions: [agentExecutionSchema],
  totalTokens: { type: Number, default: null },
  totalDurationMs: { type: Number, default: 0 },
  estimatedCost: { type: Number, default: null },
  actualCost: { type: Number, default: null },
  success: { type: Boolean, default: true },
  finalAnswer: { type: String }
}, {
  timestamps: true
});

const Execution = mongoose.model("Execution", executionSchema);
export default Execution;
