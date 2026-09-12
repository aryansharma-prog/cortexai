import fs from "fs";
import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { vectorStore } from "../config/vectorDb.js";
import { getModelWithMeta } from "../config/llmModels.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { deductCredits } from "../utils/deductCredits.js";
import { checkAgentLimit } from "../config/agentLimit.js";
import { invokeWithTracking } from "../observability/usageTracker.js";

export const pdfRag = async (state) => {
  try {
    if (state.userId) {
      await checkAgentLimit(state.userId, "pdf");
    }

    if (!state.file || !state.file.path) {
      return {
        ...state,
        aiResponse: "Please upload a valid PDF document to analyze."
      };
    }

    const buffer = fs.readFileSync(state.file.path);
    const pdf = new PDFParse({ data: buffer });
    const result = await pdf.getText();
    const text = result?.text || "";

    if (!text.trim()) {
      return {
        ...state,
        aiResponse: "The uploaded PDF appears to be empty or contains scanned images without selectable text."
      };
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    });

    const docs = await splitter.createDocuments([text]);

    // Retrieve context using Qdrant vector store if configured, otherwise smart in-memory extraction
    let context = "";
    const isQdrantConfigured = process.env.QDRANT_URL && !process.env.QDRANT_URL.includes("add qdrant");

    if (isQdrantConfigured) {
      try {
        const collectionName = `pdf-${Date.now()}`;
        const store = await vectorStore(docs, collectionName);
        const relevantDocs = await store.similaritySearch(state.prompt, 5);
        context = relevantDocs.map((d) => d.pageContent).join("\n\n");
      } catch (vectorErr) {
        console.warn("[PDF RAG] Qdrant search failed, falling back to direct context extraction:", vectorErr.message);
      }
    }

    if (!context) {
      // Direct context fallback: search chunks matching prompt keywords or take first N chunks
      const promptWords = (state.prompt || "").toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      const scoredDocs = docs.map((doc) => {
        const docText = doc.pageContent.toLowerCase();
        let score = 0;
        promptWords.forEach((word) => {
          if (docText.includes(word)) score += 1;
        });
        return { doc, score };
      });

      scoredDocs.sort((a, b) => b.score - a.score);
      const topDocs = scoredDocs.slice(0, 5).map((item) => item.doc.pageContent);
      context = topDocs.join("\n\n") || docs.slice(0, 4).map((d) => d.pageContent).join("\n\n");
    }

    const { llm, modelName, provider } = await getModelWithMeta("pdfRag");
    const messages = [
      new SystemMessage(`You are CortexAI PDF Assistant.
Rules:
- Answer accurately based on the provided PDF context.
- If the answer is not present in the context, clearly state: "I couldn't find this information in the uploaded PDF."
- Use clean Markdown formatting.`),
      new HumanMessage(`Context from PDF:
${context}

User Question:
${state.prompt}`)
    ];

    const { response, metrics } = await invokeWithTracking(llm, messages, {
      agentId: "pdfRag",
      modelName,
      provider,
      conversationId: state.conversationId,
      userId: state.userId
    });

    if (state.userId) {
      await deductCredits(state.userId, "pdf");
    }

    return {
      ...state,
      metrics: {
        ...(state.metrics || {}),
        tokens: metrics?.totalTokens || null
      },
      aiResponse: response.content
    };
  } catch (error) {
    console.error("[PDF RAG Error]", error);
    return {
      ...state,
      aiResponse: `⚠️ PDF Analysis error: ${error.message || "Failed to process PDF"}`
    };
  } finally {
    if (state.file?.path && fs.existsSync(state.file.path)) {
      try {
        fs.unlinkSync(state.file.path);
      } catch (cleanupErr) {
        console.warn("[PDF RAG] Could not remove temp file:", cleanupErr.message);
      }
    }
  }
};