# 🧠 CortexAI — System Architecture, Microservices & Algorithmic Blueprint

---

## 📌 1. Architectural Overview & System Design

**CortexAI** is a distributed, multi-agent AI intelligence platform designed to surpass traditional single-prompt conversational models. It evaluates task complexity, dynamically creates Directed Acyclic Graphs (DAG), executes specialized domain agents in parallel and sequential chains, and synthesizes outputs into executive-grade reports with interactive artifacts.

```
                               ┌───────────────────────────────────────────┐
                               │   React 19 + Vite 8 Frontend (SPA)       │
                               │   Tailwind CSS v4 + Monaco Editor + Redux │
                               └─────────────────────┬─────────────────────┘
                                                     │ HTTP / SSE / REST
                                                     ▼
                               ┌───────────────────────────────────────────┐
                               │        API Gateway (Port: 8000)           │
                               │    Dual Authentication (Cookie + Bearer)  │
                               └───────┬──────────┬──────────┬─────────────┘
                                       │          │          │
                 ┌─────────────────────┼──────────┴──────────┼─────────────────────┐
                 ▼                     ▼                     ▼                     ▼
       ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
       │   Auth Service   │  │   Chat Service   │  │  Agent Service   │  │ Billing Service  │
       │   (Port: 8001)   │  │   (Port: 8002)   │  │   (Port: 8003)   │  │   (Port: 8004)   │
       │ Firebase + Mongo │  │ Conversations    │  │ Orchestrator DAG │  │ Razorpay Credits │
       └─────────┬────────┘  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
                 │                    │                     │                     │
                 └────────────────────┴──────────┬──────────┴─────────────────────┘
                                                 │
                                 ┌───────────────┴───────────────┐
                                 │   Distributed Infrastructure  │
                                 │   • Redis (Pub/Sub + Cache)   │
                                 │   • MongoDB Atlas (Storage)   │
                                 │   • Qdrant (Vector Database)  │
                                 └───────────────────────────────┘
```

---

## 🧩 2. Microservice Topology

| Microservice | Port | Primary Responsibilities | Data Store / APIs |
|---|---|---|---|
| **API Gateway** | `8000` | Reverse proxy, request forwarding, CORS, dual-session authentication check, public asset routing | Redis Session Cache |
| **Auth Service** | `8001` | Firebase token verification, user synchronization, session creation/destruction | MongoDB, Firebase Admin, Redis |
| **Chat Service** | `8002` | Conversation threads, message persistence, history retrieval | MongoDB (`conversations`, `messages`) |
| **Agent Service** | `8003` | Task analysis, DAG orchestration, agent dispatching, RAG, PDF/PPT synthesis, SSE streaming, cancellation manager | Groq, Gemini, OpenRouter, Tavily, Qdrant, Redis, S3 |
| **Billing Service**| `8004` | Razorpay order generation, webhook verification, credit deduction, subscription management | MongoDB (`users`, `transactions`), Razorpay SDK |

---

## ⚙️ 3. Complete Inventory of Implemented Algorithms

---

### 🔬 Algorithm 1: Heuristic Fast-Path Query Classification
* **File:** `backend/services/agent/orchestration/taskAnalyzer.js`
* **Goal:** Eliminate unnecessary LLM latency and token cost for deterministic, simple, or file-driven tasks.

#### Mathematical / Logic Flow:
Given input prompt $P$ and uploaded file metadata $F$:
1. **File Type Filter**:
   $$\text{If } F \neq \emptyset \land F.\text{mimetype} = \text{'application/pdf'} \implies \text{Route to } \text{pdfRag} \text{ (Complexity: 4, Strategy: Single)}$$
   $$\text{If } F \neq \emptyset \land F.\text{mimetype} \in \{\text{'image/*'}\} \implies \text{Route to } \text{imageAnalyzer} \text{ (Complexity: 4, Strategy: Single)}$$
2. **Conversational Greeting Filter**:
   $$\text{Let } G = \{\text{'hi'}, \text{'hello'}, \text{'hey'}, \dots\}$$
   $$\text{If } \text{lower}(P) \in G \lor (|P| \le 15 \land \text{lower}(P) \text{ starts with 'hi'}) \implies \text{Route to } \text{chat} \text{ (Complexity: 1)}$$
3. **Definition / Explanation Regex Filter**:
   $$\text{Regex: } \text{/}\text{\textasciicircum}(what\ is|what\ are|define|explain|who\ is|how\ does|why\ is)\backslash s+([a-zA-Z0-9\_\-\backslash s]\{2,30\})\backslash ?\$\text{/i}$$
   If matches and contains no comparison/research indicators $\implies \text{Route to } \text{chat} \text{ (Complexity: 2)}$
