#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const API_BASE = process.env.API_BASE ?? "https://effervescent-ermine-544.convex.site";
const EMAIL = "distribution-cli-e2e@vidjutsu.ai";
const CLI = resolve(import.meta.dir, "../dist/cli/index.mjs");

function localEnv(name: string): string | undefined {
  for (const path of [
    resolve(import.meta.dir, "../../../.env"),
    resolve(import.meta.dir, "../../vidjutsu/.env.local"),
  ]) {
    try {
      for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
        const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
        if (match?.[1] === name) return match[2].trim().replace(/^(['"])(.*)\1$/, "$2");
      }
    } catch {
      // Local test credentials are optional in each individual env file.
    }
  }
  return undefined;
}

const testKey = process.env.TEST_API_KEY ?? localEnv("TEST_API_KEY");
if (!testKey) throw new Error("TEST_API_KEY is not configured");

async function testClient(path: string, body: unknown): Promise<any> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Test-Key": testKey! },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${path} failed with HTTP ${response.status}`);
  return await response.json();
}

async function cli(args: string[], apiKey: string): Promise<any> {
  const proc = Bun.spawn([process.execPath, CLI, ...args], {
    env: { ...process.env, VIDJUTSU_API_URL: API_BASE, VIDJUTSU_API_KEY: apiKey },
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (exitCode !== 0) throw new Error(`vidjutsu ${args.join(" ")} failed: ${stderr.trim()}`);
  return JSON.parse(stdout);
}

await testClient("/v1/test/delete-client", { email: EMAIL });
try {
  const auth = await testClient("/v1/test/create-client", { email: EMAIL });
  const generated = await cli(
    [
      "clips",
      "generate",
      "--youtube",
      "https://www.youtube.com/watch?v=Eg93po_DAYo",
      "--count",
      "2",
      "--rights-attested",
      "--idempotency-key",
      "cli-generate",
    ],
    auth.apiKey,
  );
  const job = await cli(["jobs", "wait", generated.jobId, "--interval", "10"], auth.apiKey);
  const firstClipId = job.outputs?.find((output: any) => output.kind === "clip")?.id;
  if (!firstClipId) throw new Error("CLI generate did not return a clip");

  const captioned = await cli(
    ["clips", "captions", firstClipId, "--idempotency-key", "cli-captions"],
    auth.apiKey,
  );
  const captionClipId = captioned.outputs?.find((output: any) => output.kind === "clip")?.id;
  if (!captionClipId) throw new Error("CLI captions did not return a clip");

  const broll = await cli(
    ["clips", "broll", captionClipId, "--idempotency-key", "cli-broll"],
    auth.apiKey,
  );
  if (!broll.outputs?.some((output: any) => output.kind === "clip")) {
    throw new Error("CLI B-roll did not return a clip");
  }
  console.log("CLI dry-run passed: clips generate -> jobs wait -> captions -> B-roll.");
} finally {
  await testClient("/v1/test/delete-client", { email: EMAIL });
}
