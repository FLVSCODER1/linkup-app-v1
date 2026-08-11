import type { FeedEvent } from "./types";

export const EVENT_CATEGORIES = [
  "social",
  "sports",
  "academic",
  "club",
  "arts",
  "music",
  "volunteering",
  "gaming",
  "fundraiser",
  "competition",
  "other",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const DEFAULT_EVENT_CATEGORY: EventCategory = "academic";

const CATEGORY_KEYWORDS: Record<EventCategory, string[]> = {
  social: ["party", "hangout", "social", "meetup"],
  sports: ["football", "soccer", "basketball", "practice", "game", "sports"],
  academic: ["study", "lecture", "academic", "workshop", "research"],
  club: ["club", "meeting", "student organization"],
  arts: ["art", "painting", "theater", "drama"],
  music: ["music", "concert", "band", "choir"],
  volunteering: ["volunteer", "charity", "community service"],
  gaming: ["gaming", "esports", "tournament"],
  fundraiser: ["fundraiser", "donation", "charity drive"],
  competition: ["competition", "hackathon", "contest"],
  other: [],
};

export function normalizeCategory(value?: string | null): EventCategory {
  if (!value) return "other";

  const normalized = value.trim().toLowerCase();

  if (EVENT_CATEGORIES.includes(normalized as EventCategory)) {
    return normalized as EventCategory;
  }

  return "other";
}

export function inferCategory(event: FeedEvent): EventCategory {
  if (event.aiCategory) {
    return normalizeCategory(event.aiCategory);
  }

  if (event.category) {
    return normalizeCategory(event.category);
  }

  const searchableText = [
    event.title,
    event.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (
      keywords.some((keyword) => searchableText.includes(keyword))
    ) {
      return category as EventCategory;
    }
  }

  return "other";
}
