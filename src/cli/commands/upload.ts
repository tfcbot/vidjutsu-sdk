import { defineCommand } from "citty";
import { getConfig } from "../client";
import { readFileSync } from "fs";

export default defineCommand({
  meta: { name: "upload", description: "Upload a file or URL to VidJutsu CDN" },
  args: {
    file: { type: "positional", description: "File path to upload" },
    url: { type: "string", description: "URL to upload via POST /v1/upload/url" },
  },
  async run({ args }) {
    const config = getConfig();
    if (!config.apiKey) {
      throw new Error('Not authenticated. Run "vidjutsu auth --key <your_api_key>" first.');
    }

    // URL-based upload
    if (args.url) {
      const res = await fetch(`${config.apiUrl}/v1/upload/url`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sourceUrl: args.url }),
      });

      const json = await res.json();

      if (!res.ok) {
        const msg =
          typeof json === "object" && json !== null && "error" in json
            ? (json as any).message ?? (json as any).error
            : `HTTP ${res.status}`;
        throw new Error(msg);
      }

      console.log(JSON.stringify(json, null, 2));
      return;
    }

    if (!args.file) {
      throw new Error("Provide a file path or --url <url>");
    }

    const filePath = args.file;
    const buffer = readFileSync(filePath);

    // Detect content type from extension
    const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
    const contentTypes: Record<string, string> = {
      mp4: "video/mp4",
      mov: "video/quicktime",
      webm: "video/webm",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
      mp3: "audio/mpeg",
      wav: "audio/wav",
    };
    const contentType = contentTypes[ext] ?? "application/octet-stream";

    console.log(`Uploading ${filePath} (${Math.round(buffer.length / 1024)}KB, ${contentType})...`);

    const res = await fetch(`${config.apiUrl}/v1/upload`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Content-Type": contentType,
      },
      body: buffer,
    });

    const json = await res.json();

    if (!res.ok) {
      const msg =
        typeof json === "object" && json !== null && "error" in json
          ? (json as any).message ?? (json as any).error
          : `HTTP ${res.status}`;
      throw new Error(msg);
    }

    console.log(JSON.stringify(json, null, 2));
  },
});
