import { NextRequest, NextResponse } from "next/server";

import {
  isDecodedAccountVerified,
  verifyRequestToken,
} from "@/app/lib/auth/server-auth";
import { buildOwnedEditableEvent } from "@/app/lib/events/drafts";
import { getAdminDb } from "@/app/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const token = await verifyRequestToken(request);
    if (!token || !isDecodedAccountVerified(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;
    const snapshot = await getAdminDb().collection("events").doc(eventId).get();
    if (!snapshot.exists) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const event = buildOwnedEditableEvent(
      { id: snapshot.id, data: snapshot.data() ?? {} },
      token.uid
    );
    if (!event) {
      return NextResponse.json(
        { error: "Only the event host can edit this event." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { event },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Owned event lookup failed:", error);
    return NextResponse.json(
      { error: "We couldn't load this event for editing." },
      { status: 500 }
    );
  }
}
