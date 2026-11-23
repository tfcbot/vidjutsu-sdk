// `vidjutsu graphics ...`: render HTML motion graphics scenes and edit them in
// workspaces. Customers never run code on our boxes: only the renderer draws
// their scenes (each page's `render(t)`), on locked-down boxes.
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import {
  graphicsText,
  sha256Hex,
  type GraphicsFilm,
  type GraphicsLocalFile,
  type GraphicsWrite,
  type JsonObject,
  type RenderJob,
  type VidJutsu,
} from "../client";

export const GRAPHICS_HELP = `Motion graphics (HTML scenes drawn frame by frame; billed by box time)
  graphics render <folder | film.json> [--name <name>] [--no-wait] [--out <file.mp4>] [--key <idempotency key>]
                                     Upload the folder's files (film.json + one folder per scene), render
                                     the film and print the video's media id (place it with edit)
  graphics render <film.json> --workspace <ws> [...]     Render a workspace's current files instead
  graphics status <job_id> | cancel <job_id>
  graphics source <bundle>           A bundle's files with one-day download links
  graphics ws ls <ws>                A workspace's files, current bundle and history
  graphics ws push <ws> <folder> [--keep]       Make the workspace match the folder (--keep: no deletes)
  graphics ws pull <ws> <folder>     Download the workspace's files into the folder
  graphics ws read <ws> <path>       Print a text file (or its download link)
  graphics ws write <ws> <path> <file | ->      Write one text file whole
  graphics ws patch <ws> <path> --find <text> --with <text>
  graphics ws patch <ws> <patches.json>         [{path, find, replace}, ...]
  graphics ws rm <ws> <path...>      Delete files
  graphics ws restore <ws> <bundle>  Go back to an earlier bundle (from ws ls history)
                                     Workspace writes take --expected-bundle <bundle> (409 if it moved on)`;

type Args = { positional: string[]; flags: Record<string, string | true> };
export type Cli = {
  client: () => VidJutsu;
  print: (value: unknown) => void;
  say: (text: string) => void;
  fail: (message: string) => never;
  need: (value: string | undefined, what: string) => string;
  flag: (args: Args, name: string) => string | undefined;
};

/** Most changes one workspace write takes, and the inline text we put in one call. */
const MAX_CHANGES = 200;
const MAX_WRITE_TEXT = 2 * 1024 * 1024;

/** Every file under `root` as bundle paths (`/` between folders), leaving out dot files and folders. */
export function readFolder(root: string, say: (text: string) => void = () => undefined): GraphicsLocalFile[] {
  const files: GraphicsLocalFile[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = join(dir, entry.name);
      if (entry.name.startsWith(".")) {
        say(`  skipping ${relative(root, full)} (dot files are not sent)`);
        continue;
      }
      const stat = statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (stat.isFile()) {
        files.push({ path: relative(root, full).split(sep).join("/"), data: new Uint8Array(readFileSync(full)) });
      }
    }
  };
  walk(root);
  return files;
}

/** The film folder and film.json for a path that is either. */
export function filmPaths(path: string): { folder: string; film: string } {
  if (existsSync(path) && statSync(path).isDirectory()) return { folder: path, film: join(path, "film.json") };
  return { folder: dirname(path), film: path };
}

/** Each scene's entry page must be among the files, so a typo fails here and not on a box. */
export function checkScenes(film: GraphicsFilm, paths: Set<string>): string[] {
  const problems: string[] = [];
  if (!Array.isArray(film.scenes) || film.scenes.length === 0) return ["film.json has no scenes"];
  film.scenes.forEach((scene, i) => {
    const dir = (scene.dir ?? "").replace(/^\/+|\/+$/g, "");
    const entry = `${dir ? `${dir}/` : ""}${scene.entry ?? "index.html"}`;
    if (!paths.has(entry)) problems.push(`scene ${i + 1}: ${entry} is not in the folder`);
    if (!(typeof scene.seconds === "number" && scene.seconds > 0)) problems.push(`scene ${i + 1}: seconds must be above 0`);
  });
  return problems;
}

