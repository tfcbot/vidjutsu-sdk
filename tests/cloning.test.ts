import { afterEach, describe, expect, test } from "bun:test";
import { createClient } from "../src/index.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("cloning SDK", () => {
  test("posts a model-specific clone job with idempotency", async () => {
    const calls: Request[] = [];
    globalThis.fetch = (async (input, init) => {
      calls.push(input instanceof Request ? input.clone() : new Request(input, init));
      return response({
        jobId: "job_1",
        operation: "clone_video",
        status: "queued",
        progress: 0,
        outputs: [],
        createdAt: new Date().toISOString(),
      });
    }) as typeof fetch;

    const client = createClient({
      apiKey: "job-scoped-test-token",
      baseUrl: "https://vidjutsu.test",
    });
    const job = await client.clones.createVideo(
      {
        startingImageAssetId: "asset_start",
        source: { kind: "asset", assetId: "asset_source" },
        model: "kling-motion-control",
        cloneCheckId: "check_ready",
      },
      { idempotencyKey: "clone-job-1" },
    );

    expect(job.jobId).toBe("job_1");
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://vidjutsu.test/v1/clones/video");
    expect(calls[0]?.headers.get("idempotency-key")).toBe("clone-job-1");
    expect(await calls[0]!.json()).toMatchObject({
      model: "kling-motion-control",
      cloneCheckId: "check_ready",
    });
  });

  test("awaitJob polls until the durable job completes", async () => {
    let pollCount = 0;
    globalThis.fetch = (async () => {
      pollCount += 1;
      return response({
        jobId: "job_2",
        operation: "clone_check",
        status: pollCount === 1 ? "running" : "completed",
        progress: pollCount === 1 ? 50 : 100,
        outputs: [],
        result:
          pollCount === 1
            ? undefined
            : {
                kind: "clone_check",
                checkId: "check_1",
                score: 90,
                verdict: "recommended",
                modelRecommendation: "kling-motion-control",
                rubricVersion: "cloneability-v1",
                evidence: [],
              },
        createdAt: new Date().toISOString(),
      });
    }) as typeof fetch;

    const client = createClient({ baseUrl: "https://vidjutsu.test" });
    const job = await client.awaitJob("job_2", {
      timeoutMs: 1_000,
      pollIntervalMs: 1,
    });

    expect(job.status).toBe("completed");
    expect(pollCount).toBe(2);
  });
});
