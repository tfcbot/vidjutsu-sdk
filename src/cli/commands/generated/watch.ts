// AUTO-GENERATED — do not edit. Run `bun run codegen` to regenerate.
import { defineCommand } from "citty";
import { apiRequest } from "../../client";

export default defineCommand({
  meta: { name: "watch", description: "AI watches a video and answers your prompt" },
  args: {
    "mediaUrl": { type: "string", description: "URL of the media to analyze", required: true },
    "prompt": { type: "string", description: "Freeform prompt — tell AI what to look for", required: true },
  },
  async run({ args }) {
    const body: Record<string, unknown> = {};
    if (args["mediaUrl"] !== undefined) body["mediaUrl"] = args["mediaUrl"];
    if (args["prompt"] !== undefined) body["prompt"] = args["prompt"];
    const result = await apiRequest("POST", "/v1/watch", body);
    console.log(JSON.stringify(result, null, 2));
  },
});
