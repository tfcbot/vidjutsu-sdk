# vidjutsu

TypeScript SDK for the [VidJutsu](https://vidjutsu.ai) video intelligence API.

Watch, extract, transcribe, and overlay — fully typed, auto-generated from the [OpenAPI spec](https://raw.githubusercontent.com/tfcbot/vidjutsu-openapi/main/openapi/spec.json).

## Install

```bash
npm install vidjutsu
```

## Get your API key

```bash
curl -fsSL https://vidjutsu.ai/install.sh | bash
vidjutsu subscribe --email you@example.com
```

Your key saves to `~/.vidjutsu/config.json` automatically. The SDK reads it from there — no extra setup needed.

## Quick start

```ts
import { createClient } from "vidjutsu";

const vj = createClient();

// Watch — AI analyzes a video and answers your prompt (50/day)
const { data: watch } = await vj.watchMedia({
  mediaUrl: "https://cdn.example.com/video.mp4",
  prompt: "Is the hook strong enough for fitness TikTok?",
});
console.log(watch.response);

// Extract — pull frames, audio, and metadata (100/day)
const { data: extract } = await vj.extractMedia({
  mediaUrl: "https://cdn.example.com/video.mp4",
  frames: "auto",
  audio: true,
});
console.log(extract.frames, extract.metadata);

// Transcribe — speech-to-text with word-level timing (30/day)
const { data: transcript } = await vj.transcribeMedia({
  mediaUrl: "https://cdn.example.com/video.mp4",
});
console.log(transcript.transcript, transcript.words);

// Overlay — burn text onto video (50/day)
const { data: overlay } = await vj.createOverlay({
  videoUrl: "https://cdn.example.com/video.mp4",
  text: "Follow for more tips",
  position: "bottom",
});
console.log(overlay.resultUrl);
```

## Authentication

The client resolves your API key in this order:

1. **Explicit** — `createClient({ apiKey: "vj_live_..." })`
2. **Environment variable** — `VIDJUTSU_API_KEY`
3. **Config file** — `~/.vidjutsu/config.json` (written by `vidjutsu auth`)

```ts
// Reads from env or config file
const vj = createClient();

// Or pass explicitly
const vj = createClient({ apiKey: "vj_live_..." });

// Custom base URL
const vj = createClient({ baseUrl: "https://staging.api.vidjutsu.ai" });
```

## All methods

### Video intelligence (metered)

Requires an active subscription. Each endpoint has its own daily rate limit (fixed window, resets 00:00 UTC). Hitting a limit returns HTTP 429 with a `retryAfter` hint.

| Method | Daily limit | Description |
|--------|-------------|-------------|
| `watchMedia(body)` | 50 / day | AI watches a video/image and answers your prompt |
| `extractMedia(body)` | 100 / day | Extract frames, audio, and metadata from video |
| `transcribeMedia(body)` | 30 / day | Speech-to-text with word-level timing |
| `checkSpec(body)` | 100 / day | Validate a VidLang spec against rules |
| `createOverlay(body)` | 50 / day | Burn text overlay onto video |

### Resources (unmetered)

| Method | Description |
|--------|-------------|
| `createAccount(body)` / `updateAccount(body, query)` / `listOrGetAccounts(query)` / `deleteAccount(query)` | Manage accounts |
| `createPost(body)` / `updatePost(body, query)` / `listOrGetPosts(query)` / `deletePost(query)` | Manage posts |
| `createAsset(body)` / `updateAsset(body, query)` / `listOrGetAssets(query)` / `deleteAsset(query)` | Manage assets |
| `createReference(body)` / `updateReference(body, query)` / `listOrGetReferences(query)` / `deleteReference(query)` | Manage references |
| `uploadFile(body)` / `uploadFromUrl(body)` | Upload media to CDN |

### Utilities (free)

| Method | Description |
|--------|-------------|
| `getInfo()` | API info and endpoint discovery |
| `getPricing()` | Current pricing |
| `createCheckout(body)` | Create Stripe checkout session |
| `getCheckoutStatus(query)` | Check checkout status |
| `createSubscription(body)` | Subscribe ($99/mo) |
| `rotateApiKey()` | Rotate API key (invalidates current key) |
| `recoverApiKey(body)` | Recover key via email |

## Raw client

Every method returns the `openapi-fetch` response shape: `{ data, error, response }`. For endpoints not covered by convenience methods, use the raw client:

```ts
const { data, error } = await vj.api.GET("/v1/usage");
const { data, error } = await vj.api.POST("/v1/watch", {
  body: { mediaUrl: "...", prompt: "..." },
});
```

## Pricing & billing

- **$99/month flat** — full API access via Stripe, billed monthly, cancel anytime.
- **No credits, no metered billing, no top-ups** — usage is governed by per-endpoint daily rate limits (reset 00:00 UTC), not a credit balance.
- Hitting a daily limit returns **HTTP 429** with a `retryAfter` hint. Check remaining capacity with `getUsage()` or `GET /v1/usage`.
- `GET /v1/pricing` is the single source of truth for current price and limits.

## Links

- [Documentation](https://docs.vidjutsu.ai)
- [API Reference](https://docs.vidjutsu.ai/api-reference/introduction)
- [CLI](https://github.com/tfcbot/vidjutsu-sdk) (included in this package)
- [OpenAPI Spec](https://raw.githubusercontent.com/tfcbot/vidjutsu-openapi/main/openapi/spec.json)

## License

MIT
