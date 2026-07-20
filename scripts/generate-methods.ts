#!/usr/bin/env bun
/**
 * Generate typed convenience methods from the VidJutsu OpenAPI spec.
 * Reads the spec, extracts all operations, and emits src/methods.ts
 * with a VidJutsuMethods interface and bindMethods() function.
 *
 * Usage:
 *   bun scripts/generate-methods.ts                          # fetch from GitHub
 *   bun scripts/generate-methods.ts --local path/to/spec.json # use local spec
 */
import { writeFileSync, readFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";

const SPEC_URL =
  "https://raw.githubusercontent.com/tfcbot/vidjutsu-openapi/main/openapi/spec.json";

const scriptDir = fileURLToPath(new URL(".", import.meta.url));
const outPath = resolve(scriptDir, "../src/methods.ts");

// ---------------------------------------------------------------------------
// Route metadata (auth level + credits per operation)
// Inlined to avoid depending on the main vidjutsu repo at codegen time.
// ---------------------------------------------------------------------------

const ROUTE_META: Record<string, { auth: string; credits: number; special?: string }> = {
  createCheckout:      { auth: "public", credits: 0 },
  getCheckoutStatus:   { auth: "public", credits: 0 },
  createSubscription:  { auth: "public", credits: 0 },
  getInfo:             { auth: "public", credits: 0 },
  getPricing:          { auth: "public", credits: 0 },
  recoverApiKey:       { auth: "public", credits: 0 },
  requestVerification: { auth: "public", credits: 0 },
  confirmVerification: { auth: "public", credits: 0 },
  createAccount:       { auth: "authenticated", credits: 0 },
  updateAccount:       { auth: "authenticated", credits: 0 },
  listOrGetAccounts:   { auth: "authenticated", credits: 0 },
  deleteAccount:       { auth: "authenticated", credits: 0 },
  createAsset:         { auth: "authenticated", credits: 0 },
  updateAsset:         { auth: "authenticated", credits: 0 },
  listOrGetAssets:     { auth: "authenticated", credits: 0 },
  deleteAsset:         { auth: "authenticated", credits: 0 },
  createPost:          { auth: "authenticated", credits: 0 },
  updatePost:          { auth: "authenticated", credits: 0 },
  listOrGetPosts:      { auth: "authenticated", credits: 0 },
  deletePost:          { auth: "authenticated", credits: 0 },
  createReference:     { auth: "authenticated", credits: 0 },
  updateReference:     { auth: "authenticated", credits: 0 },
  listOrGetReferences: { auth: "authenticated", credits: 0 },
  deleteReference:     { auth: "authenticated", credits: 0 },
  getBalance:          { auth: "authenticated", credits: 0 },
  getCheckRules:       { auth: "authenticated", credits: 0 },
  updateCheckRules:    { auth: "authenticated", credits: 0 },
  rotateApiKey:        { auth: "authenticated", credits: 0 },
  uploadFile:          { auth: "authenticated", credits: 0, special: "binary" },
  uploadFromUrl:       { auth: "authenticated", credits: 0 },
  addVideo:            { auth: "authenticated", credits: 0 },
  generateClips:       { auth: "authenticated", credits: 0 },
  addClipCaptions:     { auth: "authenticated", credits: 0 },
  addClipBroll:        { auth: "authenticated", credits: 0 },
  getDistributionJob:  { auth: "authenticated", credits: 0 },
  listOrGetDistributionClips: { auth: "authenticated", credits: 0 },
  cloneCheck:           { auth: "authenticated", credits: 0 },
  createCharacter:      { auth: "authenticated", credits: 0 },
  cloneStartingImage:   { auth: "authenticated", credits: 0 },
  cloneVideo:           { auth: "authenticated", credits: 0 },
  getJob:               { auth: "authenticated", credits: 0 },
  createAgentTask:       { auth: "paid", credits: 0 },
  listAgentTaskEvents:   { auth: "authenticated", credits: 0 },
  downloadTikTokVideo:  { auth: "paid", credits: 1 },
  downloadInstagramVideo: { auth: "paid", credits: 1 },
  watchMedia:          { auth: "paid", credits: 10 },
  extractMedia:        { auth: "paid", credits: 5 },
  transcribeMedia:     { auth: "paid", credits: 10 },
  checkSpec:           { auth: "paid", credits: 5 },
  createOverlay:       { auth: "paid", credits: 5 },
  // Scrape primitives — base cost 1 credit + 1 per staged media file (dynamic).
  scrapeTikTokProfile:           { auth: "paid", credits: 1 },
  scrapeTikTokProfileVideos:     { auth: "paid", credits: 1 },
  scrapeTikTokVideo:             { auth: "paid", credits: 1 },
  scrapeTikTokVideoTranscript:   { auth: "paid", credits: 1 },
  scrapeTikTokVideoComments:     { auth: "paid", credits: 1 },
  scrapeTikTokSearchUsers:       { auth: "paid", credits: 1 },
  scrapeTikTokTrending:          { auth: "paid", credits: 1 },
  scrapeInstagramProfile:        { auth: "paid", credits: 1 },
  scrapeInstagramUserPosts:      { auth: "paid", credits: 1 },
  scrapeInstagramPost:           { auth: "paid", credits: 1 },
  scrapeInstagramPostComments:   { auth: "paid", credits: 1 },
  scrapeInstagramUserReels:      { auth: "paid", credits: 1 },
};

// ---------------------------------------------------------------------------
// Load spec
// ---------------------------------------------------------------------------

async function loadSpec(): Promise<any> {
  const localIdx = process.argv.indexOf("--local");
  if (localIdx !== -1 && process.argv[localIdx + 1]) {
    return JSON.parse(readFileSync(process.argv[localIdx + 1], "utf8"));
  }
  const res = await fetch(SPEC_URL);
  if (!res.ok) throw new Error(`Failed to fetch spec: ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Parse operations
// ---------------------------------------------------------------------------

interface Operation {
  path: string;
  method: string; // GET, POST, PUT, DELETE
  operationId: string;
  summary: string;
  parameters: Array<{ name: string; in: string; required?: boolean }>;
  requestBodyRef: string | null;
  requestBodyRequired: boolean;
  responseRef: string | null; // may contain "|" for union
  isBinary: boolean;
}

function extractOperations(spec: any): Operation[] {
  const ops: Operation[] = [];

  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const [method, opDef] of Object.entries(methods as any)) {
      if (method === "options") continue;
      const op = opDef as any;
      if (!op.operationId) continue;

      let requestBodyRef: string | null = null;
      let requestBodyRequired = false;
      let isBinary = false;

      if (op.requestBody?.content?.["application/json"]?.schema?.$ref) {
        requestBodyRef = op.requestBody.content["application/json"].schema.$ref.replace(
          "#/components/schemas/",
          ""
        );
        requestBodyRequired = op.requestBody.required ?? false;
      } else if (op.requestBody?.content?.["application/octet-stream"]) {
        isBinary = true;
      }

      let responseRef: string | null = null;
      for (const [status, resDef] of Object.entries(op.responses ?? {})) {
        const statusNum = parseInt(status);
        if (statusNum >= 200 && statusNum < 300) {
          const content = (resDef as any).content?.["application/json"]?.schema;
          if (content?.$ref) {
            responseRef = content.$ref.replace("#/components/schemas/", "");
          } else if (content?.anyOf) {
            responseRef = content.anyOf
              .map((s: any) => s.$ref?.replace("#/components/schemas/", "") ?? "unknown")
              .join(" | ");
          }
          break;
        }
      }

      ops.push({
        path,
        method: method.toUpperCase(),
        operationId: op.operationId,
        summary: op.summary ?? "",
        parameters: op.parameters ?? [],
        requestBodyRef,
        requestBodyRequired,
        responseRef,
        isBinary,
      });
    }
  }

  return ops;
}

// ---------------------------------------------------------------------------
// Emit methods.ts
// ---------------------------------------------------------------------------

function emit(ops: Operation[]): string {
  const lines: string[] = [
    "// AUTO-GENERATED by scripts/generate-methods.ts — do not edit",
    'import type { paths, components } from "./schema.js";',
    'import type createFetchClient from "openapi-fetch";',
    "",
    "type Client = ReturnType<typeof createFetchClient<paths>>;",
    "",
    "// Extract the JSON request body type from an operation path+method",
    'type ReqBody<P extends keyof paths, M extends keyof paths[P]> = paths[P][M] extends { requestBody: { content: { "application/json": infer B } } } ? B : never;',
    "",
    "// Extract the success response type",
    'type ResBody<P extends keyof paths, M extends keyof paths[P]> = paths[P][M] extends { responses: { 200: { content: { "application/json": infer R } } } } ? R : paths[P][M] extends { responses: { 201: { content: { "application/json": infer R } } } } ? R : paths[P][M] extends { responses: { 202: { content: { "application/json": infer R } } } } ? R : unknown;',
    "",
    "// Extract query parameters",
    "type QueryParams<P extends keyof paths, M extends keyof paths[P]> = paths[P][M] extends { parameters: { query?: infer Q } } ? Q : never;",
    "",
  ];

  // --- Interface ---
  lines.push("export interface VidJutsuMethods {");

  for (const op of ops) {
    const meta = ROUTE_META[op.operationId];
    const queryParams = op.parameters.filter((p) => p.in === "query");

    // JSDoc
    const jsdocParts = [op.summary || op.operationId];
    if (meta) {
      if (meta.auth === "public") jsdocParts.push("Public endpoint.");
      else if (meta.auth === "authenticated") jsdocParts.push("Auth required.");
      else if (meta.auth === "paid") jsdocParts.push(`Auth required. ${meta.credits} credits.`);
    }
    lines.push(`  /** ${jsdocParts.join(" ")} */`);

    // Method signature
    const pathLiteral = op.path as string;
    const methodLower = op.method.toLowerCase();
    const args: string[] = [];
    let returnType: string;

    if (op.isBinary) {
      args.push("body: Blob | ArrayBuffer | ReadableStream");
      returnType = `ReturnType<Client["POST"]>`;
    } else if (op.requestBodyRef) {
      args.push(`body: ReqBody<"${pathLiteral}", "${methodLower}">`);
      if (queryParams.length > 0) {
        args.push(`query?: QueryParams<"${pathLiteral}", "${methodLower}">`);
      }
      returnType = `ReturnType<Client["${op.method}"]>`;
    } else if (queryParams.length > 0) {
      args.push(`query?: QueryParams<"${pathLiteral}", "${methodLower}">`);
      returnType = `ReturnType<Client["${op.method}"]>`;
    } else {
      returnType = `ReturnType<Client["${op.method}"]>`;
    }

    lines.push(`  ${op.operationId}(${args.join(", ")}): ${returnType};`);
  }

  lines.push("}");
  lines.push("");

  // --- bindMethods ---
  lines.push("export function bindMethods(client: Client): VidJutsuMethods {");
  lines.push("  return {");

  for (const op of ops) {
    const pathLiteral = op.path;
    const queryParams = op.parameters.filter((p) => p.in === "query");

    if (op.isBinary) {
      // Binary upload — pass body directly with custom serializer
      lines.push(`    ${op.operationId}(body) {`);
      lines.push(`      return client.POST("${pathLiteral}" as any, {`);
      lines.push(`        body: body as any,`);
      lines.push(`        bodySerializer: (b: any) => b,`);
      lines.push(`        headers: { "Content-Type": "application/octet-stream" },`);
      lines.push(`      } as any);`);
      lines.push(`    },`);
    } else if (op.requestBodyRef && queryParams.length > 0) {
      // Body + query params
      lines.push(`    ${op.operationId}(body, query) {`);
      lines.push(`      return client.${op.method}("${pathLiteral}" as any, { body, params: { query } } as any);`);
      lines.push(`    },`);
    } else if (op.requestBodyRef) {
      // Body only
      lines.push(`    ${op.operationId}(body) {`);
      lines.push(`      return client.${op.method}("${pathLiteral}" as any, { body } as any);`);
      lines.push(`    },`);
    } else if (queryParams.length > 0) {
      // Query params only
      lines.push(`    ${op.operationId}(query) {`);
      lines.push(`      return client.${op.method}("${pathLiteral}" as any, { params: { query } } as any);`);
      lines.push(`    },`);
    } else {
      // No args
      lines.push(`    ${op.operationId}() {`);
      lines.push(`      return client.${op.method}("${pathLiteral}" as any, {} as any);`);
      lines.push(`    },`);
    }
  }

  lines.push("  };");
  lines.push("}");
  lines.push("");

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const spec = await loadSpec();
const ops = extractOperations(spec);
console.log(`Parsed ${ops.length} operations`);

const content = emit(ops);
writeFileSync(outPath, content);
console.log(`Wrote methods.ts (${content.split("\n").length} lines)`);
