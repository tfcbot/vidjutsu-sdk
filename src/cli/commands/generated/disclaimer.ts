// AUTO-GENERATED — do not edit. Run `bun run codegen` to regenerate.
import { defineCommand } from "citty";
import { apiRequest } from "../../client";

export default defineCommand({
  meta: { name: "disclaimer", description: "Burn fine-print disclaimer onto video" },
  args: {
    "videoUrl": { type: "string", description: "URL of the source video", required: true },
    "text": { type: "string", description: "Disclaimer text. Use \\n for line breaks. Kept fine-print style at the bottom of the frame.", required: true },
    "fontSize": { type: "string", description: "Font size in pixels. Defaults to 2.2% of video height (fine-print)." },
  },
  async run({ args }) {
    const body: Record<string, unknown> = {};
    if (args["videoUrl"] !== undefined) body["videoUrl"] = args["videoUrl"];
    if (args["text"] !== undefined) body["text"] = args["text"];
    if (args["fontSize"] !== undefined) body["fontSize"] = args["fontSize"];
    const result = await apiRequest("POST", "/v1/disclaimer", body);
    console.log(JSON.stringify(result, null, 2));
  },
});
