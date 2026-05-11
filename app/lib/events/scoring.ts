import type { FeedEvent, UserProfile } from "./types";

export function getBaseEventScore(event: FeedEvent, profile: UserProfile): number {
  let score = 0;

  if (!event.imported) score += 25;
  if (event.visibility === "school") score += 20;
  if (event.school && event.school === profile.school) score += 20;

  score += Math.min(event.attendeeCount ?? 0, 30);

  return score;
}
