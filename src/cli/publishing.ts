// `vidjutsu accounts ...` and `vidjutsu post ...`: connect social accounts and
// post finished videos to them, now or at a time.
import { readFileSync } from "node:fs";
import type { JsonObject, Platform, PostState, SchedulePost } from "../client";
import type { Cli } from "./graphics";

export const PUBLISHING_HELP = `Publishing (TikTok, Instagram, YouTube)
  accounts [list]                    Your connected social accounts
  accounts connect <tiktok|instagram|youtube> [--return-to app|page]
                                     Print a link: open it in a browser to sign in to the platform
  accounts disconnect <account_id>
  post schedule (--job <render job_id> | --hash <media hash>) --accounts <id,id> (--caption <text> | --caption-file <file>)
                [--at <ISO time>] [--options <file.json>] [--key <idempotency key>]
                                     Post now, or at --at. --options is {"<account_id>": {platform options}}
  post list [--state <state>] [--limit <n>] [--cursor <c>]
  post get <post_id> | post cancel <post_id> | post stats <post_id>
  post reschedule <post_id> --at <ISO time>`;

type Args = { positional: string[]; flags: Record<string, string | true> };

const PLATFORMS = new Set<Platform>(["tiktok", "instagram", "youtube"]);
const STATES = new Set<PostState>([
  "scheduled",
  "awaiting_approval",
  "dispatching",
  "published",
  "partially_published",
  "failed",
  "canceled",
  "paused_unpaid",
]);

/** An ISO time with a date and a time of day, given back in the API's form (UTC, ISO 8601). */
export function isoTime(value: string, fail: (message: string) => never): string {
  const ms = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value) ? Date.parse(value) : NaN;
  if (Number.isNaN(ms)) fail(`--at must be an ISO time such as 2026-12-01T15:00:00Z (got ${value})`);
  return new Date(ms).toISOString();
}

/** The schedule_post body from the command line's flags. */
export function scheduleBody(args: Args, cli: Pick<Cli, "fail" | "flag">): SchedulePost {
  const { fail, flag } = cli;
  const job = flag(args, "job");
  const hash = flag(args, "hash");
  if (!job === !hash) fail("give the video as --job <render job_id> or --hash <media hash> (one of them)");
  const ids = (flag(args, "accounts") ?? "").split(",").map((id) => id.trim()).filter(Boolean);
  if (ids.length === 0) fail("missing --accounts (ids from vidjutsu accounts)");
  const captionFile = flag(args, "caption-file");
  const caption = captionFile !== undefined ? readFileSync(captionFile === "-" ? 0 : captionFile, "utf8").trim() : flag(args, "caption");
  if (caption === undefined) return fail("missing --caption <text> (or --caption-file <file>)");
  const optionsFile = flag(args, "options");
  const options = optionsFile ? (JSON.parse(readFileSync(optionsFile, "utf8")) as Record<string, JsonObject>) : {};
  for (const id of Object.keys(options)) {
    if (!ids.includes(id)) fail(`--options names ${id}, which is not in --accounts`);
  }
  const at = flag(args, "at");
  const key = flag(args, "key");
  return {
    caption,
    media: job ? { job_id: job } : { hash: hash! },
    accounts: ids.map((id) => (options[id] ? { id, options: options[id] } : { id })),
    ...(at !== undefined && at !== "now" ? { at: isoTime(at, fail) } : {}),
    ...(key ? { idempotency_key: key } : {}),
  };
}

export async function accounts(rest: string[], args: Args, cli: Cli): Promise<void> {
  const { client, print, say, fail, need, flag } = cli;
  const [action = "list", value] = rest;
  if (action === "list") return print(await client().socialAccounts());
  if (action === "connect") {
    const platform = need(value, "platform (tiktok, instagram or youtube)") as Platform;
    if (!PLATFORMS.has(platform)) fail("platform must be tiktok, instagram or youtube");
    const returnTo = flag(args, "return-to") as "app" | "page" | undefined;
    if (returnTo !== undefined && returnTo !== "app" && returnTo !== "page") fail("--return-to must be app or page");
    const answer = await client().connectAccount(platform, returnTo ? { return_to: returnTo } : {});
    say(`Open this link in a browser to sign in to ${platform}: ${answer.url}`);
    return print(answer);
  }
  if (action === "disconnect") return print(await client().disconnectAccount(need(value, "account id")));
  return fail(`unknown accounts action ${action}`);
}

export async function post(rest: string[], args: Args, cli: Cli): Promise<void> {
  const { client, print, fail, need, flag } = cli;
  const [action, id] = rest;
  switch (action) {
    case "schedule":
      return print(await client().schedulePost(scheduleBody(args, cli)));
    case "list":
    case undefined: {
      const state = flag(args, "state");
      if (state !== undefined && !STATES.has(state as PostState)) fail(`--state must be one of ${[...STATES].join(", ")}`);
      const limit = flag(args, "limit");
      if (limit !== undefined && !/^\d+$/.test(limit)) fail("--limit must be a whole number");
      return print(
        await client().posts({
          state: state as PostState | undefined,
          cursor: flag(args, "cursor"),
          limit: limit === undefined ? undefined : Number(limit),
        }),
      );
    }
    case "get":
      return print(await client().getPost(need(id, "post id")));
    case "cancel":
      return print(await client().cancelPost(need(id, "post id")));
    case "stats":
      return print(await client().postStats(need(id, "post id")));
    case "reschedule":
      return print(await client().reschedulePost(need(id, "post id"), isoTime(need(flag(args, "at"), "--at <ISO time>"), fail)));
    default:
      return fail(`unknown post action ${action}`);
  }
}
