import type { FeedEvent } from "./types";

const LOW_VALUE_IMPORTED_KEYWORDS = [
  "practice",
  "bus",
  "equipment",
  "locker",
  "weight room",
];

export function isImportedEvent(event: FeedEvent): boolean {
  return Boolean(
    event.imported || event.source === "ics" || event.sourceType === "ics"
  );
}

export function isLowValueImportedEvent(event: FeedEvent): boolean {
  if (!isImportedEvent(event)) return false;

  const searchableText = [
    event.title,
    event.description,
    event.location,
    event.category,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return LOW_VALUE_IMPORTED_KEYWORDS.some((keyword) =>
    searchableText.includes(keyword)
  );
}

export function removeDuplicateEvents(events: FeedEvent[]): FeedEvent[] {
  const seen = new Set<string>();

  return events.filter((event) => {
    if (seen.has(event.id)) return false;

    seen.add(event.id);
    return true;
  });
}

export function applyTemporaryFeedSuppression(events: FeedEvent[]): FeedEvent[] {
  return events.filter((event) => !isLowValueImportedEvent(event));
}