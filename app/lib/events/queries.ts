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

import { rankFeedEvents } from "./ranking";
import { db } from "../firebase";
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

export async function getOwnedDraftEvents(userId: string): Promise<FeedEvent[]> {
  if (!userId) return [];

  // The owner constraint is important for both privacy and Firestore rule
  // evaluation. We intentionally avoid a second status constraint so this
  // query works without requiring another composite index.
  const snapshot = await getDocs(
    query(collection(db, "events"), where("createdBy", "==", userId))
  );

  return snapshot.docs
    .map((eventDoc) => ({
      id: eventDoc.id,
      ...eventDoc.data(),
      date: formatEventDateRange(
        eventDoc.data().startTime,
        eventDoc.data().endTime
      ),
    }) as FeedEvent)
    .filter((event) => event.status === "draft")
    .sort((a, b) => {
      const aUpdated = a.updatedAt instanceof Timestamp
        ? a.updatedAt.toMillis()
        : 0;
      const bUpdated = b.updatedAt instanceof Timestamp
        ? b.updatedAt.toMillis()
        : 0;
      return bUpdated - aUpdated;
    });
}
