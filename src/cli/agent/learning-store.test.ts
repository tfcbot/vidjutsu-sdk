import { afterEach, describe, expect, test } from "bun:test";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  createLearningStore,
  createVidjutsuSkill,
  patchVidjutsuSkill,
  redactSecrets,
  resolveSkillFile,
  validateSkillName,
  writeVidjutsuReference,
} from "./learning-store";

const tempDirs: string[] = [];

async function makeStore() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "vidjutsu-learning-test-"));
  tempDirs.push(dir);
  return createLearningStore(dir);
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe("learning-store path guards", () => {
  test("accepts lowercase skill slugs", () => {
    expect(validateSkillName("product-photo-workflow")).toBe("product-photo-workflow");
  });

  test("rejects invalid skill names", () => {
    expect(() => validateSkillName("../escape")).toThrow();
    expect(() => validateSkillName("Bad Name")).toThrow();
  });

  test("keeps support files inside allowed directories", async () => {
    const store = await makeStore();
    expect(resolveSkillFile(store, "creative-briefs", "references/example.md")).toContain(
      "references/example.md",
    );
    expect(() => resolveSkillFile(store, "creative-briefs", "../outside.md")).toThrow();
    expect(() => resolveSkillFile(store, "creative-briefs", "notes/example.md")).toThrow();
  });
});

describe("learning-store write restrictions", () => {
  test("creates and patches a VidJutsu-owned skill", async () => {
    const store = await makeStore();
    await createVidjutsuSkill(
      store,
      "creative-briefs",
      `---
name: creative-briefs
description: Capture reusable creative brief workflows.
---

# Creative Briefs

- Start from the offer.
`,
    );

    await patchVidjutsuSkill(
      store,
      "creative-briefs",
      "- Start from the offer.",
      "- Start from the offer and the strongest visual proof.",
    );

    const content = await fs.readFile(
      path.join(store.skillRoot, "creative-briefs", "SKILL.md"),
      "utf8",
    );
    expect(content).toContain("strongest visual proof");
  });

  test("rejects missing and ambiguous exact-string patches", async () => {
    const store = await makeStore();
    await createVidjutsuSkill(
      store,
      "prompt-recipes",
      `---
name: prompt-recipes
description: Reusable prompt recipes.
---

repeat
repeat
`,
    );

    await expect(
      patchVidjutsuSkill(store, "prompt-recipes", "missing", "replacement"),
    ).rejects.toThrow();
    await expect(
      patchVidjutsuSkill(store, "prompt-recipes", "repeat", "replacement"),
    ).rejects.toThrow();
  });

  test("rejects support file writes outside approved directories", async () => {
    const store = await makeStore();
    await expect(
      writeVidjutsuReference(store, "prompt-recipes", "../escape.md", "nope"),
    ).rejects.toThrow();
    await expect(
      writeVidjutsuReference(store, "prompt-recipes", "notes/example.md", "nope"),
    ).rejects.toThrow();
  });
});

describe("learning-store redaction", () => {
  test("redacts obvious secrets before reviewer prompts", () => {
    const redacted = redactSecrets(
      "OPENAI_API_KEY=sk-proj-secretvalue --api-key wave_secret_token authorization: Bearer abcdefghijklmnopqrstuvwxyz",
    );
    expect(redacted).not.toContain("sk-proj-secretvalue");
    expect(redacted).not.toContain("wave_secret_token");
    expect(redacted).not.toContain("abcdefghijklmnopqrstuvwxyz");
    expect(redacted).toContain("<redacted>");
  });
});
