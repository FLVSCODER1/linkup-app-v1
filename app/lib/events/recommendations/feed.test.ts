import { describe, expect, it } from "vitest";

import { buildRecommendationFeed } from "./feed";
import { fnv1aHash } from "./hash";
import { recommendationSimilarity, rerankForDiversity } from "./rerank";
import { scoreRecommendations, STAGE_A_WEIGHTS } from "./scoring";
import type { RecommendationCandidate } from "./types";

const NOW = Date.parse("2026-08-12T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

function candidate(
  id: string,
  overrides: Partial<RecommendationCandidate> = {}
): RecommendationCandidate {
  return {
    event: {
      id,
      title: `Event ${id}`,
      category: "other",
      createdBy: `host-${id}`,
      status: "published",
      visibility: "school",
    },
    categoryId: "other",
    organizerId: `host-${id}`,
    startTimeMs: NOW + DAY,
    publishedAtMs: NOW - 10 * DAY,
    visibilityScope: "school",
    ...overrides,
  };
}

describe("Stage A recommendation feed", () => {
  it("uses normalized weights that sum to one", () => {
    expect(Object.values(STAGE_A_WEIGHTS).reduce((sum, value) => sum + value, 0)).toBe(1);
  });

  it("ranks an explicit interest match above an otherwise identical event", () => {
    const [match, other] = scoreRecommendations(
      [
        candidate("match", { categoryId: "sports" }),
        candidate("other", { categoryId: "music" }),
      ],
      ["Sports"],
      NOW
    );

    expect(match.score).toBeGreaterThan(other.score);
    expect(match.reason).toContain("sports");
  });

  it("gives school events a modest advantage over district events", () => {
    const [school, district] = scoreRecommendations(
      [
        candidate("school"),
        candidate("district", {
          event: { id: "district", title: "District event" },
          visibilityScope: "district",
        }),
      ],
      [],
      NOW
    );

    expect(school.score).toBeGreaterThan(district.score);
  });

  it("keeps far-future events discoverable with a nonzero time score", () => {
    const [event] = scoreRecommendations(
      [candidate("trip", { startTimeMs: NOW + 90 * DAY })],
      [],
      NOW
    );

    expect(event.signals.timeRelevance).toBeGreaterThanOrEqual(0.3);
  });

  it("is deterministic for the same student and UTC day", () => {
    const candidates = Array.from({ length: 12 }, (_, index) =>
      candidate(String(index), { publishedAtMs: NOW - DAY })
    );
    const input = { studentId: "student", interests: [], candidates, nowMs: NOW };

    expect(buildRecommendationFeed(input).map((item) => item.candidate.event.id)).toEqual(
      buildRecommendationFeed(input).map((item) => item.candidate.event.id)
    );
  });

  it("deduplicates candidates and always fills from available unique events", () => {
    const duplicate = candidate("same", { publishedAtMs: NOW - DAY });
    const feed = buildRecommendationFeed({
      studentId: "student",
      interests: [],
      candidates: [duplicate, duplicate, candidate("other")],
      feedSize: 10,
      nowMs: NOW,
    });

    expect(feed).toHaveLength(2);
    expect(new Set(feed.map((item) => item.candidate.event.id)).size).toBe(2);
  });

  it("reserves discovery inventory without duplicating it", () => {
    const feed = buildRecommendationFeed({
      studentId: "student",
      interests: ["Sports"],
      candidates: [
        candidate("new", { publishedAtMs: NOW - DAY }),
        ...Array.from({ length: 9 }, (_, index) =>
          candidate(`ranked-${index}`, { categoryId: "sports" })
        ),
      ],
      feedSize: 5,
      nowMs: NOW,
    });

    expect(feed).toHaveLength(5);
    expect(feed.some((item) => item.candidate.event.id === "new")).toBe(true);
    expect(new Set(feed.map((item) => item.candidate.event.id)).size).toBe(5);
  });

  it("uses bounded similarity and diversifies repetitive results", () => {
    const scored = scoreRecommendations(
      [
        candidate("sports-a", { categoryId: "sports", organizerId: "same" }),
        candidate("sports-b", { categoryId: "sports", organizerId: "same" }),
        candidate("music", { categoryId: "music", organizerId: "different" }),
      ],
      ["Sports", "Music"],
      NOW
    );
    expect(recommendationSimilarity(scored[0], scored[1])).toBeLessThanOrEqual(1);

    const reranked = rerankForDiversity(scored, 3, "student", "2026-08-12");
    expect(reranked[0].candidate.categoryId).not.toBe(
      reranked[1].candidate.categoryId
    );
  });

  it("normalizes the deterministic hash into the documented range", () => {
    const normalized = fnv1aHash("student::event::2026-08-12") / 0x1_0000_0000;
    expect(normalized).toBeGreaterThanOrEqual(0);
    expect(normalized).toBeLessThan(1);
  });
});
