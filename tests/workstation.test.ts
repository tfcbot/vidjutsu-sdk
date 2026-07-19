import { afterEach, describe, expect, test } from "bun:test";
import { createWorkstationClient } from "../src/workstation.js";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("typed workstation capabilities", () => {
  test("clone check applies the deterministic rubric to watch observations", async () => {
    globalThis.fetch = (async () =>
      Response.json({
        response: {
          durationSeconds: 8.5,
          primarySubjectCount: 1,
          shotCount: 1,
          continuousShot: true,
          motionComplexity: "low",
          propCount: 1,
          interactionComplexity: "low",
          subjectVisibility: "clear",
          occlusionCount: 0,
          persistentWallText: true,
          wallTextReproducible: true,
          sourceAudioPresent: true,
          soundReusable: true,
          evidence: [
            {
              criterion: "full_video",
              observation: "One visible subject for the full clip.",
              timestamps: [0, 8.5],
            },
          ],
        },
      })) as typeof fetch;

    const client = createWorkstationClient({
      baseUrl: "https://api.test",
      apiKey: "job-key",
    });
    const result = await client.analysis.cloneCheck({
      mediaUrl: "https://cdn.test/source.mp4",
    });

    expect(result.successPercent).toBe(100);
    expect(result.verdict).toBe("recommended");
    expect(result.recommendedModel).toBe("kling-motion-control");
  });

  test("motion submission uses the typed VidJutsu broker instead of a provider domain", async () => {
    let requestBody: any;
    let requestUrl = "";
    globalThis.fetch = (async (input, init) => {
      requestUrl = String(input);
      requestBody = JSON.parse(String(init?.body));
      return Response.json({
        providerTaskId: "prediction_1",
        status: "queued",
      });
    }) as typeof fetch;

    const client = createWorkstationClient({
      baseUrl: "https://api.test",
      apiKey: "job-key",
    });
    const task = await client.videos.submitMotionClone({
      model: "seedance",
      sourceVideoUrl: "https://cdn.test/source.mp4",
      startingImageUrl: "https://cdn.test/start.jpg",
    });

    expect(requestUrl).toBe("https://api.test/v1/internal/workstation/providers/motion-clones");
    expect(requestBody).toEqual({
      model: "seedance",
      sourceVideoUrl: "https://cdn.test/source.mp4",
      startingImageUrl: "https://cdn.test/start.jpg",
    });
    expect(task).toMatchObject({
      providerTaskId: "prediction_1",
      status: "queued",
    });
  });

  test("Kling remains a typed broker selection with no provider credentials", async () => {
    let requestBody: any;
    let requestUrl = "";
    globalThis.fetch = (async (input, init) => {
      requestUrl = String(input);
      requestBody = JSON.parse(String(init?.body));
      return Response.json({ providerTaskId: "prediction_2", status: "queued" });
    }) as typeof fetch;

    const client = createWorkstationClient({
      baseUrl: "https://api.test",
      apiKey: "job-key",
    });
    await client.videos.submitMotionClone({
      model: "kling-motion-control",
      sourceVideoUrl: "https://cdn.test/source.mp4",
      startingImageUrl: "https://cdn.test/start.jpg",
    });

    expect(requestUrl).toBe("https://api.test/v1/internal/workstation/providers/motion-clones");
    expect(requestBody).toEqual({
      model: "kling-motion-control",
      sourceVideoUrl: "https://cdn.test/source.mp4",
      startingImageUrl: "https://cdn.test/start.jpg",
    });
  });
});
