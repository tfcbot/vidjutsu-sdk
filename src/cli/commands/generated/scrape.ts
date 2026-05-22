// AUTO-GENERATED — do not edit. Run `bun run codegen` to regenerate.
import { defineCommand } from "citty";
import { apiRequest } from "../../client";

export default defineCommand({
  meta: { name: "scrape", description: "Scrape social platforms and ad libraries (TikTok, Instagram, X, YouTube, Meta/Google/LinkedIn/Reddit ads)" },
  subCommands: {
    "tiktok-profile": defineCommand({
      meta: { name: "tiktok-profile", description: "Scrape TikTok profile" },
      args: {
        "handle": { type: "string", description: "TikTok username (without @)", required: true },
        "trim": { type: "boolean", description: "Reduce response size by trimming large fields" },
        "download-media": { type: "boolean", description: "Stage media URLs through VidJutsu CDN (response contains only VidJutsu URLs). Defaults to false." },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["handle"] !== undefined) body["handle"] = args["handle"];
        if (args["trim"] !== undefined) body["trim"] = args["trim"];
        if (args["download-media"] !== undefined) body["download_media"] = args["download-media"];
        const result = await apiRequest("POST", "/v1/scrape/tiktok/profile", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "tiktok-profile-videos": defineCommand({
      meta: { name: "tiktok-profile-videos", description: "Scrape TikTok profile videos" },
      args: {
        "handle": { type: "string", description: "TikTok username", required: true },
        "cursor": { type: "string", description: "Pagination cursor" },
        "download-media": { type: "boolean", description: "Stage media URLs through VidJutsu CDN. Defaults to false." },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["handle"] !== undefined) body["handle"] = args["handle"];
        if (args["cursor"] !== undefined) body["cursor"] = args["cursor"];
        if (args["download-media"] !== undefined) body["download_media"] = args["download-media"];
        const result = await apiRequest("POST", "/v1/scrape/tiktok/profile/videos", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "tiktok-video": defineCommand({
      meta: { name: "tiktok-video", description: "Scrape TikTok video" },
      args: {
        "url": { type: "string", description: "TikTok video URL", required: true },
        "trim": { type: "boolean", description: "Reduce response size" },
        "download-media": { type: "boolean", description: "Stage media URLs through VidJutsu CDN. Defaults to false." },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["url"] !== undefined) body["url"] = args["url"];
        if (args["trim"] !== undefined) body["trim"] = args["trim"];
        if (args["download-media"] !== undefined) body["download_media"] = args["download-media"];
        const result = await apiRequest("POST", "/v1/scrape/tiktok/video", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "tiktok-video-transcript": defineCommand({
      meta: { name: "tiktok-video-transcript", description: "Scrape TikTok video transcript" },
      args: {
        "url": { type: "string", description: "TikTok video URL", required: true },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["url"] !== undefined) body["url"] = args["url"];
        const result = await apiRequest("POST", "/v1/scrape/tiktok/video/transcript", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "tiktok-video-comments": defineCommand({
      meta: { name: "tiktok-video-comments", description: "Scrape TikTok video comments" },
      args: {
        "url": { type: "string", description: "TikTok video URL", required: true },
        "cursor": { type: "string", description: "Pagination cursor" },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["url"] !== undefined) body["url"] = args["url"];
        if (args["cursor"] !== undefined) body["cursor"] = args["cursor"];
        const result = await apiRequest("POST", "/v1/scrape/tiktok/video/comments", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "tiktok-search-users": defineCommand({
      meta: { name: "tiktok-search-users", description: "Scrape TikTok user search" },
      args: {
        "query": { type: "string", description: "Search query", required: true },
        "cursor": { type: "string", description: "Pagination cursor" },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["query"] !== undefined) body["query"] = args["query"];
        if (args["cursor"] !== undefined) body["cursor"] = args["cursor"];
        const result = await apiRequest("POST", "/v1/scrape/tiktok/search/users", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "tiktok-trending": defineCommand({
      meta: { name: "tiktok-trending", description: "Scrape TikTok trending feed" },
      args: {
        "country": { type: "string", description: "Two-letter ISO country code (e.g. 'us')" },
        "download-media": { type: "boolean", description: "Stage media URLs through VidJutsu CDN. Defaults to false." },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["country"] !== undefined) body["country"] = args["country"];
        if (args["download-media"] !== undefined) body["download_media"] = args["download-media"];
        const result = await apiRequest("POST", "/v1/scrape/tiktok/trending", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "instagram-profile": defineCommand({
      meta: { name: "instagram-profile", description: "Scrape Instagram profile" },
      args: {
        "handle": { type: "string", description: "Instagram username (without @)", required: true },
        "download-media": { type: "boolean", description: "Stage media URLs through VidJutsu CDN. Defaults to false." },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["handle"] !== undefined) body["handle"] = args["handle"];
        if (args["download-media"] !== undefined) body["download_media"] = args["download-media"];
        const result = await apiRequest("POST", "/v1/scrape/instagram/profile", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "instagram-user-posts": defineCommand({
      meta: { name: "instagram-user-posts", description: "Scrape Instagram user posts" },
      args: {
        "handle": { type: "string", description: "Instagram username", required: true },
        "cursor": { type: "string", description: "Pagination cursor" },
        "download-media": { type: "boolean", description: "Stage media URLs through VidJutsu CDN. Defaults to false." },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["handle"] !== undefined) body["handle"] = args["handle"];
        if (args["cursor"] !== undefined) body["cursor"] = args["cursor"];
        if (args["download-media"] !== undefined) body["download_media"] = args["download-media"];
        const result = await apiRequest("POST", "/v1/scrape/instagram/user/posts", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "instagram-post": defineCommand({
      meta: { name: "instagram-post", description: "Scrape Instagram post or reel" },
      args: {
        "url": { type: "string", description: "Instagram post or reel URL", required: true },
        "download-media": { type: "boolean", description: "Stage media URLs through VidJutsu CDN. Defaults to false." },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["url"] !== undefined) body["url"] = args["url"];
        if (args["download-media"] !== undefined) body["download_media"] = args["download-media"];
        const result = await apiRequest("POST", "/v1/scrape/instagram/post", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "instagram-post-comments": defineCommand({
      meta: { name: "instagram-post-comments", description: "Scrape Instagram post comments" },
      args: {
        "url": { type: "string", description: "Instagram post URL", required: true },
        "cursor": { type: "string", description: "Pagination cursor" },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["url"] !== undefined) body["url"] = args["url"];
        if (args["cursor"] !== undefined) body["cursor"] = args["cursor"];
        const result = await apiRequest("POST", "/v1/scrape/instagram/post/comments", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "instagram-user-reels": defineCommand({
      meta: { name: "instagram-user-reels", description: "Scrape Instagram user reels" },
      args: {
        "handle": { type: "string", description: "Instagram username", required: true },
        "cursor": { type: "string", description: "Pagination cursor" },
        "download-media": { type: "boolean", description: "Stage media URLs through VidJutsu CDN. Defaults to false." },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["handle"] !== undefined) body["handle"] = args["handle"];
        if (args["cursor"] !== undefined) body["cursor"] = args["cursor"];
        if (args["download-media"] !== undefined) body["download_media"] = args["download-media"];
        const result = await apiRequest("POST", "/v1/scrape/instagram/user/reels", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "twitter-profile": defineCommand({
      meta: { name: "twitter-profile", description: "Scrape X profile" },
      args: {
        "handle": { type: "string", description: "X username (without @)", required: true },
        "download-media": { type: "boolean", description: "Stage media URLs through VidJutsu CDN. Defaults to false." },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["handle"] !== undefined) body["handle"] = args["handle"];
        if (args["download-media"] !== undefined) body["download_media"] = args["download-media"];
        const result = await apiRequest("POST", "/v1/scrape/twitter/profile", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "twitter-user-tweets": defineCommand({
      meta: { name: "twitter-user-tweets", description: "Scrape X user tweets" },
      args: {
        "handle": { type: "string", description: "X username", required: true },
        "cursor": { type: "string", description: "Pagination cursor" },
        "trim": { type: "boolean", description: "Reduce response size" },
        "download-media": { type: "boolean", description: "Stage media URLs through VidJutsu CDN. Defaults to false." },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["handle"] !== undefined) body["handle"] = args["handle"];
        if (args["cursor"] !== undefined) body["cursor"] = args["cursor"];
        if (args["trim"] !== undefined) body["trim"] = args["trim"];
        if (args["download-media"] !== undefined) body["download_media"] = args["download-media"];
        const result = await apiRequest("POST", "/v1/scrape/twitter/user-tweets", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "twitter-tweet": defineCommand({
      meta: { name: "twitter-tweet", description: "Scrape X tweet" },
      args: {
        "url": { type: "string", description: "Tweet URL or status URL", required: true },
        "trim": { type: "boolean", description: "Reduce response size" },
        "download-media": { type: "boolean", description: "Stage media URLs through VidJutsu CDN. Defaults to false." },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["url"] !== undefined) body["url"] = args["url"];
        if (args["trim"] !== undefined) body["trim"] = args["trim"];
        if (args["download-media"] !== undefined) body["download_media"] = args["download-media"];
        const result = await apiRequest("POST", "/v1/scrape/twitter/tweet", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "twitter-tweet-transcript": defineCommand({
      meta: { name: "twitter-tweet-transcript", description: "Scrape X tweet video transcript" },
      args: {
        "url": { type: "string", description: "Tweet URL", required: true },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["url"] !== undefined) body["url"] = args["url"];
        const result = await apiRequest("POST", "/v1/scrape/twitter/tweet/transcript", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "youtube-channel": defineCommand({
      meta: { name: "youtube-channel", description: "Scrape YouTube channel" },
      args: {
        "handle": { type: "string", description: "Channel handle, e.g. @MrBeast" },
        "channel-id": { type: "string", description: "Channel ID, e.g. UC..." },
        "download-media": { type: "boolean", description: "Stage media URLs through VidJutsu CDN. Defaults to false." },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["handle"] !== undefined) body["handle"] = args["handle"];
        if (args["channel-id"] !== undefined) body["channel_id"] = args["channel-id"];
        if (args["download-media"] !== undefined) body["download_media"] = args["download-media"];
        const result = await apiRequest("POST", "/v1/scrape/youtube/channel", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "youtube-channel-videos": defineCommand({
      meta: { name: "youtube-channel-videos", description: "Scrape YouTube channel videos" },
      args: {
        "handle": { type: "string", description: "Channel handle" },
        "channel-id": { type: "string", description: "Channel ID" },
        "cursor": { type: "string", description: "Pagination cursor" },
        "download-media": { type: "boolean", description: "Stage media URLs through VidJutsu CDN. Defaults to false." },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["handle"] !== undefined) body["handle"] = args["handle"];
        if (args["channel-id"] !== undefined) body["channel_id"] = args["channel-id"];
        if (args["cursor"] !== undefined) body["cursor"] = args["cursor"];
        if (args["download-media"] !== undefined) body["download_media"] = args["download-media"];
        const result = await apiRequest("POST", "/v1/scrape/youtube/channel-videos", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "youtube-video": defineCommand({
      meta: { name: "youtube-video", description: "Scrape YouTube video" },
      args: {
        "url": { type: "string", description: "YouTube video URL", required: true },
        "download-media": { type: "boolean", description: "Stage media URLs through VidJutsu CDN. Defaults to false." },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["url"] !== undefined) body["url"] = args["url"];
        if (args["download-media"] !== undefined) body["download_media"] = args["download-media"];
        const result = await apiRequest("POST", "/v1/scrape/youtube/video", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "youtube-video-comments": defineCommand({
      meta: { name: "youtube-video-comments", description: "Scrape YouTube video comments" },
      args: {
        "url": { type: "string", description: "YouTube video URL", required: true },
        "cursor": { type: "string", description: "Pagination cursor" },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["url"] !== undefined) body["url"] = args["url"];
        if (args["cursor"] !== undefined) body["cursor"] = args["cursor"];
        const result = await apiRequest("POST", "/v1/scrape/youtube/video/comments", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "meta-ads": defineCommand({
      meta: { name: "meta-ads", description: "Scrape Meta (Facebook) Ad Library" },
      args: {
        "query": { type: "string", description: "Search keyword or page name", required: true },
        "country": { type: "string", description: "Two-letter ISO country (default: US)" },
        "download-media": { type: "boolean", description: "Stage media URLs through VidJutsu CDN. Defaults to false." },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["query"] !== undefined) body["query"] = args["query"];
        if (args["country"] !== undefined) body["country"] = args["country"];
        if (args["download-media"] !== undefined) body["download_media"] = args["download-media"];
        const result = await apiRequest("POST", "/v1/scrape/ads/meta", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "google-ads": defineCommand({
      meta: { name: "google-ads", description: "Scrape Google Ad Transparency" },
      args: {
        "company": { type: "string", description: "Company / advertiser name", required: true },
        "download-media": { type: "boolean", description: "Stage media URLs through VidJutsu CDN. Defaults to false." },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["company"] !== undefined) body["company"] = args["company"];
        if (args["download-media"] !== undefined) body["download_media"] = args["download-media"];
        const result = await apiRequest("POST", "/v1/scrape/ads/google", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "linkedin-ads": defineCommand({
      meta: { name: "linkedin-ads", description: "Scrape LinkedIn Ad Library" },
      args: {
        "query": { type: "string", description: "Search keyword", required: true },
        "download-media": { type: "boolean", description: "Stage media URLs through VidJutsu CDN. Defaults to false." },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["query"] !== undefined) body["query"] = args["query"];
        if (args["download-media"] !== undefined) body["download_media"] = args["download-media"];
        const result = await apiRequest("POST", "/v1/scrape/ads/linkedin", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
    "reddit-ads": defineCommand({
      meta: { name: "reddit-ads", description: "Scrape Reddit Ad Library" },
      args: {
        "query": { type: "string", description: "Search keyword", required: true },
        "download-media": { type: "boolean", description: "Stage media URLs through VidJutsu CDN. Defaults to false." },
      },
      async run({ args }) {
        const body: Record<string, unknown> = {};
        if (args["query"] !== undefined) body["query"] = args["query"];
        if (args["download-media"] !== undefined) body["download_media"] = args["download-media"];
        const result = await apiRequest("POST", "/v1/scrape/ads/reddit", body);
        console.log(JSON.stringify(result, null, 2));
      },
    }),
  },
});
