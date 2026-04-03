// ANSI color codes for pink/magenta theme
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",

  // Pink theme
  pink: "\x1b[38;5;206m",
  pinkBright: "\x1b[38;5;219m",
  pinkDim: "\x1b[38;5;183m",

  // Accent colors
  cyan: "\x1b[38;5;87m",
  green: "\x1b[38;5;84m",
  yellow: "\x1b[38;5;227m",
  red: "\x1b[38;5;203m",
  orange: "\x1b[38;5;214m",

  // Neutrals
  gray: "\x1b[38;5;245m",
  white: "\x1b[38;5;15m",
}

// Frame characters for nice boxes
const frame = {
  topLeft: "╔",
  topRight: "╗",
  bottomLeft: "╚",
  bottomRight: "╝",
  horizontal: "═",
  vertical: "║",
  leftT: "╠",
  rightT: "╣",
}

// Loading spinner frames
const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export class Spinner {
  private frame = 0;
  private interval: NodeJS.Timeout | null = null;
  private message: string;

  constructor(message: string = "Thinking") {
    this.message = message;
  }

  start(): void {
    process.stdout.write(`${colors.pink}${spinnerFrames[0]}${colors.reset} ${this.message}`);
    this.interval = setInterval(() => {
      process.stdout.write(`\r${colors.pink}${spinnerFrames[this.frame % spinnerFrames.length]}${colors.reset} ${this.message}`);
      this.frame++;
    }, 80);
  }

  stop(finalMessage?: string): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (finalMessage) {
      console.log(`\r${colors.green}✓${colors.reset} ${finalMessage}`);
    } else {
      process.stdout.write(`\r${" ".repeat(50)}\r`);
    }
  }

  updateMessage(message: string): void {
    this.message = message;
    process.stdout.write(`\r${colors.pink}${spinnerFrames[this.frame % spinnerFrames.length]}${colors.reset} ${message}`);
  }
}

// Print banner/header
export function printBanner(): void {
  const banner = `
${colors.pinkBright}╔═══════════════════════════════════════════════════════════════╗
║                                                                       ║
║   ${colors.pinkBright}██${colors.reset}${colors.pink}     ${colors.pinkBright}██${colors.reset}${colors.pink}    ${colors.pinkBright}████${colors.reset}${colors.pink}    ${colors.pinkBright}█████${colors.reset}${colors.pink}   ${colors.pinkBright}██████${colors.reset}${colors.pink}    ${colors.pinkBright}██${colors.reset}${colors.pink}    ${colors.pinkBright}████████${colors.reset}${colors.pink}    ${colors.pinkBright}████████${colors.reset}${colors.pink}  ${colors.pinkBright}██${colors.reset}${colors.pink}    ${colors.pinkBright}████${colors.reset}${colors.pink}  ║
║   ${colors.pinkBright}██${colors.reset}${colors.pink}     ${colors.pinkBright}██${colors.reset}${colors.pink}    ${colors.pinkBright}██${colors.reset}${colors.pink}  ${colors.pinkBright}██${colors.reset}${colors.pink}   ${colors.pinkBright}██${colors.reset}${colors.pink}   ${colors.pinkBright}██${colors.reset}${colors.pink}   ${colors.pinkBright}██${colors.reset}${colors.pink}  ${colors.pinkBright}██${colors.reset}${colors.pink}    ${colors.pinkBright}██${colors.reset}${colors.pink}  ${colors.pinkBright}██${colors.reset}${colors.pink}     ${colors.pinkBright}██${colors.reset}${colors.pink}     ${colors.pinkBright}██${colors.reset}${colors.pink}    ${colors.pinkBright}██${colors.reset}${colors.pink}   ${colors.pinkBright}██${colors.reset}${colors.pink}   ${colors.pinkBright}██${colors.reset}${colors.pink}  ║
║   ${colors.pinkBright}██${colors.reset}${colors.pink}     ${colors.pinkBright}██${colors.reset}${colors.pink}    ${colors.pinkBright}██${colors.reset}${colors.pink}  ${colors.pinkBright}██${colors.reset}${colors.pink}   ${colors.pinkBright}████${colors.reset}${colors.pink}    ${colors.pinkBright}██${colors.reset}${colors.pink}  ${colors.pinkBright}██${colors.reset}${colors.pink}    ${colors.pinkBright}██${colors.reset}${colors.pink}  ${colors.pinkBright}██${colors.reset}${colors.pink}     ${colors.pinkBright}██${colors.reset}${colors.pink}     ${colors.pinkBright}█████${colors.reset}${colors.pink}   ${colors.pinkBright}██${colors.reset}${colors.pink}    ${colors.pinkBright}████${colors.reset}${colors.pink}  ║
║   ${colors.pinkBright}██${colors.reset}${colors.pink}     ${colors.pinkBright}██${colors.reset}${colors.pink}    ${colors.pinkBright}█████${colors.reset}${colors.pink}    ${colors.pinkBright}██${colors.reset}${colors.pink}   ${colors.pinkBright}██${colors.reset}${colors.pink}   ${colors.pinkBright}██${colors.reset}${colors.pink}  ${colors.pinkBright}██${colors.reset}${colors.pink}    ${colors.pinkBright}██${colors.reset}${colors.pink}  ${colors.pinkBright}██${colors.reset}${colors.pink}     ${colors.pinkBright}██${colors.reset}${colors.pink}          ${colors.pinkBright}██${colors.reset}${colors.pink}   ${colors.pinkBright}██${colors.reset}${colors.pink}    ${colors.pinkBright}██${colors.reset}${colors.pink}   ${colors.pinkBright}██${colors.reset}${colors.pink}  ║
║   ${colors.pinkBright}████████${colors.reset}${colors.pink}    ${colors.pinkBright}██${colors.reset}${colors.pink}   ${colors.pinkBright}██${colors.reset}${colors.pink}   ${colors.pinkBright}██████${colors.reset}${colors.pink}    ${colors.pinkBright}██${colors.reset}${colors.pink}   ${colors.pinkBright}█████${colors.reset}${colors.pink}  ${colors.pinkBright}████████${colors.reset}${colors.pink}  ${colors.pinkBright}████████${colors.reset}${colors.pink} ${colors.pinkBright}██████${colors.reset}${colors.pink}  ${colors.pinkBright}████████${colors.reset}${colors.pink}  ${colors.pinkBright}██${colors.reset}${colors.pink}   ${colors.pinkBright}██${colors.reset}${colors.pink}  ║
║                                                                       ║
║                    ${colors.cyan}${colors.bold}v0.1.0 - Lightweight AI Agent${colors.reset}                       ║
╚═══════════════════════════════════════════════════════════════╝${colors.reset}
`
  console.log(banner);
}

