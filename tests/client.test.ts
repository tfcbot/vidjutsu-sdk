import { describe, expect, test } from "bun:test";
import { API_VERSION, sha256Hex, VidJutsu, VidJutsuError } from "../src/client";

type Call = { url: string; method: string; headers: Record<string, string>; body?: unknown };

function fake(answer: (call: Call) => Response) {
  const calls: Call[] = [];
  const fetcher = (async (url: string, init: RequestInit = {}) => {
    const call: Call = {
      url,
      method: init.method ?? "GET",
      headers: (init.headers ?? {}) as Record<string, string>,
      body: init.body,
    };
    calls.push(call);
    return answer(call);
  }) as unknown as typeof fetch;
  return { calls, fetcher };
}
const json = (value: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json", ...headers } });

describe("VidJutsu", () => {
  test("sends the key, JSON and idempotency key", async () => {
    const { calls, fetcher } = fake(() => json({ job_id: "j1", state: "queued" }, 202));
    const api = new VidJutsu({ apiKey: "vj_live_x", baseUrl: "https://api.test/", fetch: fetcher });
    const job = await api.render("film", { range_seconds: 10 }, "k1");
    expect(job.job_id).toBe("j1");
    expect(calls[0]!.url).toBe("https://api.test/projects/film/renders");
    expect(calls[0]!.headers.authorization).toBe("Bearer vj_live_x");
    expect(calls[0]!.headers["idempotency-key"]).toBe("k1");
    expect(calls[0]!.headers["VidJutsu-Version"]).toBe(API_VERSION);
    expect(JSON.parse(calls[0]!.body as string)).toEqual({ range_seconds: 10 });
  });

  test("errors carry the code and the link that fixes a 402", async () => {
    const { fetcher } = fake(() =>
      json({ code: "no_plan", message: "subscribe first", checkout_url: "https://checkout.stripe.com/x" }, 402),
    );
    const api = new VidJutsu({ apiKey: "k", fetch: fetcher });
    const error = await api.render("film").catch((e) => e);
    expect(error).toBeInstanceOf(VidJutsuError);
    expect(error.code).toBe("no_plan");
    expect(error.status).toBe(402);
    expect(error.fixUrl).toBe("https://checkout.stripe.com/x");
  });

  test("a pinned API version is sent instead of the default", async () => {
    const { calls, fetcher } = fake(() => json({}));
    await new VidJutsu({ fetch: fetcher, apiVersion: "2027-01-01" }).account();
    expect(calls[0]!.headers["VidJutsu-Version"]).toBe("2027-01-01");
  });

  test("a top-up sends its amount, and a 402 for credits points at the top-up link", async () => {
    const { calls, fetcher } = fake((call) =>
      call.url.endsWith("/billing/top-up")
        ? json({ url: "https://checkout.stripe.com/t" })
        : json({ code: "payment_required", message: "add credits", top_up_url: "https://checkout.stripe.com/t" }, 402),
    );
    const api = new VidJutsu({ apiKey: "k", fetch: fetcher });
    expect((await api.billingTopUp({ amount_usd: 20 })).url).toBe("https://checkout.stripe.com/t");
    expect(JSON.parse(calls[0]!.body as string)).toEqual({ amount_usd: 20 });
    const error = await api.render("film").catch((e) => e);
    expect(error.fixUrl).toBe("https://checkout.stripe.com/t");
  });

  test("path parameters are escaped", async () => {
    const { calls, fetcher } = fake(() => json({}));
    await new VidJutsu({ fetch: fetcher }).show("a/b");
    expect(calls[0]!.url).toBe("https://api.vidjutsu.ai/projects/a%2Fb");
  });

  test("upload sends each part to its link and completes with the ETags", async () => {
    const data = new Uint8Array(10).map((_, i) => i);
    const hash = await sha256Hex(data);
    const { calls, fetcher } = fake((call) => {
      if (call.url.endsWith("/uploads")) {
        return json({
          upload_id: "up_1",
          already_stored: false,
          part_size: 6,
          parts: [
            { number: 1, url: "https://r2.test/p1" },
            { number: 2, url: "https://r2.test/p2" },
          ],
        });
      }
      if (call.url.startsWith("https://r2.test/")) {
        return new Response(null, { status: 200, headers: { etag: `"e-${call.url.slice(-1)}"` } });
      }
      return json({ media: { id: "take1" }, audio: null });
    });
    const done = await new VidJutsu({ apiKey: "k", fetch: fetcher }).upload("take1.mp4", data);
    expect(done.media.id).toBe("take1");
    expect(JSON.parse(calls[0]!.body as string)).toEqual({ name: "take1.mp4", bytes: 10, sha256: hash });
    expect((calls[1]!.body as Uint8Array).byteLength).toBe(6);
    expect((calls[2]!.body as Uint8Array).byteLength).toBe(4);
    expect(calls[3]!.url).toBe("https://api.vidjutsu.ai/uploads/up_1/complete");
    expect(JSON.parse(calls[3]!.body as string)).toEqual({
      parts: [
        { number: 1, etag: '"e-1"' },
        { number: 2, etag: '"e-2"' },
      ],
    });
  });

  test("an already stored file completes with no parts", async () => {
    const { calls, fetcher } = fake((call) =>
      call.url.endsWith("/uploads")
        ? json({ upload_id: "up_2", already_stored: true, part_size: 0, parts: [] })
        : json({ media: { id: "x" }, audio: null }),
    );
    await new VidJutsu({ fetch: fetcher }).upload("x.mp4", new Uint8Array([1]));
    expect(calls).toHaveLength(2);
    expect(JSON.parse(calls[1]!.body as string)).toEqual({ parts: [] });
  });

  test("waitForRender polls until the job ends", async () => {
    const states = ["queued", "running", "succeeded"];
    const { calls, fetcher } = fake(() => json({ job_id: "j", state: states.shift() }));
    const job = await new VidJutsu({ fetch: fetcher }).waitForRender("j", { intervalMs: 1 });
    expect(job.state).toBe("succeeded");
    expect(calls).toHaveLength(3);
  });

  test("reads send their options as query parameters, leaving out unset ones", async () => {
    const { calls, fetcher } = fake(() => json({}));
    const api = new VidJutsu({ fetch: fetcher });
    await api.history("film", { limit: 5 });
    await api.searchWords("film", "hello world", { limit: 3 });
    await api.quote("film", { media: ["take1", "take2"] });
    await api.listProjects();
    await api.show("film", { revision: "r1" });
    expect(calls.map((call) => call.url)).toEqual([
      "https://api.vidjutsu.ai/projects/film/history?limit=5",
      "https://api.vidjutsu.ai/projects/film/words?query=hello+world&limit=3",
      "https://api.vidjutsu.ai/projects/film/quote?media=take1%2Ctake2",
      "https://api.vidjutsu.ai/projects",
      "https://api.vidjutsu.ai/projects/film?revision=r1",
    ]);
  });

  test("undo, shot list edits and layouts send the bodies the API takes", async () => {
    const { calls, fetcher } = fake(() => json({}));
    const api = new VidJutsu({ fetch: fetcher, clientName: "Test Agent" });
    await api.undo("film", "r9", { change: 2, expected_head: "r10" });
    await api.shotListEdit("film", 3, [{ op: "add_scene", title: "Intro" }], "k2");
    await api.applyLayout("film", "circle_corner", { from: "12.5", to: 30 });
    await api.studioSound("film", { media: ["take1-audio"] });
    expect(calls[0]!.url).toBe("https://api.vidjutsu.ai/projects/film/undo");
    expect(JSON.parse(calls[0]!.body as string)).toEqual({ revision: "r9", change: 2, expected_head: "r10" });
    expect(calls[0]!.headers["VidJutsu-Client"]).toBe("Test Agent");
    expect(calls[1]!.url).toBe("https://api.vidjutsu.ai/projects/film/shot-list/edits");
    expect(JSON.parse(calls[1]!.body as string)).toEqual({
      expected_revision: 3,
      operations: [{ op: "add_scene", title: "Intro" }],
    });
    expect(calls[1]!.headers["idempotency-key"]).toBe("k2");
    expect(calls[2]!.url).toBe("https://api.vidjutsu.ai/projects/film/layout");
    expect(JSON.parse(calls[2]!.body as string)).toEqual({ preset: "circle_corner", from: "12.5", to: 30 });
    expect(calls[3]!.url).toBe("https://api.vidjutsu.ai/projects/film/studio-sound");
  });

  test("stream yields the project's events and resumes from the last notice", async () => {
    const bodies = [
      'event: ready\ndata: {"last_seq":4}\n\n: keep-alive\n\nid: 5\nevent: revision\ndata: {"seq":5,\ndata: "by":"Max"}\n\nretry: 1\n\n',
      "event: presence\ndata: []\n\n",
    ];
    const { calls, fetcher } = fake(() => new Response(bodies.shift() ?? "", { headers: { "content-type": "text/event-stream" } }));
    const api = new VidJutsu({ fetch: fetcher });
    const seen = [];
    for await (const event of api.stream("film")) {
      seen.push(event);
      if (seen.length === 3) break;
    }
    expect(seen).toEqual([
      { event: "ready", data: { last_seq: 4 } },
      { event: "revision", id: "5", data: { seq: 5, by: "Max" } },
      { event: "presence", data: [] },
    ]);
    expect(calls[0]!.headers.accept).toBe("text/event-stream");
    expect(calls[1]!.headers["last-event-id"]).toBe("5");
  });

  test("a refused stream throws the API's error", async () => {
    const { fetcher } = fake(() => json({ code: "not_found", message: "No such project." }, 404));
    const error = await (async () => {
      for await (const _ of new VidJutsu({ fetch: fetcher }).stream("nope")) void _;
    })().catch((e) => e);
    expect(error).toBeInstanceOf(VidJutsuError);
    expect(error.code).toBe("not_found");
  });

  test("captions reads the cut's captions in the chosen format", async () => {
    const { calls, fetcher } = fake(() => json({ format: "vtt", name: "film.vtt", file: "WEBVTT\n" }));
    const result = await new VidJutsu({ fetch: fetcher }).captions("film", { format: "vtt" });
    expect(result.file).toBe("WEBVTT\n");
    expect(calls[0]!.url).toBe("https://api.vidjutsu.ai/projects/film/captions?format=vtt");
  });
});
