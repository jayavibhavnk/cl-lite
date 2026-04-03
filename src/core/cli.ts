import * as readline from "readline";

export interface CLIConfig {
  prompt?: string;
  verbose?: boolean;
}

export class CLI {
  private rl: readline.Interface;
  private verbose: boolean;

  constructor(config: CLIConfig = {}) {
    this.verbose = config.verbose || false;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: config.prompt || "cl-lite> ",
    });
  }

  async prompt(message?: string): Promise<string> {
    if (message) {
      console.log(message);
    }

    return new Promise((resolve) => {
      this.rl.question(this.rl.getPrompt(), (answer) => {
        resolve(answer);
      });
    });
  }

  print(message: string): void {
    console.log(message);
  }

  printError(message: string): void {
    console.error(`Error: ${message}`);
  }

  printMarkdown(markdown: string): void {
    // Simple markdown rendering
    const lines = markdown.split("\n");
    for (const line of lines) {
      if (line.startsWith("## ")) {
        console.log(`\n${line.replace("## ", "")}`);
        console.log("=".repeat(line.length - 4));
      } else if (line.startsWith("### ")) {
        console.log(`\n${line.replace("### ", "")}`);
        console.log("-".repeat(line.length - 4));
      } else if (line.startsWith("- ")) {
        console.log(`  ${line}`);
      } else {
        console.log(line);
      }
    }
    console.log();
  }

  async close(): Promise<void> {
    this.rl.close();
  }

  setPrompt(prompt: string): void {
    this.rl.setPrompt(prompt);
  }
}

// Format tool result for display
export function formatToolResult(name: string, result: { content: string; is_error?: boolean }): string {
  const prefix = result.is_error ? "❌" : "✓";
  return `${prefix} ${name}:\n${result.content}`;
}
