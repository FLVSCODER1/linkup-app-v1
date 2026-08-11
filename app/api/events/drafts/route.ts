import { NextRequest, NextResponse } from "next/server";

import {
  isDecodedAccountVerified,
  verifyRequestToken,
} from "@/app/lib/auth/server-auth";
import { buildOwnedDraftEvents } from "@/app/lib/events/drafts";
import { getAdminDb } from "@/app/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = await verifyRequestToken(request);
    if (!token || !isDecodedAccountVerified(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const snapshot = await getAdminDb()
      .collection("events")
      .where("createdBy", "==", token.uid)
      .get();
    const drafts = buildOwnedDraftEvents(
      snapshot.docs.map((document) => ({
        id: document.id,
        data: document.data(),
      })),
      token.uid
    );

    return NextResponse.json(
      { drafts },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Draft event lookup failed:", error);
    return NextResponse.json(
      { error: "We couldn't load your drafts." },
      { status: 500 }
    );
  }
}
