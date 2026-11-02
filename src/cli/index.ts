#!/usr/bin/env node
// The `vidjutsu` command line for VidJutsu Cloud. Every command prints the
// API's JSON on stdout; progress and prompts go to stderr.
import { createWriteStream, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import { createInterface } from "node:readline/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { DEFAULT_BASE_URL, VidJutsu, VidJutsuError, type JsonObject } from "../client";
import { VERSION } from "./version";

const HELP = `vidjutsu ${VERSION}: video editing for agents, in the cloud.

Account
  login [--email <address>]          Sign up or sign in with an emailed code; saves an API key
  logout                             Forget the saved key
  account | usage | entitlements     Your account, this period's usage, your plan's limits
  keys [list | create <name> | revoke <key_id>]
  billing [checkout | portal]        Stripe links to subscribe or manage billing

Media
  upload <file> [--name <name>]      Upload a file straight to storage and add it to your library
  ingest <https-url> [--name <name>] Add media from a link
  url <hash> [--ttl <seconds>]       A time-limited download link

Projects and renders
  init <project>                     Create a project
  show <project>                     Its current timeline
  edit <project> <ops.json | ->      Apply edit operations ([...] or {operations, expected_head})
  render <project> [--json <body>] [--no-wait] [--out <file>]
  status <job_id> | cancel <job_id>
  download <job_id> [--out <file>]   Save a finished render

Environment: VIDJUTSU_API_KEY (else the saved key), VIDJUTSU_API_URL (default ${DEFAULT_BASE_URL}).
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
const BOOLEAN = new Set(["no-wait", "help", "version"]);

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
  return new VidJutsu({ apiKey, baseUrl: process.env.VIDJUTSU_API_URL || DEFAULT_BASE_URL });
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
  if (done.checkout_url) say(`No plan yet: subscribe at ${done.checkout_url}`);
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
    case "keys": {
      const [action = "list", value] = rest;
      if (action === "list") return print(await client().listKeys());
      if (action === "create") return print(await client().createKey(need(value, "key name")));
      if (action === "revoke") return print(await client().revokeKey(need(value, "key id")));
      return fail(`unknown keys action ${action}`);
    }
    case "billing": {
      const [action = "checkout"] = rest;
      if (action === "checkout") return print(await client().billingCheckout());
      if (action === "portal") return print(await client().billingPortal());
      return fail(`unknown billing action ${action}`);
    }
    case "upload": {
      const file = need(rest[0], "file");
      const name = flag(args, "name") ?? basename(file);
      say(`Uploading ${file}...`);
      return print(await client().upload(name, new Uint8Array(readFileSync(file))));
    }
    case "ingest":
      return print(await client().ingestUrl(need(rest[0], "https URL"), flag(args, "name")));
    case "url": {
      const ttl = flag(args, "ttl");
      return print(await client().mediaUrl(need(rest[0], "hash"), ttl ? Number(ttl) : undefined));
    }
    case "init":
      return print(await client().init(need(rest[0], "project")));
    case "show":
      return print(await client().show(need(rest[0], "project")));
    case "edit": {
      const project = need(rest[0], "project");
      const body = await readOperations(need(rest[1], "operations file (or - for stdin)"));
      const { operations, ...options } = body;
      return print(await client().edit(project, operations as JsonObject[], options as JsonObject));
    }
    case "render": {
      const api = client();
      const project = need(rest[0], "project");
      const body = flag(args, "json") ? (JSON.parse(flag(args, "json")!) as JsonObject) : {};
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
