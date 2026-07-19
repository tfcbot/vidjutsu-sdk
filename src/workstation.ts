import {
  createClient as createFullClient,
  type VidJutsuConfig,
  type VidJutsuClient,
} from "./client.js";

type BaseClient = Pick<
  VidJutsuClient,
  | "watchMedia"
  | "extractMedia"
  | "uploadFromUrl"
  | "listOrGetAssets"
  | "createOverlay"
  | "getJob"
  | "downloadTikTokVideo"
  | "downloadInstagramVideo"
>;

export interface CloneEvidence {
  criterion: string;
  observation: string;
  timestamps: number[];
}

export interface CloneCheckResult {
  successPercent: number;
  verdict: "recommended" | "marginal" | "not_recommended";
  recommendedModel: "seedance" | "kling-motion-control";
  failedCriteria: string[];
  evidence: CloneEvidence[];
  components: Record<string, number>;
  observations: Record<string, unknown>;
}

export interface GeneratedImageAsset {
  assetId: string;
  url: string;
  interactionId: string;
}

export interface MotionCloneTask {
  providerTaskId: string;
  status: "queued" | "processing" | "completed" | "failed";
  statusUrl?: string;
  resultUrl?: string;
  error?: string;
}

export interface WorkstationClient extends BaseClient {
  analysis: {
    cloneCheck(input: { mediaUrl: string }): Promise<CloneCheckResult>;
    watch(input: { mediaUrl: string; prompt: string }): Promise<unknown>;
  };
  images: {
    createCharacter(input: {
      prompt: string;
      referenceImageUrls?: string[];
    }): Promise<GeneratedImageAsset>;
    createStartingImage(input: {
      sourceVideoUrl: string;
      identityImageUrl: string;
    }): Promise<GeneratedImageAsset>;
  };
  videos: {
    submitMotionClone(input: {
      model: "seedance" | "kling-motion-control";
      sourceVideoUrl: string;
      startingImageUrl: string;
      prompt?: string;
    }): Promise<MotionCloneTask>;
    getMotionClone(input: {
      providerTaskId: string;
      statusUrl?: string;
    }): Promise<MotionCloneTask>;
  };
  overlays: {
    addText(input: {
      videoUrl: string;
      text: string;
      position?: "top" | "center" | "bottom";
      fontSize?: number;
      strokeThickness?: number;
    }): Promise<{ id: string; resultUrl: string }>;
  };
}

const CLONE_CHECK_PROMPT = `Watch the entire video and evaluate whether it can be recreated by replacing
one performer while preserving the source motion, timing, sound, and text-video
format.

Return only JSON with:
{
  "durationSeconds": number,
  "primarySubjectCount": number,
  "shotCount": number,
  "continuousShot": boolean,
  "motionComplexity": "low" | "medium" | "high",
  "propCount": number,
  "interactionComplexity": "low" | "medium" | "high",
  "subjectVisibility": "clear" | "partial" | "poor",
  "occlusionCount": number,
  "persistentWallText": boolean,
  "wallTextReproducible": boolean,
  "sourceAudioPresent": boolean,
  "soundReusable": boolean,
  "evidence": [
    {
      "criterion": string,
      "observation": string,
      "timestamps": number[]
    }
  ]
}

Count only people who visibly participate as primary subjects. Background
images, reflections, and text are not additional subjects. Inspect the full
video rather than inferring from the first frame.`;

const STARTING_IMAGE_PROMPT = `Replace the source performer with the identity shown in the character
reference. Preserve the source pose, framing, camera, lighting, background,
clothing silhouette, and composition. Remove every original text overlay,
caption, sticker, watermark-like wall-text element, and UI element. Return one
clean portrait frame with exactly one visible performer. Do not add text.`;

/**
 * Restricted client injected into VidJutsu job workstations.
 *
 * Provider URLs, credentials, payloads, response parsing, and clone scoring are
 * intentionally encapsulated here. EVE-authored programs compose these typed
 * capabilities and cannot invoke agent-backed endpoints.
 */
