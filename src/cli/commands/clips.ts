import { defineCommand } from "citty";
import { apiRequest } from "../client";

function dryRun(args: { execute?: boolean }): boolean {
  return args.execute !== true;
}

function optionalNumber(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid number: ${value}`);
  return parsed;
}

export default defineCommand({
  meta: { name: "clips", description: "Generate and transform distribution clips" },
  subCommands: {
    generate: defineCommand({
      meta: { name: "generate", description: "Generate a bounded batch of 9:16 clips" },
      args: {
        youtube: { type: "string", description: "One YouTube watch URL" },
        url: { type: "string", description: "Direct HTTP(S) MP4 URL" },
        asset: { type: "string", description: "Existing uploaded asset ID" },
        video: { type: "string", description: "Existing normalized video ID" },
        count: { type: "string", description: "Number of clips (1-20)", default: "5" },
        min: { type: "string", description: "Minimum clip duration in seconds" },
        max: { type: "string", description: "Maximum clip duration in seconds" },
        intent: { type: "string", description: "What kinds of moments to find" },
        "rights-attested": { type: "boolean", description: "Attest rights to transform/distribute the source" },
        execute: { type: "boolean", description: "Allow configured live media adapters; defaults to dry-run" },
        "idempotency-key": { type: "string", description: "Safe retry key" },
      },
      async run({ args }) {
        const choices = [args.youtube, args.url, args.asset, args.video].filter(Boolean);
        if (choices.length !== 1) {
          throw new Error("Provide exactly one of --youtube, --url, --asset, or --video");
        }
        const source = args.youtube
          ? { kind: "youtube", url: args.youtube }
          : args.url
            ? { kind: "http", url: args.url }
            : args.asset
              ? { kind: "asset", assetId: args.asset }
              : undefined;
        if (source && args["rights-attested"] !== true) {
          throw new Error("--rights-attested is required when supplying a source");
        }
        const result = await apiRequest(
          "POST",
          "/v1/clips/generate",
          {
            ...(source ? { source } : { videoId: args.video }),
            aspectRatio: "9:16",
            count: optionalNumber(args.count),
            minDurationSeconds: optionalNumber(args.min),
            maxDurationSeconds: optionalNumber(args.max),
            intent: args.intent,
            dryRun: dryRun(args),
          },
          { idempotencyKey: args["idempotency-key"] },
        );
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    captions: defineCommand({
      meta: { name: "captions", description: "Create a captioned child clip" },
      args: {
        clip: { type: "positional", description: "Parent clip ID", required: true },
        preset: { type: "string", description: "Caption style preset", default: "podcast" },
        language: { type: "string", description: "Caption language", default: "en" },
        execute: { type: "boolean", description: "Allow configured live media adapters; defaults to dry-run" },
        "idempotency-key": { type: "string", description: "Safe retry key" },
      },
      async run({ args }) {
        const result = await apiRequest(
          "POST",
          "/v1/clips/captions",
          {
            clipId: args.clip,
            preset: args.preset,
            language: args.language,
            dryRun: dryRun(args),
          },
          { idempotencyKey: args["idempotency-key"] },
        );
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    broll: defineCommand({
      meta: { name: "broll", description: "Create a B-roll-treated child clip" },
      args: {
        clip: { type: "positional", description: "Parent clip ID", required: true },
        mode: { type: "string", description: "auto, supplied, or none", default: "auto" },
        assets: { type: "string", description: "Comma-separated approved asset IDs" },
        intent: { type: "string", description: "B-roll treatment intent" },
        execute: { type: "boolean", description: "Allow configured live media adapters; defaults to dry-run" },
        "idempotency-key": { type: "string", description: "Safe retry key" },
      },
      async run({ args }) {
        if (!['auto', 'supplied', 'none'].includes(args.mode)) {
          throw new Error("--mode must be auto, supplied, or none");
        }
        const result = await apiRequest(
          "POST",
          "/v1/clips/broll",
          {
            clipId: args.clip,
            mode: args.mode,
            assetIds: args.assets?.split(",").map((id) => id.trim()).filter(Boolean),
            intent: args.intent,
            dryRun: dryRun(args),
          },
          { idempotencyKey: args["idempotency-key"] },
        );
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    list: defineCommand({
      meta: { name: "list", description: "List clips or inspect one clip" },
      args: {
        id: { type: "string", description: "Clip ID" },
        video: { type: "string", description: "Filter by root video ID" },
      },
      async run({ args }) {
        const params = new URLSearchParams();
        if (args.id) params.set("id", args.id);
        if (args.video) params.set("videoId", args.video);
        const query = params.toString();
        const result = await apiRequest("GET", `/v1/distribution/clips${query ? `?${query}` : ""}`);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
  },
});
