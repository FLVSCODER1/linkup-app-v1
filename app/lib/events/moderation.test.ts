import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { moderateEvent } from "./moderation";

describe("event moderation baseline", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-10T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects malformed and past events", () => {
    expect(
      moderateEvent({ id: "missing-title", startTime: "2026-07-11T12:00:00Z" })
        .suppressionReason
    ).toBe("malformed_event");
    expect(
      moderateEvent({
        id: "past",
        title: "Past event",
        startTime: "2026-07-09T12:00:00Z",
      }).suppressionReason
    ).toBe("past_event");
  });

  it("auto-approves a valid imported event", () => {
    expect(
      moderateEvent({
        id: "future",
        title: "School concert",
        source: "ics",
        startTime: "2026-07-11T12:00:00Z",
      })
    ).toMatchObject({ allowed: true, moderationStatus: "auto_approved" });
  });
});

