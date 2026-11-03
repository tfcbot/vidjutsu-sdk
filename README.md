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
vidjutsu billing checkout      # add a card and fund your prepaid wallet ($5 minimum)

vidjutsu upload take1.mp4      # straight to storage; prints the media item
vidjutsu init film
vidjutsu edit film ops.json    # e.g. add_media, insert_clip, set_fade
vidjutsu render film --out film.mp4
```

`edit` takes a JSON list of operations, or `{"operations": [...],
"expected_head": "<revision>"}` so a retry can't apply twice. Every command
prints the API's JSON. `vidjutsu --help` lists them all.

Usage is paid from a prepaid wallet: no monthly fee. Add credits any time with
`vidjutsu billing top-up --amount 20`; `vidjutsu usage` shows the balance.

Set `VIDJUTSU_API_KEY` to use a key without `login`. Keys live in
`~/.config/vidjutsu/cloud.json` (mode 600). Set `VIDJUTSU_CLIENT` (e.g.
`Claude Code`) to choose the name that history and the editor's Activity show
for your edits.

## Working on a project with an agent

```sh
vidjutsu shot-list film                  # the plan: scenes, shots and their takes
vidjutsu shot-list edit film plan.json   # add_scene, add_shot, attach_media, ...
vidjutsu words film                      # the words on the edited timeline
vidjutsu search film "the launch"        # find words in every file
vidjutsu working-on film "Tightening the intro" --from 0 --to 30
vidjutsu history film                    # every revision, with its author and changes
vidjutsu undo film <revision> --change 0 # undo one change, keeping later edits
vidjutsu layout film circle_corner       # screen and camera with a preset
vidjutsu quote film                      # what a render or Studio Sound would cost
vidjutsu studio-sound film               # clean every voice ($0.10 a voice minute)
vidjutsu events film --follow            # live change notices
```

## Agents (MCP)

Point any MCP client at `https://api.vidjutsu.ai/mcp`. It signs in with OAuth,
or send `Authorization: Bearer <api key>`. The tools have the same names as the
REST operations, and the SDK has one method for each:

| Area | Tools |
| --- | --- |
| Media | `ingest`, `create_upload`, `complete_upload`, `abort_upload`, `media_url`, `make_preview`, `media_preview`, `make_transcript`, `media_transcript` |
| Projects | `list_projects`, `init`, `show`, `head`, `edit`, `level`, `timeline_words`, `files`, `search_words` |
| History | `history`, `undo`, `restore` |
| Shot list | `shot_list`, `shot_list_edit` |
| Layouts | `layouts`, `save_layout`, `delete_layout`, `apply_layout` |
| Sound | `studio_sound` |
| Working together | `events`, `set_presence`, `working_on`, `comments`, `add_comment`, `resolve_comment`, `delete_comment` |
| Renders and prices | `quote`, `render`, `render_status`, `cancel_render` |
| Account | `account`, `create_account`, `usage`, `wallet`, `entitlements`, `create_key`, `list_keys`, `revoke_key`, `billing_checkout`, `billing_top_up`, `billing_auto_top_up`, `billing_portal` |

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

`api.stream(project)` is the project's live stream (Server-Sent Events): an
async iterator of `{event, id?, data}` that reconnects on its own and resumes
from the last notice it saw.

```ts
for await (const { event, data } of api.stream("film")) {
  if (event === "revision") console.log("new revision by", data);
}
```

Errors are `VidJutsuError` with the API's `code` and `message`. A 402 also
carries `fixUrl`, the Stripe link that fixes it (sign-up or top-up).

## Release

Bump `package.json` and `src/cli/version.ts` together, merge, then push the tag
`v<version>`. The tag publishes to npm (trusted publishing) and attaches the
standalone binaries to a GitHub release.
