#!/usr/bin/env node
// The `vidjutsu` command line for VidJutsu Cloud. Every command prints the
// API's JSON on stdout; progress and prompts go to stderr.
import { createWriteStream, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import { createInterface } from "node:readline/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { DEFAULT_BASE_URL, VidJutsu, VidJutsuError, type Json, type JsonObject, type StartedJob } from "../client";
import { VERSION } from "./version";

const HELP = `vidjutsu ${VERSION}: video editing for agents, in the cloud.

Account
  login [--email <address>]          Sign up or sign in with an emailed code; saves an API key
  logout                             Forget the saved key
  account | usage | entitlements     Your account, usage and wallet balance, your limits
  wallet                             Wallet balance, card on file, auto top-up and this period's spend
  keys [list | create <name> | revoke <key_id>]
  billing checkout [--amount <usd>]  Sign up: add a card and fund your prepaid wallet ($5 minimum)
  billing top-up [--amount <usd>]    Add credits to your wallet (default $10, $5 minimum)
  billing auto-top-up --on|--off [--threshold <usd>] [--amount <usd>]
  billing portal                     Your saved card and payment receipts

Media
  upload <file> [--name <name>] [--project <p>]   Upload a file straight to storage
  ingest <https-url> [--name <name>] [--project <p>]
  url <hash> [--ttl <seconds>]       A time-limited download link
  preview <hash> [--project <p>] [--no-wait]      Make (or read) its proxy, filmstrip and waveform
  transcript <hash> [--project <p>] [--no-wait]   Make (or read) its transcript

Projects
  projects [--limit <n>] [--cursor <c>]           Your projects, most recently changed first
  init <project>                     Create a project
  show <project> [--revision <r>]    Its timeline, and who is in it right now
  head <project>                     Its head revision, without the timeline
  edit <project> <ops.json | -> [--summary <line>]
                                     Apply edit operations ([...] or {operations, expected_head})
  words <project> [--pause <seconds>]             The words on the edited timeline, and the pauses
  search <project> <words...> [--limit <n>]       Find spoken words in every file of the project
  files <project>                    Every file in the project, where it is used and where it came from

History
  history <project> [--limit <n>] [--before <next>]
  undo <project> <revision> [--change <index>] [--expected-head <r>]
  restore <project> <revision> [--expected-head <r>]

Shot list
  shot-list <project>                The scenes, shots and the files filed under each
  shot-list edit <project> <ops.json | -> [--expected-revision <n>]
  shot-list import <project> <episode.json | -> [--replace] [--expected-revision <n>]
                                     Bring an episode plan in as the shot list

Layouts and sound
  layouts [list | save <file.json> | delete <layout_id>]
  layout <project> <preset> [--from <t>] [--to <t>]   Lay out screen and camera with a preset
  studio-sound <project> [--media <id,id>] [--no-wait] Clean every voice (billed by box time)
  level <project> --tracks <a1,a2> [--target <lufs>] [--dry-run]

Look and check
  frame <project> <t...> [--height 360|720|1080] [--revision <r>] [--no-wait]
                                     Stills of the cut at timeline times, as the render draws them
  check <project> [--sections <file.json>] [--revision <r>] [--no-wait]
                                     Measure gaps, black, silence, loudness and gains
  import <project> <timeline.fcpxml|.edl> --files <ingested.json> [--format fcpxml|edl]
                                     Open a Descript timeline export as a new project (free)

Working together
  events <project> [--after <seq>] [--follow]     Change notices; --follow streams them live
  comments <project>                 The comments on a project
  comment <project> <text> [--at <t> | --from <t> --to <t>] [--reply-to <id>] [--quote <words>]
  comments resolve|reopen|delete <project> <comment_id>
  working-on <project> <text | --clear> [--clips <id,id>] [--from <t> --to <t>] [--scene <id>]
  presence <project> [--playhead <t>] [--from <t> --to <t>] [--clear]

Prices and renders
  quote <project> [--media <id,id>]  What a render and Studio Sound would cost, before you spend
  render <project> [--json <body>] [--no-wait] [--out <file>]
         [--captions] [--captions-position top] [--captions-size small|large] [--captions-background none] (captions: coming soon)
  captions <project> [--format srt|vtt] [--revision <r>] [--out <file>]   The cut's captions (coming soon)
  status <job_id> | cancel <job_id>
  download <job_id> [--out <file>]   Save a finished render

Times are seconds (12, 12.5) or fractions (1001/30000).
Environment: VIDJUTSU_API_KEY (else the saved key), VIDJUTSU_API_URL (default ${DEFAULT_BASE_URL}),
VIDJUTSU_CLIENT (the name history and Activity show for you, e.g. "Claude Code").
MCP: point your agent at ${DEFAULT_BASE_URL}/mcp.`;

type Args = { positional: string[]; flags: Record<string, string | true> };

function parse(argv: string[]): Args {
  const positional: string[] = [];
  const flags: Record<string, string | true> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg.startsWith("--")) {
      const [key, inline] = arg.slice(2).split("=", 2) as [string, string | undefined];
      const next = argv[i + 1];
      if (inline !== undefined) flags[key] = inline;
      else if (next !== undefined && !next.startsWith("--") && !BOOLEAN.has(key)) {
        flags[key] = next;
        i++;
      } else flags[key] = true;
    } else positional.push(arg);
  }
  return { positional, flags };
}
const BOOLEAN = new Set(["no-wait", "help", "version", "follow", "on", "off", "clear", "dry-run", "captions"]);

