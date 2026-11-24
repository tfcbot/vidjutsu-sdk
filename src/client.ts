// VidJutsu Cloud client: the REST API at https://api.vidjutsu.ai, versioned
// by date in the VidJutsu-Version header.
//
// Every method maps to one public operation (the same names as the MCP
// tools). JSON in and out is snake_case, as the API sends it. Errors are
// thrown as VidJutsuError with the API's {code, message} and, for 402s, the
// link that fixes them (checkout_url, top_up_url, portal_url or upgrade_url).

export const DEFAULT_BASE_URL = "https://api.vidjutsu.ai";
/** A bug report for reportBug. Only `summary` is required. */
export type BugReport = {
  /** What went wrong, in one line (up to 300 characters). */
  summary: string;
  /** Steps, what you expected and what happened (up to 10,000 characters). */
  details?: string;
  project?: string;
  /** The tool sending it and its version. */
  app?: { name?: string; version?: string; build?: string; os?: string };
  /** Recent log lines; the last 64 KB are kept. */
  logs?: string;
  sentry_event_id?: string;
  /** A PNG or JPEG of up to 2.5 MB, as base64. */
  screenshot?: { data: string; content_type: "image/png" | "image/jpeg" };
};

/** The API version this client was written against (Stripe-style dates). */
export const API_VERSION = "2026-11-03";
export const VERSION_HEADER = "VidJutsu-Version";

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type JsonObject = { [key: string]: Json };

export interface ClientOptions {
  /** A `vj_live_...` API key, or an OAuth access token. */
  apiKey?: string;
  /** Defaults to https://api.vidjutsu.ai. */
  baseUrl?: string;
  /** Defaults to the global fetch. */
  fetch?: typeof fetch;
  /** Pin a different API version (YYYY-MM-DD). Defaults to API_VERSION. */
  apiVersion?: string;
  /**
   * Who is acting, as history, Activity and change notices name you (sent as
   * the VidJutsu-Client header, e.g. "Claude Code"). Display only.
   */
  clientName?: string;
}

/** Query parameters: undefined values are left out. */
export type Query = Record<string, string | number | boolean | undefined>;

export class VidJutsuError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly body: JsonObject = {},
  ) {
    super(message);
    this.name = "VidJutsuError";
  }
  /** The link that fixes a 402 (sign-up, top-up, card or plan upgrade), when the API sent one. */
  get fixUrl(): string | undefined {
    const url = this.body.checkout_url ?? this.body.top_up_url ?? this.body.portal_url ?? this.body.upgrade_url;
    return typeof url === "string" ? url : undefined;
  }
}

export type MediaObject = {
  id: string;
  asset_hash: string;
  duration: number;
  kind: "video" | "audio" | "image";
  lineage: string[];
};

export type Ingested = JsonObject & { media: MediaObject & JsonObject; audio: (MediaObject & JsonObject) | null };

export type RenderJob = JsonObject & {
  job_id: string;
  state: "queued" | "running" | "succeeded" | "failed" | "canceled";
};
/** A job started by make_preview, make_transcript or studio_sound. `started: false` means nothing new was started (and nothing charged). */
export type StartedJob = JsonObject & { started?: boolean; job_id?: string };

/** One Server-Sent Event from a project's live stream. */
export interface ProjectEvent {
  /** `ready`, `revision`, `comment`, `shot_list`, `job`, `presence`, `working_on` or `reset`. */
  event: string;
  /** The notice's sequence number; snapshots (presence, working_on, job progress) have none. */
  id?: string;
  data: Json;
}

/** Burned-in captions for a render. One clean style; no extra charge. */
export type CaptionsOption = {
  on?: boolean;
  position?: "bottom" | "top";
  size?: "small" | "medium" | "large";
  background?: "solid" | "none";
};

/**
 * A shot list edit operation, named by `op`: scenes (add_scene, rename_scene, move_scene, remove_scene),
 * shots (add_shot, set_shot, move_shot, remove_shot), columns (add_column, rename_column, move_column,
 * hide_column, set_column_options, remove_column) and files (attach_media, detach_media).
 */
export type ShotListOperation = JsonObject & { op: string };

/** The kinds of shot list column. A column's type never changes. */
export type ColumnType =
  | "text"
  | "long_text"
  | "dialogue"
  | "media"
  | "references"
  | "takes"
  | "select"
  | "number"
  | "links";

/** What a reference is for, on a `references` column. */
export type ReferenceRole = "character" | "location" | "style" | "prop" | "voice" | "input_clip" | "first_frame";

/** A shot list column, as a template or a project's shot list has it. `options` is only for `select`. */
export interface Column {
  id: string;
  name: string;
  type: ColumnType;
  options?: { choices: string[] };
  hidden?: boolean;
}

/** A saved column list a project can start from. Built in: `talking_head` (the default), `ai_drama` and `blank`. */
export interface Template {
  id: string;
  name: string;
  builtin: boolean;
  columns: Column[];
}

// ---- Motion graphics ----

