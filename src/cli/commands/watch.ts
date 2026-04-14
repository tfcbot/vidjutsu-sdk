import { defineCommand } from "citty";
import { getConfig } from "../client";

export default defineCommand({
  meta: { name: "watch", description: "AI watches a video and answers your prompt" },
  args: {
    "video-url": { type: "string", required: true, description: "URL of the video to watch" },
    prompt: { type: "string", required: true, description: "What to look for (freeform)" },
  },
  async run({ args }) {
    const config = getConfig();
    if (!config.apiKey) {
      throw new Error('Not authenticated. Run "vidjutsu auth --key <your_api_key>" first.');
    }

    console.log("Watching...");

    const res = await fetch(`${config.apiUrl}/v1/watch`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        mediaUrl: args["video-url"],
        prompt: args.prompt,
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
