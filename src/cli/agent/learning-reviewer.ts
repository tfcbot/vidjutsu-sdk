import { Type } from "@earendil-works/pi-ai";
import {
  createAgentSession,
  defineTool,
  SessionManager,
  type ExtensionAPI,
  type ExtensionContext,
  type ToolDefinition,
} from "@earendil-works/pi-coding-agent";
import {
  appendLearningEvent,
  createVidjutsuSkill,
  listVidjutsuSkills,
  patchVidjutsuSkill,
  sanitizeTurnRecord,
  viewVidjutsuSkill,
  writeVidjutsuReference,
  type LearningStore,
  type TurnRecord,
} from "./learning-store";

export interface LearningReviewResult {
  actions: string[];
}

export interface LearningReviewRuntime {
  cwd: string;
  model: NonNullable<ExtensionContext["model"]>;
  thinkingLevel: ReturnType<ExtensionAPI["getThinkingLevel"]>;
}

interface LearningToolAction {
  action: "created" | "patched" | "reference";
  skill: string;
  message: string;
}

function textResult(text: string) {
  return {
    content: [{ type: "text" as const, text }],
    details: {},
  };
}

function createReviewerTools(
  store: LearningStore,
  actions: LearningToolAction[],
): ToolDefinition[] {
  const listTool = defineTool({
    name: "vidjutsu_skill_list",
    label: "List VidJutsu Skills",
    description: "List VidJutsu-owned learned creative workflow skills only.",
    parameters: Type.Object({}),
    async execute() {
      const skills = await listVidjutsuSkills(store);
      return textResult(JSON.stringify(skills, null, 2));
    },
  });

  const viewTool = defineTool({
    name: "vidjutsu_skill_view",
    label: "View VidJutsu Skill",
    description: "Read one VidJutsu-owned learned skill or support file.",
    parameters: Type.Object({
      skillName: Type.String({ description: "Lowercase VidJutsu skill slug." }),
      filePath: Type.Optional(
        Type.String({ description: "Relative file path. Defaults to SKILL.md." }),
      ),
    }),
    async execute(_toolCallId, params) {
      const content = await viewVidjutsuSkill(store, params.skillName, params.filePath);
      return textResult(content);
    },
  });

  const createTool = defineTool({
    name: "vidjutsu_skill_create",
    label: "Create VidJutsu Skill",
    description: "Create a new reusable VidJutsu-owned creative workflow skill.",
    parameters: Type.Object({
      skillName: Type.String({ description: "Lowercase slug name for the skill." }),
      content: Type.String({ description: "Complete SKILL.md content with frontmatter." }),
    }),
    async execute(_toolCallId, params) {
      await createVidjutsuSkill(store, params.skillName, params.content);
      actions.push({
        action: "created",
        skill: params.skillName,
        message: `created ${params.skillName}`,
      });
      return textResult(`Created VidJutsu skill: ${params.skillName}`);
    },
  });

  const patchTool = defineTool({
    name: "vidjutsu_skill_patch",
    label: "Patch VidJutsu Skill",
    description:
      "Patch an existing VidJutsu-owned skill file using one exact string replacement.",
    parameters: Type.Object({
      skillName: Type.String({ description: "Lowercase VidJutsu skill slug." }),
      oldString: Type.String({ description: "Exact existing text to replace. Must be unique." }),
      newString: Type.String({ description: "Replacement text." }),
      filePath: Type.Optional(
        Type.String({ description: "Relative file path. Defaults to SKILL.md." }),
      ),
    }),
    async execute(_toolCallId, params) {
      await patchVidjutsuSkill(
        store,
        params.skillName,
        params.oldString,
        params.newString,
        params.filePath,
      );
      actions.push({
        action: "patched",
        skill: params.skillName,
        message: `patched ${params.skillName}`,
      });
      return textResult(`Patched VidJutsu skill: ${params.skillName}`);
    },
  });

  const referenceTool = defineTool({
    name: "vidjutsu_skill_write_reference",
    label: "Write VidJutsu Skill Reference",
    description:
      "Write a concise support file under references/, templates/, or scripts/ for a VidJutsu-owned skill.",
    parameters: Type.Object({
      skillName: Type.String({ description: "Lowercase VidJutsu skill slug." }),
      filePath: Type.String({
        description: "Relative path under references/, templates/, or scripts/.",
      }),
      content: Type.String({ description: "Concise support file content." }),
    }),
    async execute(_toolCallId, params) {
      await writeVidjutsuReference(store, params.skillName, params.filePath, params.content);
      actions.push({
        action: "reference",
        skill: params.skillName,
        message: `wrote ${params.filePath}`,
      });
      return textResult(`Wrote VidJutsu support file: ${params.skillName}/${params.filePath}`);
    },
  });

  return [listTool, viewTool, createTool, patchTool, referenceTool];
}

export async function runLearningReview(
  store: LearningStore,
  runtime: LearningReviewRuntime,
  record: TurnRecord,
): Promise<LearningReviewResult> {
  const sanitized = sanitizeTurnRecord(record);
  const actions: LearningToolAction[] = [];
  const tools = createReviewerTools(store, actions);
  const { session } = await createAgentSession({
    cwd: runtime.cwd,
    model: runtime.model,
    thinkingLevel: runtime.thinkingLevel,
    noTools: "all",
    tools: tools.map((tool) => tool.name),
    customTools: tools,
    sessionManager: SessionManager.inMemory(runtime.cwd),
  });

  try {
    await session.prompt(buildReviewerPrompt(sanitized));
  } finally {
    session.dispose();
  }

  for (const action of actions) {
    await appendLearningEvent(store, action);
  }

  if (actions.length === 0) {
    await appendLearningEvent(store, {
      action: "skipped",
      message: "review found no durable creative workflow learning",
    });
  }

  return {
    actions: actions.map((action) =>
      action.action === "reference"
        ? `updated ${action.skill}`
        : `${action.action} ${action.skill}`,
    ),
  };
}

function buildReviewerPrompt(record: TurnRecord): string {
  return `You are VidJutsu Agent's autonomous self-learning reviewer.

You run after the user-facing turn has completed. Decide whether this completed turn contains reusable creative workflow learning. If it does, use the VidJutsu skill tools to create or patch only VidJutsu-owned skills. If it does not, do not call write tools and finish with "Nothing durable to learn."

Hard rules:
- Only write VidJutsu-owned creative workflow skills through the provided vidjutsu_skill_* tools.
- Never include secrets, raw API keys, auth tokens, raw credentials, or private session dumps in skills.
- Prefer patching an existing umbrella skill over creating a new skill.
- Create a new skill only for a reusable class of creative work, not for a one-off session summary.
- Capture provider quirks, reusable prompt patterns, successful workflow recipes, and user corrections.
- Do not turn transient environment failures into durable workflow rules.
- Keep SKILL.md short, operational, and useful for future creative work.
- New SKILL.md files must have YAML frontmatter with name and description, followed by direct instructions.

Completed turn:
${JSON.stringify(record, null, 2)}
`;
}
