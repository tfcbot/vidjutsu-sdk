import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkScenes, planPush, readFolder, safeJoin } from "../src/cli/graphics";
import { GRAPHICS_INLINE_TOTAL, graphicsText, sha256Hex, VidJutsu } from "../src/client";

type Call = { url: string; method: string; headers: Record<string, string>; body?: unknown };

function fake(answer: (call: Call) => Response) {
  const calls: Call[] = [];
  const fetcher = (async (url: string, init: RequestInit = {}) => {
    const call: Call = { url, method: init.method ?? "GET", headers: (init.headers ?? {}) as Record<string, string>, body: init.body };
    calls.push(call);
    return answer(call);
  }) as unknown as typeof fetch;
  return { calls, fetcher };
}
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
const bytes = (text: string) => new TextEncoder().encode(text);
const body = (call: Call) => JSON.parse(call.body as string);

describe("graphics SDK", () => {
  test("each graphics route has its method, path and body", async () => {
    const { calls, fetcher } = fake(() => json({ bundle: "gb_1", missing: [], files: [], job_id: "g1", state: "queued" }));
    const api = new VidJutsu({ apiKey: "k", baseUrl: "https://api.test", fetch: fetcher });
    await api.graphicsFiles([{ path: "a/index.html", bytes: 2, sha256: "x" }]);
    await api.graphicsSource("gb_1");
    await api.graphicsList("my ws");
    await api.graphicsRead("ws", "intro/index.html");
    await api.graphicsWrite("ws", { patch: [{ path: "a.js", find: "1", replace: "2" }], expected_bundle: "gb_1" });
    await api.makeGraphics({ film: { width: 1920, height: 1080, scenes: [{ seconds: 3 }] }, bundle: "gb_1" }, "key1");
    await api.graphicsStatus("g1");
    await api.cancelGraphics("g1");
    expect(calls.map((c) => `${c.method} ${c.url.replace("https://api.test", "")}`)).toEqual([
      "POST /graphics/files",
      "GET /graphics/bundles/gb_1",
      "GET /graphics/workspaces/my%20ws",
      "GET /graphics/workspaces/ws/file?path=intro%2Findex.html",
      "POST /graphics/workspaces/ws",
      "POST /graphics",
      "GET /graphics/g1",
      "POST /graphics/g1/cancel",
    ]);
    expect(body(calls[4]!)).toEqual({ patch: [{ path: "a.js", find: "1", replace: "2" }], expected_bundle: "gb_1" });
    expect(body(calls[5]!)).toEqual({
      film: { width: 1920, height: 1080, scenes: [{ seconds: 3 }] },
      bundle: "gb_1",
      idempotency_key: "key1",
    });
    expect(calls[5]!.headers["idempotency-key"]).toBe("key1");
  });

  test("text files are detected by extension and UTF-8", () => {
    expect(graphicsText("a/index.html", bytes("<p>hi</p>"))).toBe("<p>hi</p>");
    expect(graphicsText("a/logo.png", bytes("png"))).toBeUndefined();
    expect(graphicsText("a/bad.js", new Uint8Array([0xff, 0xfe, 0x00]))).toBeUndefined();
    expect(graphicsText("big.js", new Uint8Array(256 * 1024 + 1).fill(97))).toBeUndefined();
  });

  test("uploadGraphics sends text inline and PUTs the rest", async () => {
    const png = new Uint8Array([137, 80, 78, 71]);
    const pngHash = await sha256Hex(png);
    const { calls, fetcher } = fake((call) => {
      if (call.url.endsWith("/graphics/files")) {
        return json({
          bundle: "gb_abc",
          files: 2,
          bytes: 13,
          stored_inline: 1,
          expires_at: 1,
          missing: [{ sha256: pngHash, bytes: 4, paths: ["intro/logo.png"], put_url: "https://r2.test/put/logo" }],
        });
      }
      return new Response(null, { status: 200 });
    });
    const api = new VidJutsu({ apiKey: "k", fetch: fetcher });
    const result = await api.uploadGraphics([
      { path: "intro/index.html", data: bytes("<p>hi</p>") },
      { path: "intro/logo.png", data: png },
    ]);
    expect(result.bundle).toBe("gb_abc");
    const sent = body(calls[0]!).files;
    expect(sent[0]).toEqual({ path: "intro/index.html", bytes: 9, sha256: await sha256Hex(bytes("<p>hi</p>")), text: "<p>hi</p>" });
    expect(sent[1]).toEqual({ path: "intro/logo.png", bytes: 4, sha256: pngHash });
    expect(calls[1]!.url).toBe("https://r2.test/put/logo");
    expect(calls[1]!.method).toBe("PUT");
    expect(calls[1]!.headers.authorization).toBeUndefined();
  });

  test("inline text stops at 2 MB per call; the rest goes by link", async () => {
    const big = (n: number) => new Uint8Array(200 * 1024).fill(97 + n);
    const files = Array.from({ length: 12 }, (_, i) => ({ path: `s/f${i}.js`, data: big(i) }));
    const { calls, fetcher } = fake(() => json({ bundle: "gb_1", missing: [] }));
    await new VidJutsu({ fetch: fetcher }).uploadGraphics(files);
    const sent = body(calls[0]!).files as { text?: string; bytes: number }[];
    const inline = sent.filter((f) => f.text !== undefined).reduce((n, f) => n + f.bytes, 0);
    expect(inline).toBeLessThanOrEqual(GRAPHICS_INLINE_TOTAL);
    expect(sent.filter((f) => f.text === undefined).length).toBe(2);
  });

  test("renderGraphics uploads, starts the job and polls it to the end", async () => {
    let polls = 0;
    const { calls, fetcher } = fake((call) => {
      if (call.url.endsWith("/graphics/files")) return json({ bundle: "gb_9", missing: [] });
      if (call.url.endsWith("/graphics")) return json({ job_id: "g9", state: "queued" }, 202);
      polls++;
      return json({ job_id: "g9", state: polls < 2 ? "running" : "succeeded", output: { media: { id: "graphics" } } });
    });
    const job = await new VidJutsu({ fetch: fetcher }).renderGraphics(
      [{ path: "index.html", data: bytes("<p>x</p>") }],
      { width: 1280, height: 720, scenes: [{ seconds: 2 }] },
      { name: "title", intervalMs: 1 },
    );
    expect(job.state).toBe("succeeded");
    expect(body(calls[1]!)).toEqual({ film: { width: 1280, height: 720, scenes: [{ seconds: 2 }] }, bundle: "gb_9", name: "title" });
    expect(calls.at(-1)!.url).toBe("https://api.vidjutsu.ai/graphics/g9");
  });
});

