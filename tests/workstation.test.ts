import { afterEach, describe, expect, test } from "bun:test";
import { createWorkstationClient } from "../src/workstation.js";

const originalFetch = globalThis.fetch;
const originalWaveSpeedKey = process.env.WAVESPEED_API_KEY;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalWaveSpeedKey === undefined) {
    delete process.env.WAVESPEED_API_KEY;
  } else {
    process.env.WAVESPEED_API_KEY = originalWaveSpeedKey;
  }
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

  test("Seedance submission is fixed to 480p and preserves the chosen model", async () => {
    process.env.WAVESPEED_API_KEY = "test-provider-key";
    let requestBody: any;
    let requestUrl = "";
    globalThis.fetch = (async (input, init) => {
      requestUrl = String(input);
      requestBody = JSON.parse(String(init?.body));
      return Response.json({
        data: {
          id: "prediction_1",
          status: "queued",
          urls: { get: "https://api.wavespeed.ai/status/prediction_1" },
        },
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

    expect(requestUrl).toContain("bytedance/seedance-2.0/video-edit");
    expect(requestBody.resolution).toBe("480p");
    expect(requestBody.reference_images).toEqual(["https://cdn.test/start.jpg"]);
    expect(task).toMatchObject({
      providerTaskId: "prediction_1",
      status: "queued",
    });
  });

  test("Kling submission does not send or imply a resolution transform", async () => {
    process.env.WAVESPEED_API_KEY = "test-provider-key";
    let requestBody: any;
    globalThis.fetch = (async (_input, init) => {
      requestBody = JSON.parse(String(init?.body));
      return Response.json({
        data: { id: "prediction_2", status: "created" },
      });
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

    expect(requestBody.resolution).toBeUndefined();
    expect(requestBody).toEqual({
      image: "https://cdn.test/start.jpg",
      video: "https://cdn.test/source.mp4",
      character_orientation: "video",
      keep_original_sound: true,
    });
  });
});
