import { defineCommand } from "citty";
import { apiRequest } from "../client";

export default defineCommand({
  meta: { name: "status", description: "Check resource status by ID" },
  args: {
    id: { type: "positional", description: "Resource ID (job_xxx, acc_xxx, post_xxx, ref_xxx)", required: true },
  },
  async run({ args }) {
    const id = args.id as string;
    let path: string;

    if (id.startsWith("job_")) path = `/v1/distribution/jobs?id=${id}`;
    else if (id.startsWith("acc_")) path = `/v1/accounts?id=${id}`;
    else if (id.startsWith("post_")) path = `/v1/posts?id=${id}`;
    else if (id.startsWith("ref_")) path = `/v1/references?id=${id}`;
    else {
      console.error("Unknown ID prefix. Expected job_, acc_, post_, or ref_");
      process.exit(1);
    }

    const result = await apiRequest("GET", path);
    console.log(JSON.stringify(result, null, 2));
  },
});
