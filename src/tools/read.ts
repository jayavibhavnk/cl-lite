import { Tool, ToolResult } from "../types/index.js";
import { readFileSync } from "fs";
import { resolve } from "path";

export const readTool: Tool = {
  name: "Read",
  description: "Read the contents of a file",
  inputSchema: {
    type: "object",
    properties: {
      file_path: {
        type: "string",
        description: "Absolute path to the file to read",
      },
      offset: {
        type: "number",
        description: "Line number to start reading from (0-indexed)",
        default: 0,
      },
      limit: {
        type: "number",
        description: "Maximum number of lines to read",
      },
    },
    required: ["file_path"],
  },
  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    const filePath = input.file_path as string;
    const offset = (input.offset as number) || 0;
    const limit = input.limit as number | undefined;

    try {
      const content = readFileSync(resolve(filePath), "utf-8");
      const lines = content.split("\n");

      // Handle line range
      const startLine = Math.max(0, offset);
      const endLine = limit ? startLine + limit : lines.length;
      const selectedLines = lines.slice(startLine, endLine);

      // Add line numbers for reference
      const numberedContent = selectedLines
        .map((line, i) => `${startLine + i + 1}: ${line}`)
        .join("\n");

      return {
        id: crypto.randomUUID(),
        content: numberedContent,
      };
    } catch (error: unknown) {
      const err = error as { message?: string };
      return {
        id: crypto.randomUUID(),
        content: `Error reading file: ${err.message || "Unknown error"}`,
        is_error: true,
      };
    }
  },
};
