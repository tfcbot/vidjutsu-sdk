import { defineCommand } from "citty";
import { apiRequest } from "../client";

export default defineCommand({
  meta: { name: "character", description: "Create reusable AI characters" },
  subCommands: {
    create: defineCommand({
      meta: { name: "create", description: "Create a reusable character identity" },
      args: {
        prompt: { type: "string", description: "Character appearance prompt", required: true },
        references: { type: "string", description: "Comma-separated reference image asset IDs" },
        execute: { type: "boolean", description: "Use live adapters; defaults to dry-run" },
        "idempotency-key": { type: "string", description: "Safe retry key", required: true },
      },
      async run({ args }) {
        const result = await apiRequest(
          "POST",
          "/v1/characters",
          {
            prompt: args.prompt,
            referenceImageAssetIds: args.references
              ?.split(",")
              .map((id) => id.trim())
              .filter(Boolean),
            dryRun: args.execute !== true,
          },
          { idempotencyKey: args["idempotency-key"] },
        );
        console.log(JSON.stringify(result, null, 2));
      },
    }),
  },
});
