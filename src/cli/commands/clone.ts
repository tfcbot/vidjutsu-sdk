import { defineCommand } from "citty";
import { apiRequest } from "../client";

const VALID_MODELS = ["kling", "seedance"] as const;
type CloneModel = (typeof VALID_MODELS)[number];

function validateModel(model: string | undefined): CloneModel | undefined {
  if (model === undefined) return undefined;
  if (!VALID_MODELS.includes(model as CloneModel)) {
    throw new Error(`--model must be one of: ${VALID_MODELS.join(", ")}`);
  }
  return model as CloneModel;
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
      "Kling motion control is the default model; output is 480p 9:16. Source clips are capped at 15 seconds. " +
      "Each step below is metered per call.",
  },
  subCommands: {
    check: defineCommand({
      meta: {
        name: "check",
        description:
          "Evaluate whether a source video can be cloned reliably. Metered per call. " +
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
        description: "Create a reusable generated character image. Metered per call.",
      },
      args: {
        prompt: { type: "string", description: "Text description of the character to generate", required: true },
        reference: { type: "string", description: "Optional public HTTPS reference image URL to guide identity" },
      },
      async run({ args }) {
        const result = (await apiRequest("POST", "/v1/characters", {
          prompt: args.prompt,
          referenceImageUrl: args.reference,
        })) as { imageUrl: string; model: string };

        console.log(result.imageUrl);
      },
    }),

    "starting-image": defineCommand({
      meta: {
        name: "starting-image",
        description: "Create a character-swapped starting frame, with no overlays. Metered per call.",
      },
      args: {
        character: { type: "string", description: "Public HTTPS URL of the character identity image", required: true },
        prompt: { type: "string", description: "Instructions for composing the starting frame", required: true },
        source: { type: "string", description: "Optional public HTTPS source video URL to ground the composition" },
      },
      async run({ args }) {
        const result = (await apiRequest("POST", "/v1/clones/starting-image", {
          characterImageUrl: args.character,
          prompt: args.prompt,
          sourceVideoUrl: args.source,
        })) as { imageUrl: string; model: string };

        console.log(result.imageUrl);
      },
    }),

    video: defineCommand({
      meta: {
        name: "video",
        description:
          "Clone source motion onto a starting image. Kling motion control is the default; seedance is the " +
          "alternate model, 9:16 at 480p. Metered per call. Returns a task id (HTTP 202); use --wait to poll to completion.",
      },
      args: {
        "starting-image": { type: "string", description: "Public HTTPS URL of the starting frame", required: true },
        source: { type: "string", description: "Public HTTPS URL of the source video whose motion is cloned", required: true },
        model: { type: "string", description: "kling (default) or seedance" },
        prompt: { type: "string", description: "Optional override for the default identity-swap prompt (seedance only)" },
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
          "Run the full clone chain: download the TikTok video, check it, generate a character, generate a " +
          "starting image, generate the clone video, and wait for it to finish. About 5 minutes end to end. " +
          "Kling motion control is the default model; output is 480p 9:16, source clips are capped at 15 seconds. " +
          "Each step is metered per call. Stops before spending on generation when the check verdict is weak, " +
          "unless --force is given.",
      },
      args: {
        tiktokUrl: { type: "positional", description: "TikTok video URL to clone", required: true },
        "character-prompt": { type: "string", description: "Prompt for the generated character (default: a generic presenter)" },
        "starting-prompt": { type: "string", description: "Prompt for the starting frame composition" },
        model: { type: "string", description: "kling (default) or seedance" },
        force: { type: "boolean", description: "Proceed even if the clone check verdict is weak" },
      },
      async run({ args }) {
        const model = validateModel(args.model);

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

        console.log("Generating character...");
        const character = (await apiRequest("POST", "/v1/characters", {
          prompt: args["character-prompt"] ?? "A neutral, camera-ready presenter",
        })) as { imageUrl: string };

        console.log("Generating starting image...");
        const startingImage = (await apiRequest("POST", "/v1/clones/starting-image", {
          characterImageUrl: character.imageUrl,
          prompt: args["starting-prompt"] ?? "Match the framing and pose of the source video's opening frame",
          sourceVideoUrl: download.url,
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
