import { toDate } from "./date";
import { getBaseEventScore } from "./scoring";
import type { FeedEvent, UserProfile } from "./types";

export function rankFeedEvents(
  events: FeedEvent[],
  profile: UserProfile
): FeedEvent[] {
  return [...events].sort((a, b) => {
    const scoreA = getBaseEventScore(a, profile);
    const scoreB = getBaseEventScore(b, profile);

    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }

    const timeA = toDate(a.startTime)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const timeB = toDate(b.startTime)?.getTime() ?? Number.MAX_SAFE_INTEGER;

    return timeA - timeB;
  });
}