import { defineCommand } from "citty";
import { apiRequest } from "../client";
import { cloneModel, lowScoreOverride, sourceFromArgs } from "../clone-source";

const sourceArgs = {
  url: { type: "string" as const, description: "Direct HTTP(S) video URL" },
  asset: { type: "string" as const, description: "Existing VidJutsu video asset ID" },
};

export default defineCommand({
  meta: { name: "clone", description: "Check and clone short-form source videos" },
  subCommands: {
    check: defineCommand({
      meta: { name: "check", description: "Score whether a source can be cloned reliably" },
      args: {
        ...sourceArgs,
        rubric: { type: "string", description: "Rubric version", default: "cloneability-v1" },
        execute: { type: "boolean", description: "Dispatch EVE; defaults to deterministic dry-run" },
        "idempotency-key": { type: "string", description: "Safe retry key", required: true },
      },
      async run({ args }) {
        const result = await apiRequest(
          "POST",
          "/v1/clones/check",
          {
            source: sourceFromArgs(args),
            rubricVersion: args.rubric,
            dryRun: args.execute !== true,
          },
          { idempotencyKey: args["idempotency-key"] },
        );
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "starting-image": defineCommand({
      meta: { name: "starting-image", description: "Create a clean character-swapped frame" },
      args: {
        ...sourceArgs,
        character: { type: "string", description: "Character ID", required: true },
        "rights-attested": { type: "boolean", description: "Attest rights to transform the source" },
        execute: { type: "boolean", description: "Use live adapters; defaults to dry-run" },
        "idempotency-key": { type: "string", description: "Safe retry key", required: true },
      },
      async run({ args }) {
        if (args["rights-attested"] !== true) throw new Error("--rights-attested is required");
        const result = await apiRequest(
          "POST",
          "/v1/clones/starting-image",
          {
            source: sourceFromArgs(args),
            characterId: args.character,
            dryRun: args.execute !== true,
          },
          { idempotencyKey: args["idempotency-key"] },
        );
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    video: defineCommand({
      meta: { name: "video", description: "Clone motion with Seedance or Kling motion control" },
      args: {
        ...sourceArgs,
        "starting-image": { type: "string", description: "Starting image asset ID", required: true },
        model: { type: "string", description: "seedance or kling-motion-control", required: true },
        check: { type: "string", description: "Completed clone-check ID", required: true },
        override: { type: "boolean", description: "Allow a cloneability score below 70" },
        reason: { type: "string", description: "Required audit reason for --override" },
        "rights-attested": { type: "boolean", description: "Attest rights to transform the source" },
        execute: { type: "boolean", description: "Dispatch EVE; defaults to deterministic dry-run" },
        "idempotency-key": { type: "string", description: "Safe retry key", required: true },
      },
      async run({ args }) {
        if (args["rights-attested"] !== true) throw new Error("--rights-attested is required");
        const result = await apiRequest(
          "POST",
          "/v1/clones/video",
          {
            source: sourceFromArgs(args),
            startingImageAssetId: args["starting-image"],
            model: cloneModel(args.model),
            cloneCheckId: args.check,
            override: lowScoreOverride(args),
            dryRun: args.execute !== true,
          },
          { idempotencyKey: args["idempotency-key"] },
        );
        console.log(JSON.stringify(result, null, 2));
      },
    }),
  },
});
