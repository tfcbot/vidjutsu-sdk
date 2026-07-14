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
  meta: { name: "project", description: "Manage projects" },
  subCommands: {
    "create": defineCommand({
      meta: { name: "create", description: "Create an editor project" },
      args: {
        "name": { type: "string", description: "name", required: true },
        "project": { type: "string", description: "project" },
        tags: { type: "string", description: "Tags as key=value pairs, comma-separated" },
        "metadata": { type: "string", description: "metadata" },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["name"] !== undefined) body["name"] = args["name"];
        if (args["project"] !== undefined) body["project"] = args["project"];
        const tags = parseTags(args.tags as string | undefined);
        if (tags) body.tags = tags;
        if (args["metadata"] !== undefined) body["metadata"] = args["metadata"];
        const result = await apiRequest("POST", "/v1/projects", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "edit": defineCommand({
      meta: { name: "edit", description: "Edit an editor project" },
      args: {
        id: { type: "positional", description: "Project ID", required: true },
        "name": { type: "string", description: "name" },
        "status": { type: "string", description: "status" },
        "project": { type: "string", description: "project" },
        tags: { type: "string", description: "Tags as key=value pairs, comma-separated" },
        "metadata": { type: "string", description: "metadata" },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["name"] !== undefined) body["name"] = args["name"];
        if (args["status"] !== undefined) body["status"] = args["status"];
        if (args["project"] !== undefined) body["project"] = args["project"];
        const tags = parseTags(args.tags as string | undefined);
        if (tags) body.tags = tags;
        if (args["metadata"] !== undefined) body["metadata"] = args["metadata"];
        const result = await apiRequest("PUT", "/v1/projects?id=" + args.id, body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "list": defineCommand({
      meta: { name: "list", description: "List editor projects" },
      args: {
        id: { type: "string", description: "Project ID (omit to list all)" },
        "status": { type: "string", description: "status" },
      },
      async run({ args }) {
        let path = "/v1/projects";
        const params = new URLSearchParams();
        if (args["id"]) params.set("id", args["id"]);
        if (args["status"]) params.set("status", args["status"]);
        const qs = params.toString();
        if (qs) path += "?" + qs;
        const result = await apiRequest("GET", path);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "delete": defineCommand({
      meta: { name: "delete", description: "Archive an editor project" },
      args: {
        id: { type: "positional", description: "Project ID", required: true },
      },
      async run({ args }) {
        const result = await apiRequest("DELETE", "/v1/projects?id=" + args.id);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
  },
});
