import type {
  ExtensionAPI,
  ExtensionCommandContext,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { createRequire } from "node:module";
import {
  appendLearningEvent,
  createLearningStore,
  formatLearningStatus,
  formatRecentLearningEvents,
  hasLearningSignal,
  listVidjutsuSkills,
  readLearningState,
  setLearningEnabled,
  type ToolExecutionRecord,
  type TurnRecord,
} from "./learning-store";
import { runLearningReview } from "./learning-reviewer";

const WAVESPEED_ACCESS_KEY_URL = "https://wavespeed.ai/accesskey";
const WAVESPEED_INSTALL_COMMAND = "npm install -g @wavespeed/cli";
const HIGGSFIELD_INSTALL_COMMAND = "npm install -g @higgsfield/cli";
const require = createRequire(import.meta.url);

function formatExecError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function formatCommand(command: string, args: string[]): string {
  const safeArgs = args.map((arg, index) => {
    if (args[index - 1] === "--api-key") return "<redacted>";
    return arg.includes(" ") ? JSON.stringify(arg) : arg;
  });
  return [command, ...safeArgs].join(" ");
}

function looksLikeWavespeedKey(value: string): boolean {
  return /^[A-Za-z0-9_-]{40,}$/.test(value.trim());
}

function resolveWavespeedCommand(): string {
  try {
    return require.resolve("@wavespeed/cli/dist/cli.js");
  } catch {
    return "wavespeed";
  }
}

function resolveHiggsfieldCommand(): string {
  try {
    return require.resolve("@higgsfield/cli/bin/higgsfield.js");
  } catch {
    return "higgsfield";
  }
}

async function runNodeBackedCommand(
  pi: ExtensionAPI,
  command: string,
  args: string[],
  label: string,
) {
  const shouldRunWithNode = command !== "wavespeed" && command !== "higgsfield";
  const commandArgs = shouldRunWithNode ? [command, ...args] : args;
  const result = await pi.exec(shouldRunWithNode ? "node" : command, commandArgs);
  if (result.code !== 0) {
    const stderr = result.stderr.trim();
    const stdout = result.stdout.trim();
    const details = [
      `command: ${formatCommand(shouldRunWithNode ? "node" : command, commandArgs)}`,
      `exit code: ${result.code}`,
      stderr ? `stderr:\n${stderr}` : "",
      stdout ? `stdout:\n${stdout}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
    throw new Error(
      `${label} failed.\n\n${details}`,
    );
  }
  return result;
}

async function runWavespeedCommand(
  pi: ExtensionAPI,
  args: string[],
  label: string,
) {
  return runNodeBackedCommand(pi, resolveWavespeedCommand(), args, label);
}

async function runHiggsfieldCommand(
  pi: ExtensionAPI,
  args: string[],
  label: string,
) {
  return runNodeBackedCommand(pi, resolveHiggsfieldCommand(), args, label);
}

async function runSkillInstaller(pi: ExtensionAPI, args: string[], label: string) {
  const result = await pi.exec("npx", ["-y", "skills", ...args]);
  if (result.code !== 0) {
    const stderr = result.stderr.trim();
    const stdout = result.stdout.trim();
    const details = [
      `command: ${formatCommand("npx", ["-y", "skills", ...args])}`,
      `exit code: ${result.code}`,
      stderr ? `stderr:\n${stderr}` : "",
      stdout ? `stdout:\n${stdout}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
    throw new Error(`${label} failed.\n\n${details}`);
  }
  return result;
}

async function handleWavespeedLogin(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
) {
  ctx.ui.notify("Starting WaveSpeed login...", "info");

  ctx.ui.notify(
    `Open ${WAVESPEED_ACCESS_KEY_URL}, create an access key, then paste it here.`,
    "info",
  );

  const apiKey = await ctx.ui.input(
    "WaveSpeed access key",
    "Paste your WaveSpeed API key",
  );
  const trimmedApiKey = apiKey?.trim();
  if (!trimmedApiKey) {
    ctx.ui.notify("WaveSpeed login cancelled.", "warning");
    return;
  }
  if (!looksLikeWavespeedKey(trimmedApiKey)) {
    ctx.ui.notify(
      "That does not look like a WaveSpeed access key. Expected a 40+ character token.",
      "error",
    );
    return;
  }

  try {
    await runWavespeedCommand(
      pi,
      ["login", "--api-key", trimmedApiKey, "--no-browser"],
      "WaveSpeed login",
    );
  } catch (error) {
    const message = formatExecError(error);
    if (
      message.includes("ENOENT") ||
      message.includes("not found") ||
      message.includes("No such file")
    ) {
      ctx.ui.notify(
        `WaveSpeed CLI was not found. Install it with: ${WAVESPEED_INSTALL_COMMAND}`,
        "error",
      );
      return;
    }
    ctx.ui.notify(message, "error");
    return;
  }

  ctx.ui.notify("Installing WaveSpeed agent skill...", "info");

  try {
    await runWavespeedCommand(pi, ["skill", "install"], "WaveSpeed skill install");
  } catch (error) {
    ctx.ui.notify(formatExecError(error), "error");
    return;
  }

  ctx.ui.notify("WaveSpeed is connected and its skill is installed.", "info");
}

async function handleHiggsfieldLogin(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
) {
  ctx.ui.notify("Starting Higgsfield login...", "info");
  ctx.ui.notify("Higgsfield will open a browser-based device login.", "info");

  try {
    await runHiggsfieldCommand(pi, ["auth", "login"], "Higgsfield login");
  } catch (error) {
    const message = formatExecError(error);
    if (
      message.includes("ENOENT") ||
      message.includes("not found") ||
      message.includes("No such file") ||
      message.includes("binary not found")
    ) {
      ctx.ui.notify(
        `Higgsfield CLI was not found. Install it with: ${HIGGSFIELD_INSTALL_COMMAND}`,
        "error",
      );
      return;
    }
    ctx.ui.notify(message, "error");
    return;
  }

  ctx.ui.notify("Installing Higgsfield agent skills...", "info");

  try {
    await runSkillInstaller(
      pi,
      ["add", "higgsfield-ai/skills", "--skill", "*", "--global", "--agent", "pi", "--yes"],
      "Higgsfield skills install",
    );
  } catch (error) {
    ctx.ui.notify(formatExecError(error), "error");
    return;
  }

  ctx.ui.notify("Higgsfield is connected and its skills are installed.", "info");
}

function extractMessageText(message: unknown): string {
  const content = (message as { content?: unknown })?.content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (!part || typeof part !== "object") return "";
      const typedPart = part as { type?: string; text?: string; name?: string; toolName?: string };
      if (typedPart.type === "text") return typedPart.text ?? "";
      if (typedPart.type === "toolCall") {
        return `[tool call: ${typedPart.name ?? typedPart.toolName ?? "unknown"}]`;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

function getModelInfo(ctx: ExtensionContext): Pick<TurnRecord, "model" | "provider"> {
  const model = ctx.model as
    | { id?: string; model?: string; name?: string; provider?: string; api?: string }
    | undefined;
  return {
    model: model?.id ?? model?.model ?? model?.name,
    provider: model?.provider ?? model?.api,
  };
}

async function handleLearnCommand(
  store: ReturnType<typeof createLearningStore>,
  args: string,
  ctx: ExtensionCommandContext,
) {
  const command = args.trim().toLowerCase() || "status";

  if (command === "on") {
    await setLearningEnabled(store, true);
    ctx.ui.notify("VidJutsu self-learning is on.", "info");
    return;
  }

  if (command === "off") {
    await setLearningEnabled(store, false);
    ctx.ui.notify("VidJutsu self-learning is off.", "warning");
    return;
  }

  if (command === "status") {
    const [state, skills] = await Promise.all([
      readLearningState(store),
      listVidjutsuSkills(store),
    ]);
    ctx.ui.notify(formatLearningStatus(state, skills.length), "info");
    return;
  }

  if (command === "recent") {
    const state = await readLearningState(store);
    ctx.ui.notify(formatRecentLearningEvents(state), "info");
    return;
  }

  ctx.ui.notify("Use /learn status, /learn recent, /learn on, or /learn off.", "warning");
}

export function createVidJutsuAgentExtension(pi: ExtensionAPI) {
  const learningStore = createLearningStore();
  let currentPrompt = "";
  let lastAssistant = "";
  let reviewRunning = false;
  const toolArgs = new Map<string, { toolName: string; args: unknown }>();
  let tools: ToolExecutionRecord[] = [];

  pi.on("resources_discover", () => ({
    skillPaths: [learningStore.skillRoot],
  }));

  pi.on("before_agent_start", (event) => {
    currentPrompt = event.prompt;
    lastAssistant = "";
    tools = [];
    toolArgs.clear();
  });

  pi.on("tool_execution_start", (event) => {
    toolArgs.set(event.toolCallId, {
      toolName: event.toolName,
      args: event.args,
    });
  });

  pi.on("tool_execution_end", (event) => {
    const started = toolArgs.get(event.toolCallId);
    tools.push({
      toolName: event.toolName,
      args: started?.args,
      result: event.result,
      isError: event.isError,
    });
  });

  pi.on("turn_end", (event) => {
    lastAssistant = extractMessageText(event.message);
  });

  pi.on("agent_end", async (_event, ctx) => {
    const model = ctx.model;
    const record: TurnRecord = {
      prompt: currentPrompt,
      assistant: lastAssistant,
      tools: [...tools],
      ...getModelInfo(ctx),
    };
    const runtime = model
      ? {
          cwd: ctx.cwd,
          model,
          thinkingLevel: pi.getThinkingLevel(),
        }
      : undefined;

    const state = await readLearningState(learningStore);
    if (!state.enabled || reviewRunning || !hasLearningSignal(record)) return;
    if (!runtime) {
      await appendLearningEvent(learningStore, {
        action: "skipped",
        message: "review skipped because no active model was available",
      });
      return;
    }

    reviewRunning = true;
    try {
      await runLearningReview(learningStore, runtime, record);
    } catch (error) {
      const message = formatExecError(error);
      await appendLearningEvent(learningStore, {
        action: "error",
        message: `review failed: ${message}`,
      });
    } finally {
      reviewRunning = false;
    }
  });

  pi.registerCommand("login", {
    description: "Connect VidJutsu media providers like WaveSpeed or Higgsfield",
    getArgumentCompletions(prefix) {
      const providers = ["wavespeed", "higgsfield"];
      const matches = providers
        .filter((provider) => provider.startsWith(prefix))
        .map((provider) => ({ value: provider, label: provider }));
      return matches.length > 0 ? matches : null;
    },
    handler: async (args, ctx) => {
      const provider = args.trim().toLowerCase();

      if (provider === "wavespeed") {
        await handleWavespeedLogin(pi, ctx);
        return;
      }

      if (provider === "higgsfield") {
        await handleHiggsfieldLogin(pi, ctx);
        return;
      }

      if (!provider) {
        ctx.ui.notify(
          "Use /login wavespeed or /login higgsfield.",
          "warning",
        );
        return;
      }

      ctx.ui.notify(
        "Provider login is only available for wavespeed and higgsfield right now.",
        "warning",
      );
    },
  });

  pi.registerCommand("learn", {
    description: "Show or control VidJutsu autonomous self-learning",
    getArgumentCompletions(prefix) {
      const commands = ["status", "recent", "on", "off"];
      const matches = commands
        .filter((command) => command.startsWith(prefix))
        .map((command) => ({ value: command, label: command }));
      return matches.length > 0 ? matches : null;
    },
    handler: async (args, ctx) => {
      await handleLearnCommand(learningStore, args, ctx);
    },
  });
}
