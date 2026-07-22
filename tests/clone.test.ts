import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { runCommand } from "citty";
import cloneCommand from "../src/cli/commands/clone.js";

const originalFetch = globalThis.fetch;
const originalExit = process.exit;

beforeEach(() => {
  process.env.VIDJUTSU_API_KEY = "test-key";
  process.env.VIDJUTSU_API_URL = "https://vidjutsu.test";
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  process.exit = originalExit;
  delete process.env.VIDJUTSU_API_KEY;
  delete process.env.VIDJUTSU_API_URL;
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function mockExit(): { calls: number[] } {
  const state = { calls: [] as number[] };
  process.exit = ((code?: number) => {
    state.calls.push(code ?? 0);
    throw new Error(`__process_exit_${code}__`);
  }) as typeof process.exit;
  return state;
}

describe("clone check", () => {
  test("exits nonzero when verdict is weak", async () => {
    globalThis.fetch = (async () =>
      jsonResponse({
        verdict: "weak",
        score: 12,
        evidence: ["heavy motion blur throughout", "face occluded in most frames"],
        model: "gemini-clone-check",
      })) as typeof fetch;

    const exit = mockExit();

    await expect(
      runCommand(cloneCommand, {
        rawArgs: ["check", "https://cdn.vidjutsu.ai/staged/clip.mp4"],
      }),
    ).rejects.toThrow();

    expect(exit.calls).toEqual([1]);
  });

  test("does not exit nonzero when verdict is strong", async () => {
    globalThis.fetch = (async () =>
      jsonResponse({
        verdict: "strong",
        score: 95,
        evidence: ["single subject, stable framing", "clear unobstructed face"],
        model: "gemini-clone-check",
      })) as typeof fetch;

    const exit = mockExit();

    await runCommand(cloneCommand, {
      rawArgs: ["check", "https://cdn.vidjutsu.ai/staged/clip.mp4"],
    });

    expect(exit.calls).toEqual([]);
  });

  test("http:// URL surfaces the API 400", async () => {
    globalThis.fetch = (async () =>
      jsonResponse(
        { error: "invalid_request", message: "videoUrl must use https" },
        400,
      )) as typeof fetch;

    await expect(
      runCommand(cloneCommand, {
        rawArgs: ["check", "http://cdn.vidjutsu.ai/staged/clip.mp4"],
      }),
    ).rejects.toThrow("videoUrl must use https");
  });
});

describe("clone run", () => {
  test("with --character chains download -> check -> starting-image -> video -> poll, using the character id (no createCharacter call)", async () => {
    const calls: string[] = [];

    globalThis.fetch = (async (input, init) => {
      const request = input instanceof Request ? input.clone() : new Request(input, init);
      calls.push(request.url);

      if (request.url.endsWith("/v1/videos/download/tiktok")) {
        return jsonResponse({
          assetId: "asset_tiktok",
          url: "https://cdn.vidjutsu.ai/staged/source.mp4",
          platform: "tiktok",
          externalId: "tiktok_post",
          sourceUrl: "https://www.tiktok.com/@creator/video/1",
          contentType: "video/mp4",
          size: 1024,
          sha256: "a".repeat(64),
          reused: false,
        });
      }
      if (request.url.endsWith("/v1/clones/check")) {
        return jsonResponse({
          verdict: "strong",
          score: 95,
          evidence: ["single subject, stable framing", "clear unobstructed face"],
          model: "gemini-clone-check",
        });
      }
      if (request.url.endsWith("/v1/characters")) {
        throw new Error("clone run must not create a new character when --character is given");
      }
      if (request.url.endsWith("/v1/extract")) {
        const body = init?.body ? JSON.parse(init.body as string) : {};
        expect(body).toEqual({
          mediaUrl: "https://cdn.vidjutsu.ai/staged/source.mp4",
          frames: [0],
          audio: false,
          metadata: false,
        });
        return jsonResponse({
          frames: [{ index: 0, url: "https://cdn.vidjutsu.ai/staged/first-frame.png" }],
        });
      }
      if (request.url.endsWith("/v1/clones/starting-image")) {
        const body = init?.body ? JSON.parse(init.body as string) : {};
        expect(body).toEqual({
          firstFrame: "https://cdn.vidjutsu.ai/staged/first-frame.png",
          characterId: "char_abc123",
          prompt: "Match the framing and pose of the source video's opening frame",
        });
        return jsonResponse({
          imageUrl: "https://cdn.vidjutsu.ai/staged/starting-frame.png",
          model: "nano-banana",
        });
      }
      if (request.url.endsWith("/v1/clones/video")) {
        const body = init?.body ? JSON.parse(init.body as string) : {};
        expect(body).toEqual({
          startingImageUrl: "https://cdn.vidjutsu.ai/staged/starting-frame.png",
          sourceVideoUrl: "https://cdn.vidjutsu.ai/staged/source.mp4",
          model: "kling",
        });
        return jsonResponse({ id: "clone_task_1", status: "processing" }, 202);
      }
      if (request.url.includes("/v1/clones/video/")) {
        return jsonResponse({
          id: "clone_task_1",
          status: "completed",
          videoUrl: "https://d2h7xmz5gqybh9.cloudfront.net/clone_task_1.mp4",
        });
      }
      throw new Error(`Unexpected request: ${request.url}`);
    }) as typeof fetch;

    await runCommand(cloneCommand, {
      rawArgs: ["run", "https://www.tiktok.com/@creator/video/1", "--character", "char_abc123"],
    });

    expect(calls).toEqual([
      "https://vidjutsu.test/v1/videos/download/tiktok",
      "https://vidjutsu.test/v1/clones/check",
      "https://vidjutsu.test/v1/extract",
      "https://vidjutsu.test/v1/clones/starting-image",
      "https://vidjutsu.test/v1/clones/video",
      "https://vidjutsu.test/v1/clones/video/clone_task_1",
    ]);
  });

  test("without --character exits nonzero and makes no requests", async () => {
    globalThis.fetch = (async () => {
      throw new Error("no request should be made without --character");
    }) as typeof fetch;

    const exit = mockExit();

    await expect(
      runCommand(cloneCommand, {
        rawArgs: ["run", "https://www.tiktok.com/@creator/video/1"],
      }),
    ).rejects.toThrow();

    expect(exit.calls).toEqual([1]);
  });

  test("stops before generating when verdict is weak, unless --force", async () => {
    const calls: string[] = [];

    globalThis.fetch = (async (input, init) => {
      const request = input instanceof Request ? input.clone() : new Request(input, init);
      calls.push(request.url);

      if (request.url.endsWith("/v1/videos/download/tiktok")) {
        return jsonResponse({
          assetId: "asset_tiktok",
          url: "https://cdn.vidjutsu.ai/staged/source.mp4",
          platform: "tiktok",
          externalId: "tiktok_post",
          sourceUrl: "https://www.tiktok.com/@creator/video/1",
          contentType: "video/mp4",
          size: 1024,
          sha256: "a".repeat(64),
          reused: false,
        });
      }
      if (request.url.endsWith("/v1/clones/check")) {
        return jsonResponse({
          verdict: "weak",
          score: 8,
          evidence: ["multiple subjects", "rapid cuts"],
          model: "gemini-clone-check",
        });
      }
      throw new Error(`Unexpected request beyond check: ${request.url}`);
    }) as typeof fetch;

    const exit = mockExit();

    await expect(
      runCommand(cloneCommand, {
        rawArgs: ["run", "https://www.tiktok.com/@creator/video/1", "--character", "char_abc123"],
      }),
    ).rejects.toThrow();

    expect(exit.calls).toEqual([1]);
    expect(calls).toEqual([
      "https://vidjutsu.test/v1/videos/download/tiktok",
      "https://vidjutsu.test/v1/clones/check",
    ]);
  });
});

describe("clone request contracts", () => {
  test("starting-image sends only firstFrame, characterId, and prompt", async () => {
    globalThis.fetch = (async (input, init) => {
      const request = input instanceof Request ? input.clone() : new Request(input, init);
      expect(request.url).toBe("https://vidjutsu.test/v1/clones/starting-image");
      expect(init?.body ? JSON.parse(init.body as string) : {}).toEqual({
        firstFrame: "https://cdn.vidjutsu.ai/frame.png",
        characterId: "char_genz",
        prompt: "Preserve pose and framing",
      });
      return jsonResponse({ imageUrl: "https://cdn.vidjutsu.ai/starting.png", model: "gemini" });
    }) as typeof fetch;

    await runCommand(cloneCommand, {
      rawArgs: [
        "starting-image",
        "--first-frame", "https://cdn.vidjutsu.ai/frame.png",
        "--character", "char_genz",
        "--prompt", "Preserve pose and framing",
      ],
    });
  });

  test("rejects Seedance before making a provider request", async () => {
    globalThis.fetch = (async () => {
      throw new Error("no request expected");
    }) as typeof fetch;

    await expect(runCommand(cloneCommand, {
      rawArgs: [
        "video",
        "--starting-image", "https://cdn.vidjutsu.ai/starting.png",
        "--source", "https://cdn.vidjutsu.ai/source.mp4",
        "--model", "seedance",
      ],
    })).rejects.toThrow("--model must be one of: kling");
  });
});

describe("clone character list", () => {
  test("prints ids, model, createdAt from an array response", async () => {
    globalThis.fetch = (async () =>
      jsonResponse([
        { id: "char_abc123", model: "nano-banana", createdAt: "2026-07-01T00:00:00.000Z" },
        { id: "char_def456", model: "nano-banana", createdAt: "2026-07-02T00:00:00.000Z" },
      ])) as typeof fetch;

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (msg: string) => logs.push(msg);

    try {
      await runCommand(cloneCommand, { rawArgs: ["character", "list"] });
    } finally {
      console.log = originalLog;
    }

    expect(logs.some((l) => l.includes("char_abc123"))).toBe(true);
    expect(logs.some((l) => l.includes("char_def456"))).toBe(true);
  });

  test("prints ids from a wrapped { characters: [...] } response", async () => {
    globalThis.fetch = (async () =>
      jsonResponse({
        characters: [{ id: "char_wrapped", model: "nano-banana", createdAt: "2026-07-03T00:00:00.000Z" }],
      })) as typeof fetch;

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (msg: string) => logs.push(msg);

    try {
      await runCommand(cloneCommand, { rawArgs: ["character", "list"] });
    } finally {
      console.log = originalLog;
    }

    expect(logs.some((l) => l.includes("char_wrapped"))).toBe(true);
  });
});
