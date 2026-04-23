// AUTO-GENERATED — do not edit. Run `bun run codegen` to regenerate.
import { defineCommand } from "citty";
import { apiRequest } from "../../client";

export default defineCommand({
  meta: { name: "compliance", description: "Manage compliances" },
  subCommands: {
    "prompt": defineCommand({
      meta: { name: "prompt", description: "Scan text (caption / script / ad copy) against a platform's TOS / Community Guidelines" },
      args: {
        "text": { type: "string", description: "The text to evaluate — caption, ad copy, draft script, upload description, etc.", required: true },
        "platform": { type: "string", description: "platform", required: true },
        "kind": { type: "string", description: "Optional label for logs; does not affect rule selection." },
        "context": { type: "string", description: "Optional publication metadata that affects risk (caption, hashtags, monetization intent)." },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["text"] !== undefined) body["text"] = args["text"];
        if (args["platform"] !== undefined) body["platform"] = args["platform"];
        if (args["kind"] !== undefined) body["kind"] = args["kind"];
        if (args["context"] !== undefined) body["context"] = args["context"];
        const result = await apiRequest("POST", "/v1/compliance/prompt", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "video": defineCommand({
      meta: { name: "video", description: "Scan a video against a platform's TOS / Community Guidelines" },
      args: {
        "videoUrl": { type: "string", description: "Public URL of the video to scan.", required: true },
        "platform": { type: "string", description: "platform", required: true },
        "format": { type: "string", description: "Optional content format hint. Inferred from duration when omitted." },
        "context": { type: "string", description: "Optional publication metadata that affects risk (caption, hashtags, monetization intent)." },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["videoUrl"] !== undefined) body["videoUrl"] = args["videoUrl"];
        if (args["platform"] !== undefined) body["platform"] = args["platform"];
        if (args["format"] !== undefined) body["format"] = args["format"];
        if (args["context"] !== undefined) body["context"] = args["context"];
        const result = await apiRequest("POST", "/v1/compliance/video", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
  },
});
