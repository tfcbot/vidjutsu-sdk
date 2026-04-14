// AUTO-GENERATED — do not edit. Run `bun run codegen` to regenerate.
import { defineCommand } from "citty";
import { apiRequest } from "../../client";

export default defineCommand({
  meta: { name: "usage", description: "Show daily usage and limits" },
  args: {
  },
  async run({ args }) {
    const result = await apiRequest("GET", "/v1/usage");
    console.log(JSON.stringify(result, null, 2));
  },
});
