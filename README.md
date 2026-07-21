# vidjutsu

Clone viral TikTok and Instagram videos onto your own characters. Typed SDK, CLI, and MCP server for the [VidJutsu](https://vidjutsu.ai) API, auto-generated from the [OpenAPI spec](https://raw.githubusercontent.com/tfcbot/vidjutsu-openapi/main/openapi/spec.json).

Point it at a source video and it does three things:

1. **Score it.** A clone check tells you whether the video will clone well before you spend anything on rendering.
2. **Swap in your character.** Create a reusable character once, then reuse it across every clone.
3. **Get a rendered clone.** Kling motion control maps the source motion onto your character and returns a 480p 9:16 video.

Supporting endpoints cover discovery (scrape TikTok/Instagram), single-video download, and media processing (watch, extract, transcribe, overlay, compliance).

## Install

```bash
npm install vidjutsu
```

Or install the standalone CLI (no Node required):

```bash
curl -fsSL https://vidjutsu.ai/install.sh | bash
```

## Get an API key

```bash
vidjutsu subscribe --email you@example.com
```

The key saves to `~/.vidjutsu/config.json`. The SDK and CLI read it from there, so nothing else needs configuring.

## Three ways to use it

- **MCP** — connect an agent (Claude and others) and let it drive the clone workflow.
- **CLI** — `vidjutsu clone ...` from a terminal.
- **SDK** — typed methods in TypeScript.

### MCP

For **Claude Code**:

```bash
claude mcp add --transport http vidjutsu https://api.vidjutsu.ai/mcp
```

For the **Claude desktop and web apps**, add a custom connector pointing at `https://api.vidjutsu.ai/mcp` and complete the OAuth prompt. There is no command to run.

### CLI

Characters are reusable. Create one, then clone any number of videos with it.

```bash
# 1. Create a character once. This prints a char_... id.
vidjutsu clone character --prompt "A neutral, camera-ready presenter"

# 2. Check whether a source video will clone well (optional but recommended).
vidjutsu clone check "https://www.tiktok.com/@creator/video/123456789"

# 3. Clone the video onto your character.
vidjutsu clone run "https://www.tiktok.com/@creator/video/123456789" \
  --character char_abc123

# List your characters any time.
vidjutsu clone character list
```

`clone run` downloads the source video, runs the clone check, builds a character-swapped starting frame, generates the clone video with Kling motion control, and waits for the final URL. It stops if the check verdict is weak, unless you pass `--force`. Add `--model seedance` to switch models.

### SDK

```ts
import { createClient } from "vidjutsu";

const vj = createClient(); // reads ~/.vidjutsu/config.json or env vars

// 1. Create a reusable character (returns { id: "char_...", imageUrl, model }).
const { data: character } = await vj.createCharacter({
  prompt: "A neutral, camera-ready presenter",
});

// 2. Stage the source video's file, then check it.
const { data: source } = await vj.downloadTikTokVideo({
  url: "https://www.tiktok.com/@creator/video/123456789",
});
const { data: check } = await vj.cloneCheck({ videoUrl: source.url });
console.log(check.verdict, check.score);

// 3. Build a character-swapped starting frame.
const { data: starting } = await vj.cloneStartingImage({
  characterId: character.id,
  sourceVideoUrl: source.url,
  prompt: "Match the framing and lighting of the source",
});

// 4. Generate the clone video, then poll for the final URL.
const { data: task } = await vj.cloneVideo({
  startingImageUrl: starting.imageUrl,
  sourceVideoUrl: source.url,
  model: "kling",
});
const { data: result } = await vj.getCloneVideo(task.id);
console.log(result.videoUrl);
```

Every method returns the `openapi-fetch` shape: `{ data, error, response }`.

## Authentication

The client resolves your API key in this order:

1. **Explicit** — `createClient({ apiKey: "vj_live_..." })`
2. **Environment variable** — `VIDJUTSU_API_KEY`
3. **Config file** — `~/.vidjutsu/config.json` (written by `vidjutsu subscribe` / `vidjutsu auth`)

```ts
const vj = createClient();                                  // env or config file
const vj = createClient({ apiKey: "vj_live_..." });         // explicit
const vj = createClient({ baseUrl: "https://staging.api.vidjutsu.ai" }); // custom host
```

The default base URL is `https://api.vidjutsu.ai`.

## Methods

### Clone

| Method | Description |
|--------|-------------|
| `cloneCheck(body)` | Score whether a source video will clone well |
| `createCharacter(body)` / `getCharacter(id)` / `listCharacters()` | Create and reuse persisted characters |
| `cloneStartingImage(body)` | Build a character-swapped starting frame (no overlays) |
| `cloneVideo(body)` / `getCloneVideo(id)` | Generate a clone video and poll the task |

### Discovery (scrape)

Metadata and discovery only. Scrape returns the provider's raw source URLs and never stages media.

| Method | Description |
|--------|-------------|
| `scrapeTikTokTrending(body)` / `scrapeTikTokProfile(body)` / `scrapeTikTokProfileVideos(body)` | Find TikTok videos |
| `scrapeTikTokVideo(body)` / `scrapeTikTokVideoTranscript(body)` / `scrapeTikTokVideoComments(body)` | Single TikTok video, transcript, comments |
| `scrapeTikTokSearchUsers(body)` | Search TikTok users |
| `scrapeInstagramProfile(body)` / `scrapeInstagramUserPosts(body)` / `scrapeInstagramUserReels(body)` | Find Instagram content |
| `scrapeInstagramPost(body)` / `scrapeInstagramPostComments(body)` | Single Instagram post, comments |

### Download

Stage one video's file to the CDN, one call per video.

| Method | Description |
|--------|-------------|
| `downloadTikTokVideo(body)` / `downloadInstagramVideo(body)` | Download and stage a single video |

### Media processing (metered)

Each endpoint has its own daily rate limit (fixed window, resets 00:00 UTC). Hitting a limit returns HTTP 429 with a `retryAfter` hint.

| Method | Description |
|--------|-------------|
| `watchMedia(body)` | AI watches a video/image and answers your prompt |
| `extractMedia(body)` | Extract frames, audio, and metadata |
| `transcribeMedia(body)` | Speech-to-text with word-level timing |
| `createOverlay(body)` / `createDisclaimer(body)` | Burn text or a disclaimer onto video |
| `checkComplianceVideo(body)` / `checkCompliancePrompt(body)` | Ad-compliance checks |

### Resources

| Method | Description |
|--------|-------------|
| `createAccount` / `updateAccount` / `listOrGetAccounts` / `deleteAccount` | Accounts |
| `createPost` / `updatePost` / `listOrGetPosts` / `deletePost` | Posts |
| `createAsset` / `updateAsset` / `listOrGetAssets` / `deleteAsset` | Assets |
| `createReference` / `updateReference` / `listOrGetReferences` / `deleteReference` | References |
| `createEditorProject` / `updateEditorProject` / `listOrGetEditorProjects` / `deleteEditorProject` | Editor projects |
| `uploadFile(body)` / `uploadFromUrl(body)` | Upload media to the CDN |
| `getJob(query)` / `getDistributionJob(query)` | Inspect durable jobs |

### Account and billing

| Method | Description |
|--------|-------------|
| `getInfo()` / `getPricing()` / `getUsage()` | API info, pricing, remaining daily capacity |
| `createSubscription(body)` / `getCheckoutStatus(query)` | Subscribe and check checkout status |
| `rotateApiKey()` / `recoverApiKey(body)` | Rotate or recover your key |

## Raw client

For any endpoint without a convenience method, use the raw `openapi-fetch` client:

```ts
const { data } = await vj.api.GET("/v1/usage");
const { data } = await vj.api.POST("/v1/clones/check", {
  body: { videoUrl: "https://..." },
});
```

## Pricing and billing

- **$99/month flat** for full API access, via Stripe, billed monthly, cancel anytime.
- No credits and no top-ups. Usage is governed by per-endpoint daily rate limits that reset at 00:00 UTC.
- Hitting a daily limit returns **HTTP 429** with a `retryAfter` hint. Check remaining capacity with `getUsage()` or `GET /v1/usage`.
- `GET /v1/pricing` is the source of truth for current price and limits.

## Links

- [Documentation](https://docs.vidjutsu.ai)
- [API Reference](https://docs.vidjutsu.ai/api-reference/introduction)
- [OpenAPI Spec](https://raw.githubusercontent.com/tfcbot/vidjutsu-openapi/main/openapi/spec.json)

## License

MIT