/** The changes that make a workspace (remote path -> sha256) match local files, in writes of up to 200 changes. */
export async function planPush(
  local: GraphicsLocalFile[],
  remote: Map<string, string>,
  keep: boolean,
): Promise<{ writes: GraphicsWrite[]; byHash: Map<string, Uint8Array>; changed: number }> {
  const byHash = new Map<string, Uint8Array>();
  type Change = { kind: "write" | "file" | "delete"; path: string; text?: string; sha256?: string; bytes?: number };
  const changes: Change[] = [];
  const seen = new Set<string>();
  for (const file of local) {
    seen.add(file.path);
    const sha256 = await sha256Hex(file.data);
    if (remote.get(file.path) === sha256) continue;
    const text = graphicsText(file.path, file.data);
    if (text !== undefined) changes.push({ kind: "write", path: file.path, text });
    else {
      byHash.set(sha256, file.data);
      changes.push({ kind: "file", path: file.path, sha256, bytes: file.data.byteLength });
    }
  }
  if (!keep) for (const path of remote.keys()) if (!seen.has(path)) changes.push({ kind: "delete", path });
  // Deletes go first, so a file can replace a folder of the same name.
  changes.sort((a, b) => Number(b.kind === "delete") - Number(a.kind === "delete"));
  const writes: GraphicsWrite[] = [];
  let current: GraphicsWrite = {};
  let count = 0;
  let text = 0;
  for (const change of changes) {
    const size = change.text ? new TextEncoder().encode(change.text).byteLength : 0;
    if (count === MAX_CHANGES || (size && text + size > MAX_WRITE_TEXT)) {
      writes.push(current);
      current = {};
      count = 0;
      text = 0;
    }
    count++;
    text += size;
    if (change.kind === "write") (current.write ??= []).push({ path: change.path, text: change.text! });
    else if (change.kind === "file") (current.files ??= []).push({ path: change.path, sha256: change.sha256!, bytes: change.bytes! });
    else (current.delete ??= []).push(change.path);
  }
  if (count) writes.push(current);
  return { writes, byHash, changed: changes.length };
}

/** A bundle path joined under `root`, refused when it would land outside it. */
export function safeJoin(root: string, path: string): string {
  const base = resolve(root);
  const target = resolve(base, ...path.split("/"));
  if (path.split("/").some((part) => part === "" || part === "." || part === "..") || !target.startsWith(base + sep)) {
    throw new Error(`refusing unsafe path ${JSON.stringify(path)}`);
  }
  return target;
}

