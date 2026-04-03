import { readdirSync, statSync } from "fs";
import { resolve, join } from "path";

export interface Skill {
  name: string;
  description: string;
  prompt: string;
  enabled: boolean;
}

// Built-in skills
const BUILT_IN_SKILLS: Skill[] = [
  {
    name: "implement",
    description: "Write code to implement a feature or fix a bug",
    prompt:
      "You are implementing a feature. First, explore the codebase to understand the structure. Then write the minimal code needed. Always prefer simplicity over generality.",
    enabled: true,
  },
  {
    name: "debug",
    description: "Investigate and fix a bug",
    prompt:
      "You are debugging an issue. Start by understanding what the expected behavior is vs actual behavior. Then locate the source of the bug. Fix the root cause, not the symptoms.",
    enabled: true,
  },
  {
    name: "explain",
    description: "Explain how code works",
    prompt:
      "You are explaining code. Focus on the 'why' not just the 'what'. Use simple analogies. Be concise but thorough.",
    enabled: true,
  },
  {
    name: "review",
    description: "Review code for issues and improvements",
    prompt:
      "You are reviewing code. Look for: bugs, security issues, performance problems, readability, and adherence to best practices. Be constructive and specific.",
    enabled: true,
  },
  {
    name: "refactor",
    description: "Improve code structure without changing behavior",
    prompt:
      "You are refactoring code. Preserve exact behavior. Make small, incremental improvements. Always verify the code works the same after refactoring.",
    enabled: true,
  },
  {
    name: "test",
    description: "Write or update tests",
    prompt:
      "You are writing tests. Focus on critical paths and edge cases. Make tests readable and maintainable. Ensure tests actually verify the behavior.",
    enabled: true,
  },
];

// Load skills from .cl-lite/skills directory
function loadCustomSkills(): Skill[] {
  const skillsDir = resolve(process.cwd(), ".cl-lite", "skills");
  try {
    if (!statSync(skillsDir).isDirectory()) return [];
  } catch {
    return [];
  }

  const skills: Skill[] = [];
  const files = readdirSync(skillsDir).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    try {
      const content = readdirSync(join(skillsDir, file), { encoding: "utf-8" }).toString();
      // Format: first line is name, second is description, rest is prompt
      const lines = content.split("\n");
      if (lines.length >= 3) {
        skills.push({
          name: lines[0].replace(/^#\s*/, "").trim(),
          description: lines[1].replace(/^##\s*/, "").trim(),
          prompt: lines.slice(2).join("\n").trim(),
          enabled: true,
        });
      }
    } catch {
      // Skip invalid skill files
    }
  }

  return skills;
}

export class SkillsRegistry {
  private skills: Map<string, Skill> = new Map();

  constructor() {
    // Register built-in skills
    for (const skill of BUILT_IN_SKILLS) {
      if (skill.enabled) {
        this.skills.set(skill.name, skill);
      }
    }

    // Register custom skills
    const customSkills = loadCustomSkills();
    for (const skill of customSkills) {
      this.skills.set(skill.name, skill);
    }
  }

  get(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  getAll(): Skill[] {
    return Array.from(this.skills.values());
  }

  getEnabled(): Skill[] {
    return this.getAll().filter((s) => s.enabled);
  }

  register(skill: Skill): void {
    this.skills.set(skill.name, skill);
  }

  // Get skills as context for system prompt
  toSystemPrompt(): string {
    const enabled = this.getEnabled();
    if (enabled.length === 0) return "";

    const lines = ["## Available Skills", ""];
    for (const skill of enabled) {
      lines.push(`### /${skill.name}`);
      lines.push(`${skill.description}`);
      lines.push("");
    }

    return lines.join("\n");
  }

  // Execute a skill by name
  execute(name: string, userMessage: string): string | null {
    const skill = this.get(name);
    if (!skill) return null;
    return `${skill.prompt}\n\n## Task\n${userMessage}`;
  }
}
