import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { hasAdminRole } from "@/app/lib/auth/admin.server";
import { verifyRequestToken } from "@/app/lib/auth/server-auth";
import {
  fetchPublicCalendarText,
  validateCalendarSourceUrl,
} from "@/app/lib/calendar/source-url";
import { getAdminDb } from "@/app/lib/firebase-admin";

export const dynamic = "force-dynamic";

function serializeDate(value: unknown): string | null {
  return value instanceof Timestamp ? value.toDate().toISOString() : null;
}

export async function GET(request: NextRequest) {
  try {
    const token = await verifyRequestToken(request);
    if (!token || !(await hasAdminRole(token.uid, "calendar_reviewer"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const snapshot = await getAdminDb()
      .collection("calendarImportRequests")
      .where("status", "==", "pending")
      .limit(100)
      .get();

    const requests = snapshot.docs
      .map((document) => {
        const data = document.data();
        return {
          id: document.id,
          requesterEmail: data.requesterEmail,
          district: data.district,
          school: data.school,
          sourceUrl: data.sourceUrl,
          requestedAt: serializeDate(data.requestedAt),
        };
      })
      .sort((left, right) =>
        (left.requestedAt ?? "").localeCompare(right.requestedAt ?? "")
      );

    return NextResponse.json(
      { requests },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("Calendar request list failed:", error);
    return NextResponse.json(
      { error: "We couldn't load calendar requests." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const reviewer = await verifyRequestToken(request);
    if (!reviewer || !(await hasAdminRole(reviewer.uid, "calendar_reviewer"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const id = typeof body.id === "string" ? body.id.trim() : "";
    const decision = body.decision;
    const rejectionReason =
      typeof body.rejectionReason === "string"
        ? body.rejectionReason.trim().slice(0, 250)
        : "";

    if (!id || (decision !== "approve" && decision !== "reject")) {
      return NextResponse.json({ error: "Invalid decision." }, { status: 400 });
    }

    const db = getAdminDb();
    const requestRef = db.collection("calendarImportRequests").doc(id);
    const snapshot = await requestRef.get();
    const data = snapshot.data();

    if (!snapshot.exists || data?.status !== "pending") {
      return NextResponse.json(
        { error: "Calendar request is no longer pending." },
        { status: 409 }
      );
    }

    let eventCount = 0;
    if (decision === "approve") {
      const validatedUrl = validateCalendarSourceUrl(data.sourceUrl);
      if (!validatedUrl.valid) {
        return NextResponse.json(
          { error: validatedUrl.error },
          { status: 400 }
        );
      }

      const calendarText = await fetchPublicCalendarText(validatedUrl.url);
      eventCount = calendarText.match(/BEGIN:VEVENT/g)?.length ?? 0;
      if (eventCount === 0) {
        return NextResponse.json(
          { error: "That calendar contains no recognizable events." },
          { status: 400 }
        );
      }
    }

    await db.runTransaction(async (transaction) => {
      const current = await transaction.get(requestRef);
      const currentData = current.data();
      if (!current.exists || currentData?.status !== "pending") {
        throw new Error("Calendar request is no longer pending.");
      }

      if (decision === "approve") {
        const sourceRef = db.collection("calendarSources").doc(id);
        transaction.set(sourceRef, {
          active: true,
          districtId: currentData.districtId,
          district: currentData.district,
          schoolId: currentData.schoolId,
          school: currentData.school,
          sourceType: "ics",
          sourceUrl: currentData.sourceUrl,
          visibility: "school",
          approvedAt: FieldValue.serverTimestamp(),
          approvedBy: reviewer.uid,
          requestId: id,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      transaction.update(requestRef, {
        status: decision === "approve" ? "approved" : "rejected",
        reviewedAt: FieldValue.serverTimestamp(),
        reviewedBy: reviewer.uid,
        rejectionReason:
          decision === "reject" ? rejectionReason || null : null,
        calendarSourceId: decision === "approve" ? id : null,
      });
    });

    return NextResponse.json({ success: true, eventCount });
  } catch (error) {
    console.error("Calendar request review failed:", error);
    return NextResponse.json(
      { error: "We couldn't review that calendar." },
      { status: 500 }
    );
  }
}
