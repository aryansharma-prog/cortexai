# 🧠 CortexAI — System Architecture, Microservices & Algorithmic Blueprint

---

## 📌 1. Architectural Overview & System Design

**CortexAI** is a distributed, recursive, adaptive multi-agent AI intelligence platform engineered to surpass traditional single-prompt conversational models. It evaluates task complexity, dynamically creates hierarchical Directed Acyclic Graphs (DAG), recursively decomposes complex subtasks into atomic units, selects the cheapest capable agent for each leaf task, executes them with shared incremental memory, evaluates measurable trust, selectively escalates low-trust results, and synthesizes structured executive outputs with live metrics and interactive code artifacts.

```
                                 USER QUERY / ATTACHMENT
                                            │
                                            ▼
                                   ┌─────────────────┐
                                   │  Task Analyzer  │
                                   └────────┬────────┘
                                            │
                                            ▼
                               ┌─────────────────────────┐
                               │ Initial Task Breakdown  │
                               └────────────┬────────────┘
                                            │
                                            ▼
                               ┌─────────────────────────┐
                               │  Complexity Evaluator   │
                               │ (0.3D+0.2S+0.2R+0.15C+  │
                               │         0.15U)          │
                               └────────────┬────────────┘
                                            │
               ┌────────────────────────────┼────────────────────────────┐
               ▼                            ▼                            ▼
        ┌──────────────┐             ┌──────────────┐             ┌──────────────┐
        │  EASY (0-39) │             │ MEDIUM (40-69│             │COMPLEX (70+) │
        │  (Leaf Node) │             │  (Leaf Node) │             │              │
        └──────┬───────┘             └──────┬───────┘             └──────┬───────┘
               │                            │                            │
               │                            │              ┌─────────────┴─────────────┐
               │                            │              ▼                           ▼
               │                            │     Stop Condition Met?          Decompose Task
               │                            │     • Max depth (3) reached             │
               │                            │     • Atomic / non-decomposable         ▼
               │                            │     • Benefit < Overhead       Child Subtasks
               │                            │              │                          │
               │                            │              ▼                          ▼
               │                            │     Treat as Leaf Node        Re-evaluate Complexity
               │                            │              │                          │
               └────────────────────────────┼──────────────┴──────────────────────────┘
                                            │
                                            ▼
                               ┌─────────────────────────┐
                               │ Dynamic Agent Selector  │
                               │  (Cheapest Capable)     │
                               └────────────┬────────────┘
                                            │
                                            ▼
                               ┌─────────────────────────┐
                               │ Parallel/DAG Execution  │
                               │ with Shared Memory & SSE│
                               └────────────┬────────────┘
                                            │
                                            ▼
                               ┌─────────────────────────┐
                               │    Trust Evaluation     │
                               │  (Measurable Evidence)  │
                               └────────────┬────────────┘
                                            │
                             ┌──────────────┴──────────────┐
                             ▼                             ▼
                    ┌─────────────────┐           ┌─────────────────┐
                    │  HIGH / MEDIUM  │           │ LOW TRUST (<60) │
                    │   (Trust ≥ 60)  │           └────────┬────────┘
                    └────────┬────────┘                    │
                             │                             ▼
                             │                    ┌─────────────────┐
                             │                    │Escalation / Refine
                             │                    │to Stronger Agent│
                             │                    └────────┬────────┘
                             │                             │
                             └──────────────┬──────────────┘
                                            │
                                            ▼
                               ┌─────────────────────────┐
                               │ Executive Synthesizer   │
                               │ & Execution Tree Output │
                               └─────────────────────────┘
```

---

## 🧩 2. Microservice Topology

| Microservice | Port | Primary Responsibilities | Data Store / APIs |
|---|---|---|---|
| **API Gateway** | `8000` | Reverse proxy, request forwarding, CORS, dual-session authentication check, public asset routing | Redis Session Cache |
| **Auth Service** | `8001` | Firebase token verification, user synchronization, session creation/destruction | MongoDB, Firebase Admin, Redis |
| **Chat Service** | `8002` | Conversation threads, message persistence, history retrieval | MongoDB (`conversations`, `messages`) |
| **Agent Service** | `8003` | Task analysis, recursive DAG orchestration, dynamic agent selection, RAG, PDF/PPT synthesis, SSE streaming, cancellation manager | Groq, Gemini, OpenRouter, Tavily, Qdrant, Redis, S3 |
| **Billing Service**| `8004` | Razorpay order generation, webhook verification, credit deduction, subscription management | MongoDB (`users`, `transactions`), Razorpay SDK |

