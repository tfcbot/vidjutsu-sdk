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
  meta: { name: "account", description: "Manage accounts" },
  subCommands: {
    create: defineCommand({
      meta: { name: "create", description: "Create a draft account (0 credits)" },
      args: {
        platform: { type: "string", description: "Platform (instagram)", required: true },
        name: { type: "string", description: "Account name", required: true },
        handle: { type: "string", description: "Account handle" },
        niche: { type: "string", description: "Account niche" },
        bio: { type: "string", description: "Profile biography" },
        pfp: { type: "string", description: "Profile picture URL" },
        link: { type: "string", description: "Link in bio URL" },
        tags: { type: "string", description: "Tags as key=value pairs, comma-separated (e.g. campaign=summer,tier=gold)" },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {
          platform: args.platform,
          name: args.name,
        };
        if (args.handle) body.handle = args.handle;
        if (args.niche) body.niche = args.niche;
        if (args.bio) body.bio = args.bio;
        if (args.pfp) body.pfp = args.pfp;
        if (args.link) body.linkInBio = args.link;
        const tags = parseTags(args.tags);
        if (tags) body.tags = tags;

        const result = await apiRequest("POST", "/v1/accounts", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    edit: defineCommand({
      meta: { name: "edit", description: "Edit an account" },
      args: {
        id: { type: "positional", description: "Account ID", required: true },
        name: { type: "string", description: "Account name" },
        handle: { type: "string", description: "Account handle" },
        niche: { type: "string", description: "Account niche" },
        bio: { type: "string", description: "Profile biography" },
        pfp: { type: "string", description: "Profile picture URL" },
        link: { type: "string", description: "Link in bio URL" },
        tags: { type: "string", description: "Tags as key=value pairs, comma-separated" },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args.name) body.name = args.name;
        if (args.handle) body.handle = args.handle;
        if (args.niche) body.niche = args.niche;
        if (args.bio) body.bio = args.bio;
        if (args.pfp) body.pfp = args.pfp;
        if (args.link) body.linkInBio = args.link;
        const tags = parseTags(args.tags);
        if (tags) body.tags = tags;

        const result = await apiRequest("PUT", `/v1/accounts?id=${args.id}`, body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    list: defineCommand({
      meta: { name: "list", description: "List accounts" },
      args: {
        tag: { type: "string", description: "Filter by tag (key=value)" },
      },
      async run({ args }) {
        let path = "/v1/accounts";
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
      meta: { name: "get", description: "Get account details" },
      args: {
        id: { type: "positional", description: "Account ID", required: true },
      },
      async run({ args }) {
        const result = await apiRequest("GET", `/v1/accounts?id=${args.id}`);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    delete: defineCommand({
      meta: { name: "delete", description: "Delete an account" },
      args: {
        id: { type: "positional", description: "Account ID", required: true },
      },
      async run({ args }) {
        const result = await apiRequest("DELETE", `/v1/accounts?id=${args.id}`);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
  },
});