/** One file of a graphics bundle: its path inside the bundle, length and SHA-256. */
export type GraphicsFileRef = { path: string; bytes: number; sha256: string };
/** A file as sent to graphicsFiles: text files up to 256 KB may carry their `text` inline (2 MB per call). */
export type GraphicsSentFile = GraphicsFileRef & { text?: string };
/** A file still to upload: PUT its bytes to `put_url`. */
export type GraphicsMissing = { sha256: string; bytes: number; paths: string[]; put_url: string };
/** The answer of graphicsFiles and graphicsWrite: the bundle id and the files still to upload. */
export type GraphicsBundle = JsonObject & {
  bundle: string;
  files: number;
  bytes: number;
  stored_inline: number;
  missing: GraphicsMissing[];
  expires_at: number;
  /** Set by graphicsWrite. */
  version?: number;
  workspace?: string;
};
/** A finishing effect applied to every frame: grain or vignette (amount 0 to 1), blur (radius 0 to 20 px). */
export type GraphicsEffect =
  | { type: "grain"; amount: number }
  | { type: "vignette"; amount: number }
  | { type: "blur"; radius: number };
/** One scene: a folder of the bundle whose page defines `window.render(t)`. */
export type GraphicsScene = {
  /** Scene length in seconds. */
  seconds: number;
  /** Folder inside the bundle ("" for the top). */
  dir?: string;
  /** Entry page in that folder (default index.html). */
  entry?: string;
  /** Global function the page defines (default render). */
  render?: string;
  /** Page time (seconds) of the scene's first frame. */
  start?: number;
  /** Videos in the folder decoded into stills before capture. */
  extract?: { video: string; frames: string; fps?: number | null; jpeg_q?: number; start_number?: number }[];
};
/** The film: size (even width, at most 3840 x 2160), frame rate (1 to 60), effects and 1 to 200 scenes. */
export type GraphicsFilm = {
  width: number;
  height: number;
  scenes: GraphicsScene[];
  fps?: number;
  /** Captured frames blended into each output frame (motion blur), 1 to 4. */
  subframes?: number;
  /** JPEG quality of captured frames, 50 to 100. */
  quality?: number;
  effects?: GraphicsEffect[];
};
/** One change to a text file in a workspace: `find` must occur exactly once. */
export type GraphicsPatch = { path: string; find: string; replace: string };
/** One new version of a workspace, made from the current one and these changes (up to 200). */
export type GraphicsWrite = {
  /** Text files written whole (UTF-8, up to 256 KB each). */
  write?: { path: string; text: string }[];
  patch?: GraphicsPatch[];
  /** Other files (images, fonts, footage) by hash: missing ones get a PUT link. */
  files?: GraphicsFileRef[];
  delete?: string[];
  /** The bundle you read; if the workspace moved on since, nothing is written (409). */
  expected_bundle?: string;
  /** Go back to an earlier bundle of this workspace (from history) first. */
  restore?: string;
};
/** A file to send with uploadGraphics: its path inside the bundle and its bytes. */
export type GraphicsLocalFile = { path: string; data: Uint8Array };

/** Largest text file sent inline, and all inline text of one call. */
export const GRAPHICS_INLINE_MAX = 256 * 1024;
export const GRAPHICS_INLINE_TOTAL = 2 * 1024 * 1024;
const TEXT_EXTENSIONS = new Set([
  "html", "htm", "js", "mjs", "cjs", "css", "svg", "json", "txt", "md", "xml", "csv", "glsl", "frag", "vert", "map",
]);

/** The file's text when it is a UTF-8 text file (by extension) small enough to send inline. */
export function graphicsText(path: string, data: Uint8Array): string | undefined {
  const ext = path.slice(path.lastIndexOf(".") + 1).toLowerCase();
  if (!TEXT_EXTENSIONS.has(ext) || data.byteLength > GRAPHICS_INLINE_MAX) return undefined;
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(data);
  } catch {
    return undefined;
  }
}

// ---- Publishing ----

/** The platforms an account can be connected on. */
export type Platform = "tiktok" | "instagram" | "youtube";
/** A social account connected to VidJutsu, posted to with schedulePost. */
export type SocialAccount = JsonObject & {
  id: string;
  platform: Platform;
  handle: string;
  display_name?: string;
  /** `connected`, or a state that needs the person (follow reconnect_url). */
  state: string;
  /** Posts to this account wait for the person's approval before they go out. */
  approve_before_posting: boolean;
  connected_at: string;
  /** Present when the platform needs the person to sign in again. */
  reconnect_url?: string;
};
/**
 * Where a post is: scheduled, awaiting_approval, dispatching, published,
 * partially_published (some accounts failed), failed, canceled, or
 * paused_unpaid (held until the account's payment is fixed).
 */
export type PostState =
  | "scheduled"
  | "awaiting_approval"
  | "dispatching"
  | "published"
  | "partially_published"
  | "failed"
  | "canceled"
  | "paused_unpaid";
/** One account a post goes to, and how it went there. */
export type PostTarget = JsonObject & {
  account_id: string;
  platform: Platform;
  options: JsonObject;
  state: string;
  /** The live post on the platform, once published. */
  url?: string;
  error?: Json;
};
export type Post = JsonObject & {
  id: string;
  caption: string;
  media: JsonObject & { hash: string; job_id?: string };
  targets: PostTarget[];
  scheduled_for: string;
  state: PostState;
  created_at: string;
  published_at?: string;
};
/** What schedulePost takes. `at` left out means now. */
export type SchedulePost = {
  caption: string;
  /** A finished render ({job_id}) or a stored file ({hash}). */
  media: { job_id: string } | { hash: string };
  /** The accounts to post to, each with its platform options. */
  accounts: Array<{ id: string; options?: JsonObject }>;
  /** When to post, as an ISO time. Left out: post now. */
  at?: string;
  idempotency_key?: string;
};

