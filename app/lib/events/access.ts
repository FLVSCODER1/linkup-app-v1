import type { FeedEvent, UserProfile } from "./types";

export function canUserAccessEvent(
  event: FeedEvent,
  profile: UserProfile,
  currentUserId?: string
): boolean {
  // Hosts must be able to open their own unpublished drafts even when a
  // legacy profile or school-directory change no longer matches the event.
  if (currentUserId && event.createdBy === currentUserId) return true;

  if (event.visibility === "public") return true;

  if (event.visibility === "school") {
    return Boolean(event.school && event.school === profile.school);
  }

  if (event.visibility === "district") {
    return Boolean(event.district && event.district === profile.district);
  }

  // Legacy events did not always include a visibility field.
  if (event.school) return event.school === profile.school;
  if (event.district) return event.district === profile.district;

  return false;
}
