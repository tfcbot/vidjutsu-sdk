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
// Route metadata (auth and subscription requirements per operation)
// Inlined to avoid depending on the main vidjutsu repo at codegen time.
// ---------------------------------------------------------------------------

const ROUTE_META: Record<string, { auth: "public" | "authenticated" | "subscription"; special?: "binary" }> = {
  createSubscription: { auth: "public" }, getInfo: { auth: "public" }, getPricing: { auth: "public" },
  recoverApiKey: { auth: "public" }, requestVerification: { auth: "public" }, confirmVerification: { auth: "public" },
  getCheckoutStatus: { auth: "public" }, signupAgent: { auth: "public" }, agentClaim: { auth: "public" },
  agentClaimComplete: { auth: "public" }, agentRevoke: { auth: "public" },
  createAccount: { auth: "authenticated" }, updateAccount: { auth: "authenticated" },
  listOrGetAccounts: { auth: "authenticated" }, deleteAccount: { auth: "authenticated" },
  createAsset: { auth: "authenticated" }, updateAsset: { auth: "authenticated" },
  listOrGetAssets: { auth: "authenticated" }, deleteAsset: { auth: "authenticated" },
  createEditorProject: { auth: "authenticated" }, updateEditorProject: { auth: "authenticated" },
  listOrGetEditorProjects: { auth: "authenticated" }, deleteEditorProject: { auth: "authenticated" },
  createPost: { auth: "authenticated" }, updatePost: { auth: "authenticated" },
  listOrGetPosts: { auth: "authenticated" }, deletePost: { auth: "authenticated" },
  createReference: { auth: "authenticated" }, updateReference: { auth: "authenticated" },
  listOrGetReferences: { auth: "authenticated" }, deleteReference: { auth: "authenticated" },
  getUsage: { auth: "authenticated" }, getCheckRules: { auth: "authenticated" },
  updateCheckRules: { auth: "authenticated" }, rotateApiKey: { auth: "authenticated" },
  uploadFile: { auth: "authenticated", special: "binary" }, uploadFromUrl: { auth: "authenticated" },
  listCharacters: { auth: "authenticated" }, getCharacter: { auth: "authenticated" },
  getCloneVideo: { auth: "authenticated" },
  cloneCheck: { auth: "subscription" }, createCharacter: { auth: "subscription" },
  cloneStartingImage: { auth: "subscription" }, cloneVideo: { auth: "subscription" },
  downloadTikTokVideo: { auth: "subscription" }, downloadInstagramVideo: { auth: "subscription" },
  watchMedia: { auth: "subscription" }, extractMedia: { auth: "subscription" },
  transcribeMedia: { auth: "subscription" }, checkSpec: { auth: "subscription" },
  checkComplianceVideo: { auth: "subscription" }, checkCompliancePrompt: { auth: "subscription" },
  createOverlay: { auth: "subscription" }, createDisclaimer: { auth: "subscription" },
  scrapeTikTokProfile: { auth: "subscription" }, scrapeTikTokProfileVideos: { auth: "subscription" },
  scrapeTikTokVideo: { auth: "subscription" }, scrapeTikTokVideoTranscript: { auth: "subscription" },
  scrapeTikTokVideoComments: { auth: "subscription" }, scrapeTikTokSearchUsers: { auth: "subscription" },
  scrapeTikTokTrending: { auth: "subscription" }, scrapeInstagramProfile: { auth: "subscription" },
  scrapeInstagramUserPosts: { auth: "subscription" }, scrapeInstagramPost: { auth: "subscription" },
  scrapeInstagramPostComments: { auth: "subscription" }, scrapeInstagramUserReels: { auth: "subscription" },
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
      } else if (Object.entries(op.requestBody?.content ?? {}).some(
        ([contentType, value]: [string, any]) =>
          contentType === "application/octet-stream" || value?.schema?.format === "binary",
      )) {
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
    const pathParams = op.parameters.filter((p) => p.in === "path");

    // JSDoc
    const jsdocParts = [op.summary || op.operationId];
    if (meta) {
      if (meta.auth === "public") jsdocParts.push("Public endpoint.");
      else if (meta.auth === "authenticated") jsdocParts.push("Bearer API key required.");
      else if (meta.auth === "subscription") jsdocParts.push("Active subscription and daily quota required.");
    }
    lines.push(`  /** ${jsdocParts.join(" ")} */`);

    // Method signature
    const pathLiteral = op.path as string;
    const methodLower = op.method.toLowerCase();
    const args: string[] = [];
    let returnType: string;

    // Path params come first as individual positional args (in path order).
    for (const p of pathParams) {
      args.push(`${p.name}: string`);
    }

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
    const pathParams = op.parameters.filter((p) => p.in === "path");
    const pathArgNames = pathParams.map((p) => p.name);
    const pathParamsObj = pathParams.length > 0 ? `, path: { ${pathParams.map((p) => p.name).join(", ")} }` : "";
    const callArgs = [...pathArgNames];

    if (op.isBinary) {
      // Binary upload — pass body directly with custom serializer
      callArgs.push("body");
      lines.push(`    ${op.operationId}(${callArgs.join(", ")}) {`);
      lines.push(`      return client.POST("${pathLiteral}" as any, {`);
      lines.push(`        body: body as any,`);
      lines.push(`        bodySerializer: (b: any) => b,`);
      lines.push(`        headers: { "Content-Type": "application/octet-stream" },`);
      if (pathParamsObj) lines.push(`        params: {${pathParamsObj.replace(/^, /, "")}},`);
      lines.push(`      } as any);`);
      lines.push(`    },`);
    } else if (op.requestBodyRef && queryParams.length > 0) {
      // Body + query params (+ optional path params)
      callArgs.push("body", "query");
      lines.push(`    ${op.operationId}(${callArgs.join(", ")}) {`);
      lines.push(`      return client.${op.method}("${pathLiteral}" as any, { body, params: { query${pathParamsObj} } } as any);`);
      lines.push(`    },`);
    } else if (op.requestBodyRef) {
      // Body only (+ optional path params)
      callArgs.push("body");
      lines.push(`    ${op.operationId}(${callArgs.join(", ")}) {`);
      if (pathParamsObj) {
        lines.push(`      return client.${op.method}("${pathLiteral}" as any, { body, params: {${pathParamsObj.replace(/^, /, "")}} } as any);`);
      } else {
        lines.push(`      return client.${op.method}("${pathLiteral}" as any, { body } as any);`);
      }
      lines.push(`    },`);
    } else if (queryParams.length > 0) {
      // Query params only (+ optional path params)
      callArgs.push("query");
      lines.push(`    ${op.operationId}(${callArgs.join(", ")}) {`);
      lines.push(`      return client.${op.method}("${pathLiteral}" as any, { params: { query${pathParamsObj} } } as any);`);
      lines.push(`    },`);
    } else if (pathParams.length > 0) {
      // Path params only
      lines.push(`    ${op.operationId}(${callArgs.join(", ")}) {`);
      lines.push(`      return client.${op.method}("${pathLiteral}" as any, { params: {${pathParamsObj.replace(/^, /, "")}} } as any);`);
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
