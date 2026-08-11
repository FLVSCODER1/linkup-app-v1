import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { EVENT_CATEGORIES } from "../events/categories";

describe("server-only Firestore records", () => {
  it("keeps host event categories aligned with the application", () => {
    const rules = readFileSync("firestore.rules", "utf8");
    const categoryRule = rules.match(
      /eventData\.category in \[([\s\S]*?)\]/
    );

    expect(categoryRule).not.toBeNull();
    for (const category of EVENT_CATEGORIES) {
      expect(categoryRule?.[1]).toContain(`'${category}'`);
    }
  });

  it("keeps private user profiles server-only", () => {
    const rules = readFileSync("firestore.rules", "utf8");
    const privateProfileRule = rules.match(
      /match \/privateUserProfiles\/\{document=\*\*\} \{([\s\S]*?)\n    \}/
    );

    expect(privateProfileRule?.[1]).toContain("allow read, write: if false;");
  });

  it.each([
    "admins",
    "calendarImportRequests",
    "calendarSources",
    "schoolRequests",
  ])(
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