function configPath(): string {
  const base = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
  return join(base, "vidjutsu", "cloud.json");
}
function savedKey(): string | undefined {
  try {
    return JSON.parse(readFileSync(configPath(), "utf8")).api_key;
  } catch {
    return undefined;
  }
}
function client(needKey = true): VidJutsu {
  const apiKey = process.env.VIDJUTSU_API_KEY || savedKey();
  if (needKey && !apiKey) fail("not signed in: run `vidjutsu login`, or set VIDJUTSU_API_KEY");
  return new VidJutsu({
    apiKey,
    baseUrl: process.env.VIDJUTSU_API_URL || DEFAULT_BASE_URL,
    clientName: process.env.VIDJUTSU_CLIENT || undefined,
  });
}

function print(value: unknown) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}
function say(text: string) {
  process.stderr.write(`${text}\n`);
}
function fail(message: string): never {
  say(`error: ${message}`);
  process.exit(1);
}
function need(value: string | undefined, what: string): string {
  if (!value) fail(`missing ${what} (see vidjutsu --help)`);
  return value;
}
function flag(args: Args, name: string): string | undefined {
  const value = args.flags[name];
  return typeof value === "string" ? value : undefined;
}

async function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

async function login(args: Args) {
  const api = client(false);
  const email = flag(args, "email") ?? (await ask("Email: "));
  const started = await api.signIn(need(email, "email"));
  const code = await ask("Code from the email: ");
  const done = await api.verify(started.attempt, need(code, "code"));
  const path = configPath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify({ api_key: done.api_key, account_id: done.account_id }, null, 2), {
    mode: 0o600,
  });
  say(`Signed in. Key saved to ${path}.`);
  if (done.checkout_url) say(`Add a card and fund your wallet ($5 minimum): ${done.checkout_url}`);
  const { api_key: _secret, ...rest } = done;
  print(rest);
}

async function download(job: JsonObject, out?: string) {
  const output = job.output as JsonObject | undefined;
  const url = output && typeof output.url === "string" ? output.url : undefined;
  if (!url) fail(`job ${job.job_id} has no output to download (state ${job.state})`);
  const file = out ?? `${job.job_id}.mp4`;
  const response = await fetch(url);
  if (!response.ok || !response.body) fail(`download failed: HTTP ${response.status}`);
  await pipeline(Readable.fromWeb(response.body as never), createWriteStream(file));
  say(`Saved ${file}`);
  return file;
}

