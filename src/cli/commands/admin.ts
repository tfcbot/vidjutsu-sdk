import { defineCommand } from "citty";
import { spawnSync } from "node:child_process";

const grant = defineCommand({
  meta: {
    name: "grant",
    description:
      "Grant credits to a client (looked up by email or clientId). Runs the Convex mutation directly via 'npx convex run'.",
  },
  args: {
    email: {
      type: "string",
      description: "Email of the client to grant credits to",
    },
    client: {
      type: "string",
      description: "clientId of the client to grant credits to",
    },
    amount: {
      type: "string",
      description: "Number of credits to grant (positive integer)",
      required: true,
    },
    note: {
      type: "string",
      description: "Optional admin note recorded on the ledger row",
    },
    repo: {
      type: "string",
      description:
        "Path to the vidjutsu Convex repo where 'npx convex run' executes (defaults to cwd)",
    },
  },
  async run({ args }) {
    if (!args.email && !args.client) {
      console.error("Error: provide --email <e> or --client <clientId>");
      process.exit(1);
    }

    const amount = Number(args.amount);
    if (!Number.isInteger(amount) || amount <= 0) {
      console.error("Error: --amount must be a positive integer");
      process.exit(1);
    }

    const payload: Record<string, unknown> = { amount };
    if (args.email) payload.email = args.email;
    if (args.client) payload.clientId = args.client;
    if (args.note) payload.note = args.note;

    const cwd = (args.repo as string | undefined) ?? process.cwd();
    const cmdArgs = [
      "convex",
      "run",
      "services/machineClients:grantCreditsByLookup",
      JSON.stringify(payload),
    ];

    const result = spawnSync("npx", cmdArgs, {
      cwd,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    if (result.error) {
      console.error("Error invoking npx convex:", result.error.message);
      process.exit(1);
    }
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
  },
});

export default defineCommand({
  meta: {
    name: "admin",
    description: "Admin operations (credit grants, etc.)",
  },
  subCommands: {
    grant: () => grant,
  },
});