describe("graphics CLI helpers", () => {
  test("readFolder lists files with / paths and leaves out dot files", () => {
    const root = mkdtempSync(join(tmpdir(), "vjg-"));
    mkdirSync(join(root, "intro", "img"), { recursive: true });
    mkdirSync(join(root, ".git"));
    writeFileSync(join(root, "film.json"), "{}");
    writeFileSync(join(root, "intro", "index.html"), "<p>");
    writeFileSync(join(root, "intro", "img", "a.png"), "png");
    writeFileSync(join(root, "intro", ".DS_Store"), "x");
    writeFileSync(join(root, ".git", "HEAD"), "x");
    expect(readFolder(root).map((f) => f.path)).toEqual(["film.json", "intro/img/a.png", "intro/index.html"]);
  });

  test("checkScenes finds missing entry pages and bad lengths", () => {
    const paths = new Set(["intro/index.html", "outro/main.html"]);
    expect(
      checkScenes({ width: 1920, height: 1080, scenes: [{ dir: "intro", seconds: 3 }, { dir: "outro/", entry: "main.html", seconds: 2 }] }, paths),
    ).toEqual([]);
    expect(checkScenes({ width: 1920, height: 1080, scenes: [{ dir: "mid", seconds: 0 }] }, paths)).toEqual([
      "scene 1: mid/index.html is not in the folder",
      "scene 1: seconds must be above 0",
    ]);
  });

  test("planPush writes changed text, sends other files by hash, deletes the rest, 200 changes a write", async () => {
    const same = bytes("same");
    const remote = new Map([
      ["keep.html", await sha256Hex(same)],
      ["old.html", "0".repeat(64)],
      ["gone.css", "1".repeat(64)],
    ]);
    const local = [
      { path: "keep.html", data: same },
      { path: "old.html", data: bytes("new") },
      { path: "logo.png", data: new Uint8Array([1, 2]) },
    ];
    const plan = await planPush(local, remote, false);
    expect(plan.changed).toBe(3);
    expect(plan.writes).toEqual([
      {
        delete: ["gone.css"],
        write: [{ path: "old.html", text: "new" }],
        files: [{ path: "logo.png", sha256: await sha256Hex(new Uint8Array([1, 2])), bytes: 2 }],
      },
    ]);
    expect((await planPush(local, remote, true)).writes[0]!.delete).toBeUndefined();
    const many = Array.from({ length: 450 }, (_, i) => ({ path: `f${i}.js`, data: bytes(String(i)) }));
    expect((await planPush(many, new Map(), false)).writes.map((w) => w.write!.length)).toEqual([200, 200, 50]);
  });

  test("safeJoin refuses paths that leave the folder", () => {
    expect(safeJoin("/tmp/x", "a/b.html")).toBe("/tmp/x/a/b.html");
    expect(() => safeJoin("/tmp/x", "../evil")).toThrow();
    expect(() => safeJoin("/tmp/x", "a/../../evil")).toThrow();
    expect(() => safeJoin("/tmp/x", "/etc/passwd")).toThrow();
  });
});

