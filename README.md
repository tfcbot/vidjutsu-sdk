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
vidjutsu billing checkout      # add a card and load your prepaid wallet ($59 minimum)

vidjutsu upload take1.mp4      # straight to storage; prints the media item
vidjutsu init film
vidjutsu edit film ops.json    # e.g. add_media, insert_clip, set_fade
vidjutsu render film --out film.mp4
```

`edit` takes a JSON list of operations, or `{"operations": [...],
"expected_head": "<revision>"}` so a retry can't apply twice. Every command
prints the API's JSON. `vidjutsu --help` lists them all.

Usage is paid from a prepaid wallet: no monthly fee, and watching is free. The
first load is at least $59 and turns on auto-reload ($59 when the balance drops
below $10; `--no-auto-reload` at checkout, or `vidjutsu billing auto-top-up
--off`, turns it off). Unused credit from the first load is refundable for 3
days: email admin@vidjutsu.ai. Top-ups and auto-reloads are not refundable, and
credit expires 12 months after purchase. Add credits any time with
`vidjutsu billing top-up --amount 20` ($10 minimum); `vidjutsu usage` shows the
balance.

Set `VIDJUTSU_API_KEY` to use a key without `login`. Keys live in
`~/.config/vidjutsu/cloud.json` (mode 600). Set `VIDJUTSU_CLIENT` (e.g.
`Claude Code`) to choose the name that history and the editor's Activity show
for your edits.

## Working on a project with an agent

```sh
vidjutsu templates                       # shot list templates: talking_head, ai_drama, yours
vidjutsu init drama --template ai_drama  # a project whose shot list starts with those columns
vidjutsu shot-list film                  # the plan: columns, scenes, shots and their takes
vidjutsu shot-list shot film sh_hook     # one shot with every column's value
vidjutsu shot-list edit film plan.json   # add_scene, add_shot, set_shot, add_column, attach_media, ...
vidjutsu shot-list import film episode.json  # an episode plan as scenes and shots
vidjutsu words film                      # the words on the edited timeline
vidjutsu search film "the launch"        # find words in every file
vidjutsu working-on film "Tightening the intro" --from 0 --to 30
vidjutsu history film                    # every revision, with its author and changes
vidjutsu undo film <revision> --change 0 # undo one change, keeping later edits
vidjutsu layout film circle_corner       # screen and camera with a preset
vidjutsu quote film                      # what a render or Studio Sound would cost
vidjutsu studio-sound film               # clean every voice (about 1.5 cents a voice minute)
vidjutsu events film --follow            # live change notices
vidjutsu frame film 41.967 42            # stills either side of a cut, as the render draws them
vidjutsu check film                      # gaps, black, silence, loudness and gains
vidjutsu import film descript.fcpxml --files ingested.json  # open a Descript export
vidjutsu render film --captions          # burn in captions (no extra charge)
vidjutsu captions film --format vtt      # the captions as a WebVTT file
vidjutsu bug "Render stuck at 90%" --project film --logs agent.log  # tell the VidJutsu team (free)
```

## Motion graphics

Write a scene as an HTML page that defines `window.render(t)` (draw time `t`
from `t` alone, no network) and VidJutsu renders it frame by frame on
locked-down boxes, billed by box time ($0.03 per vCPU-minute). A film is a
folder: `film.json` plus one folder per scene.

```text
launch/
  film.json        {"width": 1920, "height": 1080, "fps": 30,
                    "scenes": [{"dir": "title", "seconds": 4}, {"dir": "lower-third", "seconds": 6}]}
  title/index.html
  lower-third/index.html
  lower-third/logo.png
```

```sh
vidjutsu graphics render ./launch --name launch-title   # upload, render, print the video's media id
vidjutsu graphics ws push launch ./launch               # keep scenes in a workspace and edit them like code
vidjutsu graphics ws patch launch title/index.html --find "Hello" --with "Launch day"
vidjutsu graphics render ./launch/film.json --workspace launch
vidjutsu graphics ws pull launch ./launch-copy
```

Files are sent by SHA-256: small text files go inline, the rest by upload link,
and anything already stored is never sent again. The result is a video in your
library; place it on a timeline with `edit` (`add_media`, `insert_clip`).

```ts
const job = await client.renderGraphics(files, { width: 1920, height: 1080, scenes: [{ dir: "title", seconds: 4 }] });
console.log(job.output); // { media: { id, ... }, source: { bundle, film }, ... }
```

## Publishing

Connect TikTok, Instagram and YouTube accounts, then queue a finished render
(or a stored video) to go out now or later. Your plan sets how many accounts
you can connect.

For TikTok, pass your chosen audience and interaction settings in
`tiktok-options.json`. Replace `YOUR_TIKTOK_ACCOUNT_ID` with the same ID you
pass to `--accounts`. This example asks for private visibility (`SELF_ONLY`);
use it only if your account offers that setting. Pick the intended audience
explicitly rather than retrying a rejected post as public.

```json
{
  "YOUR_TIKTOK_ACCOUNT_ID": {
    "privacy_level": "SELF_ONLY",
    "allow_comment": false,
    "allow_duet": false,
    "allow_stitch": false
  }
}
```

```sh
vidjutsu accounts connect tiktok  # one-time setup: opens no browser; prints a sign-in link
vidjutsu accounts                 # find your connected TikTok account ID

