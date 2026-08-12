import type { FeedEvent } from "../types";

export interface RecommendationCandidate {
  event: FeedEvent;
  categoryId: string;
  organizerId: string | null;
  startTimeMs: number;
  publishedAtMs: number | null;
  visibilityScope: "school" | "district";
}

export interface RecommendationSignals {
  interestMatch: number;
  schoolAffinity: number;
  timeRelevance: number;
  newEventBoost: number;
}

export interface ScoredRecommendation {
  candidate: RecommendationCandidate;
  score: number;
  signals: RecommendationSignals;
  reason: string;
}

export interface BuildRecommendationFeedInput {
  studentId: string;
  interests: string[];
  candidates: RecommendationCandidate[];
  feedSize?: number;
  nowMs?: number;
}
