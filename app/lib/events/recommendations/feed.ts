import { deterministicOrderKey, utcDateBucket } from "./hash";
import { isNewEvent, scoreRecommendations } from "./scoring";
import { rerankForDiversity } from "./rerank";
import type {
  BuildRecommendationFeedInput,
  ScoredRecommendation,
} from "./types";

export const DISCOVERY_SLOT_FRACTION = 0.2;

function uniqueByEventId(
  recommendations: ScoredRecommendation[]
): ScoredRecommendation[] {
  const seen = new Set<string>();
  return recommendations.filter(({ candidate }) => {
    if (seen.has(candidate.event.id)) return false;
    seen.add(candidate.event.id);
    return true;
  });
}

export function buildRecommendationFeed({
  studentId,
  interests,
  candidates,
  feedSize = 20,
  nowMs = Date.now(),
}: BuildRecommendationFeedInput): ScoredRecommendation[] {
  const safeFeedSize = Math.max(0, Math.floor(feedSize));
  if (safeFeedSize === 0 || candidates.length === 0) return [];

  const dateBucket = utcDateBucket(nowMs);
  const scored = uniqueByEventId(
    scoreRecommendations(candidates, interests, nowMs)
  );
  const desiredDiscoveryCount = Math.min(
    scored.length,
    Math.max(1, Math.round(safeFeedSize * DISCOVERY_SLOT_FRACTION))
  );
  const discovery = scored
    .filter(({ candidate }) => isNewEvent(candidate, nowMs))
    .sort(
      (a, b) =>
        deterministicOrderKey(
          studentId,
          a.candidate.event.id,
          dateBucket
        ) -
        deterministicOrderKey(
          studentId,
          b.candidate.event.id,
          dateBucket
        )
    )
    .slice(0, desiredDiscoveryCount);
  const discoveryIds = new Set(
    discovery.map(({ candidate }) => candidate.event.id)
  );
  const rankedMain = rerankForDiversity(
    scored.filter(({ candidate }) => !discoveryIds.has(candidate.event.id)),
    safeFeedSize - discovery.length,
    studentId,
    dateBucket
  );

  if (discovery.length === 0) return rankedMain;

  const result = [...rankedMain];
  discovery.forEach((recommendation, index) => {
    const position = Math.min(result.length, (index + 1) * 4);
    result.splice(position, 0, recommendation);
  });

  return uniqueByEventId(result).slice(0, safeFeedSize);
}
