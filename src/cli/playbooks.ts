// `vidjutsu playbooks save <folder>` and `get --out <folder>`: a playbook as a
// folder in the built-ins' shape (SKILL.md, playbook.json, files/).
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import type { JsonObject, PlaybookInput } from "../client";

/**
 * A playbook to save: a JSON file (or - for stdin), or a folder in the
 * built-ins' shape: SKILL.md (the method), playbook.json (optional metadata)
 * and files/ (starter files, any depth).
 */
export function readPlaybook(source: string): PlaybookInput {
  if (source === "-" || !statSync(source).isDirectory()) return JSON.parse(readFileSync(source === "-" ? 0 : source, "utf8"));
  const meta = join(source, "playbook.json");
  const body: PlaybookInput = existsSync(meta) ? JSON.parse(readFileSync(meta, "utf8")) : {};
  const skill = join(source, "SKILL.md");
  if (existsSync(skill)) body.instructions = readFileSync(skill, "utf8");
  if (!body.name && body.instructions) body.name = /^#\s+(.+)$/m.exec(body.instructions)?.[1]?.trim() ?? basename(source);
  const files = join(source, "files");
  if (existsSync(files)) {
    const walk = (dir: string, prefix: string): Array<{ path: string; text: string }> =>
      readdirSync(dir).sort().flatMap(name => {
        const full = join(dir, name);
        const rel = prefix ? `${prefix}/${name}` : name;
        return statSync(full).isDirectory() ? walk(full, rel) : [{ path: rel, text: readFileSync(full, "utf8") }];
      });
    body.files = walk(files, "");
  }
  // A built-in fetched with get --out is saved as your own copy, under a new id.
  if ((body as Record<string, unknown>).builtin === true) delete body.id;
  // Fields only the server sets are not sent back.
  for (const key of ["builtin", "created_at", "updated_at", "version", "needs", "checks", "styles", "bring", "get", "creator", "license"]) {
    delete (body as Record<string, unknown>)[key];
  }
  return body;
}

/** The folder readPlaybook reads: SKILL.md, playbook.json and files/. */
export function writePlaybookFolder(dir: string, playbook: JsonObject) {
  const { instructions, files, ...meta } = playbook;
  mkdirSync(dir, { recursive: true });
  if (typeof instructions === "string") writeFileSync(join(dir, "SKILL.md"), instructions);
  writeFileSync(join(dir, "playbook.json"), `${JSON.stringify(meta, null, 2)}\n`);
  for (const file of (Array.isArray(files) ? files : []) as Array<{ path: string; text: string }>) {
    if (file.path.split("/").includes("..") || file.path.startsWith("/")) continue;
    const target = join(dir, "files", file.path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, file.text);
  }
}

