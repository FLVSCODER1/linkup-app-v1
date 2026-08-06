import { describe, expect, it } from "vitest";

import {
  applyTemporaryFeedSuppression,
  isLowValueImportedEvent,
  removeDuplicateEvents,
} from "./filter";
import type { FeedEvent } from "./types";

const usefulEvent: FeedEvent = {
  id: "club-fair",
  imported: true,
  title: "Club fair",
};

const practice: FeedEvent = {
  id: "practice",
  source: "ics",
  title: "Soccer practice",
};

describe("feed filtering", () => {
  it("suppresses low-value imported schedule entries", () => {
    expect(isLowValueImportedEvent(practice)).toBe(true);
    expect(applyTemporaryFeedSuppression([usefulEvent, practice])).toEqual([
      usefulEvent,
    ]);
  });

  it("does not suppress a user-created event with the same wording", () => {
    expect(
      isLowValueImportedEvent({
        id: "student-practice",
        source: "user-posted",
        title: "Open volleyball practice",
      })
    ).toBe(false);
  });

  it("removes duplicate document ids while preserving order", () => {
    expect(
      removeDuplicateEvents([
        usefulEvent,
        { ...usefulEvent, title: "Duplicate" },
        practice,
      ])
    ).toEqual([usefulEvent, practice]);
  });
});

