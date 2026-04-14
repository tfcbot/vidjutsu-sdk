// AUTO-GENERATED — do not edit. Run `bun run codegen` to regenerate.
import { defineCommand } from "citty";
import { apiRequest } from "../../client";

function parseTags(raw?: string): Array<{ key: string; value: string }> | undefined {
  if (!raw) return undefined;
  return raw.split(",").map((pair) => {
    const [key, ...rest] = pair.split("=");
    return { key: key.trim(), value: rest.join("=").trim() };
  });
}

export default defineCommand({
  meta: { name: "asset", description: "Manage assets" },
  subCommands: {
    "create": defineCommand({
      meta: { name: "create", description: "Create an asset record" },
      args: {
        "url": { type: "string", description: "url", required: true },
        "name": { type: "string", description: "name" },
        "contentType": { type: "string", description: "contentType" },
        tags: { type: "string", description: "Tags as key=value pairs, comma-separated" },
        "metadata": { type: "string", description: "metadata" },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["url"] !== undefined) body["url"] = args["url"];
        if (args["name"] !== undefined) body["name"] = args["name"];
        if (args["contentType"] !== undefined) body["contentType"] = args["contentType"];
        const tags = parseTags(args.tags as string | undefined);
        if (tags) body.tags = tags;
        if (args["metadata"] !== undefined) body["metadata"] = args["metadata"];
        const result = await apiRequest("POST", "/v1/assets", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "edit": defineCommand({
      meta: { name: "edit", description: "Edit an asset" },
      args: {
        id: { type: "positional", description: "Asset ID", required: true },
        "name": { type: "string", description: "name" },
        tags: { type: "string", description: "Tags as key=value pairs, comma-separated" },
        "metadata": { type: "string", description: "metadata" },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["name"] !== undefined) body["name"] = args["name"];
        const tags = parseTags(args.tags as string | undefined);
        if (tags) body.tags = tags;
        if (args["metadata"] !== undefined) body["metadata"] = args["metadata"];
        const result = await apiRequest("PUT", "/v1/assets?id=" + args.id, body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "list": defineCommand({
      meta: { name: "list", description: "List assets" },
      args: {
        id: { type: "string", description: "Asset ID (omit to list all)" },
        "type": { type: "string", description: "type" },
      },
      async run({ args }) {
        let path = "/v1/assets";
        const params = new URLSearchParams();
        if (args["id"]) params.set("id", args["id"]);
        if (args["type"]) params.set("type", args["type"]);
        const qs = params.toString();
        if (qs) path += "?" + qs;
        const result = await apiRequest("GET", path);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "delete": defineCommand({
      meta: { name: "delete", description: "Delete an asset" },
      args: {
        id: { type: "positional", description: "Asset ID", required: true },
      },
      async run({ args }) {
        const result = await apiRequest("DELETE", "/v1/assets?id=" + args.id);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
  },
});