export function createClient(config: VidJutsuConfig = {}): WorkstationClient {
  const client = createFullClient(config);
  const apiUrl =
    config.baseUrl ?? process.env.VIDJUTSU_API_URL ?? "https://api.vidjutsu.ai";
  const apiKey = config.apiKey ?? process.env.VIDJUTSU_API_KEY;

  const base: BaseClient = {
    watchMedia: client.watchMedia,
    extractMedia: client.extractMedia,
    uploadFromUrl: client.uploadFromUrl,
    listOrGetAssets: client.listOrGetAssets,
    createOverlay: client.createOverlay,
    getJob: client.getJob,
    downloadTikTokVideo: client.downloadTikTokVideo,
    downloadInstagramVideo: client.downloadInstagramVideo,
  };

  return {
    ...base,
    analysis: {
      async cloneCheck({ mediaUrl }) {
        const value = await watchJson(client, mediaUrl, CLONE_CHECK_PROMPT);
        return scoreCloneability(validateCloneObservations(value));
      },
      async watch({ mediaUrl, prompt }) {
        if (!prompt.trim()) throw new Error("analysis.watch requires a prompt");
        return await watchJson(client, mediaUrl, prompt);
      },
    },
    images: {
      async createCharacter({ prompt, referenceImageUrls = [] }) {
        if (!prompt.trim()) throw new Error("Character prompt is required");
        return await generateGeminiImage({
          apiUrl,
          apiKey,
          prompt,
          imageUrls: referenceImageUrls,
        });
      },
      async createStartingImage({ sourceVideoUrl, identityImageUrl }) {
        const extracted: any = await client.extractMedia({
          mediaUrl: sourceVideoUrl,
          frames: [0],
        } as any);
        const frameUrl = extracted.data?.frames?.[0]?.url;
        if (typeof frameUrl !== "string") {
          throw new Error("VidJutsu did not return the source opening frame");
        }
        return await generateGeminiImage({
          apiUrl,
          apiKey,
          prompt: STARTING_IMAGE_PROMPT,
          imageUrls: [frameUrl, identityImageUrl],
        });
      },
    },
    videos: {
      async submitMotionClone(input) {
        const providerKey = requiredEnvironment("WAVESPEED_API_KEY");
        const endpoint =
          input.model === "seedance"
            ? "https://api.wavespeed.ai/api/v3/bytedance/seedance-2.0/video-edit"
            : "https://api.wavespeed.ai/api/v3/kwaivgi/kling-v2.6-pro/motion-control";
        const body =
          input.model === "seedance"
            ? {
                video: input.sourceVideoUrl,
                reference_images: [input.startingImageUrl],
                prompt:
                  input.prompt ??
                  "Replace the source performer with the reference-image identity while preserving timing, motion, framing, background, and original audio.",
                aspect_ratio: "9:16",
                resolution: "480p",
                enable_web_search: false,
                generate_audio: false,
              }
            : {
                image: input.startingImageUrl,
                video: input.sourceVideoUrl,
                character_orientation: "video",
                keep_original_sound: true,
              };
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            authorization: `Bearer ${providerKey}`,
            "content-type": "application/json",
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(30_000),
        });
        const value: any = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(providerError("WaveSpeed submit", response, value));
        const data = value.data ?? value;
        const providerTaskId = data.id ?? data.prediction_id;
        if (typeof providerTaskId !== "string") {
          throw new Error("WaveSpeed submit did not return a task ID");
        }
        return {
          providerTaskId,
          status: normalizeProviderStatus(data.status),
          resultUrl: firstOutput(data),
          ...(typeof data.urls?.get === "string" ? { statusUrl: data.urls.get } : {}),
        } as MotionCloneTask;
      },
      async getMotionClone({ providerTaskId, statusUrl }) {
        const providerKey = requiredEnvironment("WAVESPEED_API_KEY");
        const url =
          statusUrl ??
          `https://api.wavespeed.ai/api/v3/predictions/${encodeURIComponent(providerTaskId)}/result`;
        const response = await fetch(url, {
          headers: { authorization: `Bearer ${providerKey}` },
          signal: AbortSignal.timeout(30_000),
        });
        const value: any = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(providerError("WaveSpeed status", response, value));
        const data = value.data ?? value;
        return {
          providerTaskId,
          status: normalizeProviderStatus(data.status),
          resultUrl: firstOutput(data),
          error:
            typeof data.error === "string"
              ? data.error
              : typeof data.error?.message === "string"
                ? data.error.message
                : undefined,
        };
      },
    },
    overlays: {
      async addText(input) {
        const result: any = await client.createOverlay(input as any);
        if (result.error) throw new Error(`VidJutsu overlay failed: ${JSON.stringify(result.error)}`);
        return result.data;
      },
    },
  };
}

