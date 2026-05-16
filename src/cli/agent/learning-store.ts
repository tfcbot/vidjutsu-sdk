import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const MAX_RECENT_EVENTS = 20;
const MAX_REVIEW_TEXT_CHARS = 12_000;
const SKILL_NAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])$/;
const ALLOWED_SUPPORT_DIRS = new Set(["references", "templates", "scripts"]);

export type LearningAction = "created" | "patched" | "reference" | "skipped" | "error";

export interface LearningEvent {
  at: string;
  action: LearningAction;
  skill?: string;
  message: string;
}

export interface LearningState {
  enabled: boolean;
  lastReviewAt?: string;
  lastAction?: string;
  recent: LearningEvent[];
}

export interface SkillSummary {
  name: string;
  description?: string;
  path: string;
}

export interface ToolExecutionRecord {
  toolName: string;
  args: unknown;
  result: unknown;
  isError: boolean;
}

export interface TurnRecord {
  prompt: string;
  assistant: string;
  model?: string;
  provider?: string;
  tools: ToolExecutionRecord[];
  skills?: string[];
}

export interface LearningStore {
  agentDir: string;
  skillRoot: string;
  statePath: string;
}

function getAgentDir(): string {
  return process.env.PI_CODING_AGENT_DIR ?? path.join(os.homedir(), ".pi", "agent");
}

