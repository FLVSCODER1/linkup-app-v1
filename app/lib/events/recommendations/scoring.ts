import { interestCategoryIds } from "./interests";
import type {
  RecommendationCandidate,
  RecommendationSignals,
  ScoredRecommendation,
} from "./types";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const NEW_EVENT_WINDOW_MS = 72 * HOUR_MS;

export const STAGE_A_WEIGHTS = {
  interestMatch: 0.45,
  schoolAffinity: 0.15,
  timeRelevance: 0.25,
  newEventBoost: 0.15,
} as const;

export function isNewEvent(
  candidate: RecommendationCandidate,
  nowMs: number
): boolean {
  if (candidate.publishedAtMs === null) return false;
  const ageMs = nowMs - candidate.publishedAtMs;
  return ageMs >= 0 && ageMs <= NEW_EVENT_WINDOW_MS;
}

function computeTimeRelevance(startTimeMs: number, nowMs: number): number {
  const timeUntilMs = startTimeMs - nowMs;
  if (!Number.isFinite(timeUntilMs) || timeUntilMs < 0) return 0;
  if (timeUntilMs <= 7 * DAY_MS) return 1;

  const weeksOut = timeUntilMs / (7 * DAY_MS);
  return Math.max(0.3, Math.min(1, 1 / (1 + 0.15 * (weeksOut - 1))));
}

function computeNewEventBoost(
  candidate: RecommendationCandidate,
  nowMs: number
): number {
  if (candidate.publishedAtMs === null) return 0;
  const ageMs = nowMs - candidate.publishedAtMs;
  if (ageMs < 0 || ageMs > NEW_EVENT_WINDOW_MS) return 0;
  return 1 - ageMs / NEW_EVENT_WINDOW_MS;
}

function recommendationReason(
  candidate: RecommendationCandidate,
  signals: RecommendationSignals
): string {
  if (signals.interestMatch === 1) {
    return `Matches your ${candidate.categoryId} interests`;
  }
  if (signals.newEventBoost > 0) return "Newly posted";
  if (signals.timeRelevance === 1) return "Happening soon";
  return candidate.visibilityScope === "school"
    ? "At your school"
    : "In your district";
}

export function scoreRecommendations(
  candidates: RecommendationCandidate[],
  interests: string[],
  nowMs: number
): ScoredRecommendation[] {
  const categories = interestCategoryIds(interests);

  return candidates.map((candidate) => {
    const signals: RecommendationSignals = {
      interestMatch: categories.has(candidate.categoryId) ? 1 : 0,
      schoolAffinity: candidate.visibilityScope === "school" ? 1 : 0.6,
      timeRelevance: computeTimeRelevance(candidate.startTimeMs, nowMs),
      newEventBoost: computeNewEventBoost(candidate, nowMs),
    };
    const score =
      STAGE_A_WEIGHTS.interestMatch * signals.interestMatch +
      STAGE_A_WEIGHTS.schoolAffinity * signals.schoolAffinity +
      STAGE_A_WEIGHTS.timeRelevance * signals.timeRelevance +
      STAGE_A_WEIGHTS.newEventBoost * signals.newEventBoost;

    return {
      candidate,
      score: Number.isFinite(score) ? Math.max(0, Math.min(1, score)) : 0,
      signals,
      reason: recommendationReason(candidate, signals),
    };
  });
}
