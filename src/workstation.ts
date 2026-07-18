import {
  createClient as createFullClient,
  type VidJutsuConfig,
  type VidJutsuClient,
} from "./client.js";

export type WorkstationClient = Pick<
  VidJutsuClient,
  | "watchMedia"
  | "extractMedia"
  | "uploadFile"
  | "uploadFromUrl"
  | "listOrGetAssets"
  | "createOverlay"
  | "getJob"
  | "downloadTikTokVideo"
  | "downloadInstagramVideo"
>;

/**
 * Restricted client injected into VidJutsu job workstations.
 * Agent-backed cloning operations are deliberately absent.
 */
export function createClient(config: VidJutsuConfig = {}): WorkstationClient {
  const client = createFullClient(config);
  return {
    watchMedia: client.watchMedia,
    extractMedia: client.extractMedia,
    uploadFile: client.uploadFile,
    uploadFromUrl: client.uploadFromUrl,
    listOrGetAssets: client.listOrGetAssets,
    createOverlay: client.createOverlay,
    getJob: client.getJob,
    downloadTikTokVideo: client.downloadTikTokVideo,
    downloadInstagramVideo: client.downloadInstagramVideo,
  };
}

export type { VidJutsuConfig };
