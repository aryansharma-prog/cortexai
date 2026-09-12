import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

const outputPath = path.resolve("../../../CortexAI_Architecture_and_Algorithms.pdf");
const doc = new PDFDocument({
  size: "A4",
  margins: { top: 45, bottom: 45, left: 45, right: 45 },
  bufferPages: true,
  info: {
    Title: "CortexAI Recursive Multi-Agent Architecture & Algorithms Specification",
    Author: "CortexAI Team",
    Subject: "Comprehensive Architecture, Algorithms, Complexity Evaluator, and Dynamic Agent Selection",
    Keywords: "CortexAI, Multi-Agent, DAG, RAG, Algorithms, Architecture, Dynamic Selection, Complexity"
  }
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

const primaryColor = "#1E3A8A";
const secondaryColor = "#0284C7";
const darkText = "#111827";
const bodyText = "#374151";
const codeBg = "#F1F5F9";

function addHeader(title, subtitle = "") {
  doc.fontSize(20).fillColor(primaryColor).text(title, { align: "left" });
  if (subtitle) {
    doc.moveDown(0.2);
    doc.fontSize(10.5).fillColor("#64748B").text(subtitle);
  }
  doc.moveDown(0.6);
  doc.strokeColor("#E2E8F0").lineWidth(1).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.6);
}

function addSectionHeading(text) {
  if (doc.y > 680) doc.addPage();
  doc.moveDown(0.5);
  doc.fontSize(13.5).fillColor(primaryColor).text(text);
  doc.moveDown(0.3);
}

function addSubHeading(text) {
  if (doc.y > 700) doc.addPage();
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor(secondaryColor).text(text);
  doc.moveDown(0.2);
}

function addParagraph(text) {
  if (doc.y > 720) doc.addPage();
  doc.fontSize(9.5).fillColor(bodyText).text(text, { lineGap: 2.5, align: "justify" });
  doc.moveDown(0.3);
}

function addBullet(title, desc) {
  if (doc.y > 720) doc.addPage();
  doc.fontSize(9.5).fillColor(darkText).text(`•  ${title}: `, { continued: true, lineGap: 2.5 });
  doc.fillColor(bodyText).text(desc);
  doc.moveDown(0.2);
}

function addCodeBlock(code) {
  if (doc.y > 650) doc.addPage();
  const startY = doc.y;
  const lines = code.split("\n");
  const blockHeight = lines.length * 11 + 12;
  
  doc.rect(45, startY, 505, blockHeight).fill(codeBg);
  doc.fontSize(8).fillColor("#0F172A");
  
  lines.forEach((line, i) => {
    doc.text(line, 55, startY + 6 + (i * 11));
  });
  
  doc.y = startY + blockHeight + 8;
}

// ---------------- COVER / HEADER ----------------
addHeader("CortexAI 🧠⚡", "Recursive Complexity-Based Dynamic Multi-Agent Architecture & Algorithm Specification");

addParagraph("CortexAI is an enterprise-grade adaptive multi-agent AI system that evaluates task complexity, dynamically creates hierarchical Directed Acyclic Graphs (DAG), recursively decomposes complex subtasks into atomic units, selects the cheapest capable agent for each leaf task, executes them with shared incremental working memory, calculates measurable trust, selectively escalates low-trust results, and synthesizes structured executive outputs.");

// ---------------- SECTION 1: ARCHITECTURE ----------------
addSectionHeading("1. Microservices Architecture & Topology");

addBullet("API Gateway (Port 8000)", "Central reverse proxy with dual-session authentication (HttpOnly cookie + Authorization Bearer header), CORS management, request routing, and SSE multiplexing.");
addBullet("Auth Service (Port 8001)", "Firebase token verification, MongoDB user persistence, and Redis distributed session caching.");
addBullet("Chat Service (Port 8002)", "Conversation threads, message history persistence, and chat telemetry.");
addBullet("Agent Service (Port 8003)", "Recursive task decomposition, complexity evaluation, dynamic agent selection, DAG execution, RAG retrieval, PPT/PDF synthesis, and observability.");
addBullet("Billing Service (Port 8004)", "Razorpay payment orders, webhook verification, credit deduction, and subscription quotas.");

// ---------------- SECTION 2: ALGORITHMS ----------------
addSectionHeading("2. Complete Inventory of Implemented Algorithms");

addSubHeading("Algorithm 1: Hybrid Complexity Evaluation Engine");
addParagraph("Calculates objective complexity (0 - 100) using the formula: ComplexityScore = 0.30D + 0.20S + 0.20R + 0.15C + 0.15U");
addBullet("D (Dependency)", "Computed from graph in-degrees and recursion depth: (depCount * 30) + (depth * 15), clamped to 10 - 100.");
addBullet("S (Reasoning Steps)", "Step count normalized to 0 - 100 (1 step=20, 2 steps=35, 3-4 steps=55, 5-6 steps=75, 7+ steps=95).");
addBullet("R (Retrieval)", "Tool signals (live search=95, PDF RAG=90, multi-source search keywords=85, internal knowledge=15).");
addBullet("C (Computation)", "Full-stack code=95, standard code=80, math formulas & algorithm simulation=85, basic transformation=15.");
addBullet("U (Uncertainty)", "Multi-hypothesis / strategic analysis=75, exploratory inquiry=55, clearly specified task=20.");
addBullet("Classifications", "0 - 39: EASY  |  40 - 69: MEDIUM  |  70 - 100: COMPLEX.");

addSubHeading("Algorithm 2: Recursive Task Decomposer with Stop Conditions");
addParagraph("Recursively splits complex subtasks (Complexity >= 70) into 2-3 focused child subtasks, evaluating each child independently. Enforces strict stop conditions:");
addCodeBlock(`1. Stop if depth >= MAX_DECOMPOSITION_DEPTH (default 3)
2. Stop if ComplexityScore < 70 (EASY or MEDIUM)
3. Stop if task is already atomic/actionable (length < 40 chars & no conjunctions)
4. Stop if decomposition overhead exceeds expected benefit`);

addSubHeading("Algorithm 3: Cheapest Capable Dynamic Agent Selection");
addParagraph("Selects the lowest-cost agent capable of meeting task complexity and quality requirements using multi-factor scoring:");
addParagraph("AgentScore = w_cap*CapabilityMatch + w_qual*Quality + w_suit*Suitability + w_tool*ToolCompat - w_cost*CostPenalty");
addBullet("Explainability", "Returns selectedAgent, calculated score, human-readable reason, and list of alternative candidates evaluated.");

addSubHeading("Algorithm 4: Hierarchical Execution Tree & Topological Dispatch");
addParagraph("Maintains a tree data structure tracking nodes, depths, factor scores, models, and trust metrics. Extracts only leaf nodes (isLeaf=true) for concurrent DAG execution based on completed prerequisite dependencies.");

addSubHeading("Algorithm 5: Shared Incremental Working Memory");
addParagraph("Provides tasks with scoped prerequisite context: passes only direct dependency outputs and newly generated delta facts rather than duplicating the entire conversation history.");

addSubHeading("Algorithm 6: Measurable Multi-Domain Trust Evaluator");
addParagraph("Calculates objective trust scores (0 - 100) from domain evidence rather than arbitrary model self-confidence:");
addBullet("Coding", "Valid multi-file artifacts (+35), code blocks (+25), missing code penalty (-25), error traces (-30).");
addBullet("Research / RAG", "Verified citations (+8/source up to +35), citation tags (+25), depth (+20).");
addBullet("Analysis / Math", "Markdown comparison tables (+30), quantitative numbers (+15), headings (+10).");
addBullet("Classification", "85 - 100: HIGH  |  60 - 84: MEDIUM  |  0 - 59: LOW (triggers escalation).");

addSubHeading("Algorithm 7: Targeted Single-Leaf Escalation Manager");
addParagraph("When a leaf task produces Low Trust (< 60), selectively upgrades the assigned model to a stronger capable tier and re-runs only the affected subtask, updating shared memory without regenerating the full workflow (max 2 attempts).");

addSubHeading("Algorithm 8: Fine-Grained Cost & Usage Telemetry Tracker");
addParagraph("Tracks estimated vs actual costs across all tasks, recursion levels, and escalations, aggregating totalTokens, duration, and averageTrust.");

addSubHeading("Algorithm 9: Distributed Real-Time Cancellation Lifecycle");
addParagraph("Dual-layer cancellation (in-memory + Redis key with 1h TTL) broadcasting workflow_cancelled events and checking assertNotCancelled() before and after every async call.");

addSubHeading("Algorithm 10: PDF RAG Pipeline");
addParagraph("pdf-parse extraction, RecursiveCharacterTextSplitter (1000-char chunks, 200 overlap), Qdrant vector search (k=5) with tokenized keyword fallback.");

addSubHeading("Algorithm 11: Web Search Normalization & Citation Ranking");
addParagraph("Sanitizes HTML tags and raw query JSON, deduplicates URLs, limits snippets to 400 characters, and renders markdown citation references.");

addSubHeading("Algorithm 12: Executive Map-Reduce Synthesizer");
addParagraph("Aggregates diverse subtask findings into an executive report with clean comparison tables, thematic headings, strategic takeaways, and download links.");

addSubHeading("Algorithm 13: Dynamic Presentation & PDF Engines");
addParagraph("Generates styled 16:9 widescreen PowerPoint decks (pptxgenjs) and styled PDF documents (pdfkit).");

addSubHeading("Algorithm 14: Dual-Session Authentication");
addParagraph("Validates session tokens across cookies, Bearer headers, and x-session-id against Redis cache.");

addSubHeading("Algorithm 15: Real-Time SSE Tree Streaming");
addParagraph("Streams live execution tree updates (tree_initialized, agent_started, agent_completed, node_escalation) over Server-Sent Events.");

// ---------------- PAGE NUMBERS & FOOTER ----------------
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  doc.fontSize(8).fillColor("#94A3B8").text(
    `CortexAI Architecture & Algorithms Specification  |  Page ${i + 1} of ${range.count}`,
    45,
    800,
    { align: "center", width: 505 }
  );
}

doc.end();

writeStream.on("finish", () => {
  console.log("PDF updated successfully at:", outputPath);
});
