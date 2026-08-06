import { describe, expect, it } from "vitest";

import { canUserAccessEvent } from "./access";
import type { FeedEvent, UserProfile } from "./types";

const profile: UserProfile = {
  district: "Test District",
  school: "Test High School",
};

function event(overrides: Partial<FeedEvent>): FeedEvent {
  return { id: "event-1", ...overrides };
}

describe("event visibility", () => {
  it("allows public, matching district, and matching school events", () => {
    expect(canUserAccessEvent(event({ visibility: "public" }), profile)).toBe(true);
    expect(
      canUserAccessEvent(
        event({ visibility: "district", district: "Test District" }),
        profile
      )
    ).toBe(true);
    expect(
      canUserAccessEvent(
        event({ visibility: "school", school: "Test High School" }),
        profile
      )
    ).toBe(true);
  });

  it("rejects events outside the user's trust boundary", () => {
    expect(
      canUserAccessEvent(
        event({ visibility: "district", district: "Other District" }),
        profile
      )
    ).toBe(false);
    expect(
      canUserAccessEvent(
        event({ visibility: "school", school: "Other High School" }),
        profile
      )
    ).toBe(false);
  });

  it("supports legacy events without a visibility field", () => {
    expect(canUserAccessEvent(event({ school: "Test High School" }), profile)).toBe(
      true
    );
    expect(canUserAccessEvent(event({ district: "Other District" }), profile)).toBe(
      false
    );
  });
});

