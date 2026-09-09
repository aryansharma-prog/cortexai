/**
 * Extracts a human-friendly domain/publisher name from a URL.
 * e.g., "https://www.bloomberg.com/news/..." -> "Bloomberg"
 */
export const extractSourceDomain = (url) => {
  try {
    const parsed = new URL(url);
    let host = parsed.hostname.replace(/^www\./, "");
    const parts = host.split(".");
    if (parts.length > 1) {
      const main = parts[0];
      return main.charAt(0).toUpperCase() + main.slice(1);
    }
    return host;
  } catch {
    return "Web Source";
  }
};

/**
 * Normalizes raw Tavily/web search responses into a compact, deduplicated structure.
 * Strips internal scores, request IDs, huge image arrays, and raw JSON artifacts.
 *
 * @param {Object|string|Array} rawData - Raw tool output
 * @param {number} [maxSources=6] - Maximum sources to retain
 * @returns {{ sources: Array, summaryContext: string, formattedSourcesMarkdown: string, images: Array }}
 */
export const normalizeSearchResults = (rawData, maxSources = 6) => {
  if (!rawData) {
    return {
      sources: [],
      summaryContext: "No verified search data available.",
      formattedSourcesMarkdown: "",
      images: []
    };
  }

  let rawList = [];
  let extractedImages = [];

  // Parse if JSON string
  if (typeof rawData === "string") {
    try {
      const parsed = JSON.parse(rawData);
      if (Array.isArray(parsed.results)) {
        rawList = parsed.results;
        if (Array.isArray(parsed.images)) extractedImages = parsed.images;
      } else if (Array.isArray(parsed)) {
        rawList = parsed;
      } else {
        rawList = [{ title: "Search Extract", content: rawData, url: "" }];
      }
    } catch {
      // Plain text search summary
      return {
        sources: [],
        summaryContext: rawData.slice(0, 2000),
        formattedSourcesMarkdown: "",
        images: []
      };
    }
  } else if (typeof rawData === "object" && rawData !== null) {
    if (Array.isArray(rawData.results)) {
      rawList = rawData.results;
      if (Array.isArray(rawData.images)) extractedImages = rawData.images;
    } else if (Array.isArray(rawData)) {
      rawList = rawData;
    }
  }

  // Deduplicate by URL
  const seenUrls = new Set();
  const normalizedSources = [];

  for (const item of rawList) {
    if (!item) continue;
    const url = (item.url || "").trim();
    if (url && seenUrls.has(url)) continue;
    if (url) seenUrls.add(url);

    const title = (item.title || "Untitled Article").trim();
    // Clean and trim content snippet (remove HTML tags & raw JSON fragments)
    let snippet = (item.content || item.snippet || item.raw_content || "")
      .replace(/<[^>]*>/g, "")
      .replace(/\{\s*"query"[\s\S]*\}/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // Limit single snippet to 400 characters to prevent token explosion
    if (snippet.length > 400) {
      snippet = `${snippet.slice(0, 397)}...`;
    }

    const domainName = url ? extractSourceDomain(url) : "Reference";

    normalizedSources.push({
      title,
      url,
      snippet,
      publisher: domainName
    });

    if (normalizedSources.length >= maxSources) break;
  }

  // Compact context for LLM prompt (saves tokens)
  const summaryContext = normalizedSources.length > 0
    ? normalizedSources.map((s, i) => `[Source ${i + 1}] ${s.title} (${s.publisher}):\n${s.snippet}`).join("\n\n")
    : "No verified search data available.";

  // Clean Markdown formatted sources for final user response
  const formattedSourcesMarkdown = normalizedSources.length > 0
    ? `### 📚 Verified Sources & References\n\n` +
      normalizedSources.map((s, i) => {
        if (s.url) {
          return `${i + 1}. **[${s.title}](${s.url})** — *${s.publisher}*\n   > ${s.snippet}`;
        }
        return `${i + 1}. **${s.title}** — *${s.publisher}*\n   > ${s.snippet}`;
      }).join("\n\n")
    : "";

  // Normalize images (filter out broken/tracking URLs)
  const validImages = extractedImages
    .filter(img => typeof img === "string" && img.startsWith("http") && !img.includes("play-store") && !img.includes("app-store"))
    .slice(0, 4);

  return {
    sources: normalizedSources,
    summaryContext,
    formattedSourcesMarkdown,
    images: validImages
  };
};
