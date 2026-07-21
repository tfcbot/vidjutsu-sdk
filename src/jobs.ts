import type createFetchClient from "openapi-fetch";
import type { components, paths } from "./schema.js";
import type { WaitOptions } from "./distribution.js";

type FetchClient = ReturnType<typeof createFetchClient<paths>>;
type MediaJob = components["schemas"]["MediaJob"];

export interface JobsNamespaces {
  mediaJobs: {
    get(jobId: string): Promise<MediaJob>;
    awaitJob(jobId: string, options?: WaitOptions): Promise<MediaJob>;
  };
  awaitJob(jobId: string, options?: WaitOptions): Promise<MediaJob>;
}

export function bindJobs(client: FetchClient): JobsNamespaces {
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
    mediaJobs,
    awaitJob: mediaJobs.awaitJob,
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
