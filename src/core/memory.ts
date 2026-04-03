import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";

const MEMORY_DIR = resolve(process.cwd(), ".cl-lite", "memory");

interface MemoryEntry {
  id: string;
  type: "episodic" | "semantic" | "working";
  content: string;
  timestamp: number;
  tags?: string[];
}

interface MemoryStore {
  episodic: MemoryEntry[];
  semantic: MemoryEntry[];
  working: MemoryEntry[];
}

function ensureMemoryDir(): void {
  mkdirSync(MEMORY_DIR, { recursive: true });
}

function getMemoryFilePath(type: string): string {
  return resolve(MEMORY_DIR, `${type}.json`);
}

function loadMemory(type: string): MemoryEntry[] {
  const filePath = getMemoryFilePath(type);
  if (!existsSync(filePath)) return [];
  try {
    const content = readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}

function saveMemory(type: string, entries: MemoryEntry[]): void {
  ensureMemoryDir();
  const filePath = getMemoryFilePath(type);
  writeFileSync(filePath, JSON.stringify(entries, null, 2), "utf-8");
}

// Working memory - current context, auto-cleared each session
export class WorkingMemory {
  private entries: MemoryEntry[] = [];

  add(content: string, tags?: string[]): void {
    this.entries.push({
      id: crypto.randomUUID(),
      type: "working",
      content,
      timestamp: Date.now(),
      tags,
    });
  }

  getAll(): MemoryEntry[] {
    return [...this.entries];
  }

  getRecent(n: number = 10): MemoryEntry[] {
    return this.entries.slice(-n);
  }

  clear(): void {
    this.entries = [];
  }

  toContext(): string {
    if (this.entries.length === 0) return "";
    return `## Working Memory (Current Context)\n${this.entries.map((e) => `- ${e.content}`).join("\n")}`;
  }
}

// Episodic memory - conversation history
export class EpisodicMemory {
  add(role: string, content: string): void {
    const entries = loadMemory("episodic");
    entries.push({
      id: crypto.randomUUID(),
      type: "episodic",
      content: `[${role}] ${content}`,
      timestamp: Date.now(),
    });
    // Keep last 100 entries
    if (entries.length > 100) {
      entries.splice(0, entries.length - 100);
    }
    saveMemory("episodic", entries);
  }

  getRecent(n: number = 20): MemoryEntry[] {
    const entries = loadMemory("episodic");
    return entries.slice(-n);
  }

  search(query: string): MemoryEntry[] {
    const entries = loadMemory("episodic");
    const lowerQuery = query.toLowerCase();
    return entries.filter((e) => e.content.toLowerCase().includes(lowerQuery));
  }

  toContext(n: number = 10): string {
    const entries = this.getRecent(n);
    if (entries.length === 0) return "";
    return `## Recent Conversation\n${entries.map((e) => e.content).join("\n")}`;
  }
}

// Semantic memory - project facts and knowledge
export class SemanticMemory {
  add(content: string, tags?: string[]): void {
    const entries = loadMemory("semantic");
    entries.push({
      id: crypto.randomUUID(),
      type: "semantic",
      content,
      timestamp: Date.now(),
      tags,
    });
    saveMemory("semantic", entries);
  }

  search(query: string): MemoryEntry[] {
    const entries = loadMemory("semantic");
    const lowerQuery = query.toLowerCase();
    return entries.filter(
      (e) =>
        e.content.toLowerCase().includes(lowerQuery) ||
        e.tags?.some((t) => t.toLowerCase().includes(lowerQuery))
    );
  }

  getAll(): MemoryEntry[] {
    return loadMemory("semantic");
  }

  toContext(): string {
    const entries = this.getAll();
    if (entries.length === 0) return "";
    return `## Project Knowledge\n${entries.map((e) => `- ${e.content}`).join("\n")}`;
  }

  clear(): void {
    saveMemory("semantic", []);
  }
}

// Combined memory manager
export class MemoryManager {
  working: WorkingMemory;
  episodic: EpisodicMemory;
  semantic: SemanticMemory;

  constructor() {
    this.working = new WorkingMemory();
    this.episodic = new EpisodicMemory();
    this.semantic = new SemanticMemory();
  }

  // Get all context for LLM system prompt
  getContext(): string {
    const parts: string[] = [];

    const semantic = this.semantic.toContext();
    if (semantic) parts.push(semantic);

    const working = this.working.toContext();
    if (working) parts.push(working);

    return parts.join("\n\n");
  }

  // Get full conversation history
  getHistory(n: number = 20): string {
    return this.episodic.toContext(n);
  }

  // Store user message
  addUserMessage(content: string): void {
    this.episodic.add("user", content);
  }

  // Store assistant message
  addAssistantMessage(content: string): void {
    this.episodic.add("assistant", content);
  }

  // Remember a fact
  remember(fact: string, tags?: string[]): void {
    this.semantic.add(fact, tags);
  }

  // Clear all memories
  clearAll(): void {
    this.working.clear();
    this.semantic.clear();
    saveMemory("episodic", []);
  }
}