export interface UploadPart {
  number: number;
  url: string;
}

const TERMINAL = new Set(["succeeded", "failed", "canceled"]);

export class VidJutsu {
  readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly fetcher: typeof fetch;
  readonly apiVersion: string;
  readonly clientName?: string;

  constructor(options: ClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.apiKey = options.apiKey;
    this.fetcher = options.fetch ?? fetch;
    this.apiVersion = options.apiVersion ?? API_VERSION;
    this.clientName = options.clientName;
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      accept: "application/json",
      [VERSION_HEADER]: this.apiVersion,
      ...extra,
    };
    if (this.apiKey) headers.authorization = `Bearer ${this.apiKey}`;
    if (this.clientName) headers["VidJutsu-Client"] = this.clientName;
    return headers;
  }

  /** One API call. `body` is sent as JSON; `idempotencyKey` makes writes safe to retry. */
  async request<T = JsonObject>(
    method: "GET" | "POST" | "DELETE",
    path: string,
    body?: unknown,
    idempotencyKey?: string,
  ): Promise<T> {
    const headers = this.headers();
    if (body !== undefined) headers["content-type"] = "application/json";
    if (idempotencyKey) headers["idempotency-key"] = idempotencyKey;
    const response = await this.fetcher(this.baseUrl + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    let parsed: unknown = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = { message: text };
      }
    }
    if (!response.ok) throw errorOf(response, parsed);
    return parsed as T;
  }

  // ---- Sign-up and sign-in (no key needed) ----

  /** Email a sign-in code. Returns {attempt} for `verify`. */
  signIn(email: string) {
    return this.request<{ attempt: string } & JsonObject>("POST", "/auth/email", { email });
  }
  /** Check the emailed code. Returns {api_key, account_id, status, checkout_url?}. */
  verify(attempt: string, code: string) {
    return this.request<{ api_key: string; account_id: string; status: string } & JsonObject>(
      "POST",
      "/auth/verify",
      { attempt, code },
    );
  }
  health() {
    return this.request("GET", "/health");
  }

  // ---- Account ----

  account() {
    return this.request("GET", "/account");
  }
  usage() {
    return this.request("GET", "/usage");
  }
  entitlements() {
    return this.request("GET", "/entitlements");
  }
  createKey(name: string) {
    return this.request("POST", "/keys", { name });
  }
  listKeys() {
    return this.request("GET", "/keys");
  }
  revokeKey(keyId: string) {
    return this.request("DELETE", `/keys/${seg(keyId)}`);
  }
  /**
   * Sign up for the prepaid wallet: a card and a first load (amount_usd, default 59, at least 59).
   * Auto-reload ($59 when the balance drops below $10) is on unless auto_reload is false.
   */
  billingCheckout(options: { amount_usd?: number; auto_reload?: boolean; success_url?: string; cancel_url?: string } = {}) {
    return this.request<{ url: string } & JsonObject>("POST", "/billing/checkout", options);
  }
  /** Add credits to the wallet any time (amount_usd, default 10, at least 10). */
  billingTopUp(options: { amount_usd?: number; success_url?: string; cancel_url?: string } = {}) {
    return this.request<{ url: string } & JsonObject>("POST", "/billing/top-up", options);
  }
  billingPortal(options: { return_url?: string } = {}) {
    return this.request<{ url: string } & JsonObject>("POST", "/billing/portal", options);
  }
  /** Turn auto top-up on or off: when usage takes the wallet below threshold_usd, the saved card is charged amount_usd. */
  billingAutoTopUp(options: { enabled: boolean; threshold_usd?: number | string; amount_usd?: number | string }) {
    return this.request("POST", "/billing/auto-top-up", options);
  }
  /** The prepaid wallet: balance, card on file, auto top-up, top-up range and this period's spend. */
  wallet() {
    return this.request("GET", "/wallet");
  }

  // ---- Media ----

  /** Add media from an https URL. `source` says where the file came from (files shows it). */
  ingestUrl(url: string, name?: string, idempotencyKey?: string, options: { source?: JsonObject; project?: string } = {}) {
    return this.request<Ingested>("POST", "/media", { url, name, ...options }, idempotencyKey);
  }
  mediaInfo(hash: string) {
    return this.request("GET", `/media/${seg(hash)}`);
  }
  mediaUrl(hash: string, ttlSeconds?: number) {
    const query = ttlSeconds ? `?ttl=${Math.floor(ttlSeconds)}` : "";
    return this.request<{ url: string } & JsonObject>("GET", `/media/${seg(hash)}/url${query}`);
  }
  /** Make a media item's preview files (proxy video, filmstrip, waveform). Paid per source minute, once per item. */
  makePreview(hash: string, options: { project?: string } = {}, idempotencyKey?: string) {
    return this.request<StartedJob>("POST", `/media/${seg(hash)}/preview`, options, idempotencyKey);
  }
  /** A media item's preview: state, and when ready, links to the proxy, filmstrip and waveform. Free. */
  mediaPreview(hash: string) {
    return this.request("GET", `/media/${seg(hash)}/preview`);
  }
  /** Transcribe a media item: words with start and end times. Paid per source minute, once per item. */
  makeTranscript(hash: string, options: { project?: string } = {}, idempotencyKey?: string) {
    return this.request<StartedJob>("POST", `/media/${seg(hash)}/transcript`, options, idempotencyKey);
  }
  /** A media item's transcript: state, language and, when ready, a link (words.url) to its words. Free. */
  mediaTranscript(hash: string) {
    return this.request("GET", `/media/${seg(hash)}/transcript`);
  }
  createUpload(name: string, bytes: number, sha256: string, idempotencyKey?: string) {
    return this.request<{
      upload_id: string;
      already_stored: boolean;
      part_size: number;
      parts: UploadPart[];
    } & JsonObject>("POST", "/uploads", { name, bytes, sha256 }, idempotencyKey);
  }
  completeUpload(uploadId: string, parts: { number: number; etag: string }[], options: { source?: JsonObject; project?: string } = {}) {
    return this.request<Ingested>("POST", `/uploads/${seg(uploadId)}/complete`, { parts, ...options });
  }
  abortUpload(uploadId: string) {
    return this.request("DELETE", `/uploads/${seg(uploadId)}`);
  }

  /**
   * Upload a file's bytes straight to storage and add it to your library:
   * create_upload, PUT each part to its presigned link, complete_upload.
   */
  async upload(name: string, data: Uint8Array, options: { source?: JsonObject; project?: string } = {}): Promise<Ingested> {
    const sha256 = await sha256Hex(data);
    const started = await this.createUpload(name, data.byteLength, sha256, `upload-${sha256}`);
    if (started.already_stored) return this.completeUpload(started.upload_id, [], options);
    try {
      const parts = [];
      for (const part of started.parts) {
        const start = (part.number - 1) * started.part_size;
        const chunk = data.subarray(start, Math.min(start + started.part_size, data.byteLength));
        const response = await this.fetcher(part.url, { method: "PUT", body: chunk as unknown as BodyInit });
        if (!response.ok) {
          throw new VidJutsuError(response.status, "upload_part_failed", `part ${part.number} was refused`);
        }
        const etag = response.headers.get("etag");
        if (!etag) throw new VidJutsuError(502, "upload_part_failed", `part ${part.number} returned no ETag`);
        parts.push({ number: part.number, etag });
      }
      return await this.completeUpload(started.upload_id, parts, options);
    } catch (error) {
      await this.abortUpload(started.upload_id).catch(() => undefined);
      throw error;
    }
  }

  // ---- Projects ----

  /** Your projects, most recently changed first. Pass next_cursor as cursor for the next page. */
  listProjects(options: { cursor?: string; limit?: number } = {}) {
    return this.request("GET", `/projects${query(options)}`);
  }
  /**
   * Create a project. `template` is the shot list template its columns come from
   * (default `talking_head`; see `templates()`). The answer's `shot_list` says which.
   */
  init(project: string, options: { template?: string; idempotencyKey?: string } | string = {}) {
    const { template, idempotencyKey } = typeof options === "string" ? { template: undefined, idempotencyKey: options } : options;
    return this.request("POST", "/projects", { project, ...(template ? { template } : {}), idempotency_key: idempotencyKey });
  }
  /** The current timeline (or an earlier revision), with who is in the project right now (presence, working_on). */
  show(project: string, options: { revision?: string } = {}) {
    return this.request("GET", `/projects/${seg(project)}${query(options)}`);
  }
  /** The head revision without the timeline: a cheap check for changes. */
  head(project: string) {
    return this.request("GET", `/projects/${seg(project)}/head`);
  }
  /** Apply edit operations; send expected_head so a retry can't apply twice. */
  edit(
    project: string,
    operations: JsonObject[],
    options: { expected_head?: string; branch?: string; summary?: string; author?: string; idempotency_key?: string } = {},
  ) {
    return this.request("POST", `/projects/${seg(project)}/edits`, { operations, ...options });
  }
  level(project: string, body: JsonObject) {
    return this.request("POST", `/projects/${seg(project)}/level`, body);
  }

  // ---- History and undo ----

  /** Timeline revisions and shot list changes, newest first. Pass the answer's `next` as before for the next page. */
  history(project: string, options: { limit?: number; before?: string } = {}) {
    return this.request("GET", `/projects/${seg(project)}/history${query(options)}`);
  }
  /** Undo a revision, or one change of it (`change`, its index in history), as a new revision. */
  undo(
    project: string,
    revision: string,
    options: { change?: number; expected_head?: string; summary?: string; branch?: string; idempotency_key?: string } = {},
  ) {
    return this.request("POST", `/projects/${seg(project)}/undo`, { revision, ...options });
  }
  /** Bring back an earlier revision's whole timeline as a new revision. */
  restore(
    project: string,
    revision: string,
    options: { expected_head?: string; summary?: string; branch?: string; idempotency_key?: string } = {},
  ) {
    return this.request("POST", `/projects/${seg(project)}/restore`, { revision, ...options });
  }
  /** The words heard on the edited timeline, in order, and the pauses between them. */
  timelineWords(project: string, options: { revision?: string; pause?: number | string } = {}) {
    return this.request("GET", `/projects/${seg(project)}/timeline-words${query(options)}`);
  }

  // ---- Shot list, files and words ----

  /**
   * The shot list: its template, columns, scenes, shots (their `values` by column id) and the files filed
   * under each scene. `scene` returns only that scene; `resolve` adds each shot's `fields`, as `getShot` has them.
   */
  shotList(project: string, options: { scene?: string; resolve?: boolean } = {}) {
    return this.request("GET", `/projects/${seg(project)}/shot-list${query(options)}`);
  }
  /**
   * One shot, ready to work from: its scene, place, neighbours, `timeline` clips and `fields`
   * (every column with its value), each file with a fresh download link.
   */
  getShot(project: string, shot: string) {
    return this.request("GET", `/projects/${seg(project)}/shot-list/shots/${seg(shot)}`);
  }
  /** Change the shot list with a batch of operations, all or none. A stale expected_revision is a 409 (stale_revision). */
  shotListEdit(project: string, expectedRevision: number, operations: ShotListOperation[], idempotencyKey?: string) {
    return this.request(
      "POST",
      `/projects/${seg(project)}/shot-list/edits`,
      { expected_revision: expectedRevision, operations },
      idempotencyKey,
    );
  }
  /**
   * Bring an episode plan (episode.json, schemaVersion 2) in as the shot list:
   * each group a scene, each beat a shot. `replace` removes every scene first.
   * A stale expected_revision is a 409 (stale_revision).
   */
  shotListImport(
    project: string,
    expectedRevision: number,
    episode: JsonObject,
    options: { replace?: boolean } = {},
    idempotencyKey?: string,
  ) {
    return this.request(
      "POST",
      `/projects/${seg(project)}/shot-list/import`,
      { expected_revision: expectedRevision, episode, ...options },
      idempotencyKey,
    );
  }
  /** Every file in the project: its scene, shot, place on the timeline and source. */
  files(project: string) {
    return this.request("GET", `/projects/${seg(project)}/files`);
  }
  /** Find spoken words across every file in the project. */
  searchWords(project: string, words: string, options: { limit?: number } = {}) {
    return this.request("GET", `/projects/${seg(project)}/words${query({ query: words, ...options })}`);
  }

  // ---- Live: presence, working_on and change notices ----

  /** Say where you are: selection ({start, end, clips?}) and playhead, or null to clear either. */
  setPresence(project: string, body: { selection?: Json; playhead?: Json }) {
    return this.request("POST", `/projects/${seg(project)}/presence`, body);
  }
  /** Say what you are about to do, so the person sees it in the editor. text: null clears it. */
  workingOn(project: string, body: { text: string | null; clips?: string[]; range?: Json; scene?: string }) {
    return this.request("POST", `/projects/${seg(project)}/working_on`, body);
  }
  /** Change notices after a sequence number. reset: true means older ones are gone: read the project again. */
  events(project: string, options: { after?: number; limit?: number } = {}) {
    return this.request("GET", `/projects/${seg(project)}/events${query(options)}`);
  }
  /**
   * The project's live stream (Server-Sent Events). Yields each event until the
   * server ends the stream (about every 5 minutes) or `signal` aborts; with
   * `reconnect` (the default) it picks up again from the last notice it saw.
   */
  async *stream(
    project: string,
    options: { lastEventId?: string; signal?: AbortSignal; reconnect?: boolean } = {},
  ): AsyncGenerator<ProjectEvent> {
    let lastId = options.lastEventId;
    let retryMs = 1000;
    for (;;) {
      const headers = this.headers({ accept: "text/event-stream" });
      if (lastId) headers["last-event-id"] = lastId;
      const response = await this.fetcher(`${this.baseUrl}/projects/${seg(project)}/events`, {
        method: "GET",
        headers,
        signal: options.signal,
      });
      if (!response.ok || !response.body) {
        const text = await response.text();
        let parsed: unknown = null;
        try {
          parsed = text ? JSON.parse(text) : null;
        } catch {
          parsed = { message: text };
        }
        throw errorOf(response, parsed);
      }
      for await (const event of parseEvents(response.body)) {
        if (event.retry !== undefined) retryMs = event.retry;
        if (!event.event && event.data === undefined) continue;
        if (event.id !== undefined) lastId = event.id;
        yield { event: event.event ?? "message", ...(event.id !== undefined ? { id: event.id } : {}), data: event.data ?? null };
      }
      if (options.reconnect === false || options.signal?.aborted) return;
      await new Promise((resolve) => setTimeout(resolve, retryMs));
    }
  }

  // ---- Comments ----

  comments(project: string) {
    return this.request("GET", `/projects/${seg(project)}/comments`);
  }
  /** Comment on a range ({text, start, end}) or a moment ({text, time}); reply with {text, reply_to}. */
  addComment(project: string, body: JsonObject & { text: string }) {
    return this.request("POST", `/projects/${seg(project)}/comments`, body);
  }
  resolveComment(project: string, commentId: string, resolved = true) {
    return this.request("POST", `/projects/${seg(project)}/comments/${seg(commentId)}`, { resolved });
  }
  deleteComment(project: string, commentId: string) {
    return this.request("DELETE", `/projects/${seg(project)}/comments/${seg(commentId)}`);
  }

  // ---- Bug reports ----

  /**
   * Tell the VidJutsu team about a bug. Only the team can read reports.
   * Free, up to 20 an hour. Answers {id, created_at, received}.
   */
  reportBug(report: BugReport) {
    return this.request("POST", "/bug-reports", report as JsonObject);
  }

  // ---- Shot list templates ----

  /** The shot list templates you can start a project from: the built-in ones and yours. */
  templates() {
    return this.request("GET", "/shot-list-templates");
  }
  /**
   * Save a template from columns (`{name, columns, id?}`) or from a project's current columns
   * (`{name, project}`). Answers `{template, replaced}`. Saving the same id again replaces it; built-in
   * templates can't be replaced. A column's id is made from its name if left out; a `select` needs `options`.
   */
  saveTemplate(
    body:
      | { name: string; columns: Array<{ name: string; type: ColumnType; id?: string; options?: { choices: string[] } }>; id?: string }
      | { name: string; project: string; id?: string },
  ) {
    return this.request("POST", "/shot-list-templates", body);
  }
  /** Delete one of your templates. Projects made from it keep their columns. */
  deleteTemplate(templateId: string) {
    return this.request("DELETE", `/shot-list-templates/${seg(templateId)}`);
  }

  // ---- Screen and camera layouts ----

  /** The six built-in presets and the ones saved to your account. */
  layouts() {
    return this.request("GET", "/layouts");
  }
  /** Save a preset ({name, screen, camera}); the same name replaces it. */
  saveLayout(body: { name: string; screen: JsonObject; camera: JsonObject }) {
    return this.request("POST", "/layouts", body);
  }
  deleteLayout(layoutId: string) {
    return this.request("DELETE", `/layouts/${seg(layoutId)}`);
  }
  /** Lay out the screen and the camera with a preset over a range (default: the whole video), as one revision. */
  applyLayout(
    project: string,
    preset: string,
    options: { from?: Json; to?: Json; expected_head?: string; screen_track?: string; camera_track?: string } = {},
    idempotencyKey?: string,
  ) {
    return this.request("POST", `/projects/${seg(project)}/layout`, { preset, ...options }, idempotencyKey);
  }

  // ---- Studio Sound and prices ----

  /** Turn on Studio Sound: clean every voice and swap the cleaned copies onto their clips. Billed by box time like every job (about 1.5 cents a voice minute); check with quote(). */
  studioSound(project: string, options: { media?: string[]; branch?: string } = {}, idempotencyKey?: string) {
    return this.request<StartedJob>("POST", `/projects/${seg(project)}/studio-sound`, options, idempotencyKey);
  }
  /** What a render at each quality and Studio Sound would cost, and whether your wallet lets each start. Free. */
  quote(project: string, options: { media?: string[] } = {}) {
    return this.request("GET", `/projects/${seg(project)}/quote${query({ media: options.media?.join(",") })}`);
  }

  // ---- Look at and check a cut ----

  /**
   * Stills of the timeline at 1 to 24 timeline times (seconds like 12.5 or
   * fractions like "1001/30000"), drawn by the renderer, so they show exactly
   * what a render shows. Starts a job; when it succeeds, `output.frames` has
   * one still per time with a one-day JPEG `url`. Billed by box time.
   */
  frame(
    project: string,
    times: Json[],
    options: { height?: 360 | 720 | 1080; branch?: string; revision?: string } = {},
    idempotencyKey?: string,
  ) {
    return this.request<StartedJob>("POST", `/projects/${seg(project)}/frames`, { times, ...options }, idempotencyKey);
  }
  /**
   * Measure the cut: gaps, stretches with no sound, black picture, silence,
   * loudness of the mix and of each section, and each audio clip's gain.
   * Measured values only, never a score. Starts a job; its `output` holds
   * the measurements. Billed by box time.
   */
  check(
    project: string,
    options: { sections?: { name?: string; from: Json; to: Json }[]; branch?: string; revision?: string } = {},
    idempotencyKey?: string,
  ) {
    return this.request<StartedJob>("POST", `/projects/${seg(project)}/checks`, options, idempotencyKey);
  }
  /**
   * Open a Descript timeline export (FCPXML or EDL text) as a new project.
   * Ingest every file the export names first and pass each ingest result
   * ({name, media, audio}) in `files`. Free, and done at once.
   */
  importTimeline(
    body: { project: string; timeline: string; format?: "fcpxml" | "edl"; files: JsonObject[] },
    idempotencyKey?: string,
  ) {
    return this.request("POST", "/imports", body, idempotencyKey);
  }

  // ---- Renders ----

  /**
   * The timeline's captions as SRT or WebVTT, from the words on its audio
   * tracks, so they follow every cut. Free. Refused while any sound on the
   * timeline has no transcript.
   */
  captions(project: string, options: { format?: "srt" | "vtt"; revision?: string; branch?: string } = {}) {
    return this.request<JsonObject & { file: string; name: string; format: string }>(
      "GET",
      `/projects/${seg(project)}/captions${query(options)}`,
    );
  }

  render(project: string, body: JsonObject = {}, idempotencyKey?: string) {
    return this.request<RenderJob>("POST", `/projects/${seg(project)}/renders`, body, idempotencyKey);
  }
  renderStatus(jobId: string) {
    return this.request<RenderJob>("GET", `/jobs/${seg(jobId)}`);
  }
  cancelRender(jobId: string) {
    return this.request<RenderJob>("POST", `/jobs/${seg(jobId)}/cancel`);
  }
  /** Poll a job (render, preview, transcript, Studio Sound, frame or check) until it ends. */
  waitForJob(jobId: string, options: { intervalMs?: number; onUpdate?: (job: RenderJob) => void } = {}) {
    return this.waitForRender(jobId, options);
  }
  /** Poll a render job until it ends. */
  async waitForRender(
    jobId: string,
    options: { intervalMs?: number; onUpdate?: (job: RenderJob) => void } = {},
  ): Promise<RenderJob> {
    for (;;) {
      const job = await this.renderStatus(jobId);
      options.onUpdate?.(job);
      if (TERMINAL.has(job.state)) return job;
      await new Promise((resolve) => setTimeout(resolve, options.intervalMs ?? 3000));
    }
  }
  // ---- Publishing ----

  /**
   * Start connecting a social account: open the answer's `url` in a browser
   * to sign in to the platform. `return_to` says where the browser lands
   * after: "app" (the web app's accounts settings) or "page" (a plain page).
   */
  connectAccount(platform: Platform, options: { return_to?: "app" | "page" } = {}) {
    return this.request<JsonObject & { url: string; expires_at: string; platform: Platform }>(
      "POST",
      "/social-accounts/connect",
      { platform, ...options },
    );
  }
  /** The social accounts you have connected. */
  socialAccounts() {
    return this.request<JsonObject & { accounts: SocialAccount[] }>("GET", "/social-accounts");
  }
  /** Disconnect a social account. Posts already scheduled to it fail for that account. */
  disconnectAccount(accountId: string) {
    return this.request<JsonObject & { account: SocialAccount }>("DELETE", `/social-accounts/${seg(accountId)}`);
  }
  /** Post a finished render or a stored file to one or more accounts, now or at `at`. */
  schedulePost(body: SchedulePost) {
    return this.request<JsonObject & { post: Post }>("POST", "/posts", body);
  }
  /** Your posts, newest first. Pass next_cursor as cursor for the next page. */
  posts(options: { state?: PostState; cursor?: string; limit?: number } = {}) {
    return this.request<JsonObject & { posts: Post[]; next_cursor: string | null }>("GET", `/posts${query(options)}`);
  }
  getPost(postId: string) {
    return this.request<JsonObject & { post: Post }>("GET", `/posts/${seg(postId)}`);
  }
  /** Move a post that hasn't gone out yet to a new time (ISO). */
  reschedulePost(postId: string, at: string) {
    return this.request<JsonObject & { post: Post }>("POST", `/posts/${seg(postId)}/reschedule`, { at });
  }
  /** Cancel a post that hasn't gone out yet. */
  cancelPost(postId: string) {
    return this.request<JsonObject & { post: Post }>("POST", `/posts/${seg(postId)}/cancel`);
  }
  /** How a post is doing on each account it went to (views, likes and the rest, as the platform reports them). */
  postStats(postId: string) {
    return this.request<JsonObject & { stats: Json }>("GET", `/posts/${seg(postId)}/stats`);
  }

  // ---- Motion graphics ----

  /**
   * Send a bundle's file list (every file, by path, length and SHA-256). Text
   * files up to 256 KB may carry `text` (2 MB per call) and are stored at once;
   * the answer's `missing` has a PUT link for each other file not stored yet.
   * Free.
   */
  graphicsFiles(files: GraphicsSentFile[]) {
    return this.request<GraphicsBundle>("POST", "/graphics/files", { files });
  }
  /** A bundle's files with one-day download links, so a scene can be edited instead of written again. Free. */
  graphicsSource(bundle: string) {
    return this.request("GET", `/graphics/bundles/${seg(bundle)}`);
  }
  /** A graphics workspace: its current bundle, version, files and earlier bundles. Free. */
  graphicsList(workspace: string) {
    return this.request<JsonObject & { workspace: string; bundle: string | null; version: number; files: GraphicsFileRef[]; history: string[] }>(
      "GET",
      `/graphics/workspaces/${seg(workspace)}`,
    );
  }
  /** One file of a workspace: `text` for text files, else a download `url`. Free. */
  graphicsRead(workspace: string, path: string) {
    return this.request<JsonObject & GraphicsFileRef & { text?: string; url?: string }>(
      "GET",
      `/graphics/workspaces/${seg(workspace)}/file${query({ path })}`,
    );
  }
  /**
   * Write a new version of a workspace: whole text files, find-and-replace
   * patches, other files by hash (PUT the `missing` ones), deletes. A stale
   * expected_bundle is a 409. Free.
   */
  graphicsWrite(workspace: string, changes: GraphicsWrite) {
    return this.request<GraphicsBundle>("POST", `/graphics/workspaces/${seg(workspace)}`, changes);
  }
  /**
   * Render a film from a bundle (every missing file PUT) or a workspace. Our
   * renderer draws each scene's `render(t)` on locked-down boxes; billed by box
   * time from the wallet. Answers a job; poll graphicsStatus. When it succeeds,
   * `output.media` is the video in your library: place it with edit (add_media, insert_clip).
   */
  makeGraphics(
    body: { film: GraphicsFilm; bundle?: string; workspace?: string; name?: string },
    idempotencyKey?: string,
  ) {
    return this.request<RenderJob>(
      "POST",
      "/graphics",
      { ...body, ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}) },
      idempotencyKey,
    );
  }
  graphicsStatus(jobId: string) {
    return this.request<RenderJob>("GET", `/graphics/${seg(jobId)}`);
  }
  cancelGraphics(jobId: string) {
    return this.request<RenderJob>("POST", `/graphics/${seg(jobId)}/cancel`);
  }
  /** Poll a graphics job until it ends. */
  async waitForGraphics(
    jobId: string,
    options: { intervalMs?: number; onUpdate?: (job: RenderJob) => void } = {},
  ): Promise<RenderJob> {
    for (;;) {
      const job = await this.graphicsStatus(jobId);
      options.onUpdate?.(job);
      if (TERMINAL.has(job.state)) return job;
      await new Promise((resolve) => setTimeout(resolve, options.intervalMs ?? 3000));
    }
  }

  /**
   * Send a film's files and answer its bundle id: hash every file, send small
   * text files inline (up to 2 MB), then PUT the rest to their links. Files the
   * account already stored are never sent again.
   */
  async uploadGraphics(
    files: GraphicsLocalFile[],
    options: { onUpload?: (missing: GraphicsMissing) => void } = {},
  ): Promise<GraphicsBundle> {
    const byHash = new Map<string, Uint8Array>();
    const sent: GraphicsSentFile[] = [];
    let inline = 0;
    const inlined = new Set<string>();
    for (const file of files) {
      const sha256 = await sha256Hex(file.data);
      byHash.set(sha256, file.data);
      const entry: GraphicsSentFile = { path: file.path, bytes: file.data.byteLength, sha256 };
      const text = inlined.has(sha256) ? undefined : graphicsText(file.path, file.data);
      if (text !== undefined && inline + file.data.byteLength <= GRAPHICS_INLINE_TOTAL) {
        entry.text = text;
        inline += file.data.byteLength;
        inlined.add(sha256);
      }
      sent.push(entry);
    }
    const bundle = await this.graphicsFiles(sent);
    await this.putMissing(bundle.missing, byHash, options.onUpload);
    return bundle;
  }

  /** PUT each missing file's bytes to its link. */
  async putMissing(
    missing: GraphicsMissing[],
    byHash: Map<string, Uint8Array>,
    onUpload?: (missing: GraphicsMissing) => void,
  ): Promise<void> {
    for (const file of missing) {
      const data = byHash.get(file.sha256);
      if (!data) throw new VidJutsuError(400, "graphics_file_unknown", `no bytes for ${file.paths.join(", ")}`);
      onUpload?.(file);
      const response = await this.fetcher(file.put_url, { method: "PUT", body: data as unknown as BodyInit });
      if (!response.ok) {
        throw new VidJutsuError(response.status, "graphics_upload_failed", `${file.paths[0]} was refused (HTTP ${response.status})`);
      }
    }
  }

  /** Upload a film's files, start the render and wait for it: the finished job (output.media is the video). */
  async renderGraphics(
    files: GraphicsLocalFile[],
    film: GraphicsFilm,
    options: { name?: string; idempotencyKey?: string; onUpdate?: (job: RenderJob) => void; intervalMs?: number } = {},
  ): Promise<RenderJob> {
    const { bundle } = await this.uploadGraphics(files);
    const job = await this.makeGraphics({ film, bundle, ...(options.name ? { name: options.name } : {}) }, options.idempotencyKey);
    if (TERMINAL.has(job.state)) return job;
    return this.waitForGraphics(job.job_id, { onUpdate: options.onUpdate, intervalMs: options.intervalMs });
  }
}

