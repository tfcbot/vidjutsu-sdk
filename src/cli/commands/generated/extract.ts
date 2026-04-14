// AUTO-GENERATED — do not edit. Run `bun run codegen` to regenerate.
import { defineCommand } from "citty";
import { apiRequest } from "../../client";

export default defineCommand({
  meta: { name: "extract", description: "Extract frames, audio, and metadata from a video" },
  args: {
    "mediaUrl": { type: "string", description: "URL of the video to extract from", required: true },
    "frames": { type: "string", description: "Frame indices to extract. Use [0, 75, 150] for specific frames, 'auto' for 3 evenly spaced, or 'last' for the final frame" },
    "audio": { type: "string", description: "Extract audio track as WAV" },
    "metadata": { type: "string", description: "Return video metadata (width, height, fps, duration). Defaults to true" },
  },
  async run({ args }) {
    const body: Record<string, unknown> = {};
    if (args["mediaUrl"] !== undefined) body["mediaUrl"] = args["mediaUrl"];
    if (args["frames"] !== undefined) body["frames"] = args["frames"];
    if (args["audio"] !== undefined) body["audio"] = args["audio"];
    if (args["metadata"] !== undefined) body["metadata"] = args["metadata"];
    const result = await apiRequest("POST", "/v1/extract", body);
    console.log(JSON.stringify(result, null, 2));
  },
});
