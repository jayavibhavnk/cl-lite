import { Tool, ToolResult } from "../types/index.js";
import { readFileSync } from "fs";
import { resolve } from "path";

export const grepTool: Tool = {
  name: "Grep",
  description: "Search for a pattern within files",
  inputSchema: {
    type: "object",
    properties: {
      pattern: {
        type: "string",
        description: "Regular expression pattern to search for",
      },
      path: {
        type: "string",
        description: "File or directory path to search in",
      },
      glob: {
        type: "string",
        description: "Optional glob pattern to filter files (e.g., '*.ts')",
      },
      case_insensitive: {
        type: "boolean",
        description: "Case insensitive search",
        default: false,
      },
    },
    required: ["pattern", "path"],
  },
  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    const pattern = input.pattern as string;
    const searchPath = input.path as string;
    const globPattern = input.glob as string | undefined;
    const caseInsensitive = (input.case_insensitive as boolean) || false;

    try {
      const flags = caseInsensitive ? "gi" : "g";
      const regex = new RegExp(pattern, flags);
      const results: string[] = [];

      const { glob } = await import("glob");
      const files = globPattern
        ? await glob(globPattern, { cwd: resolve(searchPath) })
        : [searchPath];

      for (const file of files) {
        try {
          const content = readFileSync(resolve(searchPath, file), "utf-8");
          const lines = content.split("\n");

          for (let i = 0; i < lines.length; i++) {
            if (regex.test(lines[i])) {
              regex.lastIndex = 0; // Reset regex state
              results.push(`${file}:${i + 1}: ${lines[i].trim()}`);
            }
          }
        } catch {
          // Skip files that can't be read
        }
      }

      if (results.length === 0) {
        return {
          id: crypto.randomUUID(),
          content: "No matches found",
        };
      }

      return {
        id: crypto.randomUUID(),
        content: results.join("\n"),
      };
    } catch (error: unknown) {
      const err = error as { message?: string };
      return {
        id: crypto.randomUUID(),
        content: `Error searching: ${err.message || "Unknown error"}`,
        is_error: true,
      };
    }
  },
};