function seg(value: string): string {
  return encodeURIComponent(value);
}

function query(values: Query): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

function errorOf(response: Response, parsed: unknown): VidJutsuError {
  const error = (parsed ?? {}) as JsonObject;
  return new VidJutsuError(
    response.status,
    String(error.code ?? `http_${response.status}`),
    String(error.message ?? response.statusText),
    error,
  );
}

type RawEvent = { event?: string; id?: string; data?: Json; retry?: number };

/** Parse a text/event-stream body into events (data parsed as JSON when it is JSON). */
export async function* parseEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<RawEvent> {
  const decoder = new TextDecoder();
  let buffer = "";
  let current: { event?: string; id?: string; data: string[]; retry?: number } = { data: [] };
  const flush = (): RawEvent | undefined => {
    const { event, id, data, retry } = current;
    current = { data: [] };
    if (!event && !data.length && id === undefined && retry === undefined) return undefined;
    let value: Json | undefined;
    if (data.length) {
      const text = data.join("\n");
      try {
        value = JSON.parse(text);
      } catch {
        value = text;
      }
    }
    return {
      ...(event ? { event } : {}),
      ...(id !== undefined ? { id } : {}),
      ...(value !== undefined ? { data: value } : {}),
      ...(retry !== undefined ? { retry } : {}),
    };
  };
  const reader = body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
    let newline: number;
    while ((newline = buffer.search(/\r\n|\n|\r/)) >= 0) {
      const line = buffer.slice(0, newline);
      buffer = buffer.slice(newline + (buffer.startsWith("\r\n", newline) ? 2 : 1));
      if (line === "") {
        const event = flush();
        if (event) yield event;
        continue;
      }
      if (line.startsWith(":")) continue;
      const colon = line.indexOf(":");
      const field = colon < 0 ? line : line.slice(0, colon);
      const text = colon < 0 ? "" : line.slice(colon + 1).replace(/^ /, "");
      if (field === "event") current.event = text;
      else if (field === "data") current.data.push(text);
      else if (field === "id") current.id = text;
      else if (field === "retry" && /^\d+$/.test(text)) current.retry = Number(text);
    }
    if (done) {
      const event = flush();
      if (event) yield event;
      return;
    }
  }
}

export async function sha256Hex(data: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", data as BufferSource);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
