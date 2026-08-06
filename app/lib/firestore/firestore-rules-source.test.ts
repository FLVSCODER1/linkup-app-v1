import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("server-only Firestore records", () => {
  it("keeps private user profiles server-only", () => {
    const rules = readFileSync("firestore.rules", "utf8");
    const privateProfileRule = rules.match(
      /match \/privateUserProfiles\/\{document=\*\*\} \{([\s\S]*?)\n    \}/
    );

    expect(privateProfileRule?.[1]).toContain("allow read, write: if false;");
  });

  it.each(["admins", "calendarImportRequests", "calendarSources"])(
    "keeps %s server-only",
    (collectionName) => {
      const rules = readFileSync("firestore.rules", "utf8");
      const rule = rules.match(
        new RegExp(
          `match /${collectionName}/\\{document=\\*\\*\\} \\{([\\s\\S]*?)\\n    \\}`
        )
      );

      expect(rule?.[1]).toContain("allow read, write: if false;");
    }
  );
});
