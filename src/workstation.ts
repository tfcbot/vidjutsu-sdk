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
 * Provider operations are routed through VidJutsu's trusted provider broker.
 * EVE-authored programs compose these typed capabilities and never receive
 * provider credentials or call provider domains directly.
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
        const generated = await providerRequest<BrokerGeneratedImage>({
          apiUrl,
          apiKey,
          body: { prompt, imageUrls: referenceImageUrls },
        });
        return await uploadGeneratedImage({ apiUrl, apiKey, generated });
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
        const generated = await providerRequest<BrokerGeneratedImage>({
          apiUrl,
          apiKey,
          body: { prompt: STARTING_IMAGE_PROMPT, imageUrls: [frameUrl, identityImageUrl] },
        });
        return await uploadGeneratedImage({ apiUrl, apiKey, generated });
      },
    },
    videos: {
      async submitMotionClone(input) {
        return await providerRequest<MotionCloneTask>({
          apiUrl,
          apiKey,
          path: "/v1/internal/workstation/providers/motion-clones",
          body: input,
        });
      },
      async getMotionClone({ providerTaskId }) {
        return await providerRequest<MotionCloneTask>({
          apiUrl,
          apiKey,
          path: "/v1/internal/workstation/providers/motion-clones/status",
          body: { providerTaskId },
        });
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

interface BrokerGeneratedImage {
  kind: "gemini_image";
  mimeType: string;
  base64Data: string;
  interactionId: string;
}

async function providerRequest<T>(input: {
  apiUrl: string;
  apiKey?: string;
  path?: string;
  body: unknown;
}): Promise<T> {
  if (!input.apiKey) throw new Error("VidJutsu job credential is unavailable");
  const path = input.path ?? "/v1/internal/workstation/providers/gemini-image";
  const response = await fetch(`${input.apiUrl.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${input.apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(input.body),
    signal: AbortSignal.timeout(120_000),
  });
  const value: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`VidJutsu provider broker failed (${response.status})`);
  }
  return value as T;
}

async function uploadGeneratedImage(input: {
  apiUrl: string;
  apiKey?: string;
  generated: BrokerGeneratedImage;
}): Promise<GeneratedImageAsset> {
  if (!input.apiKey) throw new Error("VidJutsu job credential is unavailable");
  if (!input.generated.base64Data || !input.generated.mimeType) {
    throw new Error("VidJutsu provider broker returned an invalid image");
  }
  const upload = await fetch(`${input.apiUrl.replace(/\/$/, "")}/v1/upload`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${input.apiKey}`,
      "content-type": input.generated.mimeType,
    },
    body: Buffer.from(input.generated.base64Data, "base64"),
    signal: AbortSignal.timeout(60_000),
  });
  const uploaded: unknown = await upload.json().catch(() => null);
  if (
    !upload.ok ||
    !uploaded ||
    typeof uploaded !== "object" ||
    typeof (uploaded as Record<string, unknown>).assetId !== "string" ||
    typeof (uploaded as Record<string, unknown>).url !== "string"
  ) {
    throw new Error(`VidJutsu image upload failed (${upload.status})`);
  }
  const value = uploaded as Record<string, string>;
  return {
    assetId: value.assetId,
    url: value.url,
    interactionId: input.generated.interactionId,
  };
}

export type { VidJutsuConfig };