export const createWorkstationClient = createClient;

async function watchJson(
  client: VidJutsuClient,
  mediaUrl: string,
  prompt: string,
): Promise<unknown> {
  const result: any = await client.watchMedia({ mediaUrl, prompt } as any);
  if (result.error) throw new Error(`VidJutsu watch failed: ${JSON.stringify(result.error)}`);
  return result.data?.response;
}

function validateCloneObservations(value: unknown): any {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("clone_check_watch_response_invalid: JSON object required");
  }
  const input = value as Record<string, any>;
  const requiredNumbers = [
    "durationSeconds",
    "primarySubjectCount",
    "shotCount",
    "propCount",
    "occlusionCount",
  ];
  for (const name of requiredNumbers) {
    if (typeof input[name] !== "number" || input[name] < 0) {
      throw new Error(`clone_check_watch_response_invalid: ${name}`);
    }
  }
  for (const name of [
    "continuousShot",
    "persistentWallText",
    "wallTextReproducible",
    "sourceAudioPresent",
    "soundReusable",
  ]) {
    if (typeof input[name] !== "boolean") {
      throw new Error(`clone_check_watch_response_invalid: ${name}`);
    }
  }
  if (!["low", "medium", "high"].includes(input.motionComplexity)) {
    throw new Error("clone_check_watch_response_invalid: motionComplexity");
  }
  if (!["low", "medium", "high"].includes(input.interactionComplexity)) {
    throw new Error("clone_check_watch_response_invalid: interactionComplexity");
  }
  if (!["clear", "partial", "poor"].includes(input.subjectVisibility)) {
    throw new Error("clone_check_watch_response_invalid: subjectVisibility");
  }
  if (!Array.isArray(input.evidence) || input.evidence.length === 0) {
    throw new Error("clone_check_watch_response_invalid: evidence");
  }
  for (const item of input.evidence) {
    if (
      !item ||
      typeof item.criterion !== "string" ||
      typeof item.observation !== "string" ||
      !Array.isArray(item.timestamps)
    ) {
      throw new Error("clone_check_watch_response_invalid: evidence item");
    }
  }
  return input;
}

function scoreCloneability(observations: any): CloneCheckResult {
  const components = {
    duration: observations.durationSeconds <= 15 ? 15 : 0,
    primary_subject: observations.primarySubjectCount === 1 ? 25 : 0,
    shots:
      observations.continuousShot && observations.shotCount === 1
        ? 15
        : observations.shotCount <= 2
          ? 10
          : 0,
    motion:
      observations.motionComplexity === "low"
        ? 15
        : observations.motionComplexity === "medium"
          ? 10
          : 0,
    props_interactions:
      observations.propCount <= 1 && observations.interactionComplexity === "low"
        ? 10
        : observations.propCount <= 2 && observations.interactionComplexity !== "high"
          ? 5
          : 0,
    visibility:
      observations.subjectVisibility === "clear" && observations.occlusionCount === 0
        ? 10
        : observations.subjectVisibility !== "poor" && observations.occlusionCount <= 2
          ? 5
          : 0,
    sound_wall_text:
      (observations.sourceAudioPresent && observations.soundReusable ? 5 : 0) +
      (!observations.persistentWallText || observations.wallTextReproducible ? 5 : 0),
  };
  let successPercent = Object.values(components).reduce((sum, value) => sum + value, 0);
  if (observations.durationSeconds > 15 || observations.primarySubjectCount !== 1) {
    successPercent = Math.min(successPercent, 69);
  }
  return {
    successPercent,
    verdict:
      successPercent >= 85
        ? "recommended"
        : successPercent >= 70
          ? "marginal"
          : "not_recommended",
    recommendedModel:
      observations.continuousShot && observations.primarySubjectCount === 1
        ? "kling-motion-control"
        : "seedance",
    failedCriteria: Object.entries(components)
      .filter(([, points]) => points === 0)
      .map(([name]) => name),
    evidence: observations.evidence,
    components,
    observations,
  };
}

