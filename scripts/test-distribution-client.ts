#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "../src/client";

const API_BASE = process.env.API_BASE ?? "https://effervescent-ermine-544.convex.site";
const EMAIL = "distribution-sdk-e2e@vidjutsu.ai";

function localEnv(name: string): string | undefined {
  const paths = [
    resolve(import.meta.dir, "../../../.env"),
    resolve(import.meta.dir, "../../vidjutsu/.env.local"),
  ];

  for (const path of paths) {
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

await testClient("/v1/test/delete-client", { email: EMAIL });
try {
  const auth = await testClient("/v1/test/create-client", { email: EMAIL });
  const vj = createClient({ apiKey: auth.apiKey, baseUrl: API_BASE });
  const generated = await vj.clips.generate(
    {
      source: { kind: "youtube", url: "https://www.youtube.com/watch?v=Eg93po_DAYo" },
      aspectRatio: "9:16",
      count: 2,
      dryRun: true,
    },
    { idempotencyKey: "sdk-generate" },
  );
  const completed = await vj.jobs.waitForResult(generated.jobId, { pollIntervalMs: 10 });
  const firstClipId = completed.outputs?.find((output) => output.kind === "clip")?.id;
  if (!firstClipId) throw new Error("SDK generate did not return a clip");

  const captioned = await vj.clips.addCaptions(
    { clipId: firstClipId, preset: "podcast", dryRun: true },
    { idempotencyKey: "sdk-captions" },
  );
  const captionClipId = captioned.outputs?.find((output) => output.kind === "clip")?.id;
  if (!captionClipId) throw new Error("SDK captions did not return a clip");

  const broll = await vj.clips.addBroll(
    { clipId: captionClipId, mode: "auto", dryRun: true },
    { idempotencyKey: "sdk-broll" },
  );
  if (!broll.outputs?.some((output) => output.kind === "clip")) {
    throw new Error("SDK B-roll did not return a clip");
  }
  console.log("SDK dry-run passed: clips.generate -> addCaptions -> addBroll -> jobs.waitForResult.");
} finally {
  await testClient("/v1/test/delete-client", { email: EMAIL });
}
