import "server-only";

import { Timestamp } from "firebase-admin/firestore";

import type { UserProfileDocument } from "../../firestore/types";
import { getAdminDb } from "../../firebase-admin";
import type { FeedEvent } from "../types";
import type { RecommendationCandidate } from "./types";
import {
  isEligibleRecommendationEvent,
  toRecommendationCandidate,
} from "./eligibility";

const MAX_EVENTS_PER_SCOPE = 100;

export async function loadEligibleRecommendationCandidates(
  profile: UserProfileDocument,
  nowMs: number
): Promise<RecommendationCandidate[]> {
  if (!profile.district) return [];

  const events = getAdminDb().collection("events");
  const base = [
    events
      .where("district", "==", profile.district)
      .where("visibility", "==", "district")
      .where("status", "==", "published")
      .where("startTime", ">=", Timestamp.fromMillis(nowMs))
      .orderBy("startTime", "asc")
      .limit(MAX_EVENTS_PER_SCOPE),
  ];

  if (profile.school) {
    base.push(
      events
        .where("district", "==", profile.district)
        .where("school", "==", profile.school)
        .where("visibility", "==", "school")
        .where("status", "==", "published")
        .where("startTime", ">=", Timestamp.fromMillis(nowMs))
        .orderBy("startTime", "asc")
        .limit(MAX_EVENTS_PER_SCOPE)
    );
  }

  const snapshots = await Promise.all(base.map((query) => query.get()));
  const seen = new Set<string>();

  return snapshots.flatMap((snapshot) =>
    snapshot.docs.flatMap((document) => {
      if (seen.has(document.id)) return [];
      seen.add(document.id);

      const event = { id: document.id, ...document.data() } as FeedEvent;
      if (!isEligibleRecommendationEvent(event, profile, nowMs)) return [];
      const candidate = toRecommendationCandidate(event);
      return candidate ? [candidate] : [];
    })
  );
}

export async function loadRecommendationProfile(
  uid: string
): Promise<UserProfileDocument | null> {
  const snapshot = await getAdminDb().collection("users").doc(uid).get();
  if (!snapshot.exists) return null;
  return snapshot.data() as UserProfileDocument;
}
