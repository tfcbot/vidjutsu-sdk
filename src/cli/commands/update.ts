import { defineCommand } from "citty";
import { execSync } from "child_process";
import { existsSync, unlinkSync } from "fs";
import { VERSION } from "../version";

const REPO = "tfcbot/vidjutsu-sdk";
const BINARY_NAME = "vidjutsu";

function detectPlatform(): string {
  const os = process.platform === "darwin" ? "darwin" : "linux";
  const arch = process.arch === "arm64" ? "arm64" : "x64";
  return `${os}-${arch}`;
}

function getCurrentVersion(): string {
  return VERSION;
}

async function getLatestVersion(): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/releases/latest`
  );
  if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);
  const data = (await res.json()) as { tag_name: string };
  return data.tag_name.replace(/^v/, "");
}

function getBinaryPath(): string {
  try {
    return execSync(`which ${BINARY_NAME}`, { encoding: "utf-8" }).trim();
  } catch {
    return `${process.env.HOME}/.local/bin/${BINARY_NAME}`;
  }
}

export default defineCommand({
  meta: { name: "update", description: "Update VidJutsu CLI to the latest version" },
  args: {
    force: {
      type: "boolean",
      description: "Force update even if already on latest",
      default: false,
    },
  },
  async run({ args }) {
    const current = getCurrentVersion();
    console.log(`Current version: v${current}`);

    const latest = await getLatestVersion();
    console.log(`Latest version:  v${latest}`);

    if (current === latest && !args.force) {
      console.log("Already on the latest version.");
      return;
    }

    const platform = detectPlatform();
    const url = `https://github.com/${REPO}/releases/download/v${latest}/${BINARY_NAME}-${platform}`;
    const installDir = `${process.env.HOME}/.local/bin`;
    const installPath = `${installDir}/${BINARY_NAME}`;

    console.log(`Downloading v${latest} for ${platform}...`);

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
    const binary = await res.arrayBuffer();

    // Clean up old binary at /usr/local/bin if it exists
    const oldPath = `/usr/local/bin/${BINARY_NAME}`;
    const currentPath = getBinaryPath();
    if (currentPath === oldPath && existsSync(oldPath)) {
      try {
        unlinkSync(oldPath);
        console.log(`Removed old binary at ${oldPath}`);
      } catch {
        console.log(
          `Could not remove ${oldPath} — run: sudo rm ${oldPath}`
        );
      }
    }

    execSync(`mkdir -p ${installDir}`);
    const file = Bun.file(installPath);
    await Bun.write(file, binary);
    execSync(`chmod +x ${installPath}`);

    console.log(`Updated to v${latest} at ${installPath}`);
  },
});
