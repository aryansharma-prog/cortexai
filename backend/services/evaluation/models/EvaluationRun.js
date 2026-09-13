import mongoose from "mongoose";

const metricsSchema = new mongoose.Schema(
  {
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    latencyMs: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    quality: { type: Number, default: 0 }
  },
  { _id: false }
);

const routingSchema = new mongoose.Schema(
  {
    complexityScore: { type: Number, default: 0 },
    complexityClass: { type: String, default: "" },
    numberOfSubtasks: { type: Number, default: 0 },
    recursionDepth: { type: Number, default: 0 },
    agentsSelected: { type: [String], default: [] },
    agentsSkipped: { type: [String], default: [] }
  },
  { _id: false }
);

const trustSchema = new mongoose.Schema(
  {
    initialTrust: { type: Number, default: 0 },
    finalTrust: { type: Number, default: 0 },
    escalated: { type: Boolean, default: false },
    escalationCount: { type: Number, default: 0 }
  },
  { _id: false }
);

const memorySchema = new mongoose.Schema(
  {
    contextTokens: { type: Number, default: 0 },
    memoryTokens: { type: Number, default: 0 }
  },
  { _id: false }
);

const modelInfoSchema = new mongoose.Schema(
  {
    provider: { type: String, default: "" },
    model: { type: String, default: "" }
  },
  { _id: false }
);

const evaluationRunSchema = new mongoose.Schema(
  {
    runId: {
      type: String,
      required: [true, "runId is required"],
      unique: true,
      trim: true,
      index: true
    },
    experimentId: {
      type: String,
      required: [true, "experimentId is required"],
      trim: true,
      index: true
    },
    benchmarkId: {
      type: String,
      required: [true, "benchmarkId is required"],
      trim: true,
      index: true
    },
    system: {
      type: String,
      required: [true, "system is required"],
      enum: {
        values: ["single-agent", "fixed-multi-agent", "cortex-ai"],
        message: "{VALUE} is not a valid evaluation system"
      },
      index: true
    },
    category: {
      type: String,
      default: "",
      trim: true,
      index: true
    },
    difficulty: {
      type: String,
      default: "",
      trim: true,
      index: true
    },
    prompt: {
      type: String,
      default: "",
      trim: true
    },
    answer: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "running", "completed", "failed"],
        message: "{VALUE} is not a valid run status"
      },
      default: "pending",
      index: true
    },
    metrics: {
      type: metricsSchema,
      default: () => ({})
    },
    routing: {
      type: routingSchema,
      default: () => ({})
    },
    trust: {
      type: trustSchema,
      default: () => ({})
    },
    memory: {
      type: memorySchema,
      default: () => ({})
    },
    modelInfo: {
      type: modelInfoSchema,
      default: () => ({})
    },
    error: {
      type: String,
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    startedAt: {
      type: Date
    },
    completedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

evaluationRunSchema.index({ experimentId: 1, benchmarkId: 1, system: 1 });
evaluationRunSchema.index({ experimentId: 1, status: 1 });

const EvaluationRun = mongoose.model("EvaluationRun", evaluationRunSchema);

export default EvaluationRun;
export { EvaluationRun };
