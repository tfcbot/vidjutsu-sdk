import { defineCommand } from "citty";
import { apiRequest } from "../client";

function parseTags(raw: string): { key: string; value: string }[] {
  return raw.split(",").map((pair) => {
    const [key, ...rest] = pair.split("=");
    return { key: key.trim(), value: rest.join("=").trim() };
  });
}

export default defineCommand({
  meta: { name: "reference", description: "Manage references" },
  subCommands: {
    create: defineCommand({
      meta: { name: "create", description: "Create a reference" },
      args: {
        url: { type: "string", description: "Reference URL", required: true },
        platform: { type: "string", description: "Platform (e.g. tiktok, instagram)" },
        notes: { type: "string", description: "Free-text notes" },
        tags: { type: "string", description: "Tags as key1=value1,key2=value2" },
      },
      async run({ args }) {
        const body: Record<string, unknown> = { url: args.url };
        if (args.platform) body.platform = args.platform;
        if (args.notes) body.notes = args.notes;
        if (args.tags) body.tags = parseTags(args.tags);

        const result = await apiRequest("POST", "/v1/references", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    list: defineCommand({
      meta: { name: "list", description: "List references" },
      args: {
        platform: { type: "string", description: "Filter by platform" },
        tag: { type: "string", description: "Filter by tag (key=value)" },
      },
      async run({ args }) {
        const params: string[] = [];
        if (args.platform) params.push(`platform=${args.platform}`);
        if (args.tag) {
          const [key, ...rest] = args.tag.split("=");
          params.push(`tag.${key.trim()}=${rest.join("=").trim()}`);
        }
        const qs = params.length ? `?${params.join("&")}` : "";
        const result = await apiRequest("GET", `/v1/references${qs}`);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    get: defineCommand({
      meta: { name: "get", description: "Get a reference" },
      args: {
        id: { type: "positional", description: "Reference ID", required: true },
      },
      async run({ args }) {
        const result = await apiRequest("GET", `/v1/references?id=${args.id}`);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    edit: defineCommand({
      meta: { name: "edit", description: "Edit a reference" },
      args: {
        id: { type: "positional", description: "Reference ID", required: true },
        notes: { type: "string", description: "Free-text notes" },
        platform: { type: "string", description: "Platform" },
        tags: { type: "string", description: "Tags as key1=value1,key2=value2" },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args.notes) body.notes = args.notes;
        if (args.platform) body.platform = args.platform;
        if (args.tags) body.tags = parseTags(args.tags);

        const result = await apiRequest("PUT", `/v1/references?id=${args.id}`, body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    delete: defineCommand({
      meta: { name: "delete", description: "Delete a reference" },
      args: {
        id: { type: "positional", description: "Reference ID", required: true },
      },
      async run({ args }) {
        const result = await apiRequest("DELETE", `/v1/references?id=${args.id}`);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
  },
});