function int(args: Args, name: string): number | undefined {
  const value = flag(args, name);
  if (value === undefined) return undefined;
  if (!/^\d+$/.test(value)) fail(`--${name} must be a whole number`);
  return Number(value);
}
function list(args: Args, name: string): string[] | undefined {
  const value = flag(args, name);
  return value === undefined ? undefined : value.split(",").map((item) => item.trim()).filter(Boolean);
}
/** A time as the API takes it: a decimal becomes an exact string ("12.5"), a whole number stays a number. */
function time(value: string | undefined, what: string): Json | undefined {
  if (value === undefined) return undefined;
  if (/^\d+$/.test(value)) return Number(value);
  if (/^\d+(\.\d+)?$|^\d+\/\d+$/.test(value)) return value;
  fail(`${what} must be seconds (12, 12.5) or a fraction (1001/30000)`);
}
function range(args: Args): JsonObject | undefined {
  const start = time(flag(args, "from"), "--from");
  const end = time(flag(args, "to"), "--to");
  if (start === undefined && end === undefined) return undefined;
  if (start === undefined || end === undefined) fail("give both --from and --to");
  return { start, end };
}

/** --captions and its options, as the render body's captions object. */
function captionsOption(args: Args): JsonObject | undefined {
  const position = flag(args, "captions-position");
  const size = flag(args, "captions-size");
  const background = flag(args, "captions-background");
  if (!args.flags.captions && position === undefined && size === undefined && background === undefined) return undefined;
  if (position !== undefined && position !== "bottom" && position !== "top") fail("--captions-position must be bottom or top");
  if (size !== undefined && !["small", "medium", "large"].includes(size)) fail("--captions-size must be small, medium or large");
  if (background !== undefined && background !== "solid" && background !== "none") fail("--captions-background must be solid or none");
  return {
    on: true,
    ...(position ? { position } : {}),
    ...(size ? { size } : {}),
    ...(background ? { background } : {}),
  };
}

/** Start a job (or find it already done), wait for it unless --no-wait, then read the result. */
async function jobThenRead(args: Args, start: () => Promise<StartedJob>, read: () => Promise<JsonObject>) {
  const api = client();
  const started = await start();
  if (started.job_id && started.started !== false && !args.flags["no-wait"]) {
    say(`Working (job ${started.job_id})...`);
    const job = await api.waitForJob(started.job_id);
    if (job.state !== "succeeded") {
      print(job);
      process.exit(1);
    }
  } else if (args.flags["no-wait"]) return print(started);
  return print(await read());
}

/** Start a job, wait for it unless --no-wait, then print what it made (its output). */
async function jobOutput(args: Args, start: () => Promise<StartedJob>) {
  const api = client();
  const started = await start();
  if (!started.job_id || args.flags["no-wait"]) return print(started);
  say(`Working (job ${started.job_id})...`);
  const job = await api.waitForJob(started.job_id);
  if (job.state !== "succeeded") {
    print(job);
    process.exit(1);
  }
  return print((job.output ?? job) as Json);
}

async function readOperations(source: string): Promise<JsonObject> {
  const text = source === "-" ? readFileSync(0, "utf8") : readFileSync(source, "utf8");
  const parsed = JSON.parse(text);
  return Array.isArray(parsed) ? { operations: parsed } : parsed;
}

