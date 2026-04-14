import { defineCommand } from "citty";
import { getConfig } from "../client";

export default defineCommand({
  meta: { name: "extract", description: "Extract frames, audio, and metadata from a video" },
  args: {
    "video-url": { type: "string", required: true, description: "URL of the video" },
    frames: { type: "string", description: "Frame indices (comma-separated), 'auto', or 'last'" },
    audio: { type: "boolean", description: "Extract audio track" },
    metadata: { type: "boolean", description: "Return video metadata (default: true)" },
  },
  async run({ args }) {
    const config = getConfig();
    if (!config.apiKey) {
      throw new Error('Not authenticated. Run "vidjutsu auth --key <your_api_key>" first.');
    }

    // Parse frames arg
    let frames: number[] | "auto" | "last" | undefined;
    if (args.frames === "auto" || args.frames === "last") {
      frames = args.frames;
    } else if (args.frames) {
      frames = args.frames.split(",").map((s: string) => parseInt(s.trim(), 10));
    }

    console.log("Extracting...");

    const res = await fetch(`${config.apiUrl}/v1/extract`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        mediaUrl: args["video-url"],
        frames,
        audio: args.audio,
        metadata: args.metadata !== false,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      const msg = typeof json === "object" && json !== null && "error" in json
        ? (json as any).message ?? (json as any).error
        : `HTTP ${res.status}`;
      throw new Error(msg);
    }

    console.log(JSON.stringify(json, null, 2));
  },
});
