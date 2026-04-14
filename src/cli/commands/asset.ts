import { defineCommand } from "citty";
import { apiRequest } from "../client";

function parseTags(raw: string): { key: string; value: string }[] {
  return raw.split(",").map((pair) => {
    const [key, ...rest] = pair.split("=");
    return { key: key.trim(), value: rest.join("=").trim() };
  });
}

export default defineCommand({
  meta: { name: "asset", description: "Manage assets" },
  subCommands: {
    create: defineCommand({
      meta: { name: "create", description: "Create an asset record" },
      args: {
        url: { type: "string", description: "Asset URL", required: true },
        name: { type: "string", description: "Asset name" },
        type: { type: "string", description: "Content type (e.g. video, image)" },
        tags: { type: "string", description: "Tags as key1=value1,key2=value2" },
        metadata: { type: "string", description: "Arbitrary metadata as JSON string" },
      },
      async run({ args }) {
        const body: Record<string, unknown> = { url: args.url };
        if (args.name) body.name = args.name;
        if (args.type) body.contentType = args.type;
        if (args.tags) body.tags = parseTags(args.tags);
        if (args.metadata) {
          try { body.metadata = JSON.parse(args.metadata); } catch { body.metadata = args.metadata; }
        }

        const result = await apiRequest("POST", "/v1/assets", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    list: defineCommand({
      meta: { name: "list", description: "List assets" },
      args: {
        type: { type: "string", description: "Filter by content type" },
        tag: { type: "string", description: "Filter by tag (key=value)" },
      },
      async run({ args }) {
        const params: string[] = [];
        if (args.type) params.push(`type=${args.type}`);
        if (args.tag) {
          const [key, ...rest] = args.tag.split("=");
          params.push(`tag.${key.trim()}=${rest.join("=").trim()}`);
        }
        const qs = params.length ? `?${params.join("&")}` : "";
        const result = await apiRequest("GET", `/v1/assets${qs}`);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    get: defineCommand({
      meta: { name: "get", description: "Get an asset" },
      args: {
        id: { type: "positional", description: "Asset ID", required: true },
      },
      async run({ args }) {
        const result = await apiRequest("GET", `/v1/assets?id=${args.id}`);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    edit: defineCommand({
      meta: { name: "edit", description: "Edit an asset" },
      args: {
        id: { type: "positional", description: "Asset ID", required: true },
        name: { type: "string", description: "Asset name" },
        tags: { type: "string", description: "Tags as key1=value1,key2=value2" },
        metadata: { type: "string", description: "Arbitrary metadata as JSON string" },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args.name) body.name = args.name;
        if (args.tags) body.tags = parseTags(args.tags);
        if (args.metadata) {
          try { body.metadata = JSON.parse(args.metadata); } catch { body.metadata = args.metadata; }
        }

        const result = await apiRequest("PUT", `/v1/assets?id=${args.id}`, body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    delete: defineCommand({
      meta: { name: "delete", description: "Delete an asset" },
      args: {
        id: { type: "positional", description: "Asset ID", required: true },
      },
      async run({ args }) {
        const result = await apiRequest("DELETE", `/v1/assets?id=${args.id}`);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
  },
});
