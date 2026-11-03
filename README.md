# vidjutsu

The command line and TypeScript SDK for **VidJutsu Cloud**: video editing
built for agents. Upload takes, edit a timeline with history, and render it on
cloud machines through one API (`https://api.vidjutsu.ai`) or MCP
(`https://api.vidjutsu.ai/mcp`).

## Install

```sh
npm i -g vidjutsu
# or a standalone binary (macOS and Linux):
curl -fsSL https://raw.githubusercontent.com/tfcbot/vidjutsu-sdk/main/install.sh | sh
```

## Start

```sh
vidjutsu login                 # email, then the code we send you; saves an API key
vidjutsu billing checkout      # Pro: $25 a month plus usage (Stripe Checkout link)

vidjutsu upload take1.mp4      # straight to storage; prints the media item
vidjutsu init film
vidjutsu edit film ops.json    # e.g. add_media, insert_clip, set_fade
vidjutsu render film --out film.mp4
```

`edit` takes a JSON list of operations, or `{"operations": [...],
"expected_head": "<revision>"}` so a retry can't apply twice. Every command
prints the API's JSON. `vidjutsu --help` lists them all.

Set `VIDJUTSU_API_KEY` to use a key without `login`. Keys live in
`~/.config/vidjutsu/cloud.json` (mode 600).

## Agents (MCP)

Point any MCP client at `https://api.vidjutsu.ai/mcp`. It signs in with OAuth,
or send `Authorization: Bearer <api key>`. The tools have the same names as the
REST operations: `ingest`, `create_upload`, `complete_upload`, `init`, `show`,
`edit`, `render`, `render_status`, `cancel_render`, `media_url`, `account`,
`usage`, `billing_checkout` and more.

## SDK

```ts
import { VidJutsu } from "vidjutsu";

const api = new VidJutsu({ apiKey: process.env.VIDJUTSU_API_KEY });
const take = await api.upload("take1.mp4", bytes);
await api.init("film");
const job = await api.render("film");
const done = await api.waitForRender(job.job_id);
console.log(done.output);
```

The API is versioned by date, like Stripe: every request carries
`VidJutsu-Version: <YYYY-MM-DD>`. The SDK sends the version it was built
against (`API_VERSION`); pass `apiVersion` to pin another.

Errors are `VidJutsuError` with the API's `code` and `message`. A 402 also
carries `fixUrl`, the Stripe link that fixes it.

## Release

Bump `package.json` and `src/cli/version.ts` together, merge, then push the tag
`v<version>`. The tag publishes to npm (trusted publishing) and attaches the
standalone binaries to a GitHub release.
