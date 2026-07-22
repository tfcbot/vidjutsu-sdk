import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const versionSource = readFileSync(new URL("../src/cli/version.ts", import.meta.url), "utf8");
const runtimeVersion = versionSource.match(/VERSION\s*=\s*"([^"]+)"/)?.[1];

if (!runtimeVersion || runtimeVersion !== packageJson.version) {
  throw new Error(`Version mismatch: package=${packageJson.version}, runtime=${runtimeVersion ?? "missing"}`);
}

const tag = process.env.GITHUB_REF_NAME;
if (tag?.startsWith("v") && tag !== `v${packageJson.version}`) {
  throw new Error(`Release tag ${tag} does not match package v${packageJson.version}`);
}

console.log(`Release contract valid for v${packageJson.version}`);
