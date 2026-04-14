import { defineCommand } from "citty";
import { publicRequest, setApiKey, CONFIG_FILE } from "../client";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default defineCommand({
  meta: { name: "subscribe", description: "Subscribe to VidJutsu ($99/mo)" },
  args: {
    email: { type: "string", description: "Email for checkout", required: true },
    claim: { type: "string", description: "Claim token to resume polling (claim_xxx)" },
  },
  async run({ args }) {
    if (!args.email) {
      console.error("Email is required. Usage: vidjutsu subscribe --email you@example.com");
      process.exit(1);
    }

    let claimToken: string;

    if (args.claim) {
      claimToken = args.claim;
    } else {
      const checkout = (await publicRequest("POST", "/v1/subscribe", {
        email: args.email,
      })) as { url: string; claimToken: string };

      claimToken = checkout.claimToken;

      console.log(`\nCheckout: ${checkout.url}`);
      console.log("\nComplete payment in your browser.");
    }

    console.log("Waiting for payment...");

    const startTime = Date.now();
    const timeoutMs = 15 * 60 * 1000;

    while (Date.now() - startTime < timeoutMs) {
      const elapsed = Date.now() - startTime;
      const interval = elapsed < 60_000 ? 3_000 : 5_000;

      await sleep(interval);

      try {
        const result = (await publicRequest(
          "GET",
          `/v1/credits/status?session=${claimToken}`
        )) as any;

        if (result.status === "completed") {
          setApiKey(result.apiKey);
          console.log(`\nCredentials saved to ${CONFIG_FILE}`);
          console.log('Run "vidjutsu auth --export" to download a credentials file.');
          return;
        }

        if (result.status === "already_claimed") {
          console.log("\nThis checkout has already been claimed.");
          console.log('If you lost your credentials, recover them:');
          console.log(`  vidjutsu auth --recover ${args.email ?? "<your_email>"}`);
          process.exit(1);
        }

        if (result.status === "invalid_token") {
          console.error("\nInvalid claim token.");
          process.exit(1);
        }
      } catch {
        // Network error — keep polling
      }
    }

    console.log("\nTimed out waiting for payment.");
    console.log("\nIf you already paid, recover your credentials:");
    console.log(`  vidjutsu auth --recover ${args.email ?? "<your_email>"}`);
    process.exit(1);
  },
});
