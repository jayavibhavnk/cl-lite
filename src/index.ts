#!/usr/bin/env node

import {
  getProviderConfig,
  MemoryManager,
  SkillsRegistry,
  Agent,
} from "./core/index.js";
import {
  printBanner,
  printUserMessage,
  printAssistantMessage,
  printError,
  printInfo,
  Spinner,
  ThinkingAnimation,
} from "./core/ui.js";
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
import * as readline from "readline";

// ANSI color codes
const colors = {
  pink: "\x1b[38;5;206m",
  pinkBright: "\x1b[38;5;219m",
  cyan: "\x1b[38;5;87m",
  green: "\x1b[38;5;84m",
  yellow: "\x1b[38;5;227m",
  red: "\x1b[38;5;203m",
  gray: "\x1b[38;5;245m",
  white: "\x1b[38;5;15m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  reset: "\x1b[0m",
};

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
  printBanner();

  // Check for API key
  const config = getProviderConfig();
  if (!config.apiKey) {
    printError("No API key found.");
    printInfo("Set one of: ANTHROPIC_API_KEY, OPENAI_API_KEY, or MINIMAX_API_KEY");
    console.log(`
Usage:
  ${colors.pink}ANTHROPIC_API_KEY${colors.reset}=sk-... npx cl-lite
  ${colors.pink}OPENAI_API_KEY${colors.reset}=sk-... ${colors.pink}MODEL_NAME${colors.reset}=gpt-4 npx cl-lite
  ${colors.pink}MINIMAX_API_KEY${colors.reset}=... npx cl-lite
`);
    process.exit(1);
  }

  console.log(`${colors.gray}Provider:${colors.reset} ${colors.cyan}${config.provider}${colors.reset}`);
  console.log(`${colors.gray}Model:${colors.reset} ${colors.cyan}${config.modelName}${colors.reset}`);
  console.log(`${colors.gray}Max Tokens:${colors.reset} ${colors.cyan}${config.maxTokens}${colors.reset}`);
  console.log("");

  // Initialize components
  const memory = new MemoryManager();
  const skills = new SkillsRegistry();

  const agent = new Agent({
    providerConfig: config,
    tools,
    memory,
    skills,
    systemPrompt: "You are CL-Lite, a concise and practical CLI assistant.",
  });

  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${colors.pink}cl-lite${colors.reset} ${colors.gray}›${colors.reset} `,
  });

  // Check for initial prompt from args
  const initialPrompt = process.argv.slice(2).join(" ");
  if (initialPrompt) {
    printUserMessage(initialPrompt);
    const thinking = new ThinkingAnimation();
    thinking.start();
    try {
      const response = await agent.run(initialPrompt);
      thinking.stop();
      printAssistantMessage(response);
    } catch (error) {
      thinking.stop();
      printError((error as Error).message);
    }
    return;
  }

  // Interactive mode
  console.log(`${colors.dim}Type your message or /help for commands. Press Ctrl+C to exit.${colors.reset}\n`);

  const mainLoop = async () => {
    for await (const input of rl) {
      if (!input.trim()) continue;

      // Handle built-in commands
      if (input === "/help") {
        console.log(`
${colors.bold}${colors.pink}Available Commands:${colors.reset}
  ${colors.cyan}/help${colors.reset}     - Show this help message
  ${colors.cyan}/skills${colors.reset}   - List available skills
  ${colors.cyan}/memory${colors.reset}   - Show current memory context
  ${colors.cyan}/clear${colors.reset}    - Clear conversation history
  ${colors.cyan}/quit${colors.reset}     - Exit the program

${colors.bold}${colors.pink}Skills (prefix message with skill name):${colors.reset}
  ${colors.cyan}/implement${colors.reset}, ${colors.cyan}/debug${colors.reset}, ${colors.cyan}/explain${colors.reset}, ${colors.cyan}/review${colors.reset}, ${colors.cyan}/refactor${colors.reset}, ${colors.cyan}/test${colors.reset}
`);
        rl.prompt();
        continue;
      }

      if (input === "/skills") {
        const skillList = skills.getEnabled();
        console.log(`\n${colors.bold}${colors.pink}Available Skills:${colors.reset}`);
        for (const skill of skillList) {
          console.log(`  ${colors.cyan}/${skill.name}${colors.reset} - ${skill.description}`);
        }
        console.log("");
        rl.prompt();
        continue;
      }

      if (input === "/memory") {
        const context = memory.getContext();
        if (context) {
          console.log(`\n${context}\n`);
        } else {
          console.log(`\n${colors.dim}(No memory context)${colors.reset}\n`);
        }
        rl.prompt();
        continue;
      }

      if (input === "/clear") {
        memory.clearAll();
        console.log(`\n${colors.green}Memory cleared.${colors.reset}\n`);
        rl.prompt();
        continue;
      }

      if (input === "/quit" || input === "/exit") {
        console.log(`\n${colors.dim}Goodbye!${colors.reset}\n`);
        break;
      }

      // Check for skill prefix
      let message = input;
      for (const skill of skills.getEnabled()) {
        if (input.startsWith(`/${skill.name} `)) {
          message = skills.execute(skill.name, input.slice(skill.name.length + 2)) || input;
          break;
        }
      }

      // Print user message
      printUserMessage(input);

      // Run agent with thinking animation
      const thinking = new ThinkingAnimation();
      thinking.start();

      try {
        const response = await agent.run(message);
        thinking.stop();
        printAssistantMessage(response);
      } catch (error) {
        thinking.stop();
        printError((error as Error).message);
        console.log("");
      }

      rl.prompt();
    }
  };

  await mainLoop();
  rl.close();
}

main().catch((error) => {
  printError(`Fatal error: ${error.message}`);
  process.exit(1);
});
