// Before a version goes to npm (BIZ-2495): every route this SDK calls must
// already exist on the production API, so the SDK never ships ahead of the
// gateway. A route that exists answers without a key with 401 (or 400/405);
// one that doesn't answers 404 "No such route". Nothing is created and no key
// is used.
//
//   bun scripts/check-api.ts [base url]   default https://api.vidjutsu.ai
//   CHECK_API_WAIT_MINUTES=45              keep retrying missing routes this long
//                                          (a gateway release may be under way)
import { readFileSync } from "node:fs";

const base = (process.argv[2] ?? "https://api.vidjutsu.ai").replace(/\/$/, "");
const waitMinutes = Number(process.env.CHECK_API_WAIT_MINUTES ?? 0);
const source = readFileSync(new URL("../src/client.ts", import.meta.url), "utf8");

// request("GET", `/projects/${seg(project)}/files`) and the like.
const calls = new Map<string, { method: string; path: string }>();
for (const m of source.matchAll(/request(?:<[^>]*>)?\(\s*"(GET|POST|DELETE)",\s*[`"]([^`"]+)[`"]/g)) {
  const method = m[1]!;
  const path = m[2]!
    .replace(/\$\{query[^}]*\}+\)?\}?/g, "")
    .replace(/\$\{[^}]+\}/g, "release-check")
    .replace(/\?.*$/, "");
  calls.set(`${method} ${path}`, { method, path });
}
if (calls.size < 20) throw new Error(`Found only ${calls.size} routes in src/client.ts; the pattern needs updating.`);

async function missing(): Promise<string[]> {
  const out: string[] = [];
  for (const [name, { method, path }] of calls) {
    const res = await fetch(base + path, {
      method,
      headers: { "content-type": "application/json", "VidJutsu-Client": "sdk-release-check" },
      body: method === "GET" ? undefined : "{}",
      signal: AbortSignal.timeout(30_000),
    });
    const text = await res.text();
    if (res.status >= 500) throw new Error(`${name} -> HTTP ${res.status} on ${base}`);
    if (res.status === 404 && /No such route/i.test(text)) out.push(name);
  }
  return out;
}

const deadline = Date.now() + waitMinutes * 60_000;
let gone = await missing();
while (gone.length && Date.now() < deadline) {
  console.log(`waiting for ${base} to serve: ${gone.join(", ")}`);
  await new Promise((r) => setTimeout(r, 60_000));
  gone = await missing();
}
if (gone.length) {
  console.error(`${base} does not serve ${gone.length} route(s) this SDK calls: ${gone.join(", ")}. Release the gateway first.`);
  process.exit(1);
}
console.log(`All ${calls.size} routes this SDK calls exist on ${base}.`);
