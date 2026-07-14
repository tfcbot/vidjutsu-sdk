import type createFetchClient from "openapi-fetch";
import type { components, paths } from "./schema.js";

type FetchClient = ReturnType<typeof createFetchClient<paths>>;
type Job = components["schemas"]["DistributionJob"];
type Clip = components["schemas"]["Clip"];
type AddVideoRequest = components["schemas"]["AddVideoRequest"];
type GenerateClipsRequest = components["schemas"]["GenerateClipsRequest"];
type AddCaptionsRequest = components["schemas"]["AddCaptionsRequest"];
type AddBrollRequest = components["schemas"]["AddBrollRequest"];

export interface MutationOptions {
  idempotencyKey?: string;
}

export interface WaitOptions {
  timeoutMs?: number;
  pollIntervalMs?: number;
}

export interface DistributionNamespaces {
  videos: {
    add(body: AddVideoRequest, options?: MutationOptions): Promise<Job>;
  };
  clips: {
    generate(body: GenerateClipsRequest, options?: MutationOptions): Promise<Job>;
    addCaptions(body: AddCaptionsRequest, options?: MutationOptions): Promise<Job>;
    addBroll(body: AddBrollRequest, options?: MutationOptions): Promise<Job>;
    list(query?: { id?: string; videoId?: string }): Promise<Clip | Clip[]>;
  };
  jobs: {
    get(jobId: string): Promise<Job>;
    waitForResult(jobId: string, options?: WaitOptions): Promise<Job>;
  };
}

export function bindDistribution(client: FetchClient): DistributionNamespaces {
  const jobs = {
    async get(jobId: string): Promise<Job> {
      const result = await client.GET("/v1/distribution/jobs", {
        params: { query: { id: jobId } },
      });
      return requireData<Job>(result, "get distribution job");
    },
    async waitForResult(jobId: string, options: WaitOptions = {}): Promise<Job> {
      const timeoutMs = options.timeoutMs ?? 10 * 60_000;
      const pollIntervalMs = options.pollIntervalMs ?? 1_000;
      const deadline = Date.now() + timeoutMs;
      while (true) {
        const job = await jobs.get(jobId);
        if (job.status === "completed") return job;
        if (job.status === "failed" || job.status === "cancelled") {
          throw new Error(job.error?.message ?? `Distribution job ${job.status}`);
        }
        if (Date.now() >= deadline) throw new Error(`Timed out waiting for distribution job ${jobId}`);
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      }
    },
  };

  return {
    videos: {
      async add(body, options) {
        const result = await client.POST("/v1/videos/add", {
          body,
          params: { header: idempotencyHeader(options) },
        });
        return requireData<Job>(result, "add video");
      },
    },
    clips: {
      async generate(body, options) {
        const result = await client.POST("/v1/clips/generate", {
          body,
          params: { header: idempotencyHeader(options) },
        });
        return requireData<Job>(result, "generate clips");
      },
      async addCaptions(body, options) {
        const result = await client.POST("/v1/clips/captions", {
          body,
          params: { header: idempotencyHeader(options) },
        });
        return requireData<Job>(result, "add captions");
      },
      async addBroll(body, options) {
        const result = await client.POST("/v1/clips/broll", {
          body,
          params: { header: idempotencyHeader(options) },
        });
        return requireData<Job>(result, "add B-roll");
      },
      async list(query = {}) {
        const result = await client.GET("/v1/distribution/clips", {
          params: { query },
        });
        const payload = requireData<
          components["schemas"]["ClipResponse"] | components["schemas"]["ClipListResponse"]
        >(result, "list clips");
        return Array.isArray(payload.data) ? payload.data : payload.data;
      },
    },
    jobs,
  };
}

function idempotencyHeader(options?: MutationOptions): { "Idempotency-Key"?: string } {
  return options?.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {};
}

function requireData<T>(
  result: { data?: unknown; error?: unknown; response: Response },
  operation: string,
): T {
  if (result.data !== undefined) return result.data as T;
  const message = extractErrorMessage(result.error) ?? `Vidjutsu failed to ${operation} (HTTP ${result.response.status})`;
  throw new Error(message);
}

function extractErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  if ("message" in error && typeof error.message === "string") return error.message;
  if ("error" in error && typeof error.error === "string") return error.error;
  return undefined;
}

