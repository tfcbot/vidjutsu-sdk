import { defineCommand } from "citty";
import { setApiKey, getConfig, publicRequest, CONFIG_DIR, CONFIG_FILE } from "../client";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const CREDENTIALS_FILE = join(CONFIG_DIR, "credentials.json");

export default defineCommand({
  meta: { name: "auth", description: "Authenticate with your VidJutsu API key" },
  args: {
    key: { type: "string", description: "Your VidJutsu API key (vj_...)" },
    recover: { type: "string", description: "Request verification code via email" },
    verify: { type: "boolean", description: "Submit verification code" },
    email: { type: "string", description: "Email for verification" },
    code: { type: "string", description: "Verification code from email" },
    export: { type: "boolean", description: "Export credentials to file" },
  },
  async run({ args }) {
    // Manual key entry
    if (args.key) {
      setApiKey(args.key);
      console.log(`Credentials saved to ${CONFIG_FILE}`);
      return;
    }

    // Request verification code
    if (args.recover) {
      await publicRequest("POST", "/v1/auth/verify/request", {
        email: args.recover,
      });
      console.log("Verification code sent. Run:");
      console.log(`  vidjutsu auth --verify --email ${args.recover} --code <code>`);
      return;
    }

    // Submit verification code
    if (args.verify) {
      if (!args.email || !args.code) {
        console.error("Both --email and --code are required with --verify.");
        console.error("  vidjutsu auth --verify --email you@example.com --code 123456");
        process.exit(1);
      }

      const result = (await publicRequest("POST", "/v1/auth/verify/confirm", {
        email: args.email,
        code: args.code,
      })) as { status: string; apiKey: string; clientId: string };

      setApiKey(result.apiKey);
      console.log(`Credentials saved to ${CONFIG_FILE}`);
      return;
    }

    // Export credentials
    if (args.export) {
      const config = getConfig();
      if (!config.apiKey) {
        console.error("Not authenticated. Nothing to export.");
        process.exit(1);
      }

      if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
      writeFileSync(CREDENTIALS_FILE, JSON.stringify({
        apiKey: config.apiKey,
      }, null, 2));
      console.log(`Credentials written to ${CREDENTIALS_FILE}`);
      return;
    }

    // Default: show status
    const config = getConfig();
    if (config.apiKey) {
      console.log("Authenticated");
      console.log(`Config: ${CONFIG_FILE}`);
    } else {
      console.log("Not authenticated.");
      console.log('  Subscribe:  vidjutsu subscribe --email you@example.com');
      console.log('  Manual key: vidjutsu auth --key <your_api_key>');
    }
  },
});
