import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("private profile rules", () => {
  it("keeps private user profiles server-only", () => {
    const rules = readFileSync("firestore.rules", "utf8");
    const privateProfileRule = rules.match(
      /match \/privateUserProfiles\/\{document=\*\*\} \{([\s\S]*?)\n    \}/
    );

    expect(privateProfileRule?.[1]).toContain("allow read, write: if false;");
  });
});
