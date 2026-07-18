import type createFetchClient from "openapi-fetch";
import type { components, paths } from "./schema.js";
import type { MutationOptions, WaitOptions } from "./distribution.js";

type FetchClient = ReturnType<typeof createFetchClient<paths>>;
type MediaJob = components["schemas"]["MediaJob"];
type CloneCheckRequest = components["schemas"]["CloneCheckRequest"];
type CreateCharacterRequest = components["schemas"]["CreateCharacterRequest"];
type CloneStartingImageRequest = components["schemas"]["CloneStartingImageRequest"];
type CloneVideoRequest = components["schemas"]["CloneVideoRequest"];
export type CloningMutationOptions = MutationOptions & {
  idempotencyKey: string;
};

export interface CloningNamespaces {
  clones: {
    check(body: CloneCheckRequest, options: CloningMutationOptions): Promise<MediaJob>;
    createStartingImage(
      body: CloneStartingImageRequest,
      options: CloningMutationOptions,
    ): Promise<MediaJob>;
    createVideo(body: CloneVideoRequest, options: CloningMutationOptions): Promise<MediaJob>;
  };
  characters: {
    create(body: CreateCharacterRequest, options: CloningMutationOptions): Promise<MediaJob>;
  };
  mediaJobs: {
    get(jobId: string): Promise<MediaJob>;
    awaitJob(jobId: string, options?: WaitOptions): Promise<MediaJob>;
  };
  awaitJob(jobId: string, options?: WaitOptions): Promise<MediaJob>;
}

export function bindCloning(client: FetchClient): CloningNamespaces {
  const mediaJobs = {
    async get(jobId: string): Promise<MediaJob> {
      const result = await client.GET("/v1/jobs", {
        params: { query: { id: jobId } },
      });
      return requireData<MediaJob>(result, "get media job");
    },
    async awaitJob(jobId: string, options: WaitOptions = {}): Promise<MediaJob> {
      const timeoutMs = options.timeoutMs ?? 10 * 60_000;
      const pollIntervalMs = options.pollIntervalMs ?? 1_000;
      if (timeoutMs <= 0 || pollIntervalMs <= 0) {
        throw new Error("timeoutMs and pollIntervalMs must be positive");
      }
      const deadline = Date.now() + timeoutMs;
      while (true) {
        const job = await mediaJobs.get(jobId);
        if (job.status === "completed") return job;
        if (job.status === "failed" || job.status === "cancelled") {
          throw new Error(job.error?.message ?? `Media job ${job.status}`);
        }
        if (Date.now() >= deadline) {
          throw new Error(`Timed out waiting for media job ${jobId}`);
        }
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      }
    },
  };

  return {
    clones: {
      async check(body, options) {
        const result = await client.POST("/v1/clones/check", request(body, options));
        return requireData<MediaJob>(result, "check cloneability");
      },
      async createStartingImage(body, options) {
        const result = await client.POST(
          "/v1/clones/starting-image",
          request(body, options),
        );
        return requireData<MediaJob>(result, "create clone starting image");
      },
      async createVideo(body, options) {
        const result = await client.POST("/v1/clones/video", request(body, options));
        return requireData<MediaJob>(result, "clone video");
      },
    },
    characters: {
      async create(body, options) {
        const result = await client.POST("/v1/characters", request(body, options));
        return requireData<MediaJob>(result, "create character");
      },
    },
    mediaJobs,
    awaitJob: mediaJobs.awaitJob,
  };
}

function request<T>(body: T, options?: MutationOptions): any {
  return {
    body,
    params: {
      header: options?.idempotencyKey
        ? { "Idempotency-Key": options.idempotencyKey }
        : {},
    },
  };
}

function requireData<T>(
  result: { data?: unknown; error?: unknown; response: Response },
  operation: string,
): T {
  if (result.data !== undefined) return result.data as T;
  const message =
    extractErrorMessage(result.error) ??
    `VidJutsu failed to ${operation} (HTTP ${result.response.status})`;
  throw new Error(message);
}

function extractErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  if ("message" in error && typeof error.message === "string") return error.message;
  if ("error" in error && typeof error.error === "string") return error.error;
  return undefined;
}
