import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { VidJutsu } from "../src/client";
import { isoTime, scheduleBody } from "../src/cli/publishing";

type Call = { url: string; method: string; body?: unknown };

function fake(answer: (call: Call) => Response = () => Response.json({})) {
  const calls: Call[] = [];
  const fetcher = (async (url: string, init: RequestInit = {}) => {
    const call = { url, method: init.method ?? "GET", body: init.body ? JSON.parse(init.body as string) : undefined };
    calls.push(call);
    return answer(call);
  }) as unknown as typeof fetch;
  return { calls, client: new VidJutsu({ apiKey: "k", baseUrl: "https://api.test", fetch: fetcher }) };
}

describe("publishing SDK", () => {
  test("each publishing operation has its method, path and body", async () => {
    const { calls, client } = fake();
    await client.connectAccount("tiktok", { return_to: "page" });
    await client.socialAccounts();
    await client.updateSocialAccount("sa_1", { approve_before_posting: true });
    await client.disconnectAccount("sa/1");
    await client.schedulePost({
      caption: "Day 1",
      media: { job_id: "j1" },
      accounts: ["sa_1", { id: "sa_2", options: { title: "Day 1", visibility: "public" } }],
      at: "2026-12-01T15:00:00.000Z",
      idempotency_key: "p1",
    });
    await client.posts({ state: "scheduled", limit: 5 });
    await client.getPost("po_1");
    await client.reschedulePost("po_1", "2026-12-02T15:00:00.000Z");
    await client.cancelPost("po_1");
    await client.approvePost("po_1");
    await client.reschedulePost("po_1", null);
    await client.postStats("po_1");
    expect(calls.map((c) => `${c.method} ${c.url.replace("https://api.test", "")}`)).toEqual([
      "POST /social-accounts/connect",
      "GET /social-accounts",
      "POST /social-accounts/sa_1",
      "DELETE /social-accounts/sa%2F1",
      "POST /posts",
      "GET /posts?state=scheduled&limit=5",
      "GET /posts/po_1",
      "POST /posts/po_1/reschedule",
      "POST /posts/po_1/cancel",
      "POST /posts/po_1/approve",
      "POST /posts/po_1/reschedule",
      "GET /posts/po_1/stats",
    ]);
    expect(calls[0]!.body).toEqual({ platform: "tiktok", return_to: "page" });
    expect(calls[2]!.body).toEqual({ approve_before_posting: true });
    expect(calls[4]!.body).toEqual({
      caption: "Day 1",
      media: { job_id: "j1" },
      accounts: ["sa_1", { id: "sa_2", options: { title: "Day 1", visibility: "public" } }],
      at: "2026-12-01T15:00:00.000Z",
      idempotency_key: "p1",
    });
    expect(calls[7]!.body).toEqual({ at: "2026-12-02T15:00:00.000Z" });
    expect(calls[8]!.body).toBeUndefined();
    expect(calls[10]!.body).toEqual({ at: null });
  });

  test("a plan without publishing points fixUrl at the upgrade link", async () => {
    const { client } = fake(() =>
      Response.json(
        { code: "upgrade_required", message: "not in your plan", reason: "not_in_plan:publish", upgrade_url: "https://checkout.stripe.com/u" },
        { status: 402 },
      ),
    );
    const error = await client.socialAccounts().catch((e) => e);
    expect(error.code).toBe("upgrade_required");
    expect(error.fixUrl).toBe("https://checkout.stripe.com/u");
  });
});

