import { afterEach, describe, expect, test } from "bun:test";
import { createClient } from "../src/client.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("upload convenience method", () => {
  test("sends raw bytes with an octet-stream content type", async () => {
    const bytes = new TextEncoder().encode("video-bytes").buffer;
    globalThis.fetch = (async (input, init) => {
      const request = input instanceof Request ? input : new Request(input, init);
      expect(request.url).toBe("https://vidjutsu.test/v1/upload");
      expect(request.headers.get("content-type")).toBe("application/octet-stream");
      expect(new Uint8Array(await request.arrayBuffer())).toEqual(new Uint8Array(bytes));
      return new Response(JSON.stringify({ assetId: "asset_1", url: "https://cdn.test/video.mp4", key: "video.mp4", size: 11 }), {
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;

    const client = createClient({ apiKey: "test", baseUrl: "https://vidjutsu.test" });
    const { data } = await client.uploadFile(bytes);
    expect(data?.assetId).toBe("asset_1");
  });
});
