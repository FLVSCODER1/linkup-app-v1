import { inferCategory } from "./categories";
import { getSchoolAffinityScore } from "./preferences";
import type { FeedEvent, UserProfile } from "./types";

const CATEGORY_SCORE: Record<string, number> = {
  social: 15,
  club: 12,
  sports: 10,
  academic: 8,
  volunteering: 8,
  competition: 8,
  music: 6,
  arts: 6,
  fundraiser: 5,
  gaming: 5,
  other: 0,
};

export function getCategoryScore(event: FeedEvent): number {
  const category = inferCategory(event);

  return CATEGORY_SCORE[category] ?? 0;
}

export function getAttendanceScore(event: FeedEvent): number {
  return Math.min(event.attendeeCount ?? 0, 30);
}

export function getSourceScore(event: FeedEvent): number {
  if (!event.imported && event.source !== "ics" && event.sourceType !== "ics") {
    return 25;
  }

  return 0;
}

export function getAiRelevanceScore(event: FeedEvent): number {
  if (typeof event.relevanceScore !== "number") {
    return 0;
  }

  return event.relevanceScore;
}

export function getBaseEventScore(
  event: FeedEvent,
  profile: UserProfile
): number {
  let score = 0;

  score += getSourceScore(event);
  score += getSchoolAffinityScore(event, profile);
  score += getAttendanceScore(event);
  score += getCategoryScore(event);
  score += getAiRelevanceScore(event);

  return score;
}