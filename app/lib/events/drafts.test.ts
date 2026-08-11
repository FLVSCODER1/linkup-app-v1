import { describe, expect, it } from "vitest";

import { buildOwnedDraftEvents } from "./drafts";

describe("buildOwnedDraftEvents", () => {
  it("returns only the current host's drafts in newest-first order", () => {
    const drafts = buildOwnedDraftEvents(
      [
        {
          id: "older-draft",
          data: {
            createdBy: "host",
            status: "draft",
            title: "Older",
            updatedAt: new Date("2026-08-10T12:00:00Z"),
          },
        },
        {
          id: "published",
          data: {
            createdBy: "host",
            status: "published",
            title: "Published",
          },
        },
        {
          id: "other-host",
          data: {
            createdBy: "someone-else",
            status: "draft",
            title: "Private",
          },
        },
        {
          id: "newer-draft",
          data: {
            createdBy: "host",
            status: "draft",
            title: "Newer",
            updatedAt: { toDate: () => new Date("2026-08-11T12:00:00Z") },
          },
        },
      ],
      "host"
    );

    expect(drafts.map((draft) => draft.id)).toEqual([
      "newer-draft",
      "older-draft",
    ]);
  });
});
