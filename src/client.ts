// VidJutsu Cloud client: the REST API at https://api.vidjutsu.ai, versioned
// by date in the VidJutsu-Version header.
//
// Every method maps to one public operation (the same names as the MCP
// tools). JSON in and out is snake_case, as the API sends it. Errors are
// thrown as VidJutsuError with the API's {code, message} and, for 402s, the
// link that fixes them (checkout_url or portal_url).

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
}

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
    const url = this.body.checkout_url ?? this.body.portal_url;
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

  constructor(options: ClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.apiKey = options.apiKey;
    this.fetcher = options.fetch ?? fetch;
    this.apiVersion = options.apiVersion ?? API_VERSION;
  }

  /** One API call. `body` is sent as JSON; `idempotencyKey` makes writes safe to retry. */
  async request<T = JsonObject>(
    method: "GET" | "POST" | "DELETE",
    path: string,
    body?: unknown,
    idempotencyKey?: string,
  ): Promise<T> {
    const headers: Record<string, string> = {
      accept: "application/json",
      [VERSION_HEADER]: this.apiVersion,
    };
    if (this.apiKey) headers.authorization = `Bearer ${this.apiKey}`;
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
    if (!response.ok) {
      const error = (parsed ?? {}) as JsonObject;
      throw new VidJutsuError(
        response.status,
        String(error.code ?? `http_${response.status}`),
        String(error.message ?? response.statusText),
        error,
      );
    }
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
  billingCheckout(options: { success_url?: string; cancel_url?: string } = {}) {
    return this.request<{ url: string } & JsonObject>("POST", "/billing/checkout", options);
  }
  billingPortal(options: { return_url?: string } = {}) {
    return this.request<{ url: string } & JsonObject>("POST", "/billing/portal", options);
  }

  // ---- Media ----

  /** Add media from an https URL. */
  ingestUrl(url: string, name?: string, idempotencyKey?: string) {
    return this.request<Ingested>("POST", "/media", { url, name }, idempotencyKey);
  }
  mediaInfo(hash: string) {
    return this.request("GET", `/media/${seg(hash)}`);
  }
  mediaUrl(hash: string, ttlSeconds?: number) {
    const query = ttlSeconds ? `?ttl=${Math.floor(ttlSeconds)}` : "";
    return this.request<{ url: string } & JsonObject>("GET", `/media/${seg(hash)}/url${query}`);
  }
  createUpload(name: string, bytes: number, sha256: string, idempotencyKey?: string) {
    return this.request<{
      upload_id: string;
      already_stored: boolean;
      part_size: number;
      parts: UploadPart[];
    } & JsonObject>("POST", "/uploads", { name, bytes, sha256 }, idempotencyKey);
  }
  completeUpload(uploadId: string, parts: { number: number; etag: string }[]) {
    return this.request<Ingested>("POST", `/uploads/${seg(uploadId)}/complete`, { parts });
  }
  abortUpload(uploadId: string) {
    return this.request("DELETE", `/uploads/${seg(uploadId)}`);
  }

  /**
   * Upload a file's bytes straight to storage and add it to your library:
   * create_upload, PUT each part to its presigned link, complete_upload.
   */
  async upload(name: string, data: Uint8Array): Promise<Ingested> {
    const sha256 = await sha256Hex(data);
    const started = await this.createUpload(name, data.byteLength, sha256, `upload-${sha256}`);
    if (started.already_stored) return this.completeUpload(started.upload_id, []);
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
      return await this.completeUpload(started.upload_id, parts);
    } catch (error) {
      await this.abortUpload(started.upload_id).catch(() => undefined);
      throw error;
    }
  }

  // ---- Projects ----

  init(project: string, idempotencyKey?: string) {
    return this.request("POST", "/projects", { project, idempotency_key: idempotencyKey });
  }
  show(project: string) {
    return this.request("GET", `/projects/${seg(project)}`);
  }
  /** Apply edit operations; send expected_head so a retry can't apply twice. */
  edit(
    project: string,
    operations: JsonObject[],
    options: { expected_head?: string; branch?: string; idempotency_key?: string } = {},
  ) {
    return this.request("POST", `/projects/${seg(project)}/edits`, { operations, ...options });
  }
  level(project: string, body: JsonObject) {
    return this.request("POST", `/projects/${seg(project)}/level`, body);
  }
  cleanAudio(body: JsonObject) {
    return this.request("POST", "/audio/clean", body);
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

export async function sha256Hex(data: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", data as BufferSource);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