---

## ⚙️ 3. Complete Inventory of All Implemented Algorithms

---

### 🔬 Algorithm 1: Hybrid Complexity Evaluation Engine
* **File:** [`backend/services/agent/orchestration/complexityEvaluator.js`](file:///c:/Users/ASUS/Desktop/cortex-ai/cortexai/backend/services/agent/orchestration/complexityEvaluator.js)
* **Goal:** Calculate an objective, multi-factor numerical complexity score ($0 - 100$) for every task node using measurable signals and domain heuristics.

#### Mathematical Formulation:
$$\text{ComplexityScore} = 0.30D + 0.20S + 0.20R + 0.15C + 0.15U$$

Where each factor is normalized to the $[0, 100]$ interval:
1. **$D$ — Dependency Factor**:
   Calculated from graph in-degrees and recursion depth:
   $$\text{RawScore} = (\text{depCount} \times 30) + (\text{depth} \times 15)$$
   Clamped to $[10, 100]$ (independent root tasks evaluate to $10$).
2. **$S$ — Reasoning Steps Factor**:
   Normalized using configurable thresholds:
   - $1 \text{ step} \implies 20$
   - $2 \text{ steps} \implies 35$
   - $3 - 4 \text{ steps} \implies 55$
   - $5 - 6 \text{ steps} \implies 75$
   - $\ge 7 \text{ steps} \implies \min(100, 75 + (\text{stepCount} - 6) \times 5)$
3. **$R$ — Retrieval Requirement Factor**:
   - Live Search Tool Trigger $\implies 95$
   - PDF Document RAG $\implies 90$
   - Multi-source keyword match ($\ge 3$ terms: *research, market, stock, stats, global*) $\implies 85$
   - Single keyword match $\implies 60$
   - Internal knowledge base $\implies 15$
4. **$C$ — Computational Difficulty Factor**:
   - Complex full-stack code/architecture $\implies 95$
   - Standard code engineering $\implies 80$
   - Mathematical modeling/formulas ($\ge 3$ metrics: *calculate, growth rate, ratio, algorithm, simulation*) $\implies 85$
   - Structured reasoning signals $\implies 65$
   - Basic transformation $\implies 15$
5. **$U$ — Uncertainty Factor**:
   - Multi-hypothesis / strategic analysis queries (*recommend, evaluate strategy, forecast, options*) $\implies 75$
   - Exploratory inquiry $\implies 55$
   - Short underspecified prompt ($< 25$ chars) $\implies 70$
   - Clearly specified task $\implies 20$

#### Complexity Classification:
- $0 \le \text{Score} < 40 \implies \mathbf{EASY}$
- $40 \le \text{Score} < 70 \implies \mathbf{MEDIUM}$
- $70 \le \text{Score} \le 100 \implies \mathbf{COMPLEX}$

---

### 🧬 Algorithm 2: Recursive Task Decomposition with Stop Conditions
* **File:** [`backend/services/agent/orchestration/taskDecomposer.js`](file:///c:/Users/ASUS/Desktop/cortex-ai/cortexai/backend/services/agent/orchestration/taskDecomposer.js)
* **Goal:** Recursively break complex tasks into atomic child subtasks while strictly preventing infinite recursion and unnecessary overhead.

#### Algorithmic Logic:
```
function recursivelyDecompose(tasks, tree, parentId, depth):
  for each task in tasks:
    1. Evaluate Complexity: (D, S, R, C, U) -> score & classification
    2. Select Dynamic Agent: Cheapest capable agent
    3. Add node to ExecutionTree
    4. Check Stop Conditions:
       - Stop if depth >= MAX_DECOMPOSITION_DEPTH (default 3)
       - Stop if ComplexityScore < 70 (EASY or MEDIUM)
       - Stop if task is already atomic/actionable (length < 40 chars and no conjunctions)
       - Stop if decomposition cost exceeds expected benefit
    5. If Stop Condition is FALSE:
       - Generate 2-3 focused child subtasks via LLM / structured heuristics
       - Mark parent node as "decomposed" (isLeaf = false)
       - Recurse: recursivelyDecompose(children, tree, node.id, depth + 1)
```

---

### 🎯 Algorithm 3: Cheapest Capable Dynamic Agent Selection
* **File:** [`backend/services/agent/orchestration/dynamicAgentSelector.js`](file:///c:/Users/ASUS/Desktop/cortex-ai/cortexai/backend/services/agent/orchestration/dynamicAgentSelector.js)
* **Goal:** Dynamically choose the lowest-cost model/agent capable of meeting task complexity and capability requirements.

#### Selection Formula:
$$\text{AgentScore} = w_{\text{cap}}\text{CapabilityMatch} + w_{\text{qual}}\text{Quality} + w_{\text{suit}}\text{Suitability} + w_{\text{tool}}\text{ToolCompatibility} - w_{\text{cost}}\text{CostPenalty}$$

*Default Weights:*
$w_{\text{cap}} = 0.35, \quad w_{\text{qual}} = 0.25, \quad w_{\text{suit}} = 0.20, \quad w_{\text{tool}} = 0.10, \quad w_{\text{cost}} = 0.10$

1. **Capability Match ($0 - 100$)**:
   Direct agentType match $\implies 100$; Multiple capability intersections $\implies 90$; Single capability $\implies 70$; Incapable candidates ($< 50$) are rejected.
2. **Suitability ($0 - 100$)**:
   - For EASY tasks: Light tiers score $95$, Heavy tiers are penalized ($60$) to prevent overkill.
   - For MEDIUM tasks: Balanced tiers score $95$, Light tiers score $85$.
   - For COMPLEX tasks: Heavy tiers score $95$, Balanced tiers score $90$.
3. **Tool Compatibility ($0 - 100$)**:
   Evaluates support for required tools (`tavily_search`, `pdf_parser`, `monaco_artifact_generator`).
4. **Cost Penalty ($0 - 100$)**:
   Higher input/output pricing per 1M tokens incurs higher penalties.
5. **Explainability**:
   Returns `selectedAgent`, `agentScore`, human-readable `reason`, and list of `alternativesConsidered` with their scores.

---

### 🌳 Algorithm 4: Hierarchical Execution Tree & Topological Dispatch
* **Files:** [`executionTree.js`](file:///c:/Users/ASUS/Desktop/cortex-ai/cortexai/backend/services/agent/orchestration/executionTree.js), [`orchestrator.js`](file:///c:/Users/ASUS/Desktop/cortex-ai/cortexai/backend/services/agent/orchestration/orchestrator.js)
* **Goal:** Model the full task hierarchy and execute only leaf nodes in parallel batches based on completed dependencies.

1. **Leaf Extraction**:
   Only leaf nodes ($isLeaf = true$) represent executable tasks. Parent branch nodes represent decomposition containers.
2. **Topological Batch Execution**:
   - Extract ready batch $B = \{ \text{leaf} \mid \text{dependencies} \subseteq \text{CompletedSet} \}$.
   - Execute batch concurrently using `Promise.allSettled()`.
   - Update execution tree node statuses and metrics in real-time.

---

### 🧠 Algorithm 5: Shared Incremental Working Memory
* **File:** [`backend/services/agent/orchestration/sharedMemory.js`](file:///c:/Users/ASUS/Desktop/cortex-ai/cortexai/backend/services/agent/orchestration/sharedMemory.js)
* **Goal:** Scoped, versioned, delta-based context delivery preventing token explosion and redundant reasoning across multi-agent DAGs.

#### Core Capabilities & Memory Architecture
1. **Structured Memory Entries**:
   - Categorized by type: `FACT`, `DATA`, `CODE`, `RESULT`, `SOURCE`, `CONSTRAINT`, `REQUIREMENT`, `VERIFICATION`, `CONFLICT`, `SUMMARY`.
   - Tracked with monotonic `version`, `importance` ($0.0 - 1.0$), `confidence`, `status` (`ACTIVE`, `VERIFIED`, `SUPERSEDED`, `INVALID`), and `producer`/`consumers` mapping.
2. **Monotonic Versioning & Delta Retrieval**:
   - `getNewSince(sinceVersion)` retrieves exclusively new and modified delta entries since the agent's last checkpoint.
3. **Relevance Filtering & Dependency Scoping**:
   - Downstream agents receive strictly the verified facts, quantitative parameters, and code snippets relevant to their immediate task dependencies.
   - Irrelevant peer findings and conversational fluff are filtered out before prompt construction.
4. **Cost-Aware Knowledge Extraction**:
   - Deterministic extraction of code blocks, Markdown tables, metric lines, and sources from agent outputs without invoking expensive intermediate LLMs.
5. **Trust & Escalation Superseding**:
   - Escalated executions mark superseded entries as `status: "SUPERSEDED"`, ensuring downstream agents only consume verified, high-trust findings.
6. **Token Reduction Telemetry**:
   $$\text{Tokens Saved} = \text{FullContextTokensEstimate} - \text{SelectedContextTokens}$$
   $$\text{Context Reduction \%} = \left( 1 - \frac{\text{SelectedContextTokens}}{\text{FullContextTokensEstimate}} \right) \times 100\%$$
7. **Fail-Safe Persistence**:
   - Fast Redis caching (`shared_memory:<executionId>`) with zero-downtime in-memory fallback if Redis is unavailable.

---

### 🛡️ Algorithm 6: Measurable Multi-Domain Trust Evaluator
* **File:** [`backend/services/agent/orchestration/trustEvaluator.js`](file:///c:/Users/ASUS/Desktop/cortex-ai/cortexai/backend/services/agent/orchestration/trustEvaluator.js)
* **Goal:** Compute objective trustworthiness ($0 - 100$) from measurable evidence rather than model self-confidence.

#### Domain Strategies:
1. **Coding Domain**:
   - Valid multi-file artifacts generated $\implies +35$
   - Markdown code blocks present $\implies +25$
   - Missing code structure penalty $\implies -25$
   - Error trace detected $\implies -30$
2. **Research / Web Domain**:
   - Verified external search citations present $\implies +8$ per source (up to $+35$)
   - Citation references present $\implies +25$
   - Sufficient depth ($\ge 200$ chars) $\implies +20$
   - Shallow content $\implies -15$
3. **Analysis / Mathematical Domain**:
   - Structured Markdown table present $\implies +30$
   - Quantitative metrics ($15\%$, $\$5B$, growth numbers) $\implies +15$
   - Thematic section structuring $\implies +10$
4. **General Domain**:
   - Non-empty length and clean execution $\implies +45$
   - Refusal or rate-limit error $\implies -40$

#### Trust Classification:
- $85 \le \text{TrustScore} \le 100 \implies \mathbf{HIGH}$
- $60 \le \text{TrustScore} < 85 \implies \mathbf{MEDIUM}$
- $0 \le \text{TrustScore} < 60 \implies \mathbf{LOW}$ (Triggers Escalation)

---

### ⚡ Algorithm 7: Targeted Single-Leaf Escalation Manager
* **File:** [`backend/services/agent/orchestration/escalationManager.js`](file:///c:/Users/ASUS/Desktop/cortex-ai/cortexai/backend/services/agent/orchestration/escalationManager.js)
* **Goal:** Automatically rectify low-trust outputs ($\text{TrustScore} < 60$) without re-executing the entire workflow.

1. **Trigger**: Detected leaf node with $\text{TrustScore} < 60$.
2. **Alternative Discovery**: Identifies next stronger capable agent in `AGENT_REGISTRY` (e.g. upgrades from light tier to heavy tier).
3. **Refined Execution**: Reruns ONLY the affected leaf task with high-accuracy refinement prompt and updated model.
4. **Trust Re-evaluation**: Recalculates trust score and updates shared memory.
5. **Loop Protection**: Limits escalations to $\text{MAX\_TASK\_ESCALATIONS} = 2$.

---

### 💰 Algorithm 8: Fine-Grained Cost & Usage Telemetry Tracker
* **File:** [`backend/services/agent/observability/costTracker.js`](file:///c:/Users/ASUS/Desktop/cortex-ai/cortexai/backend/services/agent/observability/costTracker.js)
* **Goal:** Distinguish estimated vs actual costs across all tasks, recursion levels, and escalations.

$$\text{Cost} = \left( \frac{\text{Input Tokens}}{1,000,000} \times P_{\text{input}} \right) + \left( \frac{\text{Output Tokens}}{1,000,000} \times P_{\text{output}} \right)$$

Aggregates workflow telemetry: `totalTasks`, `leafTasks`, `maxDepth`, `agentsUsed`, `escalations`, `totalTokens`, `estimatedCost`, `actualCost`, `totalDurationMs`, `averageTrust`.

---

### 🛑 Algorithm 9: Distributed Real-Time Cancellation Lifecycle
* **File:** [`backend/services/agent/orchestration/cancellationManager.js`](file:///c:/Users/ASUS/Desktop/cortex-ai/cortexai/backend/services/agent/orchestration/cancellationManager.js)
* **Goal:** Zero-leak instant termination of active agent pipelines when the user clicks **[Stop]**.

- Dual registration: in-memory set + Redis key `cancellation:<executionId>` with 1-hour TTL.
- Publishes `workflow_cancelled` over Redis Pub/Sub channel `execution_events:<executionId>`.
- Calls `assertNotCancelled(executionId)` before and after all async invocations, throwing `ResearchCancelledError` to unwind execution cleanly.

---

### 📚 Algorithm 10: PDF RAG Pipeline
* **File:** [`backend/services/agent/agents/pdfRag.agent.js`](file:///c:/Users/ASUS/Desktop/cortex-ai/cortexai/backend/services/agent/agents/pdfRag.agent.js)
* **Goal:** Extract, vectorize, and retrieve semantic document context from user-uploaded PDFs.

- Uses `pdf-parse` for text extraction.
- `RecursiveCharacterTextSplitter`: $1000$-char chunks with $200$-char overlap.
- Vector search with Qdrant ($k=5$) or tokenized keyword-frequency fallback scoring.

---

### 🔎 Algorithm 11: Web Search Normalization & Citation Ranking
* **File:** [`backend/services/agent/utils/searchNormalizer.js`](file:///c:/Users/ASUS/Desktop/cortex-ai/cortexai/backend/services/agent/utils/searchNormalizer.js)
* **Goal:** Sanitize HTML, deduplicate sources by URL, limit snippets to 400 characters, extract domain names, and format citations.

---

### 🎯 Algorithm 12: Adaptive Response Policy Engine
* **File:** [`backend/services/agent/orchestration/responsePolicyEngine.js`](file:///c:/Users/ASUS/Desktop/cortex-ai/cortexai/backend/services/agent/orchestration/responsePolicyEngine.js)
* **Core Principle:** Strict architectural separation of **Task Complexity** (reasoning, tools, and agents required) from **Response Complexity** (depth, token budget, and structure the user needs).
* **Minimum Sufficient Answer Principle:** Prefers the minimum information required to fully satisfy the user's inquiry over maximum model verbosity.

$$\text{Response Policy} = f(\text{Task Complexity}, \text{User Intent Overrides}, \text{Task Nature}, \text{Subtask Dependency Structure})$$

#### Depth Levels & Configuration Matrix
| Policy Level | Target Tokens | Max Tokens | Verbosity | Sections Allowed | Tables Allowed | Strategic Takeaways | Examples Allowed | Use Cases |
|---|---|---|---|---|---|---|---|---|
| `MINIMAL` | $40$ | $100$ | `LOW` | ❌ No | ❌ No | ❌ No | ❌ No | Simple factual questions, math/calculations, direct lookups |
| `SHORT` | $120$ | $250$ | `LOW` | ❌ No | ❌ No | ❌ No | ✅ Max 1 brief | Simple definitions, targeted code syntax fixes, concise summaries |
| `FOCUSED` | $350$ | $750$ | `MEDIUM` | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes | Direct comparisons, medium explanations, single-feature implementations |
| `DETAILED` | $1200+$ | $3000$ | `HIGH` | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | Comprehensive research, system designs, multi-market financial analyses |

#### Intent Override Hierarchy
$$\text{Explicit User Intent} \succ \text{Intrinsic Task Type} \succ \text{Task Complexity Default}$$
- Triggers like *"briefly"*, *"in short"*, *"1 sentence"*, *"TL;DR"* immediately force `MINIMAL` or `SHORT` policy even for complex topics.
- Triggers like *"explain in detail"*, *"deep dive"*, *"step by step"* force `DETAILED` policy even for simple topics.

---

### 🛡️ Algorithm 13: Non-Destructive Response Validator & Semantic Compression
* **File:** [`backend/services/agent/orchestration/responseValidator.js`](file:///c:/Users/ASUS/Desktop/cortex-ai/cortexai/backend/services/agent/orchestration/responseValidator.js)
* **Goal:** Verify synthesized responses against assigned token and structural constraints.
* **Mechanism:**
  1. Inspects synthesized output for token overshoot ($>1.25 \times \text{maxTokens}$) or forbidden report sections (`## Executive Summary`, `## Strategic Takeaways` in `MINIMAL`/`SHORT` mode).
  2. If a violation is detected, triggers targeted semantic compression via LLM prompt.
  3. **Zero Blind Truncation**: Never uses `.substring()`; preserves essential reasoning, code snippets, and citations while stripping fluff, repetitive conclusions, and unrequested background trivia.

---

### 📝 Algorithm 14: Executive Map-Reduce Multi-Agent Synthesizer
* **File:** [`backend/services/agent/agents/synthesizer.agent.js`](file:///c:/Users/ASUS/Desktop/cortex-ai/cortexai/backend/services/agent/agents/synthesizer.agent.js)
* **Goal:** Transform multi-agent subtask outputs into an executive response strictly tailored to the assigned `Response Policy`.
* Dynamically constructs system prompt and instructions corresponding to `MINIMAL`, `SHORT`, `FOCUSED`, or `DETAILED` modes.

---

### 📑 Algorithm 15: Dynamic Presentation & Document Renderers
* **Files:** [`generatePpt.js`](file:///c:/Users/ASUS/Desktop/cortex-ai/cortexai/backend/services/agent/utils/generatePpt.js), [`generatePdf.js`](file:///c:/Users/ASUS/Desktop/cortex-ai/cortexai/backend/services/agent/utils/generatePdf.js)
* Programmatic generation of styled 16:9 widescreen PowerPoint decks (`pptxgenjs`) and styled PDF whitepapers (`pdfkit`).

---

### 🔐 Algorithm 16: Dual-Session Authentication & Gateway Forwarding
* **Files:** [`backend/gateway/index.js`](file:///c:/Users/ASUS/Desktop/cortex-ai/cortexai/backend/gateway/index.js), [`backend/gateway/middleware/auth.middleware.js`](file:///c:/Users/ASUS/Desktop/cortex-ai/cortexai/backend/gateway/middleware/auth.middleware.js)
* Validates session from `req.cookies.session`, `x-session-id`, or `Authorization: Bearer` against Redis, injecting authenticated `x-user-id` and `x-user-email` headers into microservices.

---

### 📡 Algorithm 17: Real-Time SSE Telemetry & Tree Streaming
* **File:** [`backend/services/agent/controllers/agent.controller.js`](file:///c:/Users/ASUS/Desktop/cortex-ai/cortexai/backend/services/agent/controllers/agent.controller.js)
* Streams live execution graph events (`tree_initialized`, `response_policy_evaluated`, `agent_started`, `agent_completed`, `node_escalation_started`, `workflow_completed`) directly to the client via Server-Sent Events.

---

## 🗄️ 4. Data Models & Database Schemas

### `Execution` Schema (MongoDB - Agent Service)
```javascript
{
  executionId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  conversationId: { type: String, index: true },
  prompt: { type: String, required: true },
  taskType: { type: String, default: "general" },
  complexity: { type: String, enum: ["low", "medium", "high", "EASY", "MEDIUM", "COMPLEX", "cancelled", "fallback"] },
  executionStrategy: { type: String, default: "single" },
  responsePolicy: {
    depth: { type: String, enum: ["MINIMAL", "SHORT", "FOCUSED", "DETAILED"] },
    mode: String,
    taskComplexity: String,
    taskType: String,
    targetTokens: Number,
    maxTokens: Number,
    actualTokens: Number,
    verbosity: String,
    compressionTriggered: Boolean,
    originalTokens: Number,
    finalTokens: Number,
    reason: String,
    userIntentOverride: Boolean
  },
  sharedMemorySummary: {
    memoryVersion: Number,
    entriesCreated: Number,
    entriesUsed: Number,
    entriesSkipped: Number,
    fullContextTokensEstimate: Number,
    selectedContextTokens: Number,
    tokensSavedEstimate: Number,
    contextReductionPercent: Number
  },
  scores: {
    complexityScore: Number,
    decomposabilityScore: Number,
    dependencyScore: Number,
    toolRequirementScore: Number,
    riskScore: Number
  },
  selectedAgents: [String],
  subtasks: [
    {
      id: String,
      name: String,
      description: String,
      agentType: String,
      dependencies: [String],
      complexityScore: Number,
      classification: String,
      selectedAgent: String,
      model: String,
      provider: String,
      selectionReason: String,
      trustScore: Number,
      trustClassification: String,
      escalated: Boolean,
      status: String,
      metrics: Object,
      memory: Object
    }
  ],
  executionTree: Object, // Hierarchical tree with nested children
  totalTasks: Number,
  leafTasks: Number,
  maxDepth: Number,
  escalations: Number,
  averageTrust: Number,
  agentExecutions: [
    {
      agentId: String,
      model: String,
      provider: String,
      inputTokens: Number,
      outputTokens: Number,
      durationMs: Number,
      estimatedCost: Number,
      status: String
    }
  ],
  totalTokens: Number,
  totalDurationMs: Number,
  estimatedCost: Number,
  actualCost: Number,
  success: Boolean,
  finalAnswer: String
}
```

---

## 🌐 5. Complete API Route Reference

| Method | Gateway Route | Target Service | Authentication | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/google` | Auth (`8001`) | Public | Verifies Firebase token, registers/logs in user, returns session |
| `POST` | `/api/auth/logout` | Auth (`8001`) | Session | Destroys session from Redis and clears cookie |
| `GET` | `/api/me` | Gateway (`8000`) | Session | Fetches current user profile and credit balance |
| `POST` | `/api/agent/chat` | Agent (`8003`) | Session | Initiates recursive adaptive multi-agent orchestration pipeline |
| `GET` | `/api/agent/executions/:id` | Agent (`8003`) | Session | Fetches execution tree state and subtask statuses |
| `GET` | `/api/agent/executions/:id/stream`| Agent (`8003`)| Session | SSE endpoint for live execution tree telemetry & progress |
| `POST` | `/api/agent/executions/:id/cancel`| Agent (`8003`)| Session | Cancels active background research pipeline |
| `GET` | `/api/agent/research/analytics` | Agent (`8003`) | Session | Returns scientific metrics across all strategies & aggregate token efficiency |
| `GET` | `/api/agent/downloads/:filename`| Agent (`8003`) | Public | Downloads generated PDF/PPT/Image artifacts |
| `GET` | `/api/chat/conversations` | Chat (`8002`) | Session | Lists user conversation history |
| `POST` | `/api/billing/create-order` | Billing (`8004`)| Session | Generates Razorpay checkout order |
| `POST` | `/api/billing/verify-payment` | Billing (`8004`)| Session | Verifies Razorpay signature and increments credits |

---

## ⚡ 6. Token Efficiency & Intelligent Context Reduction Architecture

CortexAI’s core product differentiator is **Intelligent Token Efficiency**. Traditional multi-agent systems naively broadcast full chat history and intermediate execution outputs to every agent, causing quadratic context token growth $O(N^2)$, excessive latency, and runaway token utilization. CortexAI solves this through four tightly integrated architectural systems:

```
                            ┌────────────────────────────────────────┐
                            │          USER QUERY / TASK             │
                            └───────────────────┬────────────────────┘
                                                │
                                                ▼
                            ┌────────────────────────────────────────┐
                            │    1. Recursive Task Decomposition     │
                            │    & Complexity-Based Model Routing    │
                            │   (Groq 8B for easy / Gemini for hard) │
                            └───────────────────┬────────────────────┘
                                                │
                                                ▼
                            ┌────────────────────────────────────────┐
                            │    2. Shared Incremental Memory        │
                            │  • Delta-versioned memory entries      │
                            │  • Selective dependency scoping        │
                            │  • In-memory fact & artifact cache     │
                            └───────────────────┬────────────────────┘
                                                │
                                                ▼
                            ┌────────────────────────────────────────┐
                            │    3. Adaptive Response Policy Engine  │
                            │  • Dynamic depth (MINIMAL/SHORT/...)   │
                            │  • Token budget allocation             │
                            │  • Semantic compression validator      │
                            └───────────────────┬────────────────────┘
                                                │
                                                ▼
                            ┌────────────────────────────────────────┐
                            │    4. Telemetry Aggregation & UI       │
                            │  • Real-time token savings computation │
                            │  • Nav badge & Insights telemetry      │
                            └────────────────────────────────────────┘
```

### 6.1 Shared Incremental Memory (`SharedMemory`)
* **Atomic Fact & Result Extraction**: Extracts discrete facts, numerical data, source citations, and code blocks from subtask outputs without redundant LLM calls.
* **Selective Context Scoping**: When an agent executes a leaf subtask, only entries from its explicit dependency graph (`node.dependencies`) and general high-confidence facts are compiled into context.
* **Token Savings Calculation**:
  $$\text{TokensSaved} = \max(0, \text{FullContextEstimate} - \text{SelectedContextTokens})$$
  $$\text{ReductionPercentage} = \frac{\text{TokensSaved}}{\text{FullContextEstimate}} \times 100\%$$
* **Delta Versioning**: Tracks `memoryVersion` per execution. Subtasks receive incremental diffs since their `lastSeenVersion` rather than full snapshots.

### 6.2 Adaptive Response Policy Engine (`ResponsePolicyEngine`)
* Dynamically determines response depth:
  * **MINIMAL** (≤ 150 tokens): Direct answers for trivial factual queries (e.g. "Capital of India").
  * **SHORT** (≤ 400 tokens): Concise explanations for simple lookups or brief summaries.
  * **FOCUSED** (≤ 1,000 tokens): Balanced structure for standard research and multi-aspect queries.
  * **DETAILED** (≤ 2,500 tokens): Exhaustive analytical reports for complex cross-domain investigations.
* **Response Validator & Semantic Compressor**: Detects if an output exceeds the target depth budget and performs targeted semantic compression while preserving key insights and citations.

### 6.3 Dashboard Integration & Insights View
* **Header Token Efficiency Indicator**: Compact, unobtrusive indicator in `Nav.jsx` showing context reduction percentage (e.g. `⚡ ↓ 41.7% less context`) without intrusive advertisement style.
* **Dedicated Insights Modal (`TokenInsightsModal.jsx`)**:
  * Displays **Tokens Saved**, **Context Reduction %**, and **Execution Runs**.
  * Shows visual comparative progress bars (**Estimated Full Context** vs **CortexAI Context**).
  * Outlines technical mechanisms (Shared Memory, Selective Context, Adaptive Routing, Response Optimization).
  * Never invents numbers: aggregates live data from MongoDB `Execution` records and active WebSocket/SSE messages.

---

## 7. Multi-Provider Architecture & Cortex Continuity

### 7.1 Separation of Agent Selection vs Model Selection
CortexAI decomposes workflow orchestration into two distinct decisions:
1. **Decision 1 (Agent Role)**: *"What kind of agent should solve this subtask?"* (e.g., Coding Agent, Vision Agent, Analysis Agent, Search Agent).
2. **Decision 2 (Model Router)**: *"Which provider/model should power that agent?"* (e.g., Claude 3.7 Sonnet, Gemini 2.5 Flash, Groq Llama 3.3 70B, DeepSeek V3).

### 7.2 Multi-Criteria Model Routing Scoring Engine
The Model Router evaluates candidate models using normalized multi-factor scoring:
$$\text{RoutingScore} = w_{\text{cap}} \cdot \text{CapabilityFit} + w_{\text{qual}} \cdot \text{Quality} + w_{\text{eff}} \cdot \text{TokenEfficiency} + w_{\text{avail}} \cdot \text{Availability} + w_{\text{rel}} \cdot \text{Reliability} + w_{\text{ctx}} \cdot \text{ContextSuitability}$$

* **Capability Fit**: Strict modality filtering (e.g. vision requirements exclude pure-text models; image generation routes strictly to visual engines).
* **Token Efficiency**: Balances expected cost per million tokens and execution latency against task complexity.
* **User BYOK Key Isolation**: Filters candidates strictly to providers connected by the authenticated user (`req.headers["x-user-id"]`) or platform defaults. Decrypted credentials (AES-256-GCM) are held only in server-side memory at invocation time.

### 7.3 Model Failure Classification & Circuit Breaker
Runtime model errors are classified into distinct failure categories:
* `RATE_LIMIT` / `QUOTA`: HTTP 429 / TPM / RPM exhaustion -> puts provider into cooldown and triggers immediate failover.
* `KEY_CONFIGURATION`: HTTP 401 / 403 invalid key -> disables provider for session.
* `CAPABILITY_MISMATCH`: Context length exceeded or unsupported parameter -> reroutes to higher-capacity model.
* `RETRYABLE`: Transient 500 / 502 / 503 / 504 / timeout.

### 7.4 Cortex Continuity & Structured Context Handoff
When a provider encounters a rate limit or failure:
1. **Zero Task Restart**: The workflow never restarts and never dumps raw, noisy chat history into the replacement model.
2. **Checkpoint Synthesis**: Structured state is pulled from the **Shared Notebook**:
   * Verified completed milestones
   * Remaining subtask requirements
   * Domain constraints and decisions
   * Non-alarming failover reason
3. **Provider-Specific Adaptation**: Instructions and memory context are normalized for the replacement provider format (Gemini, Claude, Groq, DeepSeek).
4. **Execution & Trust Verification**: The subtask executes on the new model and passes through Trust Evaluation before re-integration.


