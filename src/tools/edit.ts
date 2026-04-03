import { Tool, ToolResult } from "../types/index.js";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

export const editTool: Tool = {
  name: "Edit",
  description: "Replace a specific string within a file using exact match",
  inputSchema: {
    type: "object",
    properties: {
      file_path: {
        type: "string",
        description: "Absolute path to the file to edit",
      },
      old_string: {
        type: "string",
        description: "The exact string to find and replace (must be unique in file)",
      },
      new_string: {
        type: "string",
        description: "The replacement string",
      },
    },
    required: ["file_path", "old_string", "new_string"],
  },
  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    const filePath = input.file_path as string;
    const oldString = input.old_string as string;
    const newString = input.new_string as string;

    try {
      const resolvedPath = resolve(filePath);
      const content = readFileSync(resolvedPath, "utf-8");

      // Check if old_string exists
      if (!content.includes(oldString)) {
        return {
          id: crypto.randomUUID(),
          content: `Error: old_string not found in file. Make sure it matches exactly, including whitespace.`,
          is_error: true,
        };
      }

      // Count occurrences
      const count = (content.match(new RegExp(oldString.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
      if (count > 1) {
        return {
          id: crypto.randomUUID(),
          content: `Error: old_string appears ${count} times. Make it unique by including more context.`,
          is_error: true,
        };
      }

      const newContent = content.replace(oldString, newString);
      writeFileSync(resolvedPath, newContent, "utf-8");

      return {
        id: crypto.randomUUID(),
        content: `Successfully edited ${filePath}`,
      };
    } catch (error: unknown) {
      const err = error as { message?: string };
      return {
        id: crypto.randomUUID(),
        content: `Error editing file: ${err.message || "Unknown error"}`,
        is_error: true,
      };
    }
  },
};