export async function graphics(rest: string[], args: Args, cli: Cli): Promise<void> {
  const { print, say, fail, need, flag } = cli;
  const [action, ...more] = rest;
  switch (action) {
    case "render":
      return render(more, args, cli);
    case "status":
      return print(await cli.client().graphicsStatus(need(more[0], "job id")));
    case "cancel":
      return print(await cli.client().cancelGraphics(need(more[0], "job id")));
    case "source":
      return print(await cli.client().graphicsSource(need(more[0], "bundle id")));
    case "ws":
    case "workspace":
      return workspace(more, args, cli);
    case undefined:
    case "help":
      return say(GRAPHICS_HELP);
    default:
      return fail(`unknown graphics action ${action} (see vidjutsu graphics help)`);
  }

  async function render(more: string[], args: Args, cli: Cli) {
    const api = cli.client();
    const { folder, film: filmFile } = filmPaths(need(more[0], "film folder (with film.json) or film.json"));
    if (!existsSync(filmFile)) fail(`no film.json at ${filmFile}`);
    let film: GraphicsFilm;
    try {
      film = JSON.parse(readFileSync(filmFile, "utf8"));
    } catch (error) {
      return fail(`${filmFile} is not JSON: ${(error as Error).message}`);
    }
    const name = flag(args, "name");
    const ws = flag(args, "workspace");
    let source: { bundle?: string; workspace?: string };
    if (ws) {
      const listed = await api.graphicsList(ws);
      const problems = checkScenes(film, new Set(listed.files.map((f) => f.path)));
      if (problems.length) fail(`workspace ${ws}: ${problems.join("; ")}`);
      source = { workspace: ws };
    } else {
      const files = readFolder(folder, say);
      const problems = checkScenes(film, new Set(files.map((f) => f.path)));
      if (problems.length) fail(problems.join("; "));
      say(`Sending ${files.length} files...`);
      const bundle = await api.uploadGraphics(files, {
        onUpload: (missing) => say(`  uploading ${missing.paths[0]} (${missing.bytes} bytes)`),
      });
      say(`Bundle ${bundle.bundle}`);
      source = { bundle: bundle.bundle };
    }
    const key = flag(args, "key") ?? `graphics-${source.bundle ?? source.workspace}-${Date.now()}`;
    let job: RenderJob = await api.makeGraphics({ film, ...source, ...(name ? { name } : {}) }, key);
    if (args.flags["no-wait"]) return print(job);
    say(`Rendering (job ${job.job_id})...`);
    let last = "";
    job = await api.waitForGraphics(job.job_id, {
      onUpdate: (update) => {
        if (update.state !== last) say(`  ${(last = update.state)}`);
      },
    });
    if (job.state !== "succeeded") {
      print(job);
      process.exit(1);
    }
    const output = (job.output ?? {}) as JsonObject;
    const media = (output.media ?? {}) as JsonObject;
    if (typeof media.id === "string") say(`Media ${media.id}: place it with edit (add_media, insert_clip).`);
    const out = flag(args, "out");
    if (out) {
      const hash = typeof media.asset_hash === "string" ? media.asset_hash : undefined;
      if (!hash) return fail("the job has no media to download");
      const { url } = await api.mediaUrl(hash);
      const response = await fetch(url);
      if (!response.ok) fail(`download failed: HTTP ${response.status}`);
      writeFileSync(out, new Uint8Array(await response.arrayBuffer()));
      say(`Saved ${out}`);
    }
    print(job);
  }

  async function workspace(more: string[], args: Args, cli: Cli) {
    const api = cli.client();
    const [verb, wsName, ...tail] = more;
    const ws = need(wsName, "workspace name");
    const expected = flag(args, "expected-bundle");
    const guard = expected ? { expected_bundle: expected } : {};
    const writeAndUpload = async (changes: GraphicsWrite, byHash = new Map<string, Uint8Array>()) => {
      const answer = await api.graphicsWrite(ws, changes);
      await api.putMissing(answer.missing, byHash, (missing) => say(`  uploading ${missing.paths[0]} (${missing.bytes} bytes)`));
      return answer;
    };
    switch (verb) {
      case "ls":
      case "list":
        return print(await api.graphicsList(ws));
      case "read": {
        const file = await api.graphicsRead(ws, need(tail[0], "path"));
        if (typeof file.text === "string") return void process.stdout.write(file.text);
        return print(file);
      }
      case "write": {
        const path = need(tail[0], "path inside the workspace");
        const from = need(tail[1], "file to write (or - for stdin)");
        const text = readFileSync(from === "-" ? 0 : from, "utf8");
        return print(await writeAndUpload({ write: [{ path, text }], ...guard }));
      }
      case "patch": {
        const first = need(tail[0], "path (with --find and --with) or a patches file");
        const find = flag(args, "find");
        const replace = flag(args, "with");
        if (find !== undefined && replace === undefined) fail("give --with with --find (--with \"\" removes the text)");
        const patch =
          find !== undefined
            ? [{ path: first, find, replace: replace! }]
            : JSON.parse(readFileSync(first === "-" ? 0 : first, "utf8"));
        if (!Array.isArray(patch)) fail("patches must be a list of {path, find, replace}");
        return print(await writeAndUpload({ patch, ...guard }));
      }
      case "rm":
      case "delete": {
        if (!tail.length) fail("give the paths to delete");
        return print(await writeAndUpload({ delete: tail, ...guard }));
      }
      case "restore":
        return print(await writeAndUpload({ restore: need(tail[0], "bundle (from ws ls history)"), ...guard }));
      case "push": {
        const folder = need(tail[0], "folder");
        if (!existsSync(folder) || !lstatSync(folder).isDirectory()) fail(`${folder} is not a folder`);
        const local = readFolder(folder, say);
        const listed = await api.graphicsList(ws);
        const remote = new Map(listed.files.map((f) => [f.path, f.sha256]));
        const plan = await planPush(local, remote, !!args.flags.keep);
        if (!plan.writes.length) {
          say(`${ws} already matches ${folder}.`);
          return print(listed);
        }
        let bundle = expected ?? listed.bundle ?? undefined;
        let answer: JsonObject = {};
        for (const changes of plan.writes) {
          answer = await writeAndUpload({ ...changes, ...(bundle ? { expected_bundle: bundle } : {}) }, plan.byHash);
          bundle = String(answer.bundle);
        }
        say(`Pushed ${plan.changed} changes to ${ws}.`);
        return print(answer);
      }
      case "pull": {
        const folder = need(tail[0], "folder");
        const listed = await api.graphicsList(ws);
        if (!listed.bundle) {
          say(`${ws} is empty.`);
          return print(listed);
        }
        const source = await api.graphicsSource(listed.bundle);
        const files = (source.files ?? []) as JsonObject[];
        let wrote = 0;
        for (const file of files) {
          const path = String(file.path);
          const target = safeJoin(folder, path);
          if (existsSync(target) && (await sha256Hex(new Uint8Array(readFileSync(target)))) === file.sha256) continue;
          if (typeof file.url !== "string") fail(`${path} is not stored`);
          const response = await fetch(file.url as string);
          if (!response.ok) fail(`${path}: download failed (HTTP ${response.status})`);
          const data = new Uint8Array(await response.arrayBuffer());
          if ((await sha256Hex(data)) !== file.sha256) fail(`${path}: downloaded bytes do not match its sha256`);
          mkdirSync(dirname(target), { recursive: true });
          writeFileSync(target, data);
          wrote++;
        }
        say(`Pulled ${wrote} of ${files.length} files of ${ws} (bundle ${listed.bundle}) into ${folder}.`);
        return print({ workspace: ws, bundle: listed.bundle, version: listed.version, files: files.length, written: wrote });
      }
      default:
        return fail(`unknown graphics ws action ${verb ?? ""} (ls, push, pull, read, write, patch, rm, restore)`);
    }
  }
}
