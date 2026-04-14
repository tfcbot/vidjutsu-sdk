#!/usr/bin/env node
import { defineCommand, runMain } from "citty";
import { VERSION } from "./version";

const main = defineCommand({
  meta: {
    name: "vidjutsu",
    version: VERSION,
    description: "Video intelligence API — watch, extract, transcribe, check.",
  },
  subCommands: {
    // --- Hand-written (custom logic) ---
    auth: () => import("./commands/auth").then((m) => m.default),
    check: () => import("./commands/check").then((m) => m.default),
    upload: () => import("./commands/upload").then((m) => m.default),
    subscribe: () => import("./commands/subscribe").then((m) => m.default),
    status: () => import("./commands/status").then((m) => m.default),
    version: () => import("./commands/version").then((m) => m.default),
    update: () => import("./commands/update").then((m) => m.default),

    // --- Generated from OpenAPI spec ---
    watch: () => import("./commands/generated/watch").then((m) => m.default),
    extract: () => import("./commands/generated/extract").then((m) => m.default),
    transcribe: () => import("./commands/generated/transcribe").then((m) => m.default),
    overlay: () => import("./commands/generated/overlay").then((m) => m.default),
    account: () => import("./commands/generated/account").then((m) => m.default),
    post: () => import("./commands/generated/post").then((m) => m.default),
    asset: () => import("./commands/generated/asset").then((m) => m.default),
    reference: () => import("./commands/generated/reference").then((m) => m.default),
    usage: () => import("./commands/generated/usage").then((m) => m.default),
    info: () => import("./commands/generated/info").then((m) => m.default),
  },
});

runMain(main);