# Choose one of these for a finished render:
vidjutsu post schedule --job "$RENDER_JOB_ID" --accounts "$TIKTOK_ACCOUNT_ID" \
  --caption "Day 1 of 30" --at now --options tiktok-options.json
vidjutsu post schedule --job "$RENDER_JOB_ID" --accounts "$TIKTOK_ACCOUNT_ID" \
  --caption "Day 1 of 30" --at 2026-12-01T15:00:00Z --options tiktok-options.json

vidjutsu post get "$POST_ID"      # POST_ID is post.id in the command's JSON
vidjutsu posts --state scheduled  # what is queued
vidjutsu post stats "$POST_ID"    # results for each account
```

`--at now` requests the earliest dispatch (also the default when `--at` is
omitted). An ISO timestamp with a time zone schedules it for later. Use the
same `--key` when retrying the same request to avoid duplicate posts.

```ts
const { post } = await client.schedulePost({
  caption: "Day 1 of 30",
  media: { job_id: render.job_id },
  accounts: [{
    id: tiktokAccountId,
    options: { privacy_level: "SELF_ONLY", allow_comment: false, allow_duet: false, allow_stitch: false },
  }],
  at: "2026-12-01T15:00:00Z", // leave out to request immediate dispatch
});
```

Platform options are flat, per account. With `--options options.json`, use the
shape `{"<social_account_id>": { ...options }}`. YouTube needs a `title` (up to
100 characters) and an explicit `visibility` (`private`, `unlisted`, or
`public`); `tags` are optional. TikTok takes `privacy_level`,
`allow_comment`, `allow_duet`, `allow_stitch`, `ai_generated` and
`commercial_content`; Instagram takes `ai_generated`.

The CLI sends one request without an approval prompt, prints the API's JSON on
stdout, and describes the returned state on stderr. `scheduled` means queued,
`pending_approval` means held for review by the signed-in owner in the web app,
and `paused_unpaid` means held for an overdue payment. `publishing` means
dispatch is in progress, not that TikTok (or another platform) accepted it.
Check `post get` for `published` and each target's live `url`, or for `partial`,
`failed`, or `canceled` results. VidJutsu enforces authorization and platform
requirements server-side; `--at now` does not bypass them.

## Agents (MCP)

Point any MCP client at `https://api.vidjutsu.ai/mcp`. It signs in with OAuth,
or send `Authorization: Bearer <api key>`. The tools have the same names as the
REST operations, and the SDK has one method for each:

| Area | Tools |
| --- | --- |
| Media | `ingest`, `create_upload`, `complete_upload`, `abort_upload`, `media_url`, `make_preview`, `media_preview`, `make_transcript`, `media_transcript` |
| Projects | `list_projects`, `init`, `import_timeline`, `show`, `head`, `edit`, `level`, `timeline_words`, `files`, `search_words` |
| History | `history`, `undo`, `restore` |
| Shot list | `shot_list`, `get_shot`, `shot_list_edit`, `shot_list_import`, `templates`, `save_template`, `delete_template` |
| Layouts | `layouts`, `save_layout`, `delete_layout`, `apply_layout` |
| Sound | `studio_sound` |
| Look and check | `frame`, `check` |
| Motion graphics | `graphics_files`, `make_graphics`, `graphics_status`, `cancel_graphics`, `graphics_source`, `graphics_list`, `graphics_read`, `graphics_write` |
| Working together | `events`, `set_presence`, `working_on`, `comments`, `add_comment`, `resolve_comment`, `delete_comment` |
| Renders and prices | `quote`, `render`, `render_status`, `cancel_render`, `captions` |
| Publishing | `connect_account`, `social_accounts`, `update_social_account`, `disconnect_account`, `schedule_post`, `posts`, `get_post`, `reschedule_post`, `cancel_post`, `approve_post`, `post_stats` |
| Bug reports | `report_bug` (only the VidJutsu team can read reports) |

| Account | `account`, `create_account`, `usage`, `wallet`, `entitlements`, `create_key`, `list_keys`, `revoke_key`, `billing_checkout`, `billing_top_up`, `billing_auto_top_up`, `billing_portal` |

## SDK

```ts
import { VidJutsu } from "vidjutsu";

const client = new VidJutsu({ apiKey: process.env.VIDJUTSU_API_KEY });
const take = await client.upload("take1.mp4", bytes);
await client.init("film");
const job = await client.render("film");
const done = await client.waitForRender(job.job_id);
console.log(done.output);
```

The API is versioned by date, like Stripe: every request carries
`VidJutsu-Version: <YYYY-MM-DD>`. The SDK sends the version it was built
against (`API_VERSION`); pass `apiVersion` to pin another.

`client.stream(project)` is the project's live stream (Server-Sent Events): an
async iterator of `{event, id?, data}` that reconnects on its own and resumes
from the last notice it saw.

```ts
for await (const { event, data } of client.stream("film")) {
  if (event === "revision") console.log("new revision by", data);
}
```

Errors are `VidJutsuError` with the API's `code` and `message`. A 402 also
carries `fixUrl`, the link that fixes it (sign-up, top-up or plan upgrade).

## Release

Bump `package.json` and `src/cli/version.ts` together and merge. CI then
builds the standalone binaries and opens a **draft** release `v<version>` on the
[releases page](https://github.com/tfcbot/vidjutsu-sdk/releases). Review it and
click **Publish release**: that creates the tag and publishes the package to npm
(trusted publishing). Nothing is public until you publish the draft.
