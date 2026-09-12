import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

const outputPath = path.resolve("../../../CortexAI_Architecture_and_Algorithms.pdf");
const doc = new PDFDocument({
  size: "A4",
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  bufferPages: true,
  info: {
    Title: "CortexAI System Architecture & Algorithms Specification",
    Author: "CortexAI Team",
    Subject: "Comprehensive Multi-Agent Architecture and Algorithms",
    Keywords: "CortexAI, Multi-Agent, DAG, RAG, Algorithms, Architecture"
  }
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

const primaryColor = "#1E3A8A"; // Dark Blue
const secondaryColor = "#0284C7"; // Sky Blue
const darkText = "#111827";
const bodyText = "#374151";
const accentBg = "#F0FDF4";
const codeBg = "#F1F5F9";

function addHeader(title, subtitle = "") {
  doc.fontSize(22).fillColor(primaryColor).text(title, { align: "left" });
  if (subtitle) {
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor("#64748B").text(subtitle);
  }
  doc.moveDown(0.8);
  doc.strokeColor("#E2E8F0").lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.8);
}

function addSectionHeading(text) {
  if (doc.y > 680) doc.addPage();
  doc.moveDown(0.6);
  doc.fontSize(15).fillColor(primaryColor).text(text);
  doc.moveDown(0.4);
}

function addSubHeading(text) {
  if (doc.y > 700) doc.addPage();
  doc.moveDown(0.4);
  doc.fontSize(12).fillColor(secondaryColor).text(text);
  doc.moveDown(0.2);
}

function addParagraph(text) {
  if (doc.y > 720) doc.addPage();
  doc.fontSize(10).fillColor(bodyText).text(text, { lineGap: 3, align: "justify" });
  doc.moveDown(0.4);
}

function addBullet(title, desc) {
  if (doc.y > 720) doc.addPage();
  doc.fontSize(10).fillColor(darkText).text(`•  ${title}: `, { continued: true, lineGap: 3 });
  doc.fillColor(bodyText).text(desc);
  doc.moveDown(0.2);
}

function addCodeBlock(code) {
  if (doc.y > 650) doc.addPage();
  const startY = doc.y;
  const lines = code.split("\n");
  const blockHeight = lines.length * 12 + 14;
  
  doc.rect(50, startY, 495, blockHeight).fill(codeBg);
  doc.fontSize(8.5).fillColor("#0F172A");
  
  lines.forEach((line, i) => {
    doc.text(line, 60, startY + 8 + (i * 12));
  });
  
  doc.y = startY + blockHeight + 10;
}

// ---------------- COVER / HEADER ----------------
addHeader("CortexAI 🧠⚡", "Autonomous Multi-Agent Architecture & Algorithm Specification Document");

addParagraph("CortexAI is a full-stack, enterprise-grade AI intelligence system engineered to surpass traditional single-prompt chatbots. Utilizing an Adaptive Orchestrator, CortexAI assesses task complexity, decomposes requests into dependency graphs, executes specialized domain models in parallel, and synthesizes structured executive outputs with live metrics and interactive code artifacts.");

// ---------------- SECTION 1: ARCHITECTURE ----------------
addSectionHeading("1. Distributed Microservices Topology");

addParagraph("The CortexAI backend is decoupled into specialized microservices coordinated through an intelligent central API Gateway:");

addBullet("API Gateway (Port 8000)", "Central reverse proxy handling dual session authentication, cookie/bearer header resolution, request routing, and streaming SSE multiplexing.");
addBullet("Auth Service (Port 8001)", "Firebase token verification, MongoDB user persistence, and Redis session store management.");
addBullet("Chat Service (Port 8002)", "Conversation threads, message history persistence, and chat telemetry.");
addBullet("Agent Service (Port 8003)", "Dynamic task decomposition, DAG orchestration, LangGraph state machine, RAG retrieval, PPT/PDF generation, and observability.");
addBullet("Billing Service (Port 8004)", "Razorpay payment processing, subscription quotas, and real-time credit metering.");

// ---------------- SECTION 2: ALGORITHMS ----------------
addSectionHeading("2. Comprehensive Algorithmic Inventory");

addSubHeading("Algorithm 1: Heuristic Fast-Path Query Classifier");
addParagraph("Evaluates prompts against deterministic regexes and file attachments to route zero-overhead requests directly without calling an expensive LLM analyzer.");
addBullet("File Check", "PDF attachments route to pdfRag; Images route to imageAnalyzer.");
addBullet("Greetings & Queries", "Conversational greetings (hi, hello) route immediately to Chat Agent (Complexity: 1).");
addBullet("Direct Actions", "Matches 'create ppt', 'create pdf', 'write code' to specialized agents.");

addSubHeading("Algorithm 2: Dynamic Task Decomposition & Scientific Telemetry Scoring");
addParagraph("Uses LLM-guided meta-planning to generate atomic subtasks with execution strategies (single, parallel, sequential, hybrid) and 1-10 scientific scores:");
addBullet("Complexity Score", "1 = Trivial knowledge lookup, 10 = Deep multi-dimensional synthesis.");
addBullet("Decomposability Score", "1 = Atomic query, 10 = Highly parallelizable sub-problems.");
addBullet("Dependency Score", "1 = Fully independent subtasks, 10 = Strict sequential pipeline.");
addBullet("Tool Requirement Score", "1 = Pure reasoning, 10 = Heavy live search / RAG necessity.");
addBullet("Risk Score", "1 = High certainty, 10 = Ambiguous or multi-hypothesis inquiry.");

addSubHeading("Algorithm 3: Dynamic DAG Topological Batch Orchestrator");
addParagraph("Iteratively resolves dependencies among subtasks, extracting ready batches where all parent dependencies are fulfilled, executing them concurrently using Promise.allSettled(), and passing accumulated context to downstream agents.");
addCodeBlock(`1. Initialize CompletedSet C = empty
2. While remaining subtasks > 0:
   a. ReadyBatch B = { s in Remaining | s.dependencies subset of C }
   b. If B is empty: B = [ Remaining.shift() ] // Prevent cycles
   c. Execute all s in B concurrently via Promise.allSettled()
   d. Accumulate outputs & metrics into Context Store
   e. C = C union { s.id for s in B }
3. Execute Synthesizer Agent on all accumulated findings.`);

addSubHeading("Algorithm 4: Distributed Real-Time Cancellation Lifecycle");
addParagraph("Handles instant termination of active agent pipelines when the user clicks [Stop]. Uses Redis Pub/Sub channels (execution_events:<id>) and local memory caches to trigger ResearchCancelledError before and after every asynchronous agent invocation.");

addSubHeading("Algorithm 5: PDF RAG (Chunking, Vector Embeddings & Fallback Search)");
addParagraph("Parses uploaded PDFs using pdf-parse, splits text with RecursiveCharacterTextSplitter (1000-char chunks, 200-char overlap), indexes into Qdrant vector database for k-NN similarity search (k=5), with an automatic tokenized keyword-frequency fallback when Qdrant is unavailable.");

addSubHeading("Algorithm 6: Search Normalization, Deduplication & Ranking");
addParagraph("Cleans raw Tavily web search results, removes JSON noise and HTML tags, deduplicates URLs, limits snippets to 400 characters, extracts publisher domains, and formats clean markdown references.");

addSubHeading("Algorithm 7: Token Normalization & Multi-Model Cost Tracker");
addParagraph("Normalizes inconsistent provider token metadata across Groq, Gemini, OpenRouter, and DeepSeek, computing exact USD costs per execution using calibrated pricing tables.");

addSubHeading("Algorithm 8: Executive Map-Reduce Multi-Agent Synthesizer");
addParagraph("Consolidates multi-agent subtask outputs and verified web sources into a structured executive report with clean markdown tables, thematic sections, numbered takeaways, and download links.");

addSubHeading("Algorithm 9: Coding Intent Classification & Multi-File Generator");
addParagraph("Classifies developer requests into CODE_GENERATION, REVIEW, EXPLANATION, or DEBUGGING. For generation, outputs strict JSON file trees rendered directly into the interactive Monaco Editor with live iframe preview.");

addSubHeading("Algorithm 10: Automated Presentation & PDF Rendering Engines");
addParagraph("Programmatically builds styled 16:9 PowerPoint decks using pptxgenjs and styled PDF documents using pdfkit with automatic headers, zebra stripes, and page numbering.");

addSubHeading("Algorithm 11: Dual-Session Authentication & Forwarding");
addParagraph("Inspects cookies, Authorization Bearer headers, and x-session-id headers, verifies Redis session tokens, and forwards authenticated x-user-id headers to downstream microservices.");

// ---------------- SECTION 3: API & SUMMARY ----------------
addSectionHeading("3. Key API Endpoints & Routes");
addBullet("POST /api/agent/chat", "Primary entrypoint for Adaptive Multi-Agent Orchestration.");
addBullet("GET /api/agent/executions/:id/stream", "Server-Sent Events (SSE) live progress & graph stream.");
addBullet("POST /api/agent/executions/:id/cancel", "Instant execution cancellation trigger.");
addBullet("GET /api/agent/research/analytics", "Aggregated scientific strategy analytics.");
addBullet("POST /api/billing/create-order", "Razorpay credit top-up order generation.");

// ---------------- PAGE NUMBERS & FOOTER ----------------
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  doc.fontSize(8).fillColor("#94A3B8").text(
    `CortexAI Architecture & Algorithms Specification  |  Page ${i + 1} of ${range.count}`,
    50,
    790,
    { align: "center", width: 495 }
  );
}

doc.end();

writeStream.on("finish", () => {
  console.log("PDF generated successfully at:", outputPath);
});
