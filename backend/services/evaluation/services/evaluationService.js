import Benchmark from "../models/Benchmark.js";
import Experiment from "../models/Experiment.js";
import EvaluationRun from "../models/EvaluationRun.js";

/**
 * Service handling database operations for benchmarks, experiments, and evaluation runs
 */
class EvaluationService {
  // ==================== BENCHMARKS ====================

  async createBenchmark(data) {
    const existing = await Benchmark.findOne({ benchmarkId: data.benchmarkId });
    if (existing) {
      const error = new Error(`Benchmark with ID '${data.benchmarkId}' already exists`);
      error.statusCode = 409;
      throw error;
    }
    const benchmark = new Benchmark(data);
    return await benchmark.save();
  }

  async getBenchmarks(query = {}, pagination = {}) {
    const filter = {};
    if (query.category) filter.category = query.category;
    if (query.difficulty) filter.difficulty = query.difficulty;
    if (query.benchmarkId) filter.benchmarkId = query.benchmarkId;
    if (query.search) {
      filter.$or = [
        { benchmarkId: { $regex: query.search, $options: "i" } },
        { prompt: { $regex: query.search, $options: "i" } }
      ];
    }

    const page = Math.max(1, parseInt(pagination.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(pagination.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const [total, benchmarks] = await Promise.all([
      Benchmark.countDocuments(filter),
      Benchmark.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      benchmarks
    };
  }

  async getBenchmarkById(idOrBenchmarkId) {
    let benchmark = await Benchmark.findOne({ benchmarkId: idOrBenchmarkId }).lean();
    if (!benchmark && idOrBenchmarkId.match(/^[0-9a-fA-F]{24}$/)) {
      benchmark = await Benchmark.findById(idOrBenchmarkId).lean();
    }
    return benchmark;
  }

  // ==================== EXPERIMENTS ====================

  async createExperiment(data) {
    const existing = await Experiment.findOne({ experimentId: data.experimentId });
    if (existing) {
      const error = new Error(`Experiment with ID '${data.experimentId}' already exists`);
      error.statusCode = 409;
      throw error;
    }
    const experiment = new Experiment(data);
    return await experiment.save();
  }

  async getExperiments(query = {}, pagination = {}) {
    const filter = {};
    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;
    if (query.experimentId) filter.experimentId = query.experimentId;
    if (query.search) {
      filter.$or = [
        { experimentId: { $regex: query.search, $options: "i" } },
        { name: { $regex: query.search, $options: "i" } },
        { description: { $regex: query.search, $options: "i" } }
      ];
    }

    const page = Math.max(1, parseInt(pagination.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(pagination.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const [total, experiments] = await Promise.all([
      Experiment.countDocuments(filter),
      Experiment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      experiments
    };
  }

  async getExperimentById(idOrExperimentId) {
    let experiment = await Experiment.findOne({ experimentId: idOrExperimentId }).lean();
    if (!experiment && idOrExperimentId.match(/^[0-9a-fA-F]{24}$/)) {
      experiment = await Experiment.findById(idOrExperimentId).lean();
    }
    return experiment;
  }

  // ==================== EVALUATION RUNS ====================

  async createEvaluationRun(data) {
    const existing = await EvaluationRun.findOne({ runId: data.runId });
    if (existing) {
      const error = new Error(`EvaluationRun with ID '${data.runId}' already exists`);
      error.statusCode = 409;
      throw error;
    }

    // Auto-populate prompt, category, difficulty from benchmark if not explicitly passed
    if (data.benchmarkId && (!data.prompt || !data.category || !data.difficulty)) {
      const benchmark = await this.getBenchmarkById(data.benchmarkId);
      if (benchmark) {
        if (!data.prompt) data.prompt = benchmark.prompt;
        if (!data.category) data.category = benchmark.category;
        if (!data.difficulty) data.difficulty = benchmark.difficulty;
      }
    }

    const run = new EvaluationRun(data);
    return await run.save();
  }

  async getEvaluationRuns(query = {}, pagination = {}) {
    const filter = {};
    if (query.experimentId) filter.experimentId = query.experimentId;
    if (query.benchmarkId) filter.benchmarkId = query.benchmarkId;
    if (query.system) filter.system = query.system;
    if (query.status) filter.status = query.status;
    if (query.category) filter.category = query.category;
    if (query.difficulty) filter.difficulty = query.difficulty;

    const page = Math.max(1, parseInt(pagination.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(pagination.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const [total, runs] = await Promise.all([
      EvaluationRun.countDocuments(filter),
      EvaluationRun.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      runs
    };
  }

  async getEvaluationRunById(idOrRunId) {
    let run = await EvaluationRun.findOne({ runId: idOrRunId }).lean();
    if (!run && idOrRunId.match(/^[0-9a-fA-F]{24}$/)) {
      run = await EvaluationRun.findById(idOrRunId).lean();
    }
    return run;
  }
}

export default new EvaluationService();
