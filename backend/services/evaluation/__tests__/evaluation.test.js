import http from "http";

const BASE_URL = "http://localhost:8005";

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", (err) => reject(err));

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("==========================================");
  console.log("🧪 Running Evaluation Framework Test Suite");
  console.log("==========================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    const health = await request("/api/evaluation/health");
    assert(
      health.status === 200 && health.body.success === true && health.body.status === "healthy",
      "GET /api/evaluation/health returns healthy"
    );

    // 2. Validation error on Benchmark with invalid category
    const invalidCategory = await request("/api/evaluation/benchmarks", {
      method: "POST",
      body: {
        benchmarkId: "INVALID-001",
        category: "invalid-cat",
        difficulty: "easy",
        prompt: "test"
      }
    });
    assert(
      invalidCategory.status === 400 && invalidCategory.body.success === false,
      "POST /api/evaluation/benchmarks rejects invalid category"
    );

    // 3. Validation error on Benchmark with missing prompt
    const missingPrompt = await request("/api/evaluation/benchmarks", {
      method: "POST",
      body: {
        benchmarkId: "INVALID-002",
        category: "coding",
        difficulty: "easy"
      }
    });
    assert(
      missingPrompt.status === 400 && missingPrompt.body.success === false,
      "POST /api/evaluation/benchmarks rejects missing prompt"
    );

    // 4. Create Benchmark TEST-001
    const uniqueBenchId = `TEST-001-${Date.now()}`;
    const createBench = await request("/api/evaluation/benchmarks", {
      method: "POST",
      body: {
        benchmarkId: uniqueBenchId,
        category: "coding",
        difficulty: "easy",
        prompt: "Explain how JWT authentication works.",
        expectedCapabilities: ["coding"],
        requiresDecomposition: false,
        metadata: { tags: ["auth", "jwt", "security"] }
      }
    });
    assert(
      createBench.status === 201 && createBench.body.success === true && createBench.body.data.benchmarkId === uniqueBenchId,
      `POST /api/evaluation/benchmarks creates benchmark ${uniqueBenchId}`
    );

    // 5. Duplicate Benchmark ID check (409)
    const duplicateBench = await request("/api/evaluation/benchmarks", {
      method: "POST",
      body: {
        benchmarkId: uniqueBenchId,
        category: "coding",
        difficulty: "easy",
        prompt: "Duplicate attempt"
      }
    });
    assert(
      duplicateBench.status === 409 && duplicateBench.body.success === false,
      "POST /api/evaluation/benchmarks prevents duplicate benchmarkId (409)"
    );

    // 6. Get Benchmarks
    const getBenchList = await request(`/api/evaluation/benchmarks?category=coding`);
    assert(
      getBenchList.status === 200 &&
      getBenchList.body.success === true &&
      Array.isArray(getBenchList.body.benchmarks) &&
      getBenchList.body.benchmarks.some((b) => b.benchmarkId === uniqueBenchId),
      "GET /api/evaluation/benchmarks filters and returns created benchmark"
    );

    // 7. Create Experiment TEST-EXP-001
    const uniqueExpId = `TEST-EXP-001-${Date.now()}`;
    const createExp = await request("/api/evaluation/experiments", {
      method: "POST",
      body: {
        experimentId: uniqueExpId,
        name: "Evaluation Framework Smoke Test",
        description: "Initial evaluation service test",
        type: "baseline-comparison",
        systems: ["single-agent", "fixed-multi-agent", "cortex-ai"],
        configuration: {
          complexityScoring: true,
          recursiveDecomposition: true,
          dynamicRouting: true,
          sharedMemory: true,
          trustEscalation: true
        }
      }
    });
    assert(
      createExp.status === 201 && createExp.body.success === true && createExp.body.data.experimentId === uniqueExpId,
      `POST /api/evaluation/experiments creates experiment ${uniqueExpId}`
    );

    // 8. Get Experiments
    const getExpList = await request("/api/evaluation/experiments");
    assert(
      getExpList.status === 200 &&
      getExpList.body.success === true &&
      Array.isArray(getExpList.body.experiments) &&
      getExpList.body.experiments.some((e) => e.experimentId === uniqueExpId),
      "GET /api/evaluation/experiments returns list including new experiment"
    );

    // 9. Create EvaluationRun TEST-RUN-001
    const uniqueRunId = `TEST-RUN-001-${Date.now()}`;
    const createRun = await request("/api/evaluation/runs", {
      method: "POST",
      body: {
        runId: uniqueRunId,
        experimentId: uniqueExpId,
        benchmarkId: uniqueBenchId,
        system: "cortex-ai",
        status: "completed",
        metrics: {
          inputTokens: 450,
          outputTokens: 180,
          totalTokens: 630,
          latencyMs: 1250,
          cost: 0.00045,
          quality: 0.95
        },
        routing: {
          complexityScore: 2.1,
          complexityClass: "EASY",
          numberOfSubtasks: 1,
          recursionDepth: 1,
          agentsSelected: ["coding-agent"],
          agentsSkipped: ["vision-agent"]
        },
        trust: {
          initialTrust: 0.92,
          finalTrust: 0.96,
          escalated: false,
          escalationCount: 0
        },
        memory: {
          contextTokens: 320,
          memoryTokens: 120
        },
        modelInfo: {
          provider: "groq",
          model: "llama-3.3-70b-versatile"
        }
      }
    });
    assert(
      createRun.status === 201 && createRun.body.success === true && createRun.body.data.runId === uniqueRunId,
      `POST /api/evaluation/runs creates evaluation run ${uniqueRunId}`
    );

    // 10. Get Evaluation Runs List
    const getRunsList = await request(`/api/evaluation/runs?experimentId=${uniqueExpId}`);
    assert(
      getRunsList.status === 200 &&
      getRunsList.body.success === true &&
      Array.isArray(getRunsList.body.runs) &&
      getRunsList.body.runs.length >= 1 &&
      getRunsList.body.runs[0].runId === uniqueRunId,
      "GET /api/evaluation/runs returns filtered runs by experimentId"
    );

    // 11. Get Evaluation Run By ID
    const getSingleRun = await request(`/api/evaluation/runs/${uniqueRunId}`);
    assert(
      getSingleRun.status === 200 &&
      getSingleRun.body.success === true &&
      getSingleRun.body.data.runId === uniqueRunId &&
      getSingleRun.body.data.system === "cortex-ai" &&
      getSingleRun.body.data.metrics.totalTokens === 630,
      `GET /api/evaluation/runs/:runId retrieves single run with full schema metrics`
    );

    // 12. Non-existent run returns 404
    const notFoundRun = await request("/api/evaluation/runs/NON_EXISTENT_RUN_999");
    assert(
      notFoundRun.status === 404 && notFoundRun.body.success === false,
      "GET /api/evaluation/runs/:runId returns 404 for non-existent run"
    );

    console.log("==========================================");
    console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
    console.log("==========================================");

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error("Test execution error:", err);
    process.exit(1);
  }
}

runTests();