export function createLearningStore(agentDir = getAgentDir()): LearningStore {
  return {
    agentDir,
    skillRoot: path.join(agentDir, "skills", "vidjutsu"),
    statePath: path.join(agentDir, "vidjutsu", "learning-state.json"),
  };
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function atomicWrite(filePath: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`,
  );
  await fs.writeFile(tempPath, content, "utf8");
  await fs.rename(tempPath, filePath);
}

export async function readLearningState(store: LearningStore): Promise<LearningState> {
  try {
    const raw = await fs.readFile(store.statePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<LearningState>;
    return {
      enabled: parsed.enabled !== false,
      lastReviewAt: parsed.lastReviewAt,
      lastAction: parsed.lastAction,
      recent: Array.isArray(parsed.recent) ? parsed.recent.slice(0, MAX_RECENT_EVENTS) : [],
    };
  } catch {
    return { enabled: true, recent: [] };
  }
}

export async function writeLearningState(
  store: LearningStore,
  state: LearningState,
): Promise<void> {
  await atomicWrite(store.statePath, `${JSON.stringify(state, null, 2)}\n`);
}

export async function setLearningEnabled(
  store: LearningStore,
  enabled: boolean,
): Promise<LearningState> {
  const state = await readLearningState(store);
  state.enabled = enabled;
  await writeLearningState(store, state);
  return state;
}

export async function appendLearningEvent(
  store: LearningStore,
  event: Omit<LearningEvent, "at">,
): Promise<LearningState> {
  const state = await readLearningState(store);
  const fullEvent: LearningEvent = {
    at: new Date().toISOString(),
    ...event,
  };
  state.lastReviewAt = fullEvent.at;
  state.lastAction = fullEvent.skill
    ? `${fullEvent.action} ${fullEvent.skill}`
    : fullEvent.action;
  state.recent = [fullEvent, ...state.recent].slice(0, MAX_RECENT_EVENTS);
  await writeLearningState(store, state);
  return state;
}

export function validateSkillName(name: string): string {
  const normalized = name.trim().toLowerCase();
  if (!SKILL_NAME_PATTERN.test(normalized) || normalized.includes("..")) {
    throw new Error("Skill name must be a lowercase slug, for example product-photo-workflow.");
  }
  return normalized;
}

export function resolveSkillFile(
  store: LearningStore,
  skillName: string,
  relativeFile = "SKILL.md",
): string {
  const safeSkillName = validateSkillName(skillName);
  if (path.isAbsolute(relativeFile) || relativeFile.includes("\\")) {
    throw new Error("Skill file path must be a relative POSIX path.");
  }

  const normalizedRelative = path.posix.normalize(relativeFile);
  if (normalizedRelative === "." || normalizedRelative.startsWith("../")) {
    throw new Error("Skill file path must stay inside the skill directory.");
  }

  if (normalizedRelative !== "SKILL.md") {
    const [topLevelDir] = normalizedRelative.split("/");
    if (!ALLOWED_SUPPORT_DIRS.has(topLevelDir)) {
      throw new Error("Support files must be under references/, templates/, or scripts/.");
    }
  }

  const skillDir = path.join(store.skillRoot, safeSkillName);
  const resolved = path.resolve(skillDir, normalizedRelative);
  const root = path.resolve(skillDir);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error("Skill file path must stay inside the skill directory.");
  }
  return resolved;
}

function extractDescription(content: string): string | undefined {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  const frontmatter = match?.[1];
  if (!frontmatter) return undefined;
  const description = frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim();
  return description?.replace(/^["']|["']$/g, "");
}

export async function listVidjutsuSkills(store: LearningStore): Promise<SkillSummary[]> {
  try {
    const entries = await fs.readdir(store.skillRoot, { withFileTypes: true });
    const skills = await Promise.all(
      entries
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => {
          const skillPath = path.join(store.skillRoot, entry.name, "SKILL.md");
          try {
            const content = await fs.readFile(skillPath, "utf8");
            return {
              name: entry.name,
              description: extractDescription(content),
              path: skillPath,
            };
          } catch {
            return undefined;
          }
        }),
    );
    return skills
      .filter((skill): skill is NonNullable<typeof skill> => Boolean(skill))
      .map((skill) => ({
        name: skill.name,
        path: skill.path,
        ...(skill.description ? { description: skill.description } : {}),
      }));
  } catch {
    return [];
  }
}

export async function viewVidjutsuSkill(
  store: LearningStore,
  skillName: string,
  relativeFile = "SKILL.md",
): Promise<string> {
  const filePath = resolveSkillFile(store, skillName, relativeFile);
  return fs.readFile(filePath, "utf8");
}

export async function createVidjutsuSkill(
  store: LearningStore,
  skillName: string,
  content: string,
): Promise<string> {
  const filePath = resolveSkillFile(store, skillName, "SKILL.md");
  if (await pathExists(filePath)) {
    throw new Error(`VidJutsu skill already exists: ${skillName}`);
  }
  if (!content.includes("description:")) {
    throw new Error("SKILL.md must include frontmatter with a description.");
  }
  await atomicWrite(filePath, ensureTrailingNewline(content));
  return filePath;
}

export async function patchVidjutsuSkill(
  store: LearningStore,
  skillName: string,
  oldString: string,
  newString: string,
  relativeFile = "SKILL.md",
): Promise<string> {
  if (!oldString) throw new Error("oldString must not be empty.");
  const filePath = resolveSkillFile(store, skillName, relativeFile);
  const current = await fs.readFile(filePath, "utf8");
  const first = current.indexOf(oldString);
  if (first === -1) throw new Error("Patch failed: oldString was not found.");
  if (current.indexOf(oldString, first + oldString.length) !== -1) {
    throw new Error("Patch failed: oldString matched more than once.");
  }
  await atomicWrite(filePath, current.replace(oldString, newString));
  return filePath;
}

export async function writeVidjutsuReference(
  store: LearningStore,
  skillName: string,
  relativeFile: string,
  content: string,
): Promise<string> {
  const filePath = resolveSkillFile(store, skillName, relativeFile);
  if (path.basename(filePath) === "SKILL.md") {
    throw new Error("Use vidjutsu_skill_create or vidjutsu_skill_patch for SKILL.md.");
  }
  await atomicWrite(filePath, ensureTrailingNewline(content));
  return filePath;
}

export function redactSecrets(value: unknown): string {
  const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return (text ?? "")
    .replace(/(--api-key\s+)(\S+)/gi, "$1<redacted>")
    .replace(/(authorization:\s*bearer\s+)(\S+)/gi, "$1<redacted>")
    .replace(/\b(sk-[A-Za-z0-9_-]{16,})\b/g, "<redacted>")
    .replace(/\b(hf_[A-Za-z0-9]{20,})\b/g, "<redacted>")
    .replace(/\b(AKIA[0-9A-Z]{16})\b/g, "<redacted>")
    .replace(
      /\b([A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD)[A-Z0-9_]*=)([^\s]+)/g,
      "$1<redacted>",
    )
    .replace(
      /\b((?:api[_-]?key|access[_-]?key|token|secret|password)["']?\s*[:=]\s*["']?)([A-Za-z0-9._\-+/=]{20,})/gi,
      "$1<redacted>",
    );
}

export function sanitizeTurnRecord(record: TurnRecord): TurnRecord {
  return {
    ...record,
    prompt: limitText(redactSecrets(record.prompt)),
    assistant: limitText(redactSecrets(record.assistant)),
    tools: record.tools.map((tool) => ({
      toolName: tool.toolName,
      args: limitText(redactSecrets(tool.args)),
      result: limitText(redactSecrets(tool.result)),
      isError: tool.isError,
    })),
  };
}

export function hasLearningSignal(record: TurnRecord): boolean {
  const combined = `${record.prompt}\n${record.assistant}`.toLowerCase();
  const toolNames = record.tools.map((tool) => tool.toolName.toLowerCase());
  const usedProviderTool = toolNames.some((tool) =>
    /wavespeed|higgsfield|vidjutsu|image|video|media|generate/.test(tool),
  );
  const hadToolError = record.tools.some((tool) => tool.isError);
  const correction = /\b(always|never|prefer|next time|wrong|instead|do not|don't|remember|should have|workaround|failed|error)\b/.test(
    combined,
  );
  const creativeWorkflow = /\b(image|video|shot|ugc|caption|thumbnail|prompt|render|generate|wavespeed|higgsfield)\b/.test(
    combined,
  );
  const multiStepCreative = creativeWorkflow && record.tools.length >= 2;

  return usedProviderTool || hadToolError || correction || multiStepCreative;
}

export function formatLearningStatus(state: LearningState, skillCount: number): string {
  return [
    `Self-learning: ${state.enabled ? "on" : "off"}`,
    `Learned skills: ${skillCount}`,
    `Last review: ${state.lastReviewAt ?? "never"}`,
    `Last action: ${state.lastAction ?? "none"}`,
  ].join("\n");
}

export function formatRecentLearningEvents(state: LearningState): string {
  if (state.recent.length === 0) return "No VidJutsu learning events yet.";
  return state.recent
    .slice(0, 5)
    .map((event) => {
      const skill = event.skill ? ` ${event.skill}` : "";
      return `${event.at} ${event.action}${skill}: ${event.message}`;
    })
    .join("\n");
}

function ensureTrailingNewline(content: string): string {
  return content.endsWith("\n") ? content : `${content}\n`;
}

function limitText(text: string): string {
  if (text.length <= MAX_REVIEW_TEXT_CHARS) return text;
  return `${text.slice(0, MAX_REVIEW_TEXT_CHARS)}\n...[truncated]`;
}
