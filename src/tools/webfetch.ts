import { Tool, ToolResult } from "../types/index.js";

export const webFetchTool: Tool = {
  name: "WebFetch",
  description: "Fetch content from a URL using HTTP GET",
  inputSchema: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "The URL to fetch content from",
      },
    },
    required: ["url"],
  },
  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    const url = input.url as string;

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "CL-Lite/1.0",
        },
      });

      if (!response.ok) {
        return {
          id: crypto.randomUUID(),
          content: `HTTP ${response.status}: ${response.statusText}`,
          is_error: true,
        };
      }

      const contentType = response.headers.get("content-type") || "";
      let body: string;

      if (contentType.includes("application/json")) {
        body = JSON.stringify(await response.json(), null, 2);
      } else {
        body = await response.text();
      }

      // Truncate very large responses
      const maxLength = 50000;
      if (body.length > maxLength) {
        body = body.slice(0, maxLength) + "\n\n[Content truncated...]";
      }

      return {
        id: crypto.randomUUID(),
        content: `URL: ${url}\nStatus: ${response.status}\nContent-Type: ${contentType}\n\n${body}`,
      };
    } catch (error: unknown) {
      const err = error as { message?: string };
      return {
        id: crypto.randomUUID(),
        content: `Error fetching URL: ${err.message || "Unknown error"}`,
        is_error: true,
      };
    }
  },
};
