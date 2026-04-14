// AUTO-GENERATED — do not edit. Run `bun run codegen` to regenerate.
import { defineCommand } from "citty";
import { apiRequest } from "../../client";

export default defineCommand({
  meta: { name: "transcribe", description: "Speech-to-text with word-level timing" },
  args: {
    "mediaUrl": { type: "string", description: "URL of the video or audio to transcribe", required: true },
    "language": { type: "string", description: "Language code (e.g. 'en', 'es'). Auto-detected if omitted" },
  },
  async run({ args }) {
    const body: Record<string, unknown> = {};
    if (args["mediaUrl"] !== undefined) body["mediaUrl"] = args["mediaUrl"];
    if (args["language"] !== undefined) body["language"] = args["language"];
    const result = await apiRequest("POST", "/v1/transcribe", body);
    console.log(JSON.stringify(result, null, 2));
  },
});
