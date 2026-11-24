import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readPlaybook, writePlaybookFolder } from "../src/cli/playbooks";
import { VidJutsu } from "../src/client";

type Call = { url: string; method: string; body?: unknown };

function fake() {
  const calls: Call[] = [];
  const fetcher = (async (url: string, init: RequestInit = {}) => {
    calls.push({ url, method: init.method ?? "GET", body: init.body });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
  }) as unknown as typeof fetch;
  return { calls, api: new VidJutsu({ apiKey: "k", fetch: fetcher }) };
}

describe("playbooks", () => {
  test("list, get, save and delete call the playbook routes", async () => {
    const { calls, api } = fake();
    await api.playbooks();
    await api.getPlaybook("my-cut");
    await api.savePlaybook({ id: "my-cut", tagline: "Tighter", defaults: { pause_seconds: 0.5 } });
    await api.deletePlaybook("my-cut");
    expect(calls.map(c => `${c.method} ${c.url}`)).toEqual([
      "GET https://api.vidjutsu.ai/playbooks",
      "GET https://api.vidjutsu.ai/playbooks/my-cut",
      "POST https://api.vidjutsu.ai/playbooks",
      "DELETE https://api.vidjutsu.ai/playbooks/my-cut",
    ]);
    expect(JSON.parse(calls[2]!.body as string)).toEqual({ id: "my-cut", tagline: "Tighter", defaults: { pause_seconds: 0.5 } });
  });

  test("a folder becomes a playbook, and a playbook becomes the same folder", () => {
    const dir = mkdtempSync(join(tmpdir(), "pb-"));
    writeFileSync(join(dir, "SKILL.md"), "# My Cut\n\nCut the pauses.");
    writeFileSync(join(dir, "playbook.json"), JSON.stringify({ tagline: "Tight", tools: ["edit"], builtin: true, version: "1.0.0" }));
    mkdirSync(join(dir, "files", "title"), { recursive: true });
    writeFileSync(join(dir, "files", "title", "index.html"), "<p>hi</p>");
    const body = readPlaybook(dir);
    expect(body).toEqual({ tagline: "Tight", tools: ["edit"], instructions: "# My Cut\n\nCut the pauses.", name: "My Cut",
      files: [{ path: "title/index.html", text: "<p>hi</p>" }] });

    const out = mkdtempSync(join(tmpdir(), "pb-out-"));
    writePlaybookFolder(out, { id: "my-cut", name: "My Cut", instructions: "# My Cut", files: [{ path: "a/b.html", text: "x" }, { path: "../evil", text: "x" }] });
    expect(readFileSync(join(out, "SKILL.md"), "utf8")).toBe("# My Cut");
    expect(JSON.parse(readFileSync(join(out, "playbook.json"), "utf8"))).toEqual({ id: "my-cut", name: "My Cut" });
    expect(readFileSync(join(out, "files", "a", "b.html"), "utf8")).toBe("x");
    expect(existsSync(join(out, "evil"))).toBe(false);
  });
});