4. **Direct Coding / Asset Generation Regex**:
   - `create ppt|presentation` $\implies$ `ppt`
   - `create pdf|document` $\implies$ `pdf`
   - `write code to|debug this` $\implies$ `coding`

---

### 🧬 Algorithm 2: LLM-Guided Task Decomposition & Scientific Telemetry Scoring
* **File:** `backend/services/agent/orchestration/taskAnalyzer.js`
* **Goal:** Deconstruct complex tasks into atomic subtasks with dependency graphs and scientific telemetry scores.

#### Scientific Scoring Metrics ($1 - 10$ Scale):
* **Complexity Score ($C_s$):** Computational and reasoning depth required.
* **Decomposability Score ($D_s$):** Feasibility of breaking into independent sub-problems.
* **Dependency Score ($Dep_s$):** Degree of sequential chaining vs parallel independence.
* **Tool Requirement Score ($T_s$):** Necessity for live search, retrieval, or multimodal execution.
* **Risk Score ($R_s$):** Probability of ambiguity or hallucination.

#### Output Schema:
```json
{
  "taskType": "research | analysis | coding | comparison | general",
  "complexity": "low | medium | high",
  "requiresMultipleAgents": true,
  "executionStrategy": "parallel | sequential | hybrid",
  "scores": {
    "complexityScore": 8,
    "decomposabilityScore": 9,
    "dependencyScore": 4,
    "toolRequirementScore": 9,
    "riskScore": 3
  },
  "subtasks": [
    {
      "id": "subtask_search",
      "name": "Market Search Agent",
      "description": "Fetch real-time financial metrics for NVDA and AMD",
      "agentType": "search",
      "dependencies": []
    },
    {
      "id": "subtask_comparison",
      "name": "Comparison Agent",
      "description": "Perform side-by-side valuation benchmarking",
      "agentType": "comparison",
      "dependencies": ["subtask_search"]
    }
  ]
}
```

---

### 🕸️ Algorithm 3: Dynamic DAG Orchestration & Topological Batch Execution
* **File:** `backend/services/agent/orchestration/orchestrator.js`
* **Goal:** Execute subtasks respecting dependency constraints, running parallelizable subtasks concurrently, and passing accumulated context to downstream nodes.

#### Algorithmic Formulation:
Let $S = \{s_1, s_2, \dots, s_n\}$ be the set of subtasks. Each subtask $s_i$ has a set of dependencies $D_i \subseteq S$. Let $C$ be the set of completed subtask IDs, initially $C = \emptyset$.

1. **Topological Batch Extraction**:
   $$\text{Batch } B = \{ s_i \in S \setminus C \mid D_i \subseteq C \}$$
2. **Cycle Prevention**:
   $$\text{If } B = \emptyset \land S \setminus C \neq \emptyset \implies B = \{ \text{first}(S \setminus C) \}$$
3. **Concurrent Execution**:
   $$\text{Execute all } s \in B \text{ in parallel using } \texttt{Promise.allSettled()}$$
4. **Context Accumulation**:
   For each completed $s_k$, store its output in $\mathcal{M}[s_k]$.
   When a dependent subtask $s_j$ runs ($D_j \cap C \neq \emptyset$), build contextual prompt:
   $$\text{Context}(s_j) = \bigcup_{d \in D_j} \text{Output}(\mathcal{M}[d])$$
5. **Update State**:
   $$C \leftarrow C \cup \{ \text{id}(s) \mid s \in B \}$$
   Repeat until $C = S$.

---

### 🛑 Algorithm 4: Distributed Real-Time Cancellation & Abort Lifecycle
* **File:** `backend/services/agent/orchestration/cancellationManager.js`
* **Goal:** Enable instant zero-leak termination of active agent pipelines upon user cancellation.

#### Mechanism:
1. **User Action**: User triggers `POST /api/agent/executions/:id/cancel`.
2. **Dual-Layer Registration**:
   - Stores `executionId` in local memory (`inMemoryCancelledTasks.add(executionId)`).
   - Writes `cancellation:<executionId>` into Redis with 1-hour TTL.
   - Publishes `workflow_cancelled` event over Redis Pub/Sub channel `execution_events:<executionId>`.
3. **Execution Guarding**:
   Before and after any async tool or LLM invocation, `assertNotCancelled(executionId)` is called:
   $$\text{If } \text{isExecutionCancelled}(executionId) = \text{true} \implies \text{throw } \text{ResearchCancelledError}$$
