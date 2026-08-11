import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";
import type { User } from "firebase/auth";

import { rankFeedEvents } from "./ranking";
import { db } from "../firebase";
import type { OwnedDraftEvent } from "./drafts";
import { removeDuplicateEvents } from "./filter";
import { applyModerationFilter } from "./moderation";
import { formatEventDateRange } from "./date";
import type { FeedEvent, UserProfile } from "./types";

export async function getVisibleFeedEvents(
  profile: UserProfile
): Promise<FeedEvent[]> {
  const district = profile.district;
  const school = profile.school;

  if (!district) return [];

  const eventsRef = collection(db, "events");

  const baseConstraints: QueryConstraint[] = [
    where("status", "==", "published"),
    where("startTime", ">=", Timestamp.now()),
    orderBy("startTime", "asc"),
  ];

  const queriesToRun = [
    query(
      eventsRef,
      where("district", "==", district),
      where("visibility", "==", "district"),
      ...baseConstraints
    ),
  ];

  if (school) {
    queriesToRun.push(
      query(
        eventsRef,
        where("district", "==", district),
        where("school", "==", school),
        where("visibility", "==", "school"),
        ...baseConstraints
      )
    );
  }

  const snapshots = await Promise.all(queriesToRun.map((q) => getDocs(q)));

  const events = snapshots.flatMap((snapshot) =>
    snapshot.docs.map((eventDoc) => {
      const data = eventDoc.data() as DocumentData;

      return {
        id: eventDoc.id,
        ...data,
        date: formatEventDateRange(data.startTime, data.endTime),
      } as FeedEvent;
    })
  );

  return rankFeedEvents(
    applyModerationFilter(removeDuplicateEvents(events)),
    profile
  );
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
