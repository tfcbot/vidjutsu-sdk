import { defineCommand } from "citty";
import { apiRequest } from "../client";

const VALID_MODELS = ["kling"] as const;
type CloneModel = (typeof VALID_MODELS)[number];

function validateModel(model: string | undefined): CloneModel | undefined {
  if (model === undefined) return undefined;
  if (!VALID_MODELS.includes(model as CloneModel)) {
    throw new Error(`--model must be one of: ${VALID_MODELS.join(", ")}`);
  }
  return model as CloneModel;
}

function isCharacterId(value: string): boolean {
  return value.startsWith("char_");
}

function requireCharacterId(value: string): string {
  if (!isCharacterId(value)) {
    throw new Error("--character must be a stored character id beginning with char_");
  }
  return value;
}

interface CloneVideoStatus {
  id: string;
  status: "processing" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
}

async function pollCloneVideo(
  id: string,
  { intervalMs = 3000, timeoutMs = 600_000 }: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<CloneVideoStatus> {
  const deadline = Date.now() + timeoutMs;
  while (true) {
    const status = (await apiRequest("GET", `/v1/clones/video/${encodeURIComponent(id)}`)) as CloneVideoStatus;
    if (status.status === "completed") return status;
    if (status.status === "failed") throw new Error(status.error ?? `Clone video ${id} failed`);
    if (Date.now() >= deadline) throw new Error(`Timed out waiting for clone video ${id}`);
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

export default defineCommand({
  meta: {
    name: "clone",
    description:
      "Clone a source video's motion onto a new character. About 5 minutes end to end for the full chain. " +
      "Kling 3.0 Motion Control is the supported model. Source clips are capped at 15 seconds. " +
      "Generation steps share the subscription's daily clone limit.",
  },
  subCommands: {
    check: defineCommand({
      meta: {
        name: "check",
        description:
          "Evaluate whether a source video can be cloned reliably. Uses the daily clone limit. " +
          "Exits nonzero when the verdict is weak.",
      },
      args: {
        videoUrl: { type: "positional", description: "Public HTTPS URL of the source video", required: true },
        context: { type: "string", description: "Optional context about the intended clone" },
      },
      async run({ args }) {
        const result = (await apiRequest("POST", "/v1/clones/check", {
          videoUrl: args.videoUrl,
          context: args.context,
        })) as { verdict: string; score: number; evidence: string[]; model: string };

        console.log(`Verdict: ${result.verdict}`);
        console.log(`Score: ${result.score}/100`);
        console.log("Evidence:");
        for (const item of result.evidence ?? []) {
          console.log(`  - ${item}`);
        }

        if (result.verdict === "weak") {
          process.exit(1);
        }
      },
    }),

    character: defineCommand({
      meta: {
        name: "character",
        description:
          "Create a reusable, persisted character. Create it once, then reuse the printed id for every " +
          "clone (see `vidjutsu clone starting-image --character <id>` and `clone run --character <id>`). " +
          "Uses the daily clone limit.",
      },
      subCommands: {
        list: defineCommand({
          meta: {
            name: "list",
            description: "List your persisted characters. Reads are not billed.",
          },
          async run() {
            const result = (await apiRequest("GET", "/v1/characters")) as {
              characters?: Array<{ id: string; model: string; createdAt: string }>;
            } | Array<{ id: string; model: string; createdAt: string }>;

            const characters = Array.isArray(result) ? result : (result.characters ?? []);

            if (characters.length === 0) {
              console.log("No characters yet. Create one with: vidjutsu clone character --prompt ...");
              return;
            }

            for (const c of characters) {
              console.log(`${c.id}  ${c.model}  ${c.createdAt}`);
            }
          },
        }),
      },
      args: {
        prompt: { type: "string", description: "Text description of the character to generate" },
        reference: { type: "string", description: "Optional public HTTPS reference image URL to guide identity" },
      },
      async run({ args, rawArgs }) {
        // citty always invokes a command's own `run` even after dispatching a subcommand
        // (e.g. `character list`), so bail out here once `list` has already handled it.
        if (rawArgs[0] === "list") return;

        if (!args.prompt) {
          throw new Error("--prompt is required to create a character (or run `vidjutsu clone character list`).");
        }

        const result = (await apiRequest("POST", "/v1/characters", {
          prompt: args.prompt,
          referenceImageUrl: args.reference,
        })) as { id: string; imageUrl: string; model: string };

        console.log(`Character created: ${result.id}`);
        console.log(`Image: ${result.imageUrl}`);
        console.log(`Model: ${result.model}`);
        console.log("");
        console.log(`Reuse this character with: --character ${result.id}`);
      },
    }),

    "starting-image": defineCommand({
      meta: {
        name: "starting-image",
        description:
          "Create a character-swapped starting frame from an extracted first frame and a stored character id. Uses the daily clone limit.",
      },
      args: {
        character: {
          type: "string",
          description: "Stored character id (char_...) from `clone character`",
          required: true,
        },
        "first-frame": {
          type: "string",
          description: "Public HTTPS URL of the source video's extracted first-frame image",
          required: true,
        },
        prompt: { type: "string", description: "Instructions for composing the starting frame", required: true },
      },
      async run({ args }) {
        const result = (await apiRequest("POST", "/v1/clones/starting-image", {
          firstFrame: args["first-frame"],
          characterId: requireCharacterId(args.character),
          prompt: args.prompt,
        })) as { imageUrl: string; model: string };

        console.log(result.imageUrl);
      },
    }),

    video: defineCommand({
      meta: {
        name: "video",
        description:
          "Clone source motion onto a starting image with Kling 3.0 Motion Control. Uses the daily clone limit. " +
          "Returns a task id (HTTP 202); use --wait to poll to completion.",
      },
      args: {
        "starting-image": { type: "string", description: "Public HTTPS URL of the starting frame", required: true },
        source: { type: "string", description: "Public HTTPS URL of the source video whose motion is cloned", required: true },
        model: { type: "string", description: "kling (the only supported model)" },
        prompt: { type: "string", description: "Optional override for the default motion-control prompt" },
        wait: { type: "boolean", description: "Poll GET status until completed or failed, then print videoUrl" },
      },
      async run({ args }) {
        const model = validateModel(args.model);
        const accepted = (await apiRequest("POST", "/v1/clones/video", {
          startingImageUrl: args["starting-image"],
          sourceVideoUrl: args.source,
          model,
          prompt: args.prompt,
        })) as { id: string; status: string };

        console.log(accepted.id);

        if (args.wait) {
          const final = await pollCloneVideo(accepted.id);
          console.log(final.videoUrl);
        }
      },
    }),

    status: defineCommand({
      meta: {
        name: "status",
        description: "Poll a clone video task by id. Status reads are not billed.",
      },
      args: {
        id: { type: "positional", description: "Clone video task id", required: true },
      },
      async run({ args }) {
        const result = await apiRequest("GET", `/v1/clones/video/${encodeURIComponent(args.id)}`);
        console.log(JSON.stringify(result, null, 2));
      },
    }),

    run: defineCommand({
      meta: {
        name: "run",
        description:
          "Run the full clone chain: download the TikTok video, check it, generate a starting image from a " +
          "reusable stored character, generate the clone video, and wait for it to finish. About 5 minutes end " +
          "to end. Characters are reusable: create one once with `vidjutsu clone character --prompt ...`, then " +
          "pass its id here with --character on every run — this command never generates a new random character. " +
          "--character is required. Kling 3.0 Motion Control is the only model; source clips " +
          "are capped at 15 seconds. Generation steps share the daily clone limit. Stops before generation when the " +
          "check verdict is weak, unless --force is given. The command extracts frame 0 and passes it directly " +
          "to the character edit step.",
      },
      args: {
        tiktokUrl: { type: "positional", description: "TikTok video URL to clone", required: true },
        character: {
          type: "string",
          description:
            "Required. Stored character id (char_...) from `vidjutsu clone character --prompt ...`. " +
            "Characters are reusable across runs — create one once, then pass its id here every time.",
        },
        "starting-prompt": { type: "string", description: "Prompt for the starting frame composition" },
        model: { type: "string", description: "kling (the only supported model)" },
        force: { type: "boolean", description: "Proceed even if the clone check verdict is weak" },
      },
      async run({ args }) {
        const model = validateModel(args.model) ?? "kling";

        if (!args.character) {
          console.log(
            "Missing --character. Create a reusable character first with: " +
              'vidjutsu clone character --prompt "A neutral, camera-ready presenter"',
          );
          console.log("Then pass its id here: vidjutsu clone run <url> --character char_...");
          process.exit(1);
        }
        const characterId = requireCharacterId(args.character);

        console.log(`Downloading ${args.tiktokUrl}...`);
        const download = (await apiRequest("POST", "/v1/videos/download/tiktok", {
          url: args.tiktokUrl,
        })) as { url: string; assetId: string };

        console.log("Checking cloneability...");
        const check = (await apiRequest("POST", "/v1/clones/check", {
          videoUrl: download.url,
        })) as { verdict: string; score: number; evidence: string[] };

        console.log(`Verdict: ${check.verdict} (score ${check.score}/100)`);
        for (const item of check.evidence ?? []) {
          console.log(`  - ${item}`);
        }

        if (check.verdict === "weak" && !args.force) {
          console.log("Stopping: the source clip is unlikely to clone well. Pass --force to continue anyway.");
          process.exit(1);
        }

        console.log("Extracting first frame...");
        const extracted = (await apiRequest("POST", "/v1/extract", {
          mediaUrl: download.url,
          frames: [0],
          audio: false,
          metadata: false,
        })) as { frames?: Array<{ index: number; url: string }> };
        const firstFrame = extracted.frames?.find((frame) => frame.index === 0)?.url ?? extracted.frames?.[0]?.url;
        if (!firstFrame) throw new Error("The source video did not return an extracted first frame");

        console.log("Generating starting image...");
        const startingImage = (await apiRequest("POST", "/v1/clones/starting-image", {
          firstFrame,
          characterId,
          prompt: args["starting-prompt"] ?? "Match the framing and pose of the source video's opening frame",
        })) as { imageUrl: string };

        console.log("Generating clone video...");
        const accepted = (await apiRequest("POST", "/v1/clones/video", {
          startingImageUrl: startingImage.imageUrl,
          sourceVideoUrl: download.url,
          model,
        })) as { id: string };

        console.log(`Task ${accepted.id} accepted, polling...`);
        const final = await pollCloneVideo(accepted.id);
        console.log(final.videoUrl);
      },
    }),
  },
});
