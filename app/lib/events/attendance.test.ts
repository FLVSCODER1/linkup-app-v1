import { describe, expect, it } from "vitest";

import {
  ALLOW_HOST_RSVP_PREVIEW,
  attendeeCountAfterLeaving,
  evaluateJoinPolicy,
} from "./attendance";

const openEvent = {
  status: "published" as const,
  attendeeCount: 4,
  capacity: 10,
  rsvpDeadline: new Date("2030-01-09T16:00:00Z"),
  alreadyAttending: false,
  isHost: false,
  now: new Date("2030-01-08T16:00:00Z"),
};

describe("event attendance policy", () => {
  it("adds a new attendee exactly once", () => {
    expect(evaluateJoinPolicy(openEvent)).toEqual({
      allowed: true,
      nextAttendeeCount: 5,
    });
  });

  it("does not increment an existing attendee again", () => {
    expect(
      evaluateJoinPolicy({ ...openEvent, alreadyAttending: true })
    ).toEqual({ allowed: true, nextAttendeeCount: 4 });
  });

  it("rejects a new RSVP after the deadline", () => {
    expect(
      evaluateJoinPolicy({
        ...openEvent,
        now: new Date("2030-01-10T16:00:00Z"),
      })
    ).toMatchObject({ allowed: false, error: "The RSVP deadline has passed." });
  });

  it("rejects a new RSVP when the event is full", () => {
    expect(
      evaluateJoinPolicy({ ...openEvent, attendeeCount: 10 })
    ).toMatchObject({ allowed: false, error: "This event has reached capacity." });
  });

  it("lets an existing attendee update preferences after capacity is reached", () => {
    expect(
      evaluateJoinPolicy({
        ...openEvent,
        attendeeCount: 10,
        alreadyAttending: true,
      })
    ).toEqual({ allowed: true, nextAttendeeCount: 10 });
  });

  it("keeps the host RSVP path enabled for one-person beta testing", () => {
    expect(ALLOW_HOST_RSVP_PREVIEW).toBe(true);
    expect(evaluateJoinPolicy({ ...openEvent, isHost: true })).toEqual({
      allowed: true,
      nextAttendeeCount: 5,
    });
  });

  it("never decrements attendance below zero", () => {
    expect(attendeeCountAfterLeaving(4, true)).toBe(3);
    expect(attendeeCountAfterLeaving(0, true)).toBe(0);
    expect(attendeeCountAfterLeaving(4, false)).toBe(4);
  });
});
