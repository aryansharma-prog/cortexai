import mongoose from "mongoose";

const benchmarkSchema = new mongoose.Schema(
  {
    benchmarkId: {
      type: String,
      required: [true, "benchmarkId is required"],
      unique: true,
      trim: true,
      index: true
    },
    category: {
      type: String,
      required: [true, "category is required"],
      enum: {
        values: ["coding", "research", "mathematics", "strategy"],
        message: "{VALUE} is not a supported benchmark category"
      },
      index: true
    },
    difficulty: {
      type: String,
      required: [true, "difficulty is required"],
      enum: {
        values: ["easy", "medium", "complex"],
        message: "{VALUE} is not a supported benchmark difficulty"
      },
      index: true
    },
    prompt: {
      type: String,
      required: [true, "prompt is required"],
      trim: true
    },
    expectedCapabilities: {
      type: [String],
      default: []
    },
    requiresDecomposition: {
      type: Boolean,
      default: false
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

benchmarkSchema.index({ category: 1, difficulty: 1 });

const Benchmark = mongoose.model("Benchmark", benchmarkSchema);

export default Benchmark;
export { Benchmark };
