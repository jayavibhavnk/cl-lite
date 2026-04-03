import { Tool, ToolResult } from "../types/index.js";

export const webSearchTool: Tool = {
  name: "WebSearch",
  description: "Search the web for information using DuckDuckGo Instant Answer API",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The search query to look up",
      },
    },
    required: ["query"],
  },
  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    const query = input.query as string;

    try {
      // Use DuckDuckGo Instant Answer API
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": "CL-Lite/1.0 (compatible; bot)",
        },
      });

      if (!response.ok) {
        return {
          id: crypto.randomUUID(),
          content: `Search failed: HTTP ${response.status}`,
          is_error: true,
        };
      }

      const data = await response.json() as {
        AnswerType?: string;
        Answer?: string;
        RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>;
        AbstractText?: string;
        AbstractURL?: string;
        Heading?: string;
      };

      // Build results from the JSON response
      const results: string[] = [];

      // Add instant answer if available
      if (data.Answer && data.AnswerType === "disambiguation") {
        results.push(`## ${data.Heading || query}\n${data.Answer}\n`);
      }

      // Add abstract/text summary
      if (data.AbstractText) {
        results.push(`## ${data.Heading || "Summary"}\n${data.AbstractText}\nSource: ${data.AbstractURL || "N/A"}\n`);
      }

      // Add related topics
      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        const topics = data.RelatedTopics
          .filter((t) => t.Text && t.FirstURL)
          .slice(0, 5)
          .map((t) => `- ${t.Text} (${t.FirstURL})`);
        if (topics.length > 0) {
          results.push(`## Related Topics\n${topics.join("\n")}`);
        }
      }

      if (results.length === 0) {
        return {
          id: crypto.randomUUID(),
          content: `No results found for "${query}". Try a different search term.`,
        };
      }

      return {
        id: crypto.randomUUID(),
        content: `Search results for "${query}":\n\n${results.join("\n\n")}`,
      };
    } catch (error: unknown) {
      const err = error as { message?: string };
      return {
        id: crypto.randomUUID(),
        content: `Search error: ${err.message || "Unknown error"}`,
        is_error: true,
      };
    }
  },
};
