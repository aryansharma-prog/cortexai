import { getModelWithMeta } from "../config/llmModels.js";
import { generatePpt } from "../utils/generatePpt.js";
import { saveFileAndGetUrl } from "../utils/fileStorage.js";
import { deductCredits } from "../utils/deductCredits.js";
import { checkAgentLimit } from "../config/agentLimit.js";
import { invokeWithTracking } from "../observability/usageTracker.js";

const parsePptJsonSafely = (text, fallbackTopic) => {
  try {
    const raw = Array.isArray(text) ? text.map((c) => c?.text || "").join("\n") : String(text || "");
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

    if (cleaned.startsWith("{") && cleaned.endsWith("}")) {
      return JSON.parse(cleaned);
    }

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.warn("[PPT Agent] Failed to parse structured JSON from LLM output, building fallback structure:", e.message);
  }

  return {
    title: fallbackTopic.length > 40 ? `${fallbackTopic.substring(0, 37)}...` : fallbackTopic,
    subtitle: "Strategic Presentation by CortexAI",
    slides: [
      {
        title: "Executive Summary",
        points: [
          `Overview of ${fallbackTopic}`,
          "Core strategic objectives and goals",
          "High-impact key takeaways"
        ]
      },
      {
        title: "Key Insights & Trends",
        points: [
          "Current landscape analysis",
          "Emerging growth opportunities",
          "Actionable roadmap and next steps"
        ]
      },
      {
        title: "Implementation Plan",
        points: [
          "Milestones and delivery phases",
          "Resource allocation and best practices",
          "Performance metrics and KPIs"
        ]
      }
    ]
  };
};

export const pptAgent = async (state) => {
  try {
    if (state.userId) {
      await checkAgentLimit(state.userId, "ppt");
    }

    const { llm, modelName } = await getModelWithMeta("ppt");
    const prompt = `You are a professional presentation designer.
Return ONLY valid JSON without markdown fences.

Format:
{
  "title": "Presentation Title",
  "subtitle": "Presentation Subtitle",
  "slides": [
    {
      "title": "Slide Title",
      "points": [
        "First key insight or bullet point",
        "Second key insight or bullet point",
        "Third key insight or bullet point",
        "Fourth key insight or bullet point"
      ]
    }
  ]
}

Rules:
- Generate exactly 4-6 comprehensive content slides.
- Each slide must have 3-5 concise, high-value bullet points.
- Return ONLY the JSON object.

Topic:
${state.prompt}`;

    const { response, usage } = await invokeWithTracking(llm, prompt, modelName, "pptAgent");
    const data = parsePptJsonSafely(response?.content, state.prompt);

    if (state.userId) {
      await deductCredits(state.userId, "ppt");
    }

    const ppt = await generatePpt(data);
    const buffer = await ppt.write({
      outputType: "nodebuffer"
    });

    const filename = `presentation-${Date.now()}.pptx`;
    const downloadUrl = await saveFileAndGetUrl(
      filename,
      buffer,
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    );

    return {
      ...state,
      metrics: {
        ...(state.metrics || {}),
        tokens: usage?.totalTokens || null
      },
      aiResponse: `# 📊 PowerPoint Presentation Generated

**${data.title}**  
*${data.subtitle || "Created with CortexAI"}*

---

### Slide Deck Overview (${data.slides.length} Slides):
${data.slides.map((s, idx) => `**Slide ${idx + 1}: ${s.title}**\n${(s.points || []).map((p) => `* ${p}`).join("\n")}`).join("\n\n")}

---

📥 **[Download PowerPoint (.pptx)](${downloadUrl})**  
*Click the link above to download your presentation deck.*`
    };
  } catch (error) {
    console.error("[PPT Agent Error]", error);
    return {
      ...state,
      aiResponse: `⚠️ PowerPoint generation encountered an error: ${error.message || "Failed to generate presentation"}. Please try again.`
    };
  }
};