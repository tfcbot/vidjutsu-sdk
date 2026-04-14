import { defineCommand } from "citty";
import { apiRequest, getConfig } from "../client";
import { readFileSync } from "fs";

export default defineCommand({
  meta: { name: "check", description: "Validate a VidLang spec against rules" },
  subCommands: {
    run: defineCommand({
      meta: { name: "run", description: "Run spec validation" },
      args: {
        spec: { type: "string", required: true, description: "Path to spec JSON file" },
        rules: { type: "string", required: true, description: "Rules config JSON or comma-separated rule IDs to enable (e.g. VL013,VL011 or '{\"VL013\":true}')" },
      },
      async run({ args }) {
        const config = getConfig();
        if (!config.apiKey) {
          throw new Error('Not authenticated. Run "vidjutsu auth --key <your_api_key>" first.');
        }

        const specContent = readFileSync(args.spec, "utf-8");
        let spec: unknown;
        try {
          spec = JSON.parse(specContent);
        } catch {
          throw new Error(`Failed to parse spec file: ${args.spec}`);
        }

        // Parse rules: either JSON object or comma-separated IDs to enable
        let rules: Record<string, unknown>;
        try {
          rules = JSON.parse(args.rules);
        } catch {
          // Treat as comma-separated rule IDs — enable each
          rules = {};
          for (const id of args.rules.split(",").map((r: string) => r.trim())) {
            rules[id] = true;
          }
        }

        console.log(`Checking spec with ${Object.keys(rules).length} rules...`);

        const res = await fetch(`${config.apiUrl}/v1/check`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ spec, rules }),
        });

        const json = await res.json();

        if (!res.ok) {
          const msg = typeof json === "object" && json !== null && "error" in json
            ? (json as any).message ?? (json as any).error
            : `HTTP ${res.status}`;
          throw new Error(msg);
        }

        const data = json as any;
        if (data.passed) {
          console.log("✓ All checks passed");
        } else {
          console.log("✗ Failed checks:");
          for (const r of data.results ?? []) {
            if (!r.passed) {
              console.log(`  [${r.severity}] ${r.rule}: ${r.message}`);
            }
          }
        }

        // Summary
        const total = data.results?.length ?? 0;
        const passed = data.results?.filter((r: any) => r.passed !== false).length ?? 0;
        console.log(`\n${passed}/${total} rules passed`);
      },
    }),
    rules: defineCommand({
      meta: { name: "rules", description: "Manage check rules" },
      subCommands: {
        list: defineCommand({
          meta: { name: "list", description: "List saved check rules" },
          args: {},
          async run() {
            const result = await apiRequest("GET", "/v1/check/rules");
            console.log(JSON.stringify(result, null, 2));
          },
        }),
        set: defineCommand({
          meta: { name: "set", description: "Save check rules" },
          args: {
            rules: { type: "positional", description: "Rules (comma-separated)", required: true },
          },
          async run({ args }) {
            const rules = args.rules.split(",").map((r: string) => r.trim());
            const result = await apiRequest("PUT", "/v1/check/rules", { rules });
            console.log(JSON.stringify(result, null, 2));
          },
        }),
      },
    }),
  },
});
