import { deterministicOrderKey } from "./hash";
import type { ScoredRecommendation } from "./types";

const DIVERSITY_WEIGHT = 0.25;
const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

function words(value: string | undefined): Set<string> {
  return new Set(
    (value ?? "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2)
  );
}

function titleSimilarity(a: string | undefined, b: string | undefined): number {
  const aWords = words(a);
  const bWords = words(b);
  if (aWords.size === 0 || bWords.size === 0) return 0;

  const intersection = [...aWords].filter((word) => bWords.has(word)).length;
  const union = new Set([...aWords, ...bWords]).size;
  return union === 0 ? 0 : intersection / union;
}

export function recommendationSimilarity(
  a: ScoredRecommendation,
  b: ScoredRecommendation
): number {
  const category = a.candidate.categoryId === b.candidate.categoryId ? 1 : 0;
  const organizer =
    a.candidate.organizerId &&
    a.candidate.organizerId === b.candidate.organizerId
      ? 1
      : 0;
  const time = Math.max(
    0,
    1 -
      Math.abs(a.candidate.startTimeMs - b.candidate.startTimeMs) /
        FOUR_HOURS_MS
  );
  const title = titleSimilarity(
    a.candidate.event.title,
    b.candidate.event.title
  );

  return 0.3 * category + 0.25 * organizer + 0.2 * time + 0.25 * title;
}

export function rerankForDiversity(
  scored: ScoredRecommendation[],
  resultSize: number,
  studentId: string,
  dateBucket: string
): ScoredRecommendation[] {
  if (resultSize <= 0) return [];

  const remaining = [...scored];
  const selected: ScoredRecommendation[] = [];

  while (selected.length < resultSize && remaining.length > 0) {
    let bestIndex = 0;
    let bestValue = Number.NEGATIVE_INFINITY;
    let bestTieKey = Number.POSITIVE_INFINITY;

    remaining.forEach((candidate, index) => {
      const maximumSimilarity = selected.length
        ? Math.max(
            ...selected.map((existing) =>
              recommendationSimilarity(candidate, existing)
            )
          )
        : 0;
      const value =
        (1 - DIVERSITY_WEIGHT) * candidate.score -
        DIVERSITY_WEIGHT * maximumSimilarity;
      const tieKey = deterministicOrderKey(
        studentId,
        candidate.candidate.event.id,
        dateBucket
      );

      if (value > bestValue || (value === bestValue && tieKey < bestTieKey)) {
        bestIndex = index;
        bestValue = value;
        bestTieKey = tieKey;
      }
    });

    selected.push(remaining[bestIndex]);
    remaining.splice(bestIndex, 1);
  }

  return selected;
}
