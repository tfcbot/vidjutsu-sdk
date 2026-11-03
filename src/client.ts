// VidJutsu Cloud client: the REST API at https://api.vidjutsu.ai, versioned
// by date in the VidJutsu-Version header.
//
// Every method maps to one public operation (the same names as the MCP
// tools). JSON in and out is snake_case, as the API sends it. Errors are
// thrown as VidJutsuError with the API's {code, message} and, for 402s, the
// link that fixes them (checkout_url, top_up_url or portal_url).

export const DEFAULT_BASE_URL = "https://api.vidjutsu.ai";
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
  /** The Stripe link that fixes a 402, when the API sent one. */
  get fixUrl(): string | undefined {
    const url = this.body.checkout_url ?? this.body.top_up_url ?? this.body.portal_url;
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

/** A shot list edit operation, named by `op` (add_scene, add_shot, set_shot, attach_media and the rest). */
export type ShotListOperation = JsonObject & { op: string };

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
  /** Sign up for the prepaid wallet: a card and a first payment (amount_usd, default 5, at least 5). */
  billingCheckout(options: { amount_usd?: number; success_url?: string; cancel_url?: string } = {}) {
    return this.request<{ url: string } & JsonObject>("POST", "/billing/checkout", options);
  }
  /** Add credits to the wallet any time (amount_usd, default 10, at least 5). */
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
  init(project: string, idempotencyKey?: string) {
    return this.request("POST", "/projects", { project, idempotency_key: idempotencyKey });
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

  /** The shot list: scenes, shots and the files filed under each, with where each file is on the timeline. */
  shotList(project: string) {
    return this.request("GET", `/projects/${seg(project)}/shot-list`);
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

  /** Turn on Studio Sound: clean every voice and swap the cleaned copies onto their clips. $0.10 a voice minute. */
  studioSound(project: string, options: { media?: string[]; branch?: string } = {}, idempotencyKey?: string) {
    return this.request<StartedJob>("POST", `/projects/${seg(project)}/studio-sound`, options, idempotencyKey);
  }
  /** What a render at each quality and Studio Sound would cost, and whether your wallet lets each start. Free. */
  quote(project: string, options: { media?: string[] } = {}) {
    return this.request("GET", `/projects/${seg(project)}/quote${query({ media: options.media?.join(",") })}`);
  }

  // ---- Renders ----

  render(project: string, body: JsonObject = {}, idempotencyKey?: string) {
    return this.request<RenderJob>("POST", `/projects/${seg(project)}/renders`, body, idempotencyKey);
  }
  renderStatus(jobId: string) {
    return this.request<RenderJob>("GET", `/jobs/${seg(jobId)}`);
  }
  cancelRender(jobId: string) {
    return this.request<RenderJob>("POST", `/jobs/${seg(jobId)}/cancel`);
  }
  /** Poll a job (render, preview, transcript or Studio Sound) until it ends. */
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
