import { describe, expect, it } from "vitest";

import type { UserProfileDocument } from "../../firestore/types";
import type { FeedEvent } from "../types";
import { isEligibleRecommendationEvent } from "./eligibility";

const NOW = Date.parse("2026-08-12T12:00:00.000Z");

const profile: UserProfileDocument = {
  uid: "student",
  email: "student@example.edu",
  firstName: "Student",
  lastInitial: "S",
  displayName: "Student S",
  bio: "",
  grade: "12",
  interests: [],
  district: "Wylie ISD",
  school: "Wylie High School",
  profileComplete: true,
  createdAt: null,
  updatedAt: null,
};

function event(overrides: Partial<FeedEvent> = {}): FeedEvent {
  return {
    id: "event",
    title: "Student club meetup",
    district: "Wylie ISD",
    school: "Wylie High School",
    visibility: "school",
    status: "published",
    moderationStatus: "approved",
    imported: false,
    startTime: new Date(NOW + 60_000).toISOString(),
    ...overrides,
  };
}

describe("recommendation eligibility", () => {
  it("allows a published event from the student's school", () => {
    expect(isEligibleRecommendationEvent(event(), profile, NOW)).toBe(true);
  });

  it("allows a district event in the student's district", () => {
    expect(
      isEligibleRecommendationEvent(
        event({ visibility: "district", school: null }),
        profile,
        NOW
      )
    ).toBe(true);
  });

  it.each([
    ["another school", { school: "Other High School" }],
    ["another district", { district: "Other ISD", visibility: "district" }],
    ["a draft", { status: "draft" }],
    ["a cancelled event", { status: "cancelled" }],
    ["a suppressed event", { moderationStatus: "suppressed" }],
    ["a public event", { visibility: "public" }],
    ["a past event", { startTime: new Date(NOW - 60_000).toISOString() }],
  ] as const)("rejects %s", (_label, overrides) => {
    expect(
      isEligibleRecommendationEvent(event(overrides as Partial<FeedEvent>), profile, NOW)
    ).toBe(false);
  });

  it("rejects low-value imported calendar noise", () => {
    expect(
      isEligibleRecommendationEvent(
        event({ imported: true, title: "Football practice" }),
        profile,
        NOW
      )
    ).toBe(false);
  });
});