describe("vidjutsu graphics (CLI against a fake API)", () => {
  test("render uploads the folder, renders and prints the media; ws push/pull round-trip", async () => {
    const store = new Map<string, Uint8Array>();
    const workspaces = new Map<string, { bundle: string; files: { path: string; bytes: number; sha256: string }[] }>();
    const seen: string[] = [];
    let server: ReturnType<typeof Bun.serve>;
    const bundleOf = async (files: { path: string; bytes: number; sha256: string }[]) => {
      const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));
      const id = `gb_${(await sha256Hex(bytes(JSON.stringify(sorted)))).slice(0, 32)}`;
      const missing = sorted
        .filter((f) => !store.has(f.sha256))
        .map((f) => ({ sha256: f.sha256, bytes: f.bytes, paths: [f.path], put_url: `${server.url}put/${f.sha256}` }));
      return { id, sorted, missing };
    };
    server = Bun.serve({
      port: 0,
      async fetch(request) {
        const url = new URL(request.url);
        seen.push(`${request.method} ${url.pathname}`);
        if (request.method === "PUT" && url.pathname.startsWith("/put/")) {
          store.set(url.pathname.slice(5), new Uint8Array(await request.arrayBuffer()));
          return new Response(null);
        }
        if (url.pathname.startsWith("/get/")) return new Response(store.get(url.pathname.slice(5)));
        if (request.headers.get("authorization") !== "Bearer vj_test") return Response.json({ code: "unauthorized" }, { status: 401 });
        if (url.pathname === "/graphics/files") {
          const { files } = (await request.json()) as { files: { path: string; bytes: number; sha256: string; text?: string }[] };
          for (const f of files) if (f.text !== undefined) store.set(f.sha256, bytes(f.text));
          const { id, missing } = await bundleOf(files);
          return Response.json({ bundle: id, files: files.length, bytes: 0, stored_inline: 0, missing, expires_at: 0 });
        }
        if (url.pathname === "/graphics" && request.method === "POST") {
          const sent = (await request.json()) as { bundle?: string; film: unknown };
          return Response.json({ job_id: "g1", state: "queued", sent }, { status: 202 });
        }
        if (url.pathname === "/graphics/g1") {
          return Response.json({ job_id: "g1", state: "succeeded", output: { media: { id: "title", asset_hash: "h".repeat(64) } } });
        }
        const ws = url.pathname.match(/^\/graphics\/workspaces\/([^/]+)$/)?.[1];
        if (ws && request.method === "GET") {
          const current = workspaces.get(ws);
          return Response.json({ workspace: ws, bundle: current?.bundle ?? null, version: 1, files: current?.files ?? [], history: [] });
        }
        if (ws && request.method === "POST") {
          const change = (await request.json()) as {
            write?: { path: string; text: string }[];
            files?: { path: string; bytes: number; sha256: string }[];
            delete?: string[];
            expected_bundle?: string;
          };
          const current = workspaces.get(ws);
          if (current && change.expected_bundle !== current.bundle) return Response.json({ code: "conflict" }, { status: 409 });
          const files = new Map((current?.files ?? []).map((f) => [f.path, f]));
          for (const path of change.delete ?? []) files.delete(path);
          for (const w of change.write ?? []) {
            const data = bytes(w.text);
            const sha256 = await sha256Hex(data);
            store.set(sha256, data);
            files.set(w.path, { path: w.path, bytes: data.byteLength, sha256 });
          }
          for (const f of change.files ?? []) files.set(f.path, f);
          const { id, sorted, missing } = await bundleOf([...files.values()]);
          workspaces.set(ws, { bundle: id, files: sorted });
          return Response.json({ bundle: id, files: sorted.length, bytes: 0, stored_inline: 0, missing, expires_at: 0, workspace: ws });
        }
        const bundle = url.pathname.match(/^\/graphics\/bundles\/(.+)$/)?.[1];
        if (bundle) {
          const found = [...workspaces.values()].find((w) => w.bundle === bundle)!;
          return Response.json({ bundle, expires_at: 0, files: found.files.map((f) => ({ ...f, url: `${server.url}get/${f.sha256}` })) });
        }
        return Response.json({ code: "not_found" }, { status: 404 });
      },
    });
    try {
      const root = mkdtempSync(join(tmpdir(), "vjfilm-"));
      mkdirSync(join(root, "intro"));
      writeFileSync(join(root, "film.json"), JSON.stringify({ width: 1920, height: 1080, scenes: [{ dir: "intro", seconds: 3 }] }));
      writeFileSync(join(root, "intro", "index.html"), "<script>window.render=t=>{}</script>");
      writeFileSync(join(root, "intro", "logo.png"), new Uint8Array([137, 80, 78, 71, 0, 1]));
      const env = { ...process.env, VIDJUTSU_API_KEY: "vj_test", VIDJUTSU_API_URL: server.url.href.replace(/\/$/, "") };
      // Async, so this process's fake server keeps answering while the CLI runs.
      const cli = async (...args: string[]) => {
        const run = Bun.spawn(["bun", "run", join(import.meta.dir, "../src/cli/index.ts"), ...args], { env, stdout: "pipe", stderr: "pipe" });
        const [out, err, code] = await Promise.all([new Response(run.stdout).text(), new Response(run.stderr).text(), run.exited]);
        return { code, out, err };
      };

      const rendered = await cli("graphics", "render", root, "--name", "title");
      expect(rendered.code).toBe(0);
      expect(JSON.parse(rendered.out).output.media.id).toBe("title");
      expect(rendered.err).toContain("Media title");
      expect(seen).toContain("PUT /put/" + (await sha256Hex(new Uint8Array([137, 80, 78, 71, 0, 1]))));
      expect(seen).toContain("POST /graphics");

      const missing = await cli("graphics", "render", join(root, "film.json"), "--workspace", "nope");
      expect(missing.code).toBe(1);
      expect(missing.err).toContain("intro/index.html is not in the folder");

      expect((await cli("graphics", "ws", "push", "lower", root)).code).toBe(0);
      expect(workspaces.get("lower")!.files.map((f) => f.path)).toEqual(["film.json", "intro/index.html", "intro/logo.png"]);
      expect((await cli("graphics", "ws", "push", "lower", root)).err).toContain("already matches");

      const pulled = mkdtempSync(join(tmpdir(), "vjpull-"));
      expect((await cli("graphics", "ws", "pull", "lower", pulled)).code).toBe(0);
      expect(readFileSync(join(pulled, "intro", "index.html"), "utf8")).toBe("<script>window.render=t=>{}</script>");
      expect([...readFileSync(join(pulled, "intro", "logo.png"))]).toEqual([137, 80, 78, 71, 0, 1]);
    } finally {
      server.stop(true);
    }
  }, 30_000);
});
