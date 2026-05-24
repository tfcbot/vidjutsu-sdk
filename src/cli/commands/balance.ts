import { defineCommand } from "citty";
import { apiRequest } from "../client";

interface LedgerEntry {
  delta: number;
  reason: "grant" | "topup" | "charge" | "refund";
  operationId?: string;
  note?: string;
  createdAt: number;
}

interface BalanceResponse {
  balance: number;
  ledger: LedgerEntry[];
}

function fmtTs(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

function fmtDelta(n: number): string {
  const s = n >= 0 ? `+${n}` : String(n);
  return s.padStart(6);
}

export default defineCommand({
  meta: {
    name: "balance",
    description: "Show credit balance and recent ledger entries",
  },
  args: {
    json: {
      type: "boolean",
      description: "Emit raw JSON instead of a table",
      default: false,
    },
  },
  async run({ args }) {
    const res = (await apiRequest("GET", "/v1/balance")) as BalanceResponse;

    if (args.json) {
      console.log(JSON.stringify(res, null, 2));
      return;
    }

    console.log(`Balance: ${res.balance} credits`);

    if (!res.ledger || res.ledger.length === 0) {
      console.log("\nNo ledger entries yet.");
      return;
    }

    console.log("\nRecent ledger (newest first):");
    for (const e of res.ledger) {
      const detail = e.operationId ?? e.note ?? "";
      console.log(
        `  ${fmtDelta(e.delta)}  ${e.reason.padEnd(7)}  ${fmtTs(e.createdAt)}  ${detail}`
      );
    }
  },
});
