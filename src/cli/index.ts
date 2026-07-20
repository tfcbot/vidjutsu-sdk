#!/usr/bin/env node
import { defineCommand, runMain } from "citty";
import { VERSION } from "./version";
import { createVidJutsuAgentExtension } from "./agent/vidjutsu-extension";

const cli = defineCommand({
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
    balance: () => import("./commands/balance").then((m) => m.default),
    admin: () => import("./commands/admin").then((m) => m.default),
    version: () => import("./commands/version").then((m) => m.default),
    update: () => import("./commands/update").then((m) => m.default),
    clips: () => import("./commands/clips").then((m) => m.default),
    jobs: () => import("./commands/jobs").then((m) => m.default),
    clone: () => import("./commands/clone").then((m) => m.default),
    character: () => import("./commands/character").then((m) => m.default),

    // --- Generated from OpenAPI spec ---
    watch: () => import("./commands/generated/watch").then((m) => m.default),
    extract: () => import("./commands/generated/extract").then((m) => m.default),
    transcribe: () => import("./commands/generated/transcribe").then((m) => m.default),
    overlay: () => import("./commands/generated/overlay").then((m) => m.default),
    compliance: () => import("./commands/generated/compliance").then((m) => m.default),
    account: () => import("./commands/generated/account").then((m) => m.default),
    post: () => import("./commands/generated/post").then((m) => m.default),
    asset: () => import("./commands/generated/asset").then((m) => m.default),
    reference: () => import("./commands/generated/reference").then((m) => m.default),
    usage: () => import("./commands/generated/usage").then((m) => m.default),
    info: () => import("./commands/generated/info").then((m) => m.default),
    project: () => import("./commands/generated/project").then((m) => m.default),
  },
});

async function run() {
  const [, , command, ...args] = process.argv;

  if (command === "agent") {
    console.log("VidJutsu Agent");
    console.log("Use /login to connect Claude or OpenAI.");
    console.log("");

    const { main: runPi } = await import("@earendil-works/pi-coding-agent");
    await runPi(args, { extensionFactories: [createVidJutsuAgentExtension] });
    return;
  }

  await runMain(cli);
}

run();
