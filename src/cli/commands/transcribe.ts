import { defineCommand } from "citty";
import { getConfig } from "../client";

export default defineCommand({
  meta: { name: "transcribe", description: "Speech-to-text with word-level timing" },
  args: {
    "video-url": { type: "string", required: true, description: "URL of the video or audio" },
    language: { type: "string", description: "Language code (e.g. 'en'). Auto-detected if omitted" },
  },
  async run({ args }) {
    const config = getConfig();
    if (!config.apiKey) {
      throw new Error('Not authenticated. Run "vidjutsu auth --key <your_api_key>" first.');
    }

    console.log("Transcribing...");

    const res = await fetch(`${config.apiUrl}/v1/transcribe`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        mediaUrl: args["video-url"],
        language: args.language,
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
