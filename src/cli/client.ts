// VidJutsu HTTP client for CLI
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

export const CONFIG_DIR = join(homedir(), ".vidjutsu");
export const CONFIG_FILE = join(CONFIG_DIR, "config.json");

interface Config {
  apiUrl: string;
  apiKey?: string;
}

const DEFAULT_API_URL = "https://api.vidjutsu.ai";

function loadConfig(): Config {
  if (existsSync(CONFIG_FILE)) {
    const raw = JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
    // Always use prod URL — ignore stale dev/preview URLs from testing
    if (!raw.apiUrl || raw.apiUrl.includes(".convex.site")) {
      raw.apiUrl = DEFAULT_API_URL;
    }
    return raw;
  }
  return { apiUrl: DEFAULT_API_URL };
}

function saveConfig(config: Config) {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getConfig(): Config {
  return loadConfig();
}

export function setApiKey(apiKey: string) {
  const config = loadConfig();
  config.apiKey = apiKey;
  saveConfig(config);
}

export function setApiUrl(url: string) {
  const config = loadConfig();
  config.apiUrl = url;
  saveConfig(config);
}

export async function publicRequest(
  method: string,
  path: string,
  body?: unknown
): Promise<unknown> {
  const config = loadConfig();
  const url = `${config.apiUrl}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const res = await fetch(url, {
    method,
    headers,
    ...(body && { body: JSON.stringify(body) }),
  });

  const json = await res.json();

  if (!res.ok) {
    const msg =
      typeof json === "object" && json !== null && "error" in json
        ? (json as any).message ?? (json as any).error
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return json;
}

export async function apiRequest(
  method: string,
  path: string,
  body?: unknown
): Promise<unknown> {
  const config = loadConfig();
  if (!config.apiKey) {
    throw new Error(
      'Not authenticated. Run "vidjutsu auth --key <your_api_key>" first.'
    );
  }

  const url = `${config.apiUrl}${path}`;
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
  };

  const res = await fetch(url, {
    method,
    headers,
    ...(body && { body: JSON.stringify(body) }),
  });

  const json = await res.json();

  if (!res.ok) {
    const msg =
      typeof json === "object" && json !== null && "error" in json
        ? (json as any).message ?? (json as any).error
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return json;
}
