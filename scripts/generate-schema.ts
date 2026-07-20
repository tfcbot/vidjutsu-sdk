#!/usr/bin/env bun
/**
 * Generate TypeScript types from the VidJutsu OpenAPI spec.
 * Fetches spec from GitHub and writes src/schema.d.ts using openapi-typescript.
 *
 * Usage:
 *   bun scripts/generate-schema.ts                          # fetch from GitHub
 *   bun scripts/generate-schema.ts --local path/to/spec.json # use local spec
 */
import openapiTS, { astToString } from "openapi-typescript";
import { writeFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";

const SPEC_URL =
  "https://raw.githubusercontent.com/tfcbot/vidjutsu-openapi/main/openapi/spec.json";

const scriptDir = fileURLToPath(new URL(".", import.meta.url));
const outPath = resolve(scriptDir, "../src/schema.d.ts");

// Determine spec source
const localIdx = process.argv.indexOf("--local");
let source: string | URL;
if (localIdx !== -1 && process.argv[localIdx + 1]) {
  source = resolve(process.argv[localIdx + 1]);
  console.log("Generating types from local spec:", source);
} else {
  source = SPEC_URL;
  console.log("Fetching spec from:", SPEC_URL);
}

const ast = await openapiTS(new URL(source.toString().startsWith("http") ? source.toString() : `file://${source}`));
const output = astToString(ast);

writeFileSync(outPath, output);
console.log(`Wrote schema.d.ts (${output.split("\n").length} lines)`);
