import { Timestamp } from "firebase/firestore";
import type { FeedEvent } from "./types";

export function toDate(value: FeedEvent["startTime"]): Date | null {
  if (!value) return null;

  if (value instanceof Date) return value;

  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

export function formatEventDateRange(
  startValue: FeedEvent["startTime"],
  endValue: FeedEvent["endTime"]
): string {
  const start = toDate(startValue);
  const end = toDate(endValue);

  if (!start) return "Date TBD";

  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (!end) {
    return `${dateFormatter.format(start)} at ${timeFormatter.format(start)}`;
  }

  return `${dateFormatter.format(start)} · ${timeFormatter.format(
    start
  )}–${timeFormatter.format(end)}`;
}

export function sortEventsByStartTime(events: FeedEvent[]): FeedEvent[] {
  return [...events].sort((a, b) => {
    const aTime = toDate(a.startTime)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bTime = toDate(b.startTime)?.getTime() ?? Number.MAX_SAFE_INTEGER;

    return aTime - bTime;
  });
}