4. **Graceful Teardown**:
   The error unwinds the call stack, releases Redis subscriptions, terminates the HTTP SSE stream, and saves a `cancelled` execution record to MongoDB.

---

### 📚 Algorithm 5: PDF RAG Pipeline (Chunking, Vector Search, & Keyword Fallback)
* **File:** `backend/services/agent/agents/pdfRag.agent.js`
* **Goal:** Extract, vectorize, and retrieve semantic document context from user-uploaded PDFs.

#### Algorithmic Steps:
1. **Text Extraction**: Uses `PDFParse` to extract raw string data from PDF binary buffer.
2. **Recursive Character Text Splitting**:
   - `chunkSize` = $1000$ characters.
   - `chunkOverlap` = $200$ characters.
   - Preserves semantic boundaries (`\n\n`, `\n`, ` `, `""`).
3. **Dual-Mode Retrieval**:
   - **Mode A (Vector DB)**: If Qdrant is connected, creates dynamic collection `pdf-<timestamp>`, embeds chunks, and runs $k$-nearest neighbor similarity search ($k=5$).
   - **Mode B (In-Memory Fallback)**: If Qdrant is absent or fails, executes tokenized keyword scoring:
     $$\text{Score}(doc, P) = \sum_{w \in P, |w| > 3} \mathbb{I}(w \in \text{lower}(doc))$$
     Sorts chunks in descending order of score and takes top 5 chunks.
4. **Context Injection & LLM Synthesis**: Injects retrieved context into prompt for LLM answer generation.
5. **Garbage Collection**: Deletes temporary uploaded PDF file in `finally` block to prevent disk leakage.

---

### 🔎 Algorithm 6: Web Search Normalization, Deduplication, & Source Ranking
* **File:** `backend/services/agent/utils/searchNormalizer.js`
* **Goal:** Strip noisy HTML, deduplicate sources by URL, sanitize markdown, and format citations.

#### Flow:
1. **URL Domain Parsing**: Extracts human-readable publishers (e.g., `https://www.reuters.com/...` $\to$ `Reuters`).
2. **URL Deduplication**: Uses `Set<URL>` to guarantee distinct sources.
3. **HTML & Raw Dump Sanitization**:
   - Replaces HTML tags: `/<[^>]*>/g` $\to$ `""`.
   - Removes raw JSON query metadata: `/\{\s*"query"[\s\S]*\}/g` $\to$ `""`.
   - Compresses multiple whitespaces to single space.
4. **Snippet Truncation**: Enforces max length of 400 characters per snippet to prevent LLM context window overflow.
5. **Dual Representation**:
   - **Compact Context**: `[Source 1] Title (Publisher): Snippet` (fed into LLM).
   - **Markdown References**: Formatted markdown citation list with backlinks.

---

### 📊 Algorithm 7: Token Usage Normalization & Multi-Model Cost Calculation
* **Files:** `usageTracker.js`, `pricing.js`
* **Goal:** Normalize heterogeneous token metadata across providers (Groq, Google GenAI, OpenRouter, DeepSeek) and calculate accurate financial cost.

#### Provider Normalization Hierarchy:
```
1. response.usage_metadata (LangChain AIMessage standard)
       ↓ (if null)
2. response.response_metadata.tokenUsage (Groq / OpenRouter / Gemini)
       ↓ (if null)
3. response.additional_kwargs.usage (Direct API wrappers)
```

#### Cost Formula:
$$\text{Cost} = \left( \frac{\text{Input Tokens}}{1,000,000} \times P_{\text{input}} \right) + \left( \frac{\text{Output Tokens}}{1,000,000} \times P_{\text{output}} \right)$$

---

### 📝 Algorithm 8: Map-Reduce Multi-Agent Synthesizer
* **File:** `backend/services/agent/agents/synthesizer.agent.js`
* **Goal:** Map individual subtask findings into structured domain summaries and reduce them into an executive research document.

#### Output Structure Enforcement:
1. **Executive Summary**: High-level verdict.
2. **Comparison Matrix**: Clean Markdown tables with structured numbers.
3. **Thematic Sections**: Categorized headings (`##`, `###`).
4. **Actionable Takeaways**: Numbered strategic points.
5. **Verified Sources & References**: Backlinked sources with publisher attribution.
6. **Generated Assets Section**: Direct download links for generated PPT/PDF/Images.

---

