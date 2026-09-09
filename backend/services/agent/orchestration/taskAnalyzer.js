import { getModelWithMeta } from "../config/llmModels.js";
import { getAgentsPromptDescription, AGENT_REGISTRY } from "./agentRegistry.js";
import { invokeWithTracking } from "../observability/usageTracker.js";

/**
 * Heuristic checks for fast-path single-agent execution
 * Minimizes unnecessary LLM calls for simple, non-decomposable queries.
 */
const detectFastPath = (prompt = "", file = null) => {
  const cleanPrompt = prompt.trim();
  const lower = cleanPrompt.toLowerCase();

  // File-specific fast path
  if (file) {
    if (file.mimetype === "application/pdf") {
      return {
        taskType: "document-qa",
        complexity: "medium",
        requiresMultipleAgents: false,
        selectedAgents: ["pdfRag"],
        subtasks: [
          {
            id: "pdf_rag",
            name: "Document QA Agent",
            description: cleanPrompt || "Analyze and query the uploaded PDF document",
            agentType: "pdfRag",
            dependencies: [],
            activitySummary: "Analyzing uploaded PDF document...",
            isOptional: false
          }
        ],
        executionStrategy: "single",
        scores: {
          complexityScore: 4,
          decomposabilityScore: 1,
          dependencyScore: 1,
          toolRequirementScore: 8,
          riskScore: 2
        },
        fastPath: true
      };
    }

    if (file.mimetype && file.mimetype.startsWith("image/")) {
      return {
        taskType: "visual-analysis",
        complexity: "medium",
        requiresMultipleAgents: false,
        selectedAgents: ["imageAnalyzer"],
        subtasks: [
          {
            id: "image_analyzer",
            name: "Visual Analysis Agent",
            description: cleanPrompt || "Inspect and interpret the uploaded image",
            agentType: "imageAnalyzer",
            dependencies: [],
            activitySummary: "Analyzing uploaded image...",
            isOptional: false
          }
        ],
        executionStrategy: "single",
        scores: {
          complexityScore: 4,
          decomposabilityScore: 1,
          dependencyScore: 1,
          toolRequirementScore: 8,
          riskScore: 2
        },
        fastPath: true
      };
    }
  }

  // Greetings and trivial conversational queries
  const greetings = ["hi", "hello", "hey", "hola", "greetings", "good morning", "good evening", "how are you", "who are you", "what can you do"];
  if (greetings.includes(lower) || (cleanPrompt.length <= 15 && lower.startsWith("hi"))) {
    return {
      taskType: "general",
      complexity: "low",
      requiresMultipleAgents: false,
      selectedAgents: ["chat"],
      subtasks: [
        {
          id: "chat_response",
          name: "Reasoning Agent",
          description: cleanPrompt,
          agentType: "chat",
          dependencies: [],
          activitySummary: "Generating response...",
          isOptional: false
        }
      ],
      executionStrategy: "single",
      scores: {
        complexityScore: 1,
        decomposabilityScore: 1,
        dependencyScore: 1,
        toolRequirementScore: 1,
        riskScore: 1
      },
      fastPath: true
    };
  }

  // Simple direct definitions or basic knowledge (e.g., "What is React?", "Explain binary search")
  const isSimpleQuestion = /^(what is|what are|define|explain|who is|how does|why is)\s+([a-zA-Z0-9_\-\s]{2,30})\??$/i.test(lower);
  const hasNoMultiIndicators = !lower.includes(" and ") && !lower.includes("compare") && !lower.includes("versus") && !lower.includes("vs") && !lower.includes("report") && !lower.includes("research") && !lower.includes("latest") && !lower.includes("news") && !lower.includes("financial");

  if (isSimpleQuestion && hasNoMultiIndicators && cleanPrompt.length < 80) {
    return {
      taskType: "explanation",
      complexity: "low",
      requiresMultipleAgents: false,
      selectedAgents: ["chat"],
      subtasks: [
        {
          id: "chat_response",
          name: "Reasoning Agent",
          description: cleanPrompt,
          agentType: "chat",
          dependencies: [],
          activitySummary: "Generating explanation...",
          isOptional: false
        }
      ],
      executionStrategy: "single",
      scores: {
        complexityScore: 2,
        decomposabilityScore: 1,
        dependencyScore: 1,
        toolRequirementScore: 1,
        riskScore: 1
      },
      fastPath: true
    };
  }

  // Direct single coding tasks
  const isDirectCodeRequest = (lower.startsWith("write a function") || lower.startsWith("write code to") || lower.startsWith("debug this")) && !lower.includes("compare") && !lower.includes("research");
  if (isDirectCodeRequest && cleanPrompt.length < 150) {
    return {
      taskType: "coding",
      complexity: "medium",
      requiresMultipleAgents: false,
      selectedAgents: ["coding"],
      subtasks: [
        {
          id: "coding_task",
          name: "Coding Agent",
          description: cleanPrompt,
          agentType: "coding",
          dependencies: [],
          activitySummary: "Developing code solution...",
          isOptional: false
        }
      ],
      executionStrategy: "single",
      scores: {
        complexityScore: 4,
        decomposabilityScore: 2,
        dependencyScore: 1,
        toolRequirementScore: 6,
        riskScore: 2
      },
      fastPath: true
    };
  }

  // Direct PPT / PDF creation request
  if (/^(create|generate|make)\s+(a\s+)?(ppt|presentation|slide\s*deck)/i.test(lower)) {
    return {
      taskType: "presentation",
      complexity: "medium",
      requiresMultipleAgents: false,
      selectedAgents: ["ppt"],
      subtasks: [
        {
          id: "ppt_task",
          name: "Presentation Agent",
          description: cleanPrompt,
          agentType: "ppt",
          dependencies: [],
          activitySummary: "Generating presentation slide deck...",
          isOptional: false
        }
      ],
      executionStrategy: "single",
      scores: {
        complexityScore: 4,
        decomposabilityScore: 1,
        dependencyScore: 1,
        toolRequirementScore: 8,
        riskScore: 2
      },
      fastPath: true
    };
  }

  if (/^(create|generate|make)\s+(a\s+)?(pdf|document|whitepaper)/i.test(lower)) {
    return {
      taskType: "document",
      complexity: "medium",
      requiresMultipleAgents: false,
      selectedAgents: ["pdf"],
      subtasks: [
        {
          id: "pdf_task",
          name: "PDF Generation Agent",
          description: cleanPrompt,
          agentType: "pdf",
          dependencies: [],
          activitySummary: "Generating formatted PDF document...",
          isOptional: false
        }
      ],
      executionStrategy: "single",
      scores: {
        complexityScore: 4,
        decomposabilityScore: 1,
        dependencyScore: 1,
        toolRequirementScore: 8,
        riskScore: 2
      },
      fastPath: true
    };
  }

  return null;
};

