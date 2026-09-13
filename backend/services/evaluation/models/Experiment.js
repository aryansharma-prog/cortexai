import mongoose from "mongoose";

const experimentConfigurationSchema = new mongoose.Schema(
  {
    complexityScoring: {
      type: Boolean,
      default: true
    },
    recursiveDecomposition: {
      type: Boolean,
      default: true
    },
    dynamicRouting: {
      type: Boolean,
      default: true
    },
    sharedMemory: {
      type: Boolean,
      default: true
    },
    trustEscalation: {
      type: Boolean,
      default: true
    }
  },
  { _id: false }
);

const experimentSchema = new mongoose.Schema(
  {
    experimentId: {
      type: String,
      required: [true, "experimentId is required"],
      unique: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: [true, "name is required"],
      trim: true
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    type: {
      type: String,
      required: [true, "type is required"],
      enum: {
        values: [
          "baseline-comparison",
          "ablation",
          "complexity-validation",
          "agent-selection",
          "memory",
          "custom"
        ],
        message: "{VALUE} is not a supported experiment type"
      },
      index: true
    },
    configuration: {
      type: experimentConfigurationSchema,
      default: () => ({})
    },
    systems: {
      type: [String],
      default: ["single-agent", "fixed-multi-agent", "cortex-ai"]
    },
    status: {
      type: String,
      enum: {
        values: ["draft", "running", "completed", "failed"],
        message: "{VALUE} is not a valid experiment status"
      },
      default: "draft",
      index: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

const Experiment = mongoose.model("Experiment", experimentSchema);

export default Experiment;
export { Experiment };
