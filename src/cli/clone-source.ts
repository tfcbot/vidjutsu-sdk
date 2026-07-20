export function sourceFromArgs(args: {
  url?: string;
  asset?: string;
}) {
  const choices = [args.url, args.asset].filter(Boolean);
  if (choices.length !== 1) {
    throw new Error("Provide exactly one of --url or --asset");
  }
  return args.url
    ? { kind: "http" as const, url: args.url }
    : { kind: "asset" as const, assetId: args.asset! };
}

export function cloneModel(value: string): "seedance" | "kling-motion-control" {
  if (value !== "seedance" && value !== "kling-motion-control") {
    throw new Error("--model must be seedance or kling-motion-control");
  }
  return value;
}

export function lowScoreOverride(args: { override?: boolean; reason?: string }) {
  if (!args.override && !args.reason) return undefined;
  if (args.override !== true || !args.reason?.trim()) {
    throw new Error("--override requires --reason");
  }
  return { allowLowScore: true as const, reason: args.reason.trim() };
}