/**
 * Task Analyzer Engine
 * Evaluates the user query to determine whether a single agent or multi-agent workflow
 * (parallel, sequential, or hybrid) is required.
 */
export const analyzeTask = async ({
  prompt = "",
  file = null,
  conversationId = null,
  userId = null
}) => {
  // 1. Check fast-path heuristics first to save tokens on simple queries
  const fastPlan = detectFastPath(prompt, file);
  if (fastPlan) {
    return {
      ...fastPlan,
      analyzerMetrics: {
        agentId: "taskAnalyzer",
        model: "heuristic-fastpath",
        durationMs: 1,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        estimatedCost: 0
      }
    };
  }

  // 2. Complex / Multi-faceted task decomposition via LLM
  try {
    const { llm, modelName, provider } = await getModelWithMeta("taskAnalyzer");
    const agentsDescription = getAgentsPromptDescription();

    const systemPrompt = `You are the CortexAI Intelligent Task Analyzer & Orchestration Architect.
Your role is to analyze the user's task and determine the optimal multi-agent execution strategy.

Available Specialized Agents:
${agentsDescription}

Rules for Orchestration Planning:
1. If the task is simple, self-contained, or requires a single core skill:
   - Set "requiresMultipleAgents": false
   - Set "complexity": "low" or "medium"
   - Set "executionStrategy": "single"
   - Create exactly 1 subtask assigned to the most appropriate agent.

2. If the task involves multi-step research, financial/data analysis, comparison of multiple companies/technologies, or comprehensive reporting:
   - Set "requiresMultipleAgents": true
   - Set "complexity": "medium" or "high"
   - Set "executionStrategy": "parallel" (if subtasks are independent), "sequential" (if each step depends strictly on the prior), or "hybrid" (parallel subtasks feeding dependent synthesis).
   - Decompose into distinct subtasks with clear IDs, descriptive human-readable names, agentTypes, dependencies (array of subtask IDs it depends on), and concise activitySummary strings.

3. Available Agent Types:
   - "chat": general explanation, direct knowledge reasoning
   - "search": live web search, current facts, company/market data
   - "analysis": in-depth analytical, financial, or data interpretation
   - "comparison": side-by-side benchmarking, pros/cons, trade-offs
   - "coding": software development, coding, debugging
   - "pdf": PDF generation
   - "ppt": PPT generation
   - "vision": image prompt generation

4. Assign numerical scores (1-10 scale) for scientific research telemetry:
   - complexityScore (1=trivial, 10=extremely complex)
   - decomposabilityScore (1=atomic, 10=highly decomposable into subtasks)
   - dependencyScore (1=all parallel/independent, 10=strict sequential chains)
   - toolRequirementScore (1=pure reasoning, 10=heavy tool/web dependency)
   - riskScore (1=low failure risk, 10=high complexity/ambiguity)

Return ONLY valid JSON matching this schema with NO markdown wrapping or extraneous text:
{
  "taskType": "research" | "analysis" | "coding" | "comparison" | "general",
  "complexity": "low" | "medium" | "high",
  "requiresMultipleAgents": boolean,
  "executionStrategy": "single" | "parallel" | "sequential" | "hybrid",
  "scores": {
    "complexityScore": number,
    "decomposabilityScore": number,
    "dependencyScore": number,
    "toolRequirementScore": number,
    "riskScore": number
  },
  "subtasks": [
    {
      "id": "string_unique_id",
      "name": "Human Readable Agent Name",
      "description": "Specific goal of this subtask",
      "agentType": "search" | "analysis" | "comparison" | "chat" | "coding" | "pdf" | "ppt" | "vision",
      "dependencies": ["prior_subtask_id"],
      "activitySummary": "Searching latest market data...",
      "isOptional": boolean
    }
  ]
}`;

    const userPromptContent = `Analyze this user task:
"${prompt}"

${file ? `Attached File: ${file.originalname || "Uploaded file"} (${file.mimetype})` : ""}`;

    const { response, metrics } = await invokeWithTracking(
      llm,
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPromptContent }
      ],
      {
        agentId: "taskAnalyzer",
        modelName,
        provider,
        conversationId,
        userId
      }
    );

    let cleanJson = response.content.trim();
    // Strip markdown code block fences if present
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```(json)?\n?/, "").replace(/\n?```$/, "").trim();
    }

    const parsed = JSON.parse(cleanJson);

    // Validate and sanitize subtasks
    const validSubtasks = Array.isArray(parsed.subtasks) && parsed.subtasks.length > 0
      ? parsed.subtasks.map(st => ({
          id: st.id || `subtask_${Math.random().toString(36).substring(2, 7)}`,
          name: st.name || st.agentType || "Agent",
          description: st.description || prompt,
          agentType: st.agentType || "chat",
          dependencies: Array.isArray(st.dependencies) ? st.dependencies : [],
          activitySummary: st.activitySummary || `Executing ${st.agentType}...`,
          isOptional: Boolean(st.isOptional)
        }))
      : [
          {
            id: "main_task",
            name: "Reasoning Agent",
            description: prompt,
            agentType: "chat",
            dependencies: [],
            activitySummary: "Generating response...",
            isOptional: false
          }
        ];

    const selectedAgents = [...new Set(validSubtasks.map(s => s.agentType))];

    return {
      taskType: parsed.taskType || "general",
      complexity: parsed.complexity || (validSubtasks.length > 1 ? "high" : "low"),
      requiresMultipleAgents: validSubtasks.length > 1,
      executionStrategy: parsed.executionStrategy || (validSubtasks.length > 1 ? "hybrid" : "single"),
      scores: {
        complexityScore: parsed.scores?.complexityScore ?? (validSubtasks.length > 1 ? 7 : 2),
        decomposabilityScore: parsed.scores?.decomposabilityScore ?? (validSubtasks.length > 1 ? 8 : 1),
        dependencyScore: parsed.scores?.dependencyScore ?? (validSubtasks.length > 1 ? 5 : 1),
        toolRequirementScore: parsed.scores?.toolRequirementScore ?? (selectedAgents.includes("search") ? 8 : 2),
        riskScore: parsed.scores?.riskScore ?? 2
      },
      subtasks: validSubtasks,
      selectedAgents,
      analyzerMetrics: metrics
    };
  } catch (error) {
    console.error("[taskAnalyzer fallback due to error]", error);
    // Robust fallback to single chat agent if LLM analysis or parsing fails
    return {
      taskType: "general",
      complexity: "medium",
      requiresMultipleAgents: false,
      executionStrategy: "single",
      scores: {
        complexityScore: 3,
        decomposabilityScore: 1,
        dependencyScore: 1,
        toolRequirementScore: 1,
        riskScore: 2
      },
      subtasks: [
        {
          id: "chat_fallback",
          name: "Reasoning Agent",
          description: prompt,
          agentType: "chat",
          dependencies: [],
          activitySummary: "Processing query...",
          isOptional: false
        }
      ],
      selectedAgents: ["chat"],
      analyzerMetrics: {
        agentId: "taskAnalyzer",
        model: "fallback",
        durationMs: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        estimatedCost: 0
      }
    };
  }
};
