import { afterEach, describe, expect, test } from "bun:test";
import { createClient } from "../src/index.js";
import { createClient as createWorkstationClient } from "../src/workstation.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("social download SDK", () => {
  test("exposes typed TikTok and Instagram methods in full and workstation clients", async () => {
    const calls: Request[] = [];
    globalThis.fetch = (async (input, init) => {
      const request = input instanceof Request ? input.clone() : new Request(input, init);
      calls.push(request);
      const platform = request.url.includes("instagram") ? "instagram" : "tiktok";
      return new Response(
        JSON.stringify({
          assetId: `asset_${platform}`,
          url: `https://cdn.vidjutsu.ai/${platform}.mp4`,
          platform,
          externalId: `${platform}_post`,
          sourceUrl: `https://www.${platform}.com/post`,
          contentType: "video/mp4",
          size: 1024,
          sha256: "a".repeat(64),
          reused: false,
        }),
        { headers: { "content-type": "application/json" } },
      );
    }) as typeof fetch;

    const full = createClient({
      apiKey: "tenant-key",
      baseUrl: "https://vidjutsu.test",
    });
    const workstation = createWorkstationClient({
      apiKey: "job-key",
      baseUrl: "https://vidjutsu.test",
    });
    await full.downloadTikTokVideo({
      url: "https://www.tiktok.com/@creator/video/1",
    });
    await workstation.downloadInstagramVideo({
      url: "https://www.instagram.com/reel/example/",
    });

    expect(calls.map((call) => call.url)).toEqual([
      "https://vidjutsu.test/v1/videos/download/tiktok",
      "https://vidjutsu.test/v1/videos/download/instagram",
    ]);
  });
});
