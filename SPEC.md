# CL-Lite: Lightweight Claude Code

## Concept & Vision

CL-Lite is a minimal, self-hosted CLI agent that replicates Claude Code's core functionality with a fraction of the context overhead. It interacts with LLMs through tool calls, executes code, manages files, and maintains conversation history — all without the heavy framework bloat.

**Design Philosophy:** Every feature must earn its context weight. If it can't be done in 100 tokens, it doesn't belong.

## Core Architecture

### Components

1. **Tool System** — Pluggable tool interface. Each tool is a standalone module.
2. **Agent Loop** — Simple request → think → tool-use → response cycle.
3. **Message Bus** — In-memory message queue with file-based persistence.
4. **LLM Client** — Minimal adapter for Claude API (or any OpenAI-compatible API).
5. **Memory Store** — Lightweight key-value store for project context.
6. **Skills Registry** — Map of slash commands to executable prompts.

### Directory Structure

```
cl-lite/
├── src/
│   ├── tools/          # Tool implementations
│   ├── core/            # Agent, client, message handling
│   ├── skills/          # Skill definitions
│   └── index.ts         # Entry point
├── types/               # Shared TypeScript types
├── package.json
└── SPEC.md
```

## Tool Inventory

| Tool | Purpose |
|------|---------|
| `Bash` | Execute shell commands |
| `Read` | Read file contents |
| `Write` | Create/overwrite files |
| `Edit` | In-place string replacement |
| `Glob` | Find files by pattern |
| `Grep` | Search file contents |
| `WebFetch` | HTTP GET requests |
| `WebSearch` | Search the web |

## Design Principles

1. **No state machines** — Tools either succeed or fail. No intermediate states.
2. **No streaming** — Response delivered in full. Simpler code, easier debugging.
3. **No multi-step tool calls** — One tool, one call, one result.
4. **No session management** — Each invocation is stateless (context lives in messages).
5. **No UI layer** — Pure TTY input/output.

## Out of Scope

- IDE extensions
- Desktop app
- Complex permission system
- Multiple concurrent agents
- Hook system
- Cron/scheduling
- Memory persistence across sessions (future: optional)

## API Design

### Tool Call Protocol

```typescript
interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

interface ToolResult {
  id: string;
  content: string;  // Always plain text
  is_error?: boolean;
}
```

### LLM Request

```typescript
interface LLMRequest {
  model: string;
  messages: Message[];
  tools: ToolDefinition[];
  max_tokens: number;
}
```

## Technical Approach

- **Language:** TypeScript (strict mode)
- **Runtime:** Node.js 20+
- **No external SDKs** except for HTTP (built-in fetch)
- **No build step** — direct .ts execution with tsx
- **Config:** Environment variables only (`ANTHROPIC_API_KEY`, `MODEL_NAME`)
