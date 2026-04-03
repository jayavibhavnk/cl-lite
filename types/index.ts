// Tool types
export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResult {
  id: string;
  content: string;
  is_error?: boolean;
}

export interface Tool {
  name: string;
  description: string;
  inputSchema: ToolInputSchema;
  execute(input: Record<string, unknown>): Promise<ToolResult>;
}

export interface ToolInputSchema {
  type: "object";
  properties: Record<string, ToolProperty>;
  required?: string[];
}

export interface ToolProperty {
  type: string;
  description: string;
  default?: unknown;
}

// Message types
export type MessageRole = "user" | "assistant" | "system" | "tool";

export interface Message {
  role: MessageRole;
  content: string | ContentBlock[];
  name?: string;
  tool_call_id?: string;
}

export interface ContentBlock {
  type: "text" | "tool_use" | "tool_result";
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: string;
}

// LLM types
export interface LLMRequest {
  model: string;
  messages: Message[];
  tools?: Tool[];
  max_tokens: number;
  system?: string;
}

export interface LLMResponse {
  content: ContentBlock[];
  stop_reason: string;
  model: string;
}

export interface LLMClient {
  complete(request: LLMRequest): Promise<LLMResponse>;
}

// Config types
export interface Config {
  apiKey: string;
  modelName: string;
  maxTokens: number;
  baseUrl?: string;
}
