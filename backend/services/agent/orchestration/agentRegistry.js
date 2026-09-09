/**
 * Centralized Agent Registry
 * Source of truth for agent discovery, capabilities, model mappings, and execution metadata.
 */

export const AGENT_REGISTRY = [
  {
    id: "chat",
    name: "General Reasoning Agent",
    description: "General reasoning, knowledge synthesis, direct explanations, and structured conversations",
    capabilities: ["conversation", "reasoning", "explanation", "qna", "summary"],
    modelKey: "chat",
    supportsParallel: true,
    defaultActivity: "Generating response..."
  },
  {
    id: "search",
    name: "Web Search & Fact Agent",
    description: "Retrieves current web information, live data, market news, and verified facts via search",
    capabilities: ["web-search", "current-information", "news", "facts", "lookup", "market-data"],
    modelKey: "search",
    supportsParallel: true,
    defaultActivity: "Searching current information..."
  },
  {
    id: "coding",
    name: "Software Engineering Agent",
    description: "Full-stack code generation, debugging, algorithmic problem solving, and architecture design",
    capabilities: ["code", "debugging", "refactoring", "software-architecture", "html-css-js"],
    modelKey: "coding",
    supportsParallel: true,
    defaultActivity: "Developing code and engineering solution..."
  },
  {
    id: "analysis",
    name: "Deep Analysis Agent",
    description: "Performs rigorous analytical, financial, strategic, and domain-specific evaluations",
    capabilities: ["analysis", "financial-analysis", "data-analysis", "market-analysis", "evaluation"],
    modelKey: "analysis",
    supportsParallel: true,
    defaultActivity: "Analyzing data and strategic factors..."
  },
  {
    id: "comparison",
    name: "Comparative Analysis Agent",
    description: "Compares multiple entities, features, companies, benchmarks, and provides side-by-side trade-offs",
    capabilities: ["comparison", "benchmarking", "pros-cons", "feature-matrix", "trade-off-analysis"],
    modelKey: "comparison",
    supportsParallel: true,
    defaultActivity: "Comparing collected results and metrics..."
  },
  {
    id: "pdf",
    name: "Document Generation Agent",
    description: "Generates downloadable structured PDF documents and whitepapers",
    capabilities: ["pdf-generation", "document-creation", "export-pdf"],
    modelKey: "pdf",
    supportsParallel: false,
    defaultActivity: "Generating formatted PDF document..."
  },
  {
    id: "ppt",
    name: "Presentation Agent",
    description: "Generates downloadable PowerPoint slide decks and presentations",
    capabilities: ["presentation-generation", "slides-creation", "export-pptx"],
    modelKey: "ppt",
    supportsParallel: false,
    defaultActivity: "Creating presentation slide deck..."
  },
  {
    id: "vision",
    name: "Image Generation Agent",
    description: "Engineers high-fidelity visual prompts and generates AI imagery",
    capabilities: ["image-generation", "visual-design", "artwork"],
    modelKey: "vision",
    supportsParallel: true,
    defaultActivity: "Generating visual artwork..."
  },
  {
    id: "pdfRag",
    name: "Document Context (RAG) Agent",
    description: "Extracts and answers questions grounded strictly in uploaded PDF documents",
    capabilities: ["pdf-rag", "document-qa", "uploaded-pdf"],
    modelKey: "pdf-rag",
    supportsParallel: false,
    defaultActivity: "Analyzing uploaded document context..."
  },
  {
    id: "imageAnalyzer",
    name: "Visual Analysis Agent",
    description: "Inspects and reasons over uploaded images, diagrams, charts, and visual content",
    capabilities: ["image-qa", "visual-understanding", "ocr", "chart-reading"],
    modelKey: "imageAnalyzer",
    supportsParallel: false,
    defaultActivity: "Analyzing uploaded image..."
  },
  {
    id: "synthesizer",
    name: "Synthesis & Report Agent",
    description: "Aggregates diverse multi-agent findings into a cohesive, high-quality final report",
    capabilities: ["synthesis", "aggregation", "final-report", "reconciliation"],
    modelKey: "synthesizer",
    supportsParallel: false,
    defaultActivity: "Synthesizing final comprehensive report..."
  }
];

export const getAgentRegistry = () => AGENT_REGISTRY;

export const getAgentById = (id) => {
  if (!id) return null;
  const cleanId = id.toLowerCase().trim();
  return AGENT_REGISTRY.find(a => a.id.toLowerCase() === cleanId) || null;
};

export const findAgentByCapability = (capability) => {
  if (!capability) return null;
  const cleanCap = capability.toLowerCase().trim();
  return AGENT_REGISTRY.find(a => 
    a.id.toLowerCase() === cleanCap || 
    a.capabilities.some(c => c.toLowerCase() === cleanCap || cleanCap.includes(c.toLowerCase()))
  ) || null;
};

export const getAgentsPromptDescription = () => {
  return AGENT_REGISTRY
    .filter(a => a.id !== "synthesizer")
    .map(a => `- ${a.id}: ${a.description} (capabilities: ${a.capabilities.join(", ")})`)
    .join("\n");
};
