import type { FeedEvent } from "./types";
import { isLowValueImportedEvent } from "./filter";
import { toDate } from "./date";

export type ModerationResult = {
  allowed: boolean;
  moderationStatus: "approved" | "auto_approved" | "suppressed" | "needs_review";
  suppressionReason: string | null;
};

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isMalformedEvent(event: FeedEvent): boolean {
  if (!hasText(event.title)) return true;
  if (!event.startTime) return true;

  const startTime = toDate(event.startTime);

  if (!startTime) return true;

  return false;
}

function isPastEvent(event: FeedEvent): boolean {
  const startTime = toDate(event.startTime);

  if (!startTime) return true;

  return startTime.getTime() < Date.now();
}

export function moderateEvent(event: FeedEvent): ModerationResult {
  if (event.moderationStatus === "suppressed") {
    return {
      allowed: false,
      moderationStatus: "suppressed",
      suppressionReason: event.suppressionReason ?? "manually_suppressed",
    };
  }

  if (isMalformedEvent(event)) {
    return {
      allowed: false,
      moderationStatus: "suppressed",
      suppressionReason: "malformed_event",
    };
  }

  if (isPastEvent(event)) {
    return {
      allowed: false,
      moderationStatus: "suppressed",
      suppressionReason: "past_event",
    };
  }

  if (isLowValueImportedEvent(event)) {
    return {
      allowed: false,
      moderationStatus: "suppressed",
      suppressionReason: "low_value_imported_event",
    };
  }

  if (event.imported || event.source === "ics" || event.sourceType === "ics") {
    return {
      allowed: true,
      moderationStatus: "auto_approved",
      suppressionReason: null,
    };
  }

  return {
    allowed: true,
    moderationStatus: "approved",
    suppressionReason: null,
  };
}

export function isAllowedByModeration(event: FeedEvent): boolean {
  return moderateEvent(event).allowed;
}

export function applyModerationFilter(events: FeedEvent[]): FeedEvent[] {
  return events.filter(isAllowedByModeration);
}