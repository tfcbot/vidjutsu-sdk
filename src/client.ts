import createFetchClient from "openapi-fetch";
import type { paths } from "./schema.js";
import { bindMethods, type VidJutsuMethods } from "./methods.js";
import { bindDistribution, type DistributionNamespaces } from "./distribution.js";
import { bindJobs, type JobsNamespaces } from "./jobs.js";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

export interface VidJutsuConfig {
  /** API key. Falls back to VIDJUTSU_API_KEY env var, then ~/.vidjutsu/config.json. */
  apiKey?: string;
  /** Base URL. Falls back to VIDJUTSU_API_URL env var, then ~/.vidjutsu/config.json, then https://api.vidjutsu.ai. */
  baseUrl?: string;
}

/** The raw openapi-fetch client with typed GET/POST/PUT/DELETE */
type FetchClient = ReturnType<typeof createFetchClient<paths>>;

/** Combined client: typed convenience methods + raw openapi-fetch escape hatch */
export type VidJutsuClient =
  & VidJutsuMethods
  & DistributionNamespaces
  & JobsNamespaces
  & { api: FetchClient };

interface ConfigFile {
  apiUrl?: string;
  apiKey?: string;
}

function readConfigFile(): ConfigFile | null {
  try {
    const configPath = join(homedir(), ".vidjutsu", "config.json");
    if (existsSync(configPath)) {
      return JSON.parse(readFileSync(configPath, "utf-8"));
    }
  } catch {
    // Non-Node environments (edge, browser) — config file not available
  }
  return null;
}

/**
 * Create a typed VidJutsu API client.
 *
 * @example
 * ```ts
 * import { createClient } from 'vidjutsu';
 *
 * const vj = createClient(); // reads ~/.vidjutsu/config.json or env vars
 *
 * // Convenience methods (fully typed):
 * const { data } = await vj.watchMedia({ mediaUrl: 'https://...', prompt: '...' });
 * const { data } = await vj.extractMedia({ mediaUrl: 'https://...', frames: 'auto' });
 * const { data } = await vj.transcribeMedia({ mediaUrl: 'https://...' });
 *
 * // Raw openapi-fetch (escape hatch):
 * const { data } = await vj.api.GET('/v1/usage');
 * ```
 */
export function createClient(config: VidJutsuConfig = {}): VidJutsuClient {
  const configFile = readConfigFile();

  const apiKey =
    config.apiKey ??
    process.env.VIDJUTSU_API_KEY ??
    configFile?.apiKey;

  const baseUrl =
    config.baseUrl ??
    process.env.VIDJUTSU_API_URL ??
    configFile?.apiUrl ??
    "https://api.vidjutsu.ai";

  const fetchClient = createFetchClient<paths>({
    baseUrl,
    headers: {
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      "Content-Type": "application/json",
    },
  });

  const methods = bindMethods(fetchClient);
  const distribution = bindDistribution(fetchClient);
  const jobs = bindJobs(fetchClient);

  return { ...methods, ...distribution, ...jobs, api: fetchClient };
}