async function generateGeminiImage(input: {
  apiUrl: string;
  apiKey?: string;
  prompt: string;
  imageUrls: string[];
}): Promise<GeneratedImageAsset> {
  const geminiKey = requiredEnvironment("GEMINI_API_KEY");
  const imageInputs = await Promise.all(
    input.imageUrls.map(async (url) => {
      const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw new Error(`Unable to fetch image input (${response.status})`);
      return {
        type: "image",
        mime_type: response.headers.get("content-type")?.split(";")[0] ?? "image/jpeg",
        data: Buffer.from(await response.arrayBuffer()).toString("base64"),
      };
    }),
  );
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/interactions",
    {
      method: "POST",
      headers: {
        "x-goog-api-key": geminiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-3.1-flash-image",
        input: [{ type: "text", text: input.prompt }, ...imageInputs],
        response_format: {
          type: "image",
          mime_type: "image/jpeg",
          aspect_ratio: "9:16",
          image_size: "1K",
        },
      }),
      signal: AbortSignal.timeout(120_000),
    },
  );
  const value: any = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(providerError("Gemini image", response, value));
  const image = [...(value.steps ?? [])]
    .reverse()
    .flatMap((step: any) => step?.type === "model_output" ? step.content ?? [] : [])
    .find((content: any) => content?.type === "image" && typeof content.data === "string");
  if (!image) throw new Error("Gemini image response did not contain an image");
  if (!input.apiKey) throw new Error("VidJutsu job credential is unavailable");
  const upload = await fetch(`${input.apiUrl.replace(/\/$/, "")}/v1/upload`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${input.apiKey}`,
      "content-type": image.mime_type ?? "image/jpeg",
    },
    body: Buffer.from(image.data, "base64"),
    signal: AbortSignal.timeout(60_000),
  });
  const uploaded: any = await upload.json().catch(() => ({}));
  if (!upload.ok || typeof uploaded.assetId !== "string" || typeof uploaded.url !== "string") {
    throw new Error(`VidJutsu image upload failed (${upload.status})`);
  }
  return {
    assetId: uploaded.assetId,
    url: uploaded.url,
    interactionId: String(value.id ?? "unknown"),
  };
}

function normalizeProviderStatus(value: unknown): MotionCloneTask["status"] {
  const status = String(value ?? "queued").toLowerCase();
  if (["completed", "succeeded", "success"].includes(status)) return "completed";
  if (["failed", "error", "cancelled", "canceled"].includes(status)) return "failed";
  if (["running", "processing", "in_progress"].includes(status)) return "processing";
  return "queued";
}

function firstOutput(value: any): string | undefined {
  const candidate = value?.outputs?.[0] ?? value?.output?.[0] ?? value?.output;
  return typeof candidate === "string" ? candidate : undefined;
}

function providerError(prefix: string, response: Response, value: any): string {
  const message =
    typeof value?.message === "string"
      ? value.message
      : typeof value?.error === "string"
        ? value.error
        : typeof value?.error?.message === "string"
          ? value.error.message
          : "provider request failed";
  return `${prefix} failed (${response.status}): ${message}`;
}

function requiredEnvironment(name: "GEMINI_API_KEY" | "WAVESPEED_API_KEY"): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export type { VidJutsuConfig };
