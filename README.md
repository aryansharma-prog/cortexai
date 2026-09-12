# CortexAI 🧠⚡

<div align="center">

![CortexAI Banner](https://img.shields.io/badge/CortexAI-Autonomous%20Multi--Agent%20Platform-4F46E5?style=for-the-badge&logo=openai&logoColor=white)

[![Vite](https://img.shields.io/badge/Vite-6.0+-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0+-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.0+-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Redis](https://img.shields.io/badge/Redis-Session%20Store-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

<p align="center">
  <strong>An Adaptive Multi-Agent AI Platform that dynamically analyzes user queries, decomposes complex tasks into directed acyclic graphs (DAG), orchestrates specialized domain agents in parallel, and delivers executive-grade reports with interactive artifacts.</strong>
</p>

</div>

---

## 📌 Project Overview

**CortexAI** is a full-stack, enterprise-grade AI intelligence system engineered to surpass traditional single-prompt chatbots. Utilizing an **Adaptive Orchestrator**, CortexAI assesses task complexity, decomposes requests into dependency graphs, executes specialized domain models in parallel, and synthesizes structured executive outputs with live metrics and interactive code artifacts.

Whether analyzing complex corporate balance sheets, conducting deep multi-source web research, generating executable web components with live iframe sandboxes, or processing document PDFs, CortexAI orchestrates specialized LLMs autonomously.

---

## 🚀 Key Features

### 1. 🧬 Adaptive Multi-Agent Orchestrator
- **Dynamic Task Decomposition**: Analyzes prompts for complexity, tool necessity, dependency chains, and decomposability.
- **DAG Execution Engine**: Dispatches independent subtasks simultaneously (parallel workflows) and stitches dependent outputs sequentially.
- **Synthesizer Agent**: Consolidates multi-agent telemetry and findings into executive-ready markdown reports, comparison matrices, and visual charts.

### 2. ⚡ Specialized Domain Agents
- **Web Search & Deep Research Agent**: Performs multi-step web scraping and source aggregation.
- **Coding & Architecture Agent**: Generates production-ready code with language detection and syntax highlighting.
- **PDF & Document RAG Agent**: Ingests, embeds, and conducts semantic similarity search over user-uploaded documents.
- **Visual & Image Intelligence Agent**: Analyzes images, charts, and diagrams using multimodal vision models.
- **Financial & Market Intelligence Agent**: Analyzes company financials, competitors, ratios, and generates structured comparison tables.
- **Slide Deck & Presentation Agent**: Drafts structured outlines and executive PowerPoint presentations.

### 3. 📊 Real-Time Agent Activity & Telemetry Panel
- **Execution Graph Pipeline**: Visual step-by-step DAG tracking showing agent states (*Working*, *Waiting*, *Completed*, *Failed*).
- **Live Metrics**: Token usage tracking, subtask latency (ms), and cost estimations.
- **Scientific Research Scores**: 1–10 metrics for Task Complexity, Decomposability, Dependency, Tool Needs, and Risk Score.
- **Instant Abort / Stop Research**: Real-time cancellation capability allowing users to terminate in-flight background agent pipelines safely.

### 4. 💻 Interactive Monaco Artifacts & Live Preview
- Embedded **Monaco Code Editor** with multi-file tabs (HTML, CSS, JS, Python, React, etc.).
- **Live Sandboxed Preview**: Zero-latency iframe rendering for live interactive web apps and HTML prototypes.
- 1-Click Code and full-response clipboard copying.

### 5. 📱 100% Responsive Modern Design
- Built for all screen widths:
  - **Desktop** (1440px, 1280px, 1024px)
  - **Tablet** (912px, 820px, 768px)
  - **Mobile** (430px, 414px, 390px, 375px, 360px)
- Fluid drawers for Sidebar, Billing, and Artifacts with touch-friendly tap targets and zero horizontal overflow.

### 6. 💳 Credits & Billing Management
- Integrated **Razorpay** checkout for starter and pro credit tier upgrades.
- Real-time credit metering and usage tracking per agent execution.

---

## 🏗️ Architecture & Microservices

CortexAI is structured as a resilient, decoupled microservices architecture coordinated through a centralized API Gateway:

```
                                  ┌────────────────────────┐
                                  │   React + Vite Client  │
                                  │   (TailwindCSS + Redux)│
                                  └───────────┬────────────┘
                                              │
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
              │ Firebase + Mongo │  │ Conversations    │  │ Orchestrator DAG │
              └──────────────────┘  └──────────────────┘  └────────┬─────────┘
                                                                   │
                                              ┌────────────────────┼────────────────────┐
                                              ▼                    ▼                    ▼
                                      ┌───────────────┐    ┌───────────────┐    ┌───────────────┐
                                      │ Search / Web  │    │ Coding / RAG  │    │ Vision / LLMs │
                                      │  (Tavily API) │    │  (LangChain)  │    │ (Groq/Gemini) │
                                      └───────────────┘    └───────────────┘    └───────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TailwindCSS, Redux Toolkit, Lucide React, Monaco Editor, React Markdown, Remark GFM, Framer Motion |
| **API Gateway** | Node.js, Express, Http-Proxy-Middleware, Helmet, CORS, Cookie-Parser, Morgan |
| **Backend Services** | Node.js, Express, Mongoose, Redis (ioredis), Multer, Axios |
| **AI & Orchestration** | LangChain, Groq Cloud API, Google Gemini API, OpenAI APIs, Tavily Search API |
| **Authentication** | Firebase Authentication (Google OAuth & JWT) + Redis Session Store |
| **Payments & Billing** | Razorpay SDK |
| **Deployment** | Render, Docker, Vercel |

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
cd 1.cortexAI
```

---

### 2. Configure Environment Variables

#### Backend Gateway (`backend/api-gateway/.env`):
```env
PORT=8000
AUTH_SERVICE_URL=http://localhost:8001
CHAT_SERVICE_URL=http://localhost:8002
AGENT_SERVICE_URL=http://localhost:8003
BILLING_SERVICE_URL=http://localhost:8004
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_key
CORS_ORIGIN=http://localhost:5173
```

#### Auth Service (`backend/services/auth/.env`):
```env
PORT=8001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
REDIS_URL=redis://localhost:6379
```

#### Chat Service (`backend/services/chat/.env`):
```env
PORT=8002
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

#### Agent Service (`backend/services/agent/.env`):
```env
PORT=8003
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
GEMINI_API_KEY=your_gemini_api_key
TAVILY_API_KEY=your_tavily_api_key
REDIS_URL=redis://localhost:6379
```

#### Frontend (`frontend/.env`):
```env
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

---

### 3. Install Dependencies & Run

#### Run Backend Services:
```bash
# In separate terminal windows or with a process manager (PM2/Concurrently):
cd backend/api-gateway && npm install && npm run dev
cd backend/services/auth && npm install && npm run dev
cd backend/services/chat && npm install && npm run dev
cd backend/services/agent && npm install && npm run dev
cd backend/services/billing && npm install && npm run dev
```

#### Run Frontend:
```bash
cd frontend
npm install
npm run dev
```

The application will be accessible at `http://localhost:5173`.

---

## 📱 Responsive Breakpoints Matrix

| Device Type | Resolutions Supported | Layout Behavior |
|---|---|---|
| **Large Desktop** | `1440px+` | Full 3-column view: Collapsible Sidebar, Central Chat, Monaco Artifact Drawer |
| **Desktop / Laptop** | `1024px – 1280px` | Adaptive columns, responsive message bubbles, syntax-highlighted code wrapping |
| **Tablet** | `768px – 912px` | Overlay drawers for sidebar & artifacts, responsive execution graph |
| **Mobile Phones** | `360px – 430px` | Horizontal-swipe agent pills, full-width touch modal, responsive tables with internal scroll |

---

## 🔒 Security & Best Practices
- **Dual Session Authentication**: Supports both secure `HttpOnly` cookie forwarding and `Authorization: Bearer <sessionId>` headers for cross-origin deployment resilience.
- **Secure Sandbox**: Monaco live preview runs in an isolated `iframe` with `sandbox="allow-scripts"` to prevent parent-window pollution.
- **Real-Time Task Abort**: In-flight HTTP requests and background agent DAG loops are linked via unique execution IDs for clean teardown upon user cancellation.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Engineered by <strong>Aryan Sharma</strong>. Built for next-generation multi-agent autonomous intelligence.</sub>
</div>
