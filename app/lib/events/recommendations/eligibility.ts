import type { UserProfileDocument } from "../../firestore/types";
import { inferCategory } from "../categories";
import { isLowValueImportedEvent } from "../filter";
import type { FeedEvent } from "../types";
import type { RecommendationCandidate } from "./types";

type DateLike = {
  toDate?: () => Date;
};

export function dateFromUnknown(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (
    value &&
    typeof value === "object" &&
    typeof (value as DateLike).toDate === "function"
  ) {
    return (value as DateLike).toDate?.() ?? null;
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function serializeDate(value: unknown): string | null {
  return dateFromUnknown(value)?.toISOString() ?? null;
}

export function isEligibleRecommendationEvent(
  event: FeedEvent,
  profile: UserProfileDocument,
  nowMs: number
): event is FeedEvent & { visibility: "school" | "district" } {
  const startTime = dateFromUnknown(event.startTime)?.getTime();
  if (!event.title?.trim() || !startTime || startTime < nowMs) return false;
  if (event.status !== "published" || event.moderationStatus === "suppressed") {
    return false;
  }
  if (event.district !== profile.district) return false;
  if (event.visibility === "school") {
    if (!profile.school || event.school !== profile.school) return false;
  } else if (event.visibility !== "district") {
    return false;
  }
  return !isLowValueImportedEvent(event);
}

export function toRecommendationCandidate(
  event: FeedEvent
): RecommendationCandidate | null {
  const startTimeMs = dateFromUnknown(event.startTime)?.getTime();
  if (!startTimeMs || (event.visibility !== "school" && event.visibility !== "district")) {
    return null;
  }

  return {
    event: {
      ...event,
      startTime: serializeDate(event.startTime),
      endTime: serializeDate(event.endTime),
      createdAt: serializeDate(event.createdAt),
      updatedAt: serializeDate(event.updatedAt),
      publishedAt: serializeDate(event.publishedAt),
      rsvpDeadline: serializeDate(event.rsvpDeadline),
      reviewedAt: serializeDate(event.reviewedAt),
    },
    categoryId: inferCategory(event),
    organizerId: event.createdBy ?? null,
    startTimeMs,
    publishedAtMs: dateFromUnknown(event.publishedAt)?.getTime() ?? null,
    visibilityScope: event.visibility,
  };
}
