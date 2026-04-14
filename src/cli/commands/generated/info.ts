// AUTO-GENERATED — do not edit. Run `bun run codegen` to regenerate.
import { defineCommand } from "citty";
import { publicRequest } from "../../client";

export default defineCommand({
  meta: { name: "info", description: "Show API info and discovery" },
  args: {
  },
  async run({ args }) {
    const result = await publicRequest("GET", "/v1/info");
    console.log(JSON.stringify(result, null, 2));
  },
});
