import {
  Tool,
  ToolResult,
  Message,
  ContentBlock,
  LLMRequest,
} from "../types/index.js";
import { createLLMClient } from "./client.js";
import { ProviderConfig } from "./config.js";
import { MemoryManager } from "./memory.js";
import { SkillsRegistry } from "../skills/index.js";

export interface AgentConfig {
  providerConfig: ProviderConfig;
  tools: Tool[];
  memory: MemoryManager;
  skills: SkillsRegistry;
  systemPrompt?: string;
  maxIterations?: number;
}

export class Agent {
  private client;
  private toolsMap;

  constructor(private config: AgentConfig) {
    this.client = createLLMClient(config.providerConfig);
    this.toolsMap = new Map(config.tools.map((t) => [t.name, t]));
  }

  async run(userMessage: string): Promise<string> {
    const maxIterations = this.config.maxIterations || 20;
    let iterations = 0;

    // Add user message to memory
    this.config.memory.addUserMessage(userMessage);

    // Build messages
    const messages: Message[] = [];
    const systemPrompt = this.buildSystemPrompt();
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: userMessage });

    while (iterations < maxIterations) {
      iterations++;

      // Get LLM response
      const request: LLMRequest = {
        model: this.config.providerConfig.modelName,
        messages,
        tools: this.config.tools,
        max_tokens: this.config.providerConfig.maxTokens,
      };

      const response = await this.client.complete(request);

      // Add assistant response to messages
      const assistantMessage = this.blockToMessage(response.content, "assistant");
      messages.push(assistantMessage);

      // Check for tool calls
      const toolCalls = response.content.filter(
        (b: ContentBlock) => b.type === "tool_use"
      ) as ContentBlock[];

      if (toolCalls.length === 0) {
        // No tool calls, return the response
        const text = response.content
          .filter((b: ContentBlock) => b.type === "text")
          .map((b: ContentBlock) => (b as { text: string }).text)
          .join("");
        this.config.memory.addAssistantMessage(text);
        return text;
      }

      // Execute tool calls
      for (const toolCall of toolCalls) {
        const result = await this.executeTool(toolCall);
        const toolId = toolCall.id || `call_${Date.now()}`;
        messages.push({
          role: "tool",
          content: result.content,
          tool_call_id: toolId,
        });
      }
    }

    return "Max iterations reached. I couldn't complete this task.";
  }

  private async executeTool(block: ContentBlock): Promise<ToolResult> {
    if (block.type !== "tool_use") {
      return { id: "error", content: "Invalid tool call", is_error: true };
    }

    const tool = this.toolsMap.get(block.name || "");
    if (!tool) {
      return {
        id: block.id || "unknown",
        content: `Unknown tool: ${block.name}`,
        is_error: true,
      };
    }

    try {
      return await tool.execute(block.input || {});
    } catch (error: unknown) {
      const err = error as { message?: string };
      return {
        id: block.id || "error",
        content: `Tool execution error: ${err.message || "Unknown error"}`,
        is_error: true,
      };
    }
  }

  private buildSystemPrompt(): string {
    const parts: string[] = [];

    // Default prompt
    parts.push(
      `You are CL-Lite, a helpful CLI assistant with access to tools.`
    );
    parts.push(
      `You can read, write, and edit files, run shell commands, search the web, and more.`
    );
    parts.push(
      `Be concise and practical. Prefer direct solutions over lengthy explanations.`
    );

    // Skills context
    const skillsContext = this.config.skills.toSystemPrompt();
    if (skillsContext) {
      parts.push(skillsContext);
    }

    // Memory context
    const memoryContext = this.config.memory.getContext();
    if (memoryContext) {
      parts.push(memoryContext);
    }

    // User-provided system prompt
    if (this.config.systemPrompt) {
      parts.push(this.config.systemPrompt);
    }

    return parts.join("\n\n");
  }

  private blockToMessage(blocks: ContentBlock[], role: string): Message {
    return {
      role: role as Message["role"],
      content: blocks.map((b) => {
        if (b.type === "text") {
          return { type: "text" as const, text: b.text };
        }
        return b;
      }),
    };
  }
}

// Self-improvement: analyze and improve past behavior
export class SelfImprover {
  private memory: MemoryManager;

  constructor(memory: MemoryManager) {
    this.memory = memory;
  }

  // Analyze recent interactions and suggest improvements
  analyzeRecent(): string {
    const history = this.memory.episodic.getRecent(10);
    if (history.length < 2) return "";

    // Simple heuristic-based analysis
    const issues: string[] = [];
    const assistantMessages = history.filter((e) =>
      e.content.startsWith("[assistant]")
    );
    const userMessages = history.filter((e) => e.content.startsWith("[user]"));

    // Check for repeated failures (heuristic)
    if (assistantMessages.length > 3) {
      issues.push(
        "- Consider breaking complex tasks into smaller steps"
      );
    }

    if (issues.length === 0) return "";

    return `## Self-Improvement Notes\n${issues.join("\n")}`;
  }

  // Learn from success
  learnFromSuccess(task: string, approach: string): void {
    this.memory.semantic.add(
      `Successfully completed: ${task} using approach: ${approach}`,
      ["learning", "success"]
    );
  }

  // Learn from failure
  learnFromFailure(task: string, error: string): void {
    this.memory.semantic.add(
      `Failed task: ${task}. Error: ${error}`,
      ["learning", "failure"]
    );
  }
}
