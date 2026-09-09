import axios from "axios";
import { getModelWithMeta } from "../config/llmModels.js";
import { saveFileAndGetUrl } from "../utils/fileStorage.js";
import { deductCredits } from "../utils/deductCredits.js";
import { checkAgentLimit } from "../config/agentLimit.js";
import { invokeWithTracking } from "../observability/usageTracker.js";

export const visionAgent = async (state) => {
  try {
    if (state.userId) {
      await checkAgentLimit(state.userId, "image");
    }

    const { llm, modelName } = await getModelWithMeta("image");
    const promptRefinementQuery = `You are an elite AI image prompt engineer.
Convert the user's request into a single highly-detailed, photorealistic, evocative image prompt.
Include artistic styling, lighting (e.g. volumetric, golden hour), camera details, and high-fidelity rendering details.
Return ONLY the raw prompt text without quotes, explanation, or markdown.

User Request:
${state.prompt}`;

    let imagePrompt = state.prompt;
    let tokenUsage = null;
    try {
      const { response, usage } = await invokeWithTracking(llm, promptRefinementQuery, modelName, "visionAgent");
      imagePrompt = String(response?.content || state.prompt).trim();
      tokenUsage = usage?.totalTokens || null;
    } catch (llmErr) {
      console.warn("[Vision Agent] Prompt refinement LLM failed, using raw prompt:", llmErr.message);
    }

    // Build image generation URL (Pollinations high-res endpoint)
    const encodedPrompt = encodeURIComponent(imagePrompt.substring(0, 400));
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;

    let imageBuffer;
    try {
      const imageRes = await axios.get(pollinationsUrl, {
        responseType: "arraybuffer",
        timeout: 25000
      });
      imageBuffer = Buffer.from(imageRes.data);
    } catch (imgFetchErr) {
      console.warn("[Vision Agent] Direct buffer fetch failed, fallback to direct URL:", imgFetchErr.message);
    }

    if (state.userId) {
      await deductCredits(state.userId, "vision");
    }

    const filename = `image-${Date.now()}.png`;
    let downloadUrl = pollinationsUrl;

    if (imageBuffer && imageBuffer.length > 0) {
      downloadUrl = await saveFileAndGetUrl(filename, imageBuffer, "image/png");
    }

    return {
      ...state,
      images: [downloadUrl],
      metrics: {
        ...(state.metrics || {}),
        tokens: tokenUsage
      },
      aiResponse: `### 🎨 Generated Image

![${imagePrompt.substring(0, 50)}](${downloadUrl})

*Prompt:* "${imagePrompt}"

---

📥 **[Download High-Res Image](${downloadUrl})**`
    };
  } catch (error) {
    console.error("[Vision Agent Error]", error);
    return {
      ...state,
      aiResponse: `⚠️ Image generation encountered an error: ${error.message || "Failed to generate image"}. Please try again.`
    };
  }
};