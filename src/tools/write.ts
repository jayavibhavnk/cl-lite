import { Tool, ToolResult } from "../../types/index.js";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { mkdirSync } from "fs";

export const writeTool: Tool = {
  name: "Write",
  description: "Create a new file or overwrite an existing file with content",
  inputSchema: {
    type: "object",
    properties: {
      file_path: {
        type: "string",
        description: "Absolute path to the file to write",
      },
      content: {
        type: "string",
        description: "The content to write to the file",
      },
    },
    required: ["file_path", "content"],
  },
  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    const filePath = input.file_path as string;
    const content = input.content as string;

    try {
      // Ensure directory exists
      const dir = dirname(resolve(filePath));
      mkdirSync(dir, { recursive: true });

      writeFileSync(resolve(filePath), content, "utf-8");

      return {
        id: crypto.randomUUID(),
        content: `Successfully wrote to ${filePath}`,
      };
    } catch (error: unknown) {
      const err = error as { message?: string };
      return {
        id: crypto.randomUUID(),
        content: `Error writing file: ${err.message || "Unknown error"}`,
        is_error: true,
      };
    }
  },
};