### 💻 Algorithm 9: Coding Intent Classification & Multi-File Generation
* **File:** `backend/services/agent/agents/coding.agent.js`
* **Goal:** Classify coding requests and generate full multi-file projects rendered in Monaco Editor.

#### Intent Classification Schema:
`CODE_GENERATION` | `CODE_REVIEW` | `CODE_EXPLANATION` | `DEBUGGING` | `OPTIMIZATION` | `CONVERSION` | `DOCUMENTATION`

*For `CODE_GENERATION`:* Generates strict JSON:
```json
{
  "files": [
    { "name": "index.html", "content": "..." },
    { "name": "style.css", "content": "..." },
    { "name": "script.js", "content": "..." }
  ]
}
```

---

### 📑 Algorithm 10: Dynamic Document (PDF & PPT) Generation
* **Files:** `generatePdf.js`, `generatePpt.js`
* **Goal:** Programmatically render structured PDF and 16:9 widescreen PowerPoint decks.

#### PDF Generation (`pdfkit`):
- Dynamic stream piping into memory buffer.
- Automatic page margins, header styling (`#1E3A8A`), bullet indentation, and footer watermarking.

#### PowerPoint Deck Generation (`pptxgenjs`):
- `LAYOUT_WIDE` ($16:9$ aspect ratio).
- **Cover Slide**: Solid `#2563EB` background, centered typography.
- **Content Slides**: Dynamic alternating zebra-striped rounded rectangles (`#F8FAFC` vs `#EFF6FF`), blue bullet indicators, and slide pagination (`X/N`).
- **Closing Slide**: Dark `#0F172A` theme with thank-you card.

---

### 🔐 Algorithm 11: Dual-Session Authentication & Gateway Proxying
* **Files:** `backend/gateway/index.js`, `backend/gateway/middleware/auth.middleware.js`
* **Goal:** Cross-origin authentication resilient across `HttpOnly` cookies, `Authorization: Bearer <session>` headers, and custom `x-session-id` headers.

#### Session Resolution Algorithm:
```
SessionID = req.cookies.session ?? req.headers["x-session-id"] ?? req.headers.authorization.slice(7)
       ↓
Fetch from Redis: GET session-${SessionID}
       ↓
If exists: req.user = JSON.parse(session) → Forward headers [x-user-id, x-user-email] to microservice
If missing: Return HTTP 400 "session expired"
```

---

### 📡 Algorithm 12: Real-Time SSE Telemetry & Pub/Sub Streaming
* **File:** `backend/services/agent/controllers/agent.controller.js`
* **Goal:** Stream live agent states, execution graphs, and metrics to the frontend with zero lag.

---

## 🗄️ 4. Data Models & Database Schemas

### `Execution` Schema (MongoDB - Agent Service)
```javascript
{
  executionId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, index: true },
  conversationId: { type: String, index: true },
  prompt: String,
  taskType: String,
  complexity: String,
  executionStrategy: String,
  scores: {
    complexityScore: Number,
    decomposabilityScore: Number,
    dependencyScore: Number,
    toolRequirementScore: Number,
    riskScore: Number
  },
  selectedAgents: [String],
  subtasks: [{ id: String, name: String, agentType: String, status: String, metrics: Object }],
  agentExecutions: [{ agentId: String, model: String, inputTokens: Number, outputTokens: Number, durationMs: Number, estimatedCost: Number, status: String }],
  totalTokens: Number,
  totalDurationMs: Number,
  estimatedCost: Number,
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
| `POST` | `/api/agent/chat` | Agent (`8003`) | Session | Initiates adaptive multi-agent orchestration pipeline |
| `GET` | `/api/agent/executions/:id` | Agent (`8003`) | Session | Fetches execution graph state and subtask statuses |
| `GET` | `/api/agent/executions/:id/stream`| Agent (`8003`)| Session | SSE endpoint for live telemetry & execution progress |
| `POST` | `/api/agent/executions/:id/cancel`| Agent (`8003`)| Session | Cancels active background research pipeline |
| `GET` | `/api/agent/research/analytics` | Agent (`8003`) | Session | Returns scientific metrics across all strategies |
| `GET` | `/api/agent/downloads/:filename`| Agent (`8003`) | Public | Downloads generated PDF/PPT/Image artifacts |
| `GET` | `/api/chat/conversations` | Chat (`8002`) | Session | Lists user conversation history |
| `POST` | `/api/billing/create-order` | Billing (`8004`)| Session | Generates Razorpay checkout order |
| `POST` | `/api/billing/verify-payment` | Billing (`8004`)| Session | Verifies Razorpay signature and increments credits |
