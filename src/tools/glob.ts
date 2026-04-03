import { Tool, ToolResult } from "../../types/index.js";
import { glob } from "glob";
import { resolve } from "path";

export const globTool: Tool = {
  name: "Glob",
  description: "Find files matching a glob pattern",
  inputSchema: {
    type: "object",
    properties: {
      pattern: {
        type: "string",
        description: "Glob pattern to match files (e.g., '**/*.ts', 'src/**/*.js')",
      },
      cwd: {
        type: "string",
        description: "Working directory to search in (defaults to current directory)",
      },
    },
    required: ["pattern"],
  },
  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    const pattern = input.pattern as string;
    const cwd = (input.cwd as string) || process.cwd();

    try {
      const files = await glob(pattern, {
        cwd: resolve(cwd),
        absolute: false,
        nodir: true,
      });

      if (files.length === 0) {
        return {
          id: crypto.randomUUID(),
          content: "No files found matching pattern",
        };
      }

      return {
        id: crypto.randomUUID(),
        content: files.join("\n"),
      };
    } catch (error: unknown) {
      const err = error as { message?: string };
      return {
        id: crypto.randomUUID(),
        content: `Error finding files: ${err.message || "Unknown error"}`,
        is_error: true,
      };
    }
  },
};
