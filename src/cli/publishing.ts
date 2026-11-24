// `vidjutsu accounts ...` and `vidjutsu post ...`: connect social accounts and
// post finished videos to them, now or at a time.
import { readFileSync } from "node:fs";
import type { JsonObject, Platform, PostState, SchedulePost } from "../client";
import type { Cli } from "./graphics";

export const PUBLISHING_HELP = `Publishing (TikTok, Instagram, YouTube)
  accounts [list]                    Your connected social accounts
  accounts connect <tiktok|instagram|youtube> [--return-to app|page]
                                     Print a link: open it in a browser to sign in to the platform
  accounts approval <social_account_id> --on|--off   Posts to it wait for approval (post approve)
  accounts disconnect <social_account_id>
  post schedule (--job <render job_id> | --hash <media hash> [--type video|image]) --accounts <id,id>
                [--caption <text> | --caption-file <file>] [--at <ISO time>] [--options <file.json>] [--key <key>]
                                     Post now, or at --at. --options is {"<social_account_id>": {platform options}}
                                     (YouTube needs a title: {"<id>": {"title": "..."}})
  post list [--state <state>] [--limit <n>] [--cursor <c>]
  post get <post_id> | post approve <post_id> | post cancel <post_id> | post stats <post_id>
  post reschedule <post_id> --at <ISO time | now>`;

type Args = { positional: string[]; flags: Record<string, string | true> };

const PLATFORMS = new Set<Platform>(["tiktok", "instagram", "youtube"]);
const STATES = new Set<PostState>([
  "pending_approval",
  "scheduled",
  "publishing",
  "published",
  "partial",
  "failed",
  "canceled",
  "paused_unpaid",
]);

/** An ISO time with a date, a time of day and a zone (Z or +hh:mm), sent in UTC. */
export function isoTime(value: string, fail: (message: string) => never): string {
  const ms = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/i.test(value) ? Date.parse(value) : NaN;
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
  const type = flag(args, "type");
  if (type !== undefined && (job || (type !== "video" && type !== "image"))) fail("--type goes with --hash and is video or image");
  const optionsFile = flag(args, "options");
  const options = optionsFile ? (JSON.parse(readFileSync(optionsFile, "utf8")) as Record<string, JsonObject>) : {};
  for (const id of Object.keys(options)) {
    if (!ids.includes(id)) fail(`--options names ${id}, which is not in --accounts`);
  }
  const at = flag(args, "at");
  const key = flag(args, "key");
  return {
    media: job ? { job_id: job } : { hash: hash!, ...(type ? { type: type as "video" | "image" } : {}) },
    accounts: ids.map((id) => (options[id] ? { id, options: options[id] } : id)),
    ...(caption !== undefined ? { caption } : {}),
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
  if (action === "approval") {
    if (!args.flags.on === !args.flags.off) fail("say --on or --off");
    return print(await client().updateSocialAccount(need(value, "social account id"), { approve_before_posting: !!args.flags.on }));
  }
  if (action === "disconnect") return print(await client().disconnectAccount(need(value, "social account id")));
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
    case "approve":
      return print(await client().approvePost(need(id, "post id")));
    case "cancel":
      return print(await client().cancelPost(need(id, "post id")));
    case "stats":
      return print(await client().postStats(need(id, "post id")));
    case "reschedule": {
      const at = need(flag(args, "at"), "--at <ISO time | now>");
      return print(await client().reschedulePost(need(id, "post id"), at === "now" ? null : isoTime(at, fail)));
    }
    default:
      return fail(`unknown post action ${action}`);
  }
}
