import { defineCommand } from "citty";
import { apiRequest } from "../client";

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
    create: defineCommand({
      meta: { name: "create", description: "Create a draft post (0 credits)" },
      args: {
        account: { type: "string", description: "Account ID" },
        video: { type: "string", description: "Video ID" },
        "video-url": { type: "string", description: "Media URL" },
        caption: { type: "string", description: "Post caption" },
        brief: { type: "string", description: "Brief metadata" },
        tags: { type: "string", description: "Tags as key=value pairs, comma-separated" },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args.account) body.accountId = args.account;
        if (args.video) body.videoId = args.video;
        if (args["video-url"]) body.mediaUrl = args["video-url"];
        if (args.caption) body.caption = args.caption;
        if (args.brief) body.brief = args.brief;
        const tags = parseTags(args.tags);
        if (tags) body.tags = tags;

        const result = await apiRequest("POST", "/v1/posts", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    edit: defineCommand({
      meta: { name: "edit", description: "Edit a draft post" },
      args: {
        id: { type: "positional", description: "Post ID", required: true },
        caption: { type: "string", description: "Post caption" },
        "video-url": { type: "string", description: "Media URL" },
        video: { type: "string", description: "Video ID" },
        account: { type: "string", description: "Account ID" },
        brief: { type: "string", description: "Brief metadata" },
        tags: { type: "string", description: "Tags as key=value pairs, comma-separated" },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args.caption) body.caption = args.caption;
        if (args["video-url"]) body.mediaUrl = args["video-url"];
        if (args.video) body.videoId = args.video;
        if (args.account) body.accountId = args.account;
        if (args.brief) body.brief = args.brief;
        const tags = parseTags(args.tags);
        if (tags) body.tags = tags;

        const result = await apiRequest("PUT", `/v1/posts?id=${args.id}`, body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    list: defineCommand({
      meta: { name: "list", description: "List posts" },
      args: {
        tag: { type: "string", description: "Filter by tag (key=value)" },
      },
      async run({ args }) {
        let path = "/v1/posts";
        if (args.tag) {
          const [key, ...rest] = args.tag.split("=");
          const value = rest.join("=");
          path += `?tag.${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        }
        const result = await apiRequest("GET", path);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    get: defineCommand({
      meta: { name: "get", description: "Get post details" },
      args: {
        id: { type: "positional", description: "Post ID", required: true },
      },
      async run({ args }) {
        const result = await apiRequest("GET", `/v1/posts?id=${args.id}`);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    delete: defineCommand({
      meta: { name: "delete", description: "Delete a post" },
      args: {
        id: { type: "positional", description: "Post ID", required: true },
      },
      async run({ args }) {
        const result = await apiRequest("DELETE", `/v1/posts?id=${args.id}`);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
  },
});
