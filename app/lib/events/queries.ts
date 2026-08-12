import type { User } from "firebase/auth";

import type { OwnedDraftEvent } from "./drafts";
import { formatEventDateRange } from "./date";
import type { FeedEvent } from "./types";

export async function getRecommendedFeedEvents(user: User): Promise<FeedEvent[]> {
  const token = await user.getIdToken(true);
  const response = await fetch("/api/events/recommendations", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = (await response.json()) as {
    events?: FeedEvent[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error || "We couldn't load event recommendations.");
  }

  return (data.events ?? []).map((event) => ({
    ...event,
    date: formatEventDateRange(event.startTime, event.endTime),
  }));
}

export async function getOwnedDraftEvents(user: User): Promise<FeedEvent[]> {
  const token = await user.getIdToken(true);
  const response = await fetch("/api/events/drafts", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = (await response.json()) as {
    drafts?: OwnedDraftEvent[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error || "We couldn't load your drafts.");
  }

  return (data.drafts ?? []).map((draft) => ({
    ...draft,
    status: "draft",
    date: formatEventDateRange(draft.startTime, draft.endTime),
  }));
}