async function run(argv: string[]) {
  const args = parse(argv);
  const [command, ...rest] = args.positional;
  if (args.flags.version || command === "version") return print({ version: VERSION });
  if (!command || args.flags.help || command === "help") return say(HELP);
  switch (command) {
    case "login":
      return login(args);
    case "logout":
      if (existsSync(configPath())) rmSync(configPath());
      return say("Signed out.");
    case "account":
      return print(await client().account());
    case "usage":
      return print(await client().usage());
    case "entitlements":
      return print(await client().entitlements());
    case "wallet":
      return print(await client().wallet());
    case "keys": {
      const [action = "list", value] = rest;
      if (action === "list") return print(await client().listKeys());
      if (action === "create") return print(await client().createKey(need(value, "key name")));
      if (action === "revoke") return print(await client().revokeKey(need(value, "key id")));
      return fail(`unknown keys action ${action}`);
    }
    case "billing": {
      const [action = "top-up"] = rest;
      const amount = flag(args, "amount");
      const money = amount === undefined ? {} : { amount_usd: Number(amount) };
      if (amount !== undefined && !(Number(amount) > 0)) fail("--amount must be a dollar amount, such as 5 or 12.50");
      if (action === "checkout") return print(await client().billingCheckout(money));
      if (action === "top-up" || action === "topup") return print(await client().billingTopUp(money));
      if (action === "portal") return print(await client().billingPortal());
      if (action === "auto-top-up") {
        if (!args.flags.on === !args.flags.off) fail("say --on or --off");
        const threshold = flag(args, "threshold");
        return print(
          await client().billingAutoTopUp({
            enabled: !!args.flags.on,
            ...(threshold !== undefined ? { threshold_usd: threshold } : {}),
            ...(amount !== undefined ? { amount_usd: amount } : {}),
          }),
        );
      }
      return fail(`unknown billing action ${action}`);
    }
    case "upload": {
      const file = need(rest[0], "file");
      const name = flag(args, "name") ?? basename(file);
      say(`Uploading ${file}...`);
      return print(await client().upload(name, new Uint8Array(readFileSync(file)), { project: flag(args, "project") }));
    }
    case "ingest":
      return print(
        await client().ingestUrl(need(rest[0], "https URL"), flag(args, "name"), undefined, { project: flag(args, "project") }),
      );
    case "url": {
      const ttl = flag(args, "ttl");
      return print(await client().mediaUrl(need(rest[0], "hash"), ttl ? Number(ttl) : undefined));
    }
    case "preview": {
      const hash = need(rest[0], "hash");
      const api = client();
      return jobThenRead(args, () => api.makePreview(hash, { project: flag(args, "project") }), () => api.mediaPreview(hash));
    }
    case "transcript": {
      const hash = need(rest[0], "hash");
      const api = client();
      return jobThenRead(
        args,
        () => api.makeTranscript(hash, { project: flag(args, "project") }),
        () => api.mediaTranscript(hash),
      );
    }
    case "projects":
      return print(await client().listProjects({ cursor: flag(args, "cursor"), limit: int(args, "limit") }));
    case "init":
      return print(await client().init(need(rest[0], "project")));
    case "show":
      return print(await client().show(need(rest[0], "project"), { revision: flag(args, "revision") }));
    case "head":
      return print(await client().head(need(rest[0], "project")));
    case "edit": {
      const project = need(rest[0], "project");
      const body = await readOperations(need(rest[1], "operations file (or - for stdin)"));
      const { operations, ...options } = body;
      const summary = flag(args, "summary");
      if (summary) options.summary = summary;
      return print(await client().edit(project, operations as JsonObject[], options as JsonObject));
    }
    case "level": {
      const project = need(rest[0], "project");
      const tracks = list(args, "tracks");
      if (!tracks?.length) fail("missing --tracks (audio track ids, such as a1)");
      const target = flag(args, "target");
      return print(
        await client().level(project, {
          tracks,
          ...(target !== undefined ? { target: Number(target) } : {}),
          ...(args.flags["dry-run"] ? { dry_run: true } : {}),
        }),
      );
    }
    case "words":
      return print(
        await client().timelineWords(need(rest[0], "project"), { revision: flag(args, "revision"), pause: flag(args, "pause") }),
      );
    case "search": {
      const project = need(rest[0], "project");
      const words = rest.slice(1).join(" ");
      return print(await client().searchWords(project, need(words, "words to find"), { limit: int(args, "limit") }));
    }
    case "files":
      return print(await client().files(need(rest[0], "project")));
    case "history":
      return print(
        await client().history(need(rest[0], "project"), { limit: int(args, "limit"), before: flag(args, "before") }),
      );
    case "undo":
      return print(
        await client().undo(need(rest[0], "project"), need(rest[1], "revision"), {
          change: int(args, "change"),
          expected_head: flag(args, "expected-head"),
        }),
      );
    case "restore":
      return print(
        await client().restore(need(rest[0], "project"), need(rest[1], "revision"), {
          expected_head: flag(args, "expected-head"),
        }),
      );
    case "shot-list":
    case "shotlist": {
      if (rest[0] === "import") {
        const api = client();
        const project = need(rest[1], "project");
        const file = need(rest[2], "episode file (episode.json, or - for stdin)");
        const episode = JSON.parse(readFileSync(file === "-" ? 0 : file, "utf8"));
        let expected = int(args, "expected-revision");
        if (expected === undefined) expected = Number((await api.shotList(project)).revision ?? 0);
        return print(await api.shotListImport(project, expected, episode, args.flags.replace ? { replace: true } : {}));
      }
      if (rest[0] !== "edit") return print(await client().shotList(need(rest[0], "project")));
      const api = client();
      const project = need(rest[1], "project");
      const body = await readOperations(need(rest[2], "operations file (or - for stdin)"));
      let expected = int(args, "expected-revision") ?? (body.expected_revision as number | undefined);
      if (expected === undefined) expected = Number((await api.shotList(project)).revision ?? 0);
      return print(await api.shotListEdit(project, expected, body.operations as never));
    }
    case "layouts": {
      const [action = "list", value] = rest;
      if (action === "list") return print(await client().layouts());
      if (action === "save") {
        const preset = JSON.parse(readFileSync(need(value, "preset file (or - for stdin)") === "-" ? 0 : value!, "utf8"));
        return print(await client().saveLayout(preset));
      }
      if (action === "delete") return print(await client().deleteLayout(need(value, "layout id")));
      return fail(`unknown layouts action ${action}`);
    }
    case "layout": {
      const project = need(rest[0], "project");
      const preset = need(rest[1], "preset (an id or name from vidjutsu layouts)");
      return print(
        await client().applyLayout(project, preset, {
          from: time(flag(args, "from"), "--from"),
          to: time(flag(args, "to"), "--to"),
        }),
      );
    }
    case "studio-sound": {
      const project = need(rest[0], "project");
      const api = client();
      return jobThenRead(args, () => api.studioSound(project, { media: list(args, "media") }), () => api.show(project));
    }
    case "frame": {
      const project = need(rest[0], "project");
      const times = rest.slice(1).map((value) => time(value, "each time") as Json);
      if (times.length === 0) fail("give at least one timeline time, e.g. vidjutsu frame film 12.5 40");
      const height = int(args, "height");
      if (height !== undefined && ![360, 720, 1080].includes(height)) fail("--height must be 360, 720 or 1080");
      const api = client();
      return jobOutput(args, () =>
        api.frame(project, times, { height: height as 360 | 720 | 1080 | undefined, revision: flag(args, "revision") }),
      );
    }
    case "check": {
      const project = need(rest[0], "project");
      const file = flag(args, "sections");
      const sections = file ? JSON.parse(readFileSync(file, "utf8")) : undefined;
      const api = client();
      return jobOutput(args, () => api.check(project, { sections, revision: flag(args, "revision") }));
    }
    case "import": {
      const project = need(rest[0], "project");
      const timeline = readFileSync(need(rest[1], "timeline file (a Descript FCPXML or EDL export)"), "utf8");
      const filesPath = need(flag(args, "files"), "--files (a JSON list of ingest results: {name, media, audio})");
      const files = JSON.parse(readFileSync(filesPath, "utf8"));
      if (!Array.isArray(files)) fail("--files must be a JSON list of ingest results");
      const format = flag(args, "format");
      if (format !== undefined && format !== "fcpxml" && format !== "edl") fail("--format must be fcpxml or edl");
      return print(
        await client().importTimeline({ project, timeline, files, format: format as "fcpxml" | "edl" | undefined }),
      );
    }
    case "quote":
      return print(await client().quote(need(rest[0], "project"), { media: list(args, "media") }));
    case "events": {
      const project = need(rest[0], "project");
      if (!args.flags.follow) {
        return print(await client().events(project, { after: int(args, "after"), limit: int(args, "limit") }));
      }
      const after = flag(args, "after");
      for await (const event of client().stream(project, { lastEventId: after })) {
        process.stdout.write(`${JSON.stringify(event)}\n`);
      }
      return;
    }
    case "comments": {
      const [first, project, commentId] = rest;
      if (first === "resolve" || first === "reopen") {
        return print(
          await client().resolveComment(need(project, "project"), need(commentId, "comment id"), first === "resolve"),
        );
      }
      if (first === "delete") return print(await client().deleteComment(need(project, "project"), need(commentId, "comment id")));
      return print(await client().comments(need(first, "project")));
    }
    case "comment": {
      const project = need(rest[0], "project");
      const text = need(rest.slice(1).join(" "), "comment text");
      const body: JsonObject = { text };
      const replyTo = flag(args, "reply-to");
      if (replyTo) body.reply_to = replyTo;
      const at = time(flag(args, "at"), "--at");
      if (at !== undefined) body.time = typeof at === "number" ? String(at) : at;
      const span = range(args);
      if (span) Object.assign(body, { start: String(span.start), end: String(span.end) });
      const quote = flag(args, "quote");
      if (quote) body.quote = quote;
      if (!replyTo && at === undefined && !span) fail("say where: --at <t>, or --from <t> --to <t> (or --reply-to <id>)");
      return print(await client().addComment(project, body as JsonObject & { text: string }));
    }
    case "working-on": {
      const project = need(rest[0], "project");
      if (args.flags.clear) return print(await client().workingOn(project, { text: null }));
      const span = range(args);
      return print(
        await client().workingOn(project, {
          text: need(rest.slice(1).join(" "), "what you are doing (or --clear)"),
          ...(list(args, "clips") ? { clips: list(args, "clips") } : {}),
          ...(span ? { range: span } : {}),
          ...(flag(args, "scene") ? { scene: flag(args, "scene") } : {}),
        }),
      );
    }
    case "presence": {
      const project = need(rest[0], "project");
      if (args.flags.clear) return print(await client().setPresence(project, { selection: null, playhead: null }));
      const playhead = time(flag(args, "playhead"), "--playhead");
      const span = range(args);
      if (playhead === undefined && !span) fail("give --playhead <t>, --from <t> --to <t>, or --clear");
      return print(
        await client().setPresence(project, {
          ...(playhead !== undefined ? { playhead } : {}),
          ...(span ? { selection: span } : {}),
        }),
      );
    }
    case "render": {
      const api = client();
      const project = need(rest[0], "project");
      const body = flag(args, "json") ? (JSON.parse(flag(args, "json")!) as JsonObject) : {};
      const captions = captionsOption(args);
      if (captions) body.captions = captions;
      let job = await api.render(project, body, `render-${project}-${Date.now()}`);
      if (!args.flags["no-wait"]) {
        say(`Rendering (job ${job.job_id})...`);
        let last = "";
        job = await api.waitForRender(job.job_id, {
          onUpdate: (update) => {
            if (update.state !== last) say(`  ${(last = update.state)}`);
          },
        });
        const out = flag(args, "out");
        if (out && job.state === "succeeded") await download(job, out);
      }
      print(job);
      if (job.state === "failed") process.exit(1);
      return;
    }
    case "captions": {
      const project = need(rest[0], "project");
      const format = flag(args, "format");
      if (format !== undefined && format !== "srt" && format !== "vtt") fail("--format must be srt or vtt");
      const result = await client().captions(project, {
        format: format as "srt" | "vtt" | undefined,
        revision: flag(args, "revision"),
      });
      const out = flag(args, "out");
      if (!out) return process.stdout.write(String(result.file ?? ""));
      writeFileSync(out, String(result.file ?? ""));
      return say(`Saved ${out}`);
    }
    case "status":
      return print(await client().renderStatus(need(rest[0], "job id")));
    case "cancel":
      return print(await client().cancelRender(need(rest[0], "job id")));
    case "download": {
      const api = client();
      const job = await api.renderStatus(need(rest[0], "job id"));
      await download(job, flag(args, "out"));
      return;
    }
    default:
      fail(`unknown command ${command} (see vidjutsu --help)`);
  }
}

run(process.argv.slice(2)).catch((error: unknown) => {
  if (error instanceof VidJutsuError) {
    say(`error: ${error.message} (${error.code}, HTTP ${error.status})`);
    if (error.fixUrl) say(`fix it here: ${error.fixUrl}`);
    process.exit(1);
  }
  fail(error instanceof Error ? error.message : String(error));
});
