import { Tool, ToolResult } from "../types/index.js";

export const webSearchTool: Tool = {
  name: "WebSearch",
  description: "Search the web for information using DuckDuckGo",
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
      // Use DuckDuckGo HTML lite results
      const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": "CL-Lite/1.0",
        },
      });

      if (!response.ok) {
        return {
          id: crypto.randomUUID(),
          content: `Search failed: HTTP ${response.status}`,
          is_error: true,
        };
      }

      const html = await response.text();

      // Simple HTML parsing to extract search results
      const results: string[] = [];
      const linkRegex = /<a class="result_link"[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g;
      const snippetRegex = /<a class="result_link"[^>]*>(.*?)<\/a>.*?<span class="result_snippet">([^<]*)<\/span>/gs;

      let match;
      let count = 0;
      while ((match = snippetRegex.exec(html)) !== null && count < 10) {
        const title = match[1].replace(/<[^>]*>/g, "").trim();
        const snippet = match[2].replace(/<[^>]*>/g, "").trim();
        if (title && snippet) {
          results.push(`## ${title}\n${snippet}\n`);
          count++;
        }
      }

      if (results.length === 0) {
        return {
          id: crypto.randomUUID(),
          content: "No search results found",
        };
      }

      return {
        id: crypto.randomUUID(),
        content: `Search results for "${query}":\n\n${results.join("\n")}`,
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
