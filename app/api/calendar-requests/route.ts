import { createHash } from "node:crypto";

import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import {
  isDecodedAccountVerified,
  verifyRequestToken,
} from "@/app/lib/auth/server-auth";
import { validateCalendarSourceUrl } from "@/app/lib/calendar/source-url";
import { getAdminDb } from "@/app/lib/firebase-admin";

export const dynamic = "force-dynamic";

function buildRequestId(uid: string, schoolId: string, sourceUrl: string): string {
  return createHash("sha256")
    .update(`${uid}\n${schoolId}\n${sourceUrl}`)
    .digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const token = await verifyRequestToken(request);
    if (!token?.email || !isDecodedAccountVerified(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { sourceUrl?: unknown };
    const validatedUrl = validateCalendarSourceUrl(body.sourceUrl);
    if (!validatedUrl.valid) {
      return NextResponse.json(
        { error: validatedUrl.error },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const profile = await db.collection("users").doc(token.uid).get();
    const profileData = profile.data();
    const districtId =
      typeof profileData?.districtId === "string" ? profileData.districtId : "";
    const district =
      typeof profileData?.district === "string" ? profileData.district : "";
    const schoolId =
      typeof profileData?.schoolId === "string" ? profileData.schoolId : "";
    const school =
      typeof profileData?.school === "string" ? profileData.school : "";

    if (
      profileData?.profileComplete !== true ||
      !districtId ||
      !district ||
      !schoolId ||
      !school
    ) {
      return NextResponse.json(
        { error: "Complete your school profile before suggesting a calendar." },
        { status: 409 }
      );
    }

    const requestId = buildRequestId(token.uid, schoolId, validatedUrl.url);
    const requestRef = db.collection("calendarImportRequests").doc(requestId);
    const existing = await requestRef.get();
    const existingStatus = existing.data()?.status;

    if (existingStatus === "pending") {
      return NextResponse.json(
        { error: "That calendar is already waiting for review." },
        { status: 409 }
      );
    }

    if (existingStatus === "approved") {
      return NextResponse.json(
        { error: "That calendar has already been approved." },
        { status: 409 }
      );
    }

    await requestRef.set({
      requestedBy: token.uid,
      requesterEmail: token.email.toLowerCase(),
      districtId,
      district,
      schoolId,
      school,
      sourceUrl: validatedUrl.url,
      visibility: "school",
      status: "pending",
      requestedAt: FieldValue.serverTimestamp(),
      reviewedAt: null,
      reviewedBy: null,
      rejectionReason: null,
      calendarSourceId: null,
    });

    return NextResponse.json({
      success: true,
      message: "Calendar submitted for admin review.",
    });
  } catch (error) {
    console.error("Calendar request submission failed:", error);
    return NextResponse.json(
      { error: "We couldn't submit that calendar." },
      { status: 500 }
    );
  }
}
