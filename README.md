# CortexAI 🧠⚡

<div align="center">

![CortexAI Banner](https://img.shields.io/badge/CortexAI-Autonomous%20Multi--Agent%20Platform-4F46E5?style=for-the-badge&logo=openai&logoColor=white)

[![Vite](https://img.shields.io/badge/Vite-8.0+-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.0+-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0+-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.0+-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Redis](https://img.shields.io/badge/Redis-Session%20Store-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

<p align="center">
  <strong>An Adaptive Multi-Agent AI Platform that dynamically analyzes user queries, recursively decomposes complex tasks into directed acyclic graphs (DAG), selects the cheapest capable agent for each leaf subtask, evaluates measurable trust, selectively escalates low-trust results, and delivers executive-grade reports with interactive artifacts.</strong>
</p>

</div>

---

## 📌 Project Overview

**CortexAI** is a full-stack, enterprise-grade AI intelligence system engineered to surpass traditional single-prompt chatbots. Utilizing an **Adaptive Recursive Orchestrator**, CortexAI assesses task complexity, decomposes requests into hierarchical dependency trees, dynamically assigns the lowest-cost capable LLM for each atomic leaf task, passes scoped working memory across dependencies, verifies result trustworthiness, and synthesizes structured executive outputs with live telemetry and interactive code artifacts.

Whether analyzing complex corporate balance sheets, conducting deep multi-source web research, generating executable web components with live iframe sandboxes, or processing document PDFs, CortexAI orchestrates specialized domain agents autonomously.

---

## 🚀 Key Architectural Capabilities

### 1. 🧬 Recursive Complexity-Based Dynamic Agent Selection
* **Hybrid Complexity Scoring**:
  $$\text{ComplexityScore} = 0.30D + 0.20S + 0.20R + 0.15C + 0.15U$$
  Evaluates **Dependency ($D$)**, **Reasoning Steps ($S$)**, **Retrieval Needs ($R$)**, **Computational Difficulty ($C$)**, and **Uncertainty ($U$)** on a normalized $0–100$ scale.
* **Classification**: `EASY` ($0–39$), `MEDIUM` ($40–69$), `COMPLEX` ($70–100$).
* **Recursive Decomposition Engine**: Tasks with $\text{Complexity} \ge 70$ are recursively decomposed into focused child subtasks up to `MAX_DECOMPOSITION_DEPTH = 3`, evaluating each child independently.
* **Cheapest Capable Agent Selector**: Dynamically selects the most cost-efficient agent capable of meeting requirements:
  $$\text{AgentScore} = w_{\text{cap}}\text{CapMatch} + w_{\text{qual}}\text{Quality} + w_{\text{suit}}\text{Suitability} + w_{\text{tool}}\text{ToolCompat} - w_{\text{cost}}\text{CostPenalty}$$
* **Explainable Selection**: Stores explicit human-readable reasons and alternative candidate scores for complete decision explainability.

### 2. 🛡️ Measurable Trust Evaluation & Targeted Escalation
* **Domain-Specific Trust Verification**:
  * **Coding**: Validates multi-file artifact schemas, markdown syntax, and error-free execution.
  * **Research / RAG**: Measures verified source count ($+8/\text{source}$), citation presence, and depth.
  * **Analysis / Math**: Verifies Markdown comparison tables, numerical formulas, and structure.
* **Targeted Escalation**: If $\text{TrustScore} < 60$, selectively escalates **only the affected leaf task** to a stronger capable model (up to 2 attempts) without re-executing the entire workflow.

### 3. 🧠 Shared Incremental Working Memory
* **Context Reuse over Context Accumulation**: Rather than broadcasting all raw outputs or full conversation history to every agent, CortexAI maintains a structured, versioned working memory.
* **Delta-Based Retrieval (`getNewSince`)**: Tasks retrieve only the incremental entries generated since their last check.
* **Relevance & Dependency Scoping**: Downstream agents receive strictly the verified facts, quantitative parameters, and code snippets relevant to their explicit task dependencies.
* **Live Token Reduction Telemetry**: Demonstrates 60%–85% input token reduction across multi-agent pipelines:
  $$\text{Context Reduction \%} = \left( 1 - \frac{\text{Selected Context Tokens}}{\text{Full Context Tokens}} \right) \times 100\%$$

### 4. ⚡ Specialized Domain Agents
* **Web Search & Deep Research Agent**: Multi-step web scraping, citation ranking, and domain attribution (`tavily-search`).
* **Software Engineering Agent**: Full-stack multi-file code generation and debugging (`deepseek-chat` / `openrouter`).
* **PDF & Document RAG Agent**: Ingests, chunks, embeds, and executes vector similarity search (`Qdrant` / `Gemini`).
* **Visual Intelligence Agent**: Multimodal image inspection and diagram reasoning (`gemini-3.6-flash`).
* **Financial & Market Analysis Agent**: Deep analytical calculations, ratios, and valuation matrices (`groq` / `gpt-oss-120b`).
* **Slide Deck & Presentation Agent**: Automated styled 16:9 PowerPoint generator (`pptxgenjs`).
* **Document Generation Agent**: Automated styled PDF report generator (`pdfkit`).
* **Adaptive Synthesizer**: Response policy-driven synthesis engine tailored dynamically from direct 1-liners to comprehensive executive reports.

### 5. 🎯 Adaptive Response Policy Engine & Non-Destructive Compression
* **Task Complexity $\neq$ Response Complexity**: Strict architectural separation ensuring simple queries (e.g., *"What is the capital of India?"*) receive direct 1-2 sentence answers without unwanted executive summaries or tables, while complex system designs receive deep multi-section reports.
* **Minimum Sufficient Answer Principle**: Delivers only the necessary information to fully satisfy the user's inquiry.
* **4-Tier Depth Levels**: `MINIMAL` ($40\text{t}$), `SHORT` ($120\text{t}$), `FOCUSED` ($350\text{t}$), and `DETAILED` ($1200+\text{t}$).
* **Explicit User Intent Hierarchy**: Triggers like *"briefly"*, *"in short"*, *"1 line"* or *"in detail"* immediately override defaults.
* **Non-Destructive Response Validator**: Performs targeted semantic compression when outputs exceed budget; never blindly truncates with `.substring()`.

### 6. 📊 Real-Time Execution Tree & Telemetry UI
* **Hierarchical Execution Tree View**: Expandable/collapsible task tree showing parent-child links, complexity factors ($D, S, R, C, U$), model info, decision explainability, trust badges, response policy status, shared memory reduction, and escalation chips.
* **DAG Pipeline View**: Step-by-step parallel pipeline tracking (*Working*, *Waiting*, *Completed*, *Failed*, *Escalated*).
* **Live Telemetry Tracker**: Real-time token usage, latency (ms), and actual/estimated cost estimations.
* **Instant Cancellation**: Zero-leak background abort via Redis Pub/Sub and in-memory cancellation manager.

### 7. 💻 Interactive Monaco Artifacts & Live Preview
* Embedded **Monaco Code Editor** with multi-file tabs (`index.html`, `style.css`, `script.js`, React, Python).
* **Live Sandboxed Preview**: Zero-latency iframe rendering for live interactive prototypes.
* 1-Click Code and full-response clipboard copying.

### 8. 💳 Credits & Billing Management
* Integrated **Razorpay** checkout for starter and pro credit tier upgrades.
* Real-time credit metering and usage tracking per agent execution.

---

## 🏗️ Architecture & Microservices

```
                                  ┌────────────────────────┐
                                  │   React 19 + Vite 8    │
                                  │ (Tailwind CSS + Redux) │
                                  └───────────┬────────────┘
                                              │ HTTP / SSE / REST
                                              ▼
                                  ┌────────────────────────┐
                                  │   API Gateway (8000)   │
                                  │ (JWT & Dual Auth Check)│
                                  └───────────┬────────────┘
                        ┌─────────────────────┼─────────────────────┐
                        ▼                     ▼                     ▼
              ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
              │   Auth Service   │  │   Chat Service   │  │  Agent Service   │
              │     (8001)       │  │     (8002)       │  │     (8003)       │
              │ Firebase + Mongo │  │ Conversations    │  │ Recursive DAG    │
              └──────────────────┘  └──────────────────┘  └────────┬─────────┘
                                                                   │
                                              ┌────────────────────┼────────────────────┐
                                              ▼                    ▼                    ▼
                                      ┌───────────────┐    ┌───────────────┐    ┌───────────────┐
                                      │ Search / Web  │    │ Coding / RAG  │    │ Vision / LLMs │
                                      │ (Tavily API)  │    │  (LangChain)  │    │(Groq/Gemini)  │
                                      └───────────────┘    └───────────────┘    └───────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 8, TailwindCSS v4, Redux Toolkit, Lucide React, Monaco Editor, React Markdown, Remark GFM, Framer Motion |
| **API Gateway** | Node.js, Express, Http-Proxy-Middleware, Helmet, CORS, Cookie-Parser, Morgan |
| **Backend Services** | Node.js, Express, Mongoose, Redis (ioredis), Multer, Axios, PDFKit, PPTXGenJS |
| **AI & Orchestration** | LangChain, Groq Cloud API (`gpt-oss-120b`, `llama-3.3-70b`), Google Gemini API (`gemini-3.6-flash`), OpenRouter (`deepseek-chat`), Tavily Search API, Qdrant Vector DB |
| **Authentication** | Firebase Authentication (Google OAuth) + Redis Distributed Session Store |
| **Payments & Billing** | Razorpay SDK |
| **Deployment** | Docker, Render, Vercel |

---

## ⚙️ Getting Started & Local Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **yarn**
- **MongoDB**: Local instance or MongoDB Atlas cluster URI
- **Redis**: Local Redis server or Upstash Redis URI
- API Keys: Firebase, Groq, Google Gemini, and Razorpay (optional for billing)

---

### 1. Clone the Repository
```bash
git clone https://github.com/aryansharma-prog/cortexai.git
cd cortexai
```

---

### 2. Configure Environment Variables

Copy each service's `.env.example` to `.env`:

```bash
# Frontend
cp frontend/.env.example frontend/.env

# Gateway & Services
cp backend/gateway/.env.example backend/gateway/.env
cp backend/services/auth/.env.example backend/services/auth/.env
cp backend/services/chat/.env.example backend/services/chat/.env
cp backend/services/agent/.env.example backend/services/agent/.env
cp backend/services/billing/.env.example backend/services/billing/.env
```

---

### 3. Install Dependencies & Run

#### Start All Backend Services (Unified Orchestrator):
```bash
cd backend
npm install
npm start
```
*Launches Gateway (port `8000`), Auth (`8001`), Chat (`8002`), Agent (`8003`), and Billing (`8004`).*

#### Start Frontend (Vite Dev Server):
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs at: `http://localhost:5173`.*

---

## 🧪 Automated Testing

Run the recursive dynamic orchestration test suite:

```bash
cd backend/services/agent
node __tests__/recursiveOrchestrator.test.js
```

---

## 📱 Responsive Breakpoints Matrix

| Device Type | Resolutions Supported | Layout Behavior |
|---|---|---|
| **Large Desktop** | `1440px+` | Full 3-column view: Collapsible Sidebar, Central Chat, Monaco Artifact Drawer |
| **Desktop / Laptop** | `1024px – 1280px` | Adaptive columns, responsive message bubbles, syntax-highlighted code wrapping |
| **Tablet** | `768px – 912px` | Overlay drawers for sidebar & artifacts, responsive execution tree view |
| **Mobile Phones** | `360px – 430px` | Horizontal-swipe agent pills, full-width touch modal, responsive tables with internal scroll |

---

## 🔒 Security & Best Practices
- **Dual Session Authentication**: Supports both secure `HttpOnly` cookies and `Authorization: Bearer <sessionId>` headers for cross-origin deployment resilience.
- **Secure Sandbox**: Monaco live preview runs in an isolated `iframe` with `sandbox="allow-scripts"` to prevent parent-window pollution.
- **Real-Time Task Abort**: In-flight HTTP requests and background agent DAG loops are linked via unique execution IDs for clean teardown upon user cancellation.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Engineered by <strong>Aryan Sharma</strong>. Built for next-generation multi-agent autonomous intelligence.</sub>
</div>
