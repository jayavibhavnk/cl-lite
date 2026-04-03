# CL-Lite

Lightweight Claude Code clone - a minimal CLI agent with LLM tool-calling capabilities.

## Features

- **Multi-Provider Support**: Works with Anthropic (Claude), OpenAI (GPT), OpenAI-compatible APIs, and MiniMax
- **Tool System**: Bash, Read, Write, Edit, Glob, Grep, WebFetch, WebSearch
- **Memory System**: Episodic (conversation history), Semantic (project facts), Working (current context)
- **Skills**: Built-in skills for implementing, debugging, explaining, reviewing, refactoring, and testing
- **Self-Improvement**: Learns from successes and failures

## Installation

```bash
npm install
npm run build
```

## Configuration

Set one of the following environment variables:

```bash
# Anthropic (Claude)
export ANTHROPIC_API_KEY=sk-...

# OpenAI
export OPENAI_API_KEY=sk-...
export MODEL_NAME=gpt-4

# OpenAI-compatible (Local models, LM Studio, etc.)
export OPENAI_BASE_URL=http://localhost:1234/v1
export OPENAI_API_KEY=not-needed

# MiniMax
export MINIMAX_API_KEY=...
export MODEL_NAME=MiniMax-Text-01
```

## Usage

### Interactive Mode

```bash
npx tsx src/index.ts
# or after build:
node dist/index.js
```

### Single Command Mode

```bash
npx tsx src/index.ts "Your prompt here"
```

### Available Commands

- `/help` - Show help message
- `/skills` - List available skills
- `/memory` - Show current memory context
- `/clear` - Clear conversation history
- `/quit` - Exit the program

### Using Skills

Prefix your message with a skill name:

```
/implement Create a new API endpoint for user authentication
/debug Fix the login bug where users get logged out randomly
/review Review the payment processing code for security issues
```

## Project Structure

```
cl-lite/
├── src/
│   ├── tools/        # Tool implementations
│   │   ├── bash.ts
│   │   ├── read.ts
│   │   ├── write.ts
│   │   ├── edit.ts
│   │   ├── glob.ts
│   │   ├── grep.ts
│   │   ├── webfetch.ts
│   │   └── websearch.ts
│   ├── core/          # Core agent logic
│   │   ├── agent.ts   # Main agent loop
│   │   ├── client.ts  # LLM API clients
│   │   ├── config.ts  # Provider configuration
│   │   ├── memory.ts  # Memory system
│   │   └── cli.ts     # CLI interface
│   ├── skills/        # Skill definitions
│   ├── types/         # TypeScript types
│   └── index.ts       # Entry point
├── .cl-lite/
│   └── memory/        # Persistent memory storage
└── SPEC.md            # Project specification
```

## Memory System

CL-Lite uses a three-tier memory system:

- **Working Memory**: Current session context, auto-cleared
- **Episodic Memory**: Conversation history, persisted to disk
- **Semantic Memory**: Project facts and learnings, persisted to disk

Memory is stored in `.cl-lite/memory/` directory.

## Custom Skills

Add custom skills by creating `.md` files in `.cl-lite/skills/`:

```markdown
# myskill
## A custom skill description

You are an expert at...
```

## License

MIT
