import type { FeedEvent, UserProfile } from "./types";
import { inferCategory } from "./categories";

export type UserPreferences = {
  preferredCategories?: string[];
};

export function getPreferenceScore(
  event: FeedEvent,
  preferences?: UserPreferences | null
): number {
  if (!preferences?.preferredCategories?.length) {
    return 0;
  }

  const category = inferCategory(event);

  if (preferences.preferredCategories.includes(category)) {
    return 25;
  }

  return 0;
}

export function getSchoolAffinityScore(
  event: FeedEvent,
  profile: UserProfile
): number {
  let score = 0;

  if (event.school && event.school === profile.school) {
    score += 20;
  }

  if (
    event.visibility === "school" &&
    event.school === profile.school
  ) {
    score += 10;
  }

  return score;
}