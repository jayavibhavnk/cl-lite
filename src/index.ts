#!/usr/bin/env node

import {
  getProviderConfig,
  MemoryManager,
  SkillsRegistry,
  Agent,
  CLI,
} from "./core/index.js";
import {
  bashTool,
  readTool,
  writeTool,
  editTool,
  globTool,
  grepTool,
  webFetchTool,
  webSearchTool,
} from "./tools/index.js";

// Register all tools
const tools = [
  bashTool,
  readTool,
  writeTool,
  editTool,
  globTool,
  grepTool,
  webFetchTool,
  webSearchTool,
];

async function main() {
  console.log(`
╔═══════════════════════════════════════╗
║           CL-Lite v0.1.0              ║
║     Lightweight Claude Code Clone     ║
╚═══════════════════════════════════════╝
`);

  // Check for API key
  const config = getProviderConfig();
  if (!config.apiKey) {
    console.error("Error: No API key found.");
    console.error("Set one of: ANTHROPIC_API_KEY, OPENAI_API_KEY, or OPENAI_BASE_URL");
    console.error("");
    console.error("Usage:");
    console.error("  ANTHROPIC_API_KEY=sk-... npx cl-lite");
    console.error("  OPENAI_API_KEY=sk-... MODEL_NAME=gpt-4 npx cl-lite");
    process.exit(1);
  }

  console.log(`Provider: ${config.provider}`);
  console.log(`Model: ${config.modelName}`);
  console.log("");

  // Initialize components
  const memory = new MemoryManager();
  const skills = new SkillsRegistry();
  const cli = new CLI({ prompt: "cl-lite> " });

  const agent = new Agent({
    providerConfig: config,
    tools,
    memory,
    skills,
    systemPrompt: "You are CL-Lite, a concise and practical CLI assistant.",
  });

  // Check for initial prompt from args
  const initialPrompt = process.argv.slice(2).join(" ");
  if (initialPrompt) {
    cli.print(`User: ${initialPrompt}\n`);
    const response = await agent.run(initialPrompt);
    cli.printMarkdown(response);
    await cli.close();
    return;
  }

  // Interactive mode
  cli.print("Type your message or /help for commands. Press Ctrl+C to exit.\n");

  while (true) {
    try {
      const input = await cli.prompt();

      if (!input.trim()) continue;

      // Handle built-in commands
      if (input === "/help") {
        cli.print(`
Available commands:
  /help     - Show this help message
  /skills   - List available skills
  /memory   - Show current memory context
  /clear    - Clear conversation history
  /quit     - Exit the program

Skills (prefix message with skill name):
  /implement, /debug, /explain, /review, /refactor, /test
`);
        continue;
      }

      if (input === "/skills") {
        const skillList = skills.getEnabled();
        cli.print("Available skills:");
        for (const skill of skillList) {
          cli.print(`  /${skill.name} - ${skill.description}`);
        }
        cli.print("");
        continue;
      }

      if (input === "/memory") {
        const context = memory.getContext();
        if (context) {
          cli.print(context);
        } else {
          cli.print("(No memory context)");
        }
        cli.print("");
        continue;
      }

      if (input === "/clear") {
        memory.clearAll();
        cli.print("Memory cleared.\n");
        continue;
      }

      if (input === "/quit" || input === "/exit") {
        await cli.close();
        return;
      }

      // Check for skill prefix
      let message = input;
      for (const skill of skills.getEnabled()) {
        if (input.startsWith(`/${skill.name} `)) {
          message = skills.execute(skill.name, input.slice(skill.name.length + 2)) || input;
          break;
        }
      }

      // Run agent
      const response = await agent.run(message);
      cli.printMarkdown(response);
    } catch (error) {
      if ((error as { code?: string }).code === "EOF") {
        break;
      }
      cli.printError((error as Error).message);
    }
  }

  await cli.close();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