// Print styled box
export function printBox(content: string, title?: string): void {
  const lines = content.split("\n");
  const maxLen = Math.max(...lines.map((l) => l.length), title?.length || 0);
  const width = maxLen + 4;

  console.log(`${colors.pink}${frame.topLeft}${frame.horizontal.repeat(width - 2)}${frame.topRight}${colors.reset}`);

  if (title) {
    const padding = width - 4 - title.length;
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;
    console.log(`${colors.pink}${frame.vertical}${colors.reset} ${colors.bold}${colors.pinkBright}${title}${colors.reset}${" ".repeat(rightPad)} ${colors.pink}${frame.vertical}${colors.reset}`);
    console.log(`${colors.pink}${frame.vertical}${colors.reset}${" ".repeat(width - 2)}${colors.pink}${frame.vertical}${colors.reset}`);
  }

  for (const line of lines) {
    const padding = width - 4 - line.length;
    console.log(`${colors.pink}${frame.vertical}${colors.reset} ${colors.white}${line}${" ".repeat(padding)} ${colors.pink}${frame.vertical}${colors.reset}`);
  }

  console.log(`${colors.pink}${frame.bottomLeft}${frame.horizontal.repeat(width - 2)}${frame.bottomRight}${colors.reset}`);
}

// Print user message
export function printUserMessage(message: string): void {
  console.log(`${colors.cyan}${colors.bold}▸ User:${colors.reset}`);
  console.log(`${colors.gray}${message}${colors.reset}\n`);
}

// Print assistant message with markdown
export function printAssistantMessage(message: string): void {
  console.log(`${colors.pinkBright}${colors.bold}▸ CL-Lite:${colors.reset}\n`);

  const lines = message.split("\n");
  for (const line of lines) {
    if (line.startsWith("## ")) {
      console.log(`\n${colors.pinkBright}${colors.bold}${line.replace("## ", "")}${colors.reset}`);
      console.log(`${colors.pink}${"─".repeat(line.length - 3)}${colors.reset}`);
    } else if (line.startsWith("### ")) {
      console.log(`\n${colors.cyan}${colors.bold}${line.replace("### ", "")}${colors.reset}`);
    } else if (line.startsWith("- ")) {
      console.log(`  ${colors.pinkDim}•${colors.reset} ${line.slice(2)}`);
    } else if (line.startsWith("```")) {
      // Code block
      console.log(`${colors.gray}${line}${colors.reset}`);
    } else if (line.startsWith("`") && line.endsWith("`")) {
      // Inline code
      console.log(`${colors.yellow}${line}${colors.reset}`);
    } else {
      console.log(`${colors.white}${line}${colors.reset}`);
    }
  }
  console.log();
}

// Print tool execution with animation
export async function printToolExecution(
  toolName: string,
  execute: () => Promise<string>
): Promise<string> {
  process.stdout.write(`${colors.yellow}⚙ ${colors.dim}Executing ${toolName}...${colors.reset}`);

  const result = await execute();

  process.stdout.write(`\r${colors.green}✓${colors.reset} ${colors.yellow}${toolName}${colors.reset}\n`);

  return result;
}

// Print error with styling
export function printError(message: string): void {
  console.log(`${colors.red}${colors.bold}✗ Error:${colors.reset} ${message}`);
}

// Print success message
export function printSuccess(message: string): void {
  console.log(`${colors.green}${colors.bold}✓${colors.reset} ${message}`);
}

// Print info message
export function printInfo(message: string): void {
  console.log(`${colors.cyan}${colors.bold}ℹ${colors.reset} ${message}`);
}

// Print thinking animation
export class ThinkingAnimation {
  private frames = ["hmm", "hmm.", "hmm..", "hmm...", "thinking", "thinking.", "thinking..", "thinking..."];
  private frame = 0;
  private interval: NodeJS.Timeout | null = null;

  start(): void {
    this.interval = setInterval(() => {
      process.stdout.write(`\r${colors.pinkDim}${this.frames[this.frame % this.frames.length].padEnd(10)}${colors.reset}`);
      this.frame++;
    }, 200);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    process.stdout.write(`\r${" ".repeat(15)}\r`);
  }
}

// Progress bar
export function printProgress(current: number, total: number, label?: string): void {
  const width = 30;
  const progress = Math.floor((current / total) * width);
  const bar = "█".repeat(progress) + "░".repeat(width - progress);
  const percent = Math.floor((current / total) * 100);

  const labelStr = label ? ` ${label}` : "";
  process.stdout.write(`\r${colors.pink}[${bar}]${colors.reset} ${percent}%${labelStr}`);
}