describe("publishing CLI helpers", () => {
  const fail = (message: string): never => {
    throw new Error(message);
  };
  const flag = (args: { flags: Record<string, string | true> }, name: string) => {
    const value = args.flags[name];
    return typeof value === "string" ? value : undefined;
  };
  const cli = { fail, flag };
  const args = (flags: Record<string, string>) => ({ positional: [], flags });

  test("isoTime takes ISO times only and answers in UTC", () => {
    expect(isoTime("2026-12-01T10:00:00-05:00", fail)).toBe("2026-12-01T15:00:00.000Z");
    expect(() => isoTime("tomorrow", fail)).toThrow("--at must be an ISO time");
    expect(() => isoTime("2026-12-01", fail)).toThrow("--at must be an ISO time");
    expect(() => isoTime("2026-12-01T15:00:00", fail)).toThrow("--at must be an ISO time");
  });

  test("scheduleBody builds the body from flags, with per-account options", () => {
    const dir = mkdtempSync(join(tmpdir(), "vj-post-"));
    writeFileSync(join(dir, "options.json"), JSON.stringify({ sa_2: { title: "Day 1" } }));
    writeFileSync(join(dir, "caption.txt"), "Line one\nLine two\n");
    expect(
      scheduleBody(
        args({ job: "j1", accounts: "sa_1, sa_2", "caption-file": join(dir, "caption.txt"), options: join(dir, "options.json"), at: "2026-12-01T15:00:00Z", key: "k1" }),
        cli,
      ),
    ).toEqual({
      caption: "Line one\nLine two",
      media: { job_id: "j1" },
      accounts: ["sa_1", { id: "sa_2", options: { title: "Day 1" } }],
      at: "2026-12-01T15:00:00.000Z",
      idempotency_key: "k1",
    });
    expect(scheduleBody(args({ hash: "h1", type: "image", accounts: "sa_1", at: "now" }), cli)).toEqual({
      media: { hash: "h1", type: "image" },
      accounts: ["sa_1"],
    });
  });

  test("scheduleBody refuses missing or doubled media, a bad type, no accounts and stray options", () => {
    expect(() => scheduleBody(args({ accounts: "a", caption: "c" }), cli)).toThrow("--job");
    expect(() => scheduleBody(args({ job: "j", hash: "h", accounts: "a", caption: "c" }), cli)).toThrow("one of them");
    expect(() => scheduleBody(args({ job: "j", caption: "c" }), cli)).toThrow("--accounts");
    expect(() => scheduleBody(args({ job: "j", type: "video", accounts: "a" }), cli)).toThrow("--type");
    const dir = mkdtempSync(join(tmpdir(), "vj-post-"));
    writeFileSync(join(dir, "o.json"), JSON.stringify({ other: {} }));
    expect(() => scheduleBody(args({ job: "j", accounts: "a", caption: "c", options: join(dir, "o.json") }), cli)).toThrow(
      "not in --accounts",
    );
  });
});

describe("vidjutsu accounts and post (CLI against a fake API)", () => {
  test("connect prints the link, schedule posts the body, posts lists", async () => {
    const seen: { route: string; body?: unknown }[] = [];
    const server = Bun.serve({
      port: 0,
      async fetch(request) {
        const url = new URL(request.url);
        const body = request.method === "POST" ? await request.json() : undefined;
        seen.push({ route: `${request.method} ${url.pathname}${url.search}`, body });
        if (url.pathname === "/social-accounts/connect") {
          return Response.json({ url: "https://connect.test/x", expires_at: "2026-12-01T00:00:00Z", platform: "youtube" });
        }
        if (url.pathname === "/posts" && request.method === "POST") return Response.json({ post: { id: "po_1", state: "scheduled" } }, { status: 201 });
        if (url.pathname === "/posts") return Response.json({ posts: [], next_cursor: null });
        return Response.json({ code: "not_found", message: "no" }, { status: 404 });
      },
    });
    try {
      const env = { ...process.env, VIDJUTSU_API_KEY: "vj_test", VIDJUTSU_API_URL: server.url.href.replace(/\/$/, "") };
      const cli = async (...args: string[]) => {
        const run = Bun.spawn(["bun", "run", join(import.meta.dir, "../src/cli/index.ts"), ...args], { env, stdout: "pipe", stderr: "pipe" });
        const [out, err, code] = await Promise.all([new Response(run.stdout).text(), new Response(run.stderr).text(), run.exited]);
        return { out, err, code };
      };
      const connect = await cli("accounts", "connect", "youtube", "--return-to", "page");
      expect(connect.code).toBe(0);
      expect(connect.err).toContain("https://connect.test/x");
      const scheduled = await cli("post", "schedule", "--job", "j1", "--accounts", "sa_1", "--caption", "Day 1", "--at", "2026-12-01T15:00:00Z");
      expect(scheduled.code).toBe(0);
      expect(JSON.parse(scheduled.out).post.id).toBe("po_1");
      const listed = await cli("posts", "--state", "failed");
      expect(listed.code).toBe(0);
      const bad = await cli("accounts", "connect", "x");
      expect(bad.code).toBe(1);
      expect(seen).toEqual([
        { route: "POST /social-accounts/connect", body: { platform: "youtube", return_to: "page" } },
        {
          route: "POST /posts",
          body: { caption: "Day 1", media: { job_id: "j1" }, accounts: ["sa_1"], at: "2026-12-01T15:00:00.000Z" },
        },
        { route: "GET /posts?state=failed", body: undefined },
      ]);
    } finally {
      server.stop(true);
    }
  });
});
