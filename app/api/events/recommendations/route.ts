import { NextRequest, NextResponse } from "next/server";

import {
  isDecodedAccountVerified,
  verifyRequestToken,
} from "@/app/lib/auth/server-auth";
import { buildRecommendationFeed } from "@/app/lib/events/recommendations/feed";
import {
  loadEligibleRecommendationCandidates,
  loadRecommendationProfile,
} from "@/app/lib/events/recommendations/server";

export const dynamic = "force-dynamic";

const DEFAULT_FEED_SIZE = 20;
const MAX_FEED_SIZE = 30;

function requestedFeedSize(request: NextRequest): number {
  const requested = Number(request.nextUrl.searchParams.get("limit"));
  if (!Number.isFinite(requested)) return DEFAULT_FEED_SIZE;
  return Math.max(1, Math.min(MAX_FEED_SIZE, Math.floor(requested)));
}

export async function GET(request: NextRequest) {
  try {
    const token = await verifyRequestToken(request);
    if (!token || !isDecodedAccountVerified(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await loadRecommendationProfile(token.uid);
    if (!profile?.profileComplete || !profile.district) {
      return NextResponse.json(
        { error: "Complete your profile before loading recommendations." },
        { status: 409 }
      );
    }

    const nowMs = Date.now();
    const candidates = await loadEligibleRecommendationCandidates(profile, nowMs);
    const recommendations = buildRecommendationFeed({
      studentId: token.uid,
      interests: profile.interests ?? [],
      candidates,
      feedSize: requestedFeedSize(request),
      nowMs,
    });

    return NextResponse.json(
      {
        events: recommendations.map(({ candidate, reason }) => ({
          ...candidate.event,
          recommendationReason: reason,
        })),
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("Recommendation feed lookup failed:", error);
    return NextResponse.json(
      { error: "We couldn't load event recommendations." },
      { status: 500 }
    );
  }
}
