import { defineCommand } from "citty";
import { getConfig } from "../client";

export default defineCommand({
  meta: { name: "info", description: "Show API info and discovery" },
  args: {},
  async run() {
    const config = getConfig();
    const res = await fetch(`${config.apiUrl}/v1/info`);
    const json = await res.json();
    console.log(JSON.stringify(json, null, 2));
  },
});
