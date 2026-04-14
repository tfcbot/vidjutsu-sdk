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
  meta: { name: "account", description: "Manage accounts" },
  subCommands: {
    "create": defineCommand({
      meta: { name: "create", description: "Create a draft account" },
      args: {
        "platform": { type: "string", description: "platform", required: true },
        "name": { type: "string", description: "name", required: true },
        "handle": { type: "string", description: "handle" },
        "bio": { type: "string", description: "bio" },
        "pfp": { type: "string", description: "pfp" },
        "niche": { type: "string", description: "niche" },
        "linkInBio": { type: "string", description: "linkInBio" },
        tags: { type: "string", description: "Tags as key=value pairs, comma-separated" },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["platform"] !== undefined) body["platform"] = args["platform"];
        if (args["name"] !== undefined) body["name"] = args["name"];
        if (args["handle"] !== undefined) body["handle"] = args["handle"];
        if (args["bio"] !== undefined) body["bio"] = args["bio"];
        if (args["pfp"] !== undefined) body["pfp"] = args["pfp"];
        if (args["niche"] !== undefined) body["niche"] = args["niche"];
        if (args["linkInBio"] !== undefined) body["linkInBio"] = args["linkInBio"];
        const tags = parseTags(args.tags as string | undefined);
        if (tags) body.tags = tags;
        const result = await apiRequest("POST", "/v1/accounts", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "edit": defineCommand({
      meta: { name: "edit", description: "Edit an account" },
      args: {
        id: { type: "positional", description: "Account ID", required: true },
        "handle": { type: "string", description: "handle" },
        "name": { type: "string", description: "name" },
        "bio": { type: "string", description: "bio" },
        "pfp": { type: "string", description: "pfp" },
        "niche": { type: "string", description: "niche" },
        "linkInBio": { type: "string", description: "linkInBio" },
        tags: { type: "string", description: "Tags as key=value pairs, comma-separated" },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["handle"] !== undefined) body["handle"] = args["handle"];
        if (args["name"] !== undefined) body["name"] = args["name"];
        if (args["bio"] !== undefined) body["bio"] = args["bio"];
        if (args["pfp"] !== undefined) body["pfp"] = args["pfp"];
        if (args["niche"] !== undefined) body["niche"] = args["niche"];
        if (args["linkInBio"] !== undefined) body["linkInBio"] = args["linkInBio"];
        const tags = parseTags(args.tags as string | undefined);
        if (tags) body.tags = tags;
        const result = await apiRequest("PUT", "/v1/accounts?id=" + args.id, body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "list": defineCommand({
      meta: { name: "list", description: "List accounts" },
      args: {
        id: { type: "string", description: "Account ID (omit to list all)" },
      },
      async run({ args }) {
        let path = "/v1/accounts";
        const params = new URLSearchParams();
        if (args["id"]) params.set("id", args["id"]);
        const qs = params.toString();
        if (qs) path += "?" + qs;
        const result = await apiRequest("GET", path);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "delete": defineCommand({
      meta: { name: "delete", description: "Delete an account" },
      args: {
        id: { type: "positional", description: "Account ID", required: true },
      },
      async run({ args }) {
        const result = await apiRequest("DELETE", "/v1/accounts?id=" + args.id);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
  },
});
