import { Tool, ToolResult } from "../../types/index.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const bashTool: Tool = {
  name: "Bash",
  description: "Execute a shell command and return its output",
  inputSchema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The shell command to execute",
      },
      timeout: {
        type: "number",
        description: "Timeout in milliseconds (default: 30000)",
        default: 30000,
      },
      cwd: {
        type: "string",
        description: "Working directory for command execution",
      },
    },
    required: ["command"],
  },
  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    const command = input.command as string;
    const timeout = (input.timeout as number) || 30000;
    const cwd = input.cwd as string | undefined;

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout,
        cwd,
        maxBuffer: 10 * 1024 * 1024, // 10MB
      });

      let output = "";
      if (stdout) output += stdout;
      if (stderr) output += `\nSTDERR:\n${stderr}`;

      return {
        id: crypto.randomUUID(),
        content: output.trim() || "(no output)",
      };
    } catch (error: unknown) {
      const err = error as { stdout?: string; stderr?: string; message?: string; code?: number };
      let content = err.message || "Unknown error";
      if (err.stdout) content += `\nSTDOUT:\n${err.stdout}`;
      if (err.stderr) content += `\nSTDERR:\n${err.stderr}`;
      if (err.code) content += `\nExit code: ${err.code}`;

      return {
        id: crypto.randomUUID(),
        content: content.trim(),
        is_error: true,
      };
    }
  },
};
