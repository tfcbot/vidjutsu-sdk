import type createFetchClient from "openapi-fetch";
import type { components, paths } from "./schema.js";

type FetchClient = ReturnType<typeof createFetchClient<paths>>;
type Job = components["schemas"]["DistributionJob"];
type AddVideoRequest = components["schemas"]["AddVideoRequest"];

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
