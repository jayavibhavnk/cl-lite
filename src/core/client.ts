import {
  LLMClient,
  LLMRequest,
  LLMResponse,
  Message,
  ContentBlock,
} from "../../types/index.js";
import { ProviderConfig, LLMProvider } from "./config.js";

// Anthropic API client
class AnthropicClient implements LLMClient {
  constructor(private apiKey: string) {}

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: request.model,
        max_tokens: request.max_tokens,
        messages: this.convertMessages(request.messages),
        tools: request.tools?.map((t) => ({
          name: t.name,
          description: t.description,
          input_schema: t.inputSchema,
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${error}`);
    }

    const data = await response.json();

    return {
      content: this.convertResponseContent(data.content),
      stop_reason: data.stop_reason,
      model: data.model,
    };
  }

  private convertMessages(messages: Message[]): object[] {
    return messages
      .filter((m) => m.role !== "system")
      .map((m) => {
        if (typeof m.content === "string") {
          return { role: m.role, content: m.content };
        }
        return {
          role: m.role,
          content: m.content.map((block) => {
            if (block.type === "text") {
              return { type: "text", text: block.text };
            }
            if (block.type === "tool_use") {
              return {
                type: "tool_use",
                id: block.id,
                name: block.name,
                input: block.input,
              };
            }
            if (block.type === "tool_result") {
              return {
                type: "tool_result",
                tool_use_id: block.tool_use_id,
                content: block.content,
              };
            }
            return block;
          }),
        };
      });
  }

  private convertResponseContent(content: object[]): ContentBlock[] {
    return content.map((block: object & { type?: string }) => {
      if (block.type === "text") {
        return { type: "text", text: (block as { text: string }).text };
      }
      if (block.type === "tool_use") {
        const tb = block as { id: string; name: string; input: Record<string, unknown> };
        return {
          type: "tool_use" as const,
          id: tb.id,
          name: tb.name,
          input: tb.input,
        };
      }
      return block as ContentBlock;
    });
  }
}

// OpenAI-compatible client
class OpenAICompatibleClient implements LLMClient {
  constructor(
    private apiKey: string | undefined,
    private baseUrl: string
  ) {}

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: request.model,
        messages: this.convertMessages(request.messages),
        tools: request.tools?.map((t) => ({
          type: "function",
          function: {
            name: t.name,
            description: t.description,
            parameters: t.inputSchema,
          },
        })),
        max_tokens: request.max_tokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const choice = data.choices[0];

    return {
      content: this.convertChoice(choice),
      stop_reason: choice.finish_reason,
      model: data.model,
    };
  }

  private convertMessages(messages: Message[]): object[] {
    const systemMessage = messages.find((m) => m.role === "system");
    const otherMessages = messages.filter((m) => m.role !== "system");

    const result: object[] = [];
    if (systemMessage) {
      result.push({
        role: "system",
        content: typeof systemMessage.content === "string"
          ? systemMessage.content
          : systemMessage.content.map((b) => b.text).join(""),
      });
    }

    for (const m of otherMessages) {
      if (typeof m.content === "string") {
        result.push({ role: m.role, content: m.content });
      } else {
        const textParts = m.content
          .filter((b) => b.type === "text")
          .map((b) => b.text);
        const toolCalls = m.content
          .filter((b) => b.type === "tool_use")
          .map((b) => ({
            id: b.id,
            type: "function",
            function: { name: b.name, arguments: JSON.stringify(b.input) },
          }));

        const msg: Record<string, unknown> = { role: m.role };
        if (textParts.length > 0) msg.content = textParts.join("");
        if (toolCalls.length > 0) msg.tool_calls = toolCalls;
        result.push(msg);
      }
    }

    return result;
  }

  private convertChoice(choice: {
    message?: { content?: string; tool_calls?: object[] };
    finish_reason?: string;
  }): ContentBlock[] {
    const blocks: ContentBlock[] = [];

    if (choice.message?.content) {
      blocks.push({ type: "text", text: choice.message.content });
    }

    if (choice.message?.tool_calls) {
      for (const tc of choice.message.tool_calls as {
        id: string;
        function: { name: string; arguments: string };
      }[]) {
        blocks.push({
          type: "tool_use",
          id: tc.id,
          name: tc.function.name,
          input: JSON.parse(tc.function.arguments),
        });
      }
    }

    return blocks;
  }
}

// MiniMax client (uses OpenAI-compatible API)
class MiniMaxClient implements LLMClient {
  constructor(private apiKey: string) {}

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const baseUrl = "https://api.minimax.chat/v1";
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: this.convertMessages(request.messages),
        tools: request.tools?.map((t) => ({
          type: "function",
          function: {
            name: t.name,
            description: t.description,
            parameters: t.inputSchema,
          },
        })),
        max_tokens: request.max_tokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`MiniMax API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const choice = data.choices[0];

    return {
      content: this.convertChoice(choice),
      stop_reason: choice.finish_reason,
      model: data.model,
    };
  }

  private convertMessages(messages: Message[]): object[] {
    return messages
      .filter((m) => m.role !== "system")
      .map((m) => {
        if (typeof m.content === "string") {
          return { role: m.role, content: m.content };
        }
        const text = m.content.filter((b) => b.type === "text").map((b) => b.text).join("");
        return { role: m.role, content: text };
      });
  }

  private convertChoice(choice: {
    message?: { content?: string; tool_calls?: object[] };
    finish_reason?: string;
  }): ContentBlock[] {
    const blocks: ContentBlock[] = [];

    if (choice.message?.content) {
      blocks.push({ type: "text", text: choice.message.content });
    }

    if (choice.message?.tool_calls) {
      for (const tc of choice.message.tool_calls as {
        id: string;
        function: { name: string; arguments: string };
      }[]) {
        blocks.push({
          type: "tool_use",
          id: tc.id,
          name: tc.function.name,
          input: JSON.parse(tc.function.arguments),
        });
      }
    }

    return blocks;
  }
}

// Factory function to create LLM client
export function createLLMClient(config: ProviderConfig): LLMClient {
  switch (config.provider) {
    case "anthropic":
      if (!config.apiKey) {
        throw new Error("ANTHROPIC_API_KEY environment variable is required");
      }
      return new AnthropicClient(config.apiKey);

    case "openai":
    case "openai-compatible":
      return new OpenAICompatibleClient(
        config.apiKey,
        config.baseUrl || "https://api.openai.com/v1"
      );

    case "minimax":
      if (!config.apiKey) {
        throw new Error("MINIMAX_API_KEY environment variable is required");
      }
      return new MiniMaxClient(config.apiKey);

    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}
