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
  meta: { name: "post", description: "Manage posts" },
  subCommands: {
    "create": defineCommand({
      meta: { name: "create", description: "Create a draft post" },
      args: {
        "accountId": { type: "string", description: "accountId" },
        "videoId": { type: "string", description: "videoId" },
        "mediaUrl": { type: "string", description: "mediaUrl" },
        "caption": { type: "string", description: "caption" },
        "brief": { type: "string", description: "brief" },
        tags: { type: "string", description: "Tags as key=value pairs, comma-separated" },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["accountId"] !== undefined) body["accountId"] = args["accountId"];
        if (args["videoId"] !== undefined) body["videoId"] = args["videoId"];
        if (args["mediaUrl"] !== undefined) body["mediaUrl"] = args["mediaUrl"];
        if (args["caption"] !== undefined) body["caption"] = args["caption"];
        if (args["brief"] !== undefined) body["brief"] = args["brief"];
        const tags = parseTags(args.tags as string | undefined);
        if (tags) body.tags = tags;
        const result = await apiRequest("POST", "/v1/posts", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "edit": defineCommand({
      meta: { name: "edit", description: "Edit a post" },
      args: {
        id: { type: "positional", description: "Post ID", required: true },
        "caption": { type: "string", description: "caption" },
        "mediaUrl": { type: "string", description: "mediaUrl" },
        "videoId": { type: "string", description: "videoId" },
        "accountId": { type: "string", description: "accountId" },
        "brief": { type: "string", description: "brief" },
        tags: { type: "string", description: "Tags as key=value pairs, comma-separated" },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["caption"] !== undefined) body["caption"] = args["caption"];
        if (args["mediaUrl"] !== undefined) body["mediaUrl"] = args["mediaUrl"];
        if (args["videoId"] !== undefined) body["videoId"] = args["videoId"];
        if (args["accountId"] !== undefined) body["accountId"] = args["accountId"];
        if (args["brief"] !== undefined) body["brief"] = args["brief"];
        const tags = parseTags(args.tags as string | undefined);
        if (tags) body.tags = tags;
        const result = await apiRequest("PUT", "/v1/posts?id=" + args.id, body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "list": defineCommand({
      meta: { name: "list", description: "List posts" },
      args: {
        id: { type: "string", description: "Post ID (omit to list all)" },
        "accountId": { type: "string", description: "accountId" },
      },
      async run({ args }) {
        let path = "/v1/posts";
        const params = new URLSearchParams();
        if (args["id"]) params.set("id", args["id"]);
        if (args["accountId"]) params.set("accountId", args["accountId"]);
        const qs = params.toString();
        if (qs) path += "?" + qs;
        const result = await apiRequest("GET", path);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "delete": defineCommand({
      meta: { name: "delete", description: "Delete a post" },
      args: {
        id: { type: "positional", description: "Post ID", required: true },
      },
      async run({ args }) {
        const result = await apiRequest("DELETE", "/v1/posts?id=" + args.id);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
  },
});
