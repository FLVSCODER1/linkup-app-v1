import { createHash } from "node:crypto";

import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { getSchoolDirectoryContext } from "@/app/lib/auth/school-directory.server";
import { validateSchoolRequest } from "@/app/lib/auth/school-request";
import { getAdminDb } from "@/app/lib/firebase-admin";

export const dynamic = "force-dynamic";

function stableHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    // A hidden field makes basic form bots harmless without confusing humans.
    if (typeof body.company === "string" && body.company.trim()) {
      return NextResponse.json({ success: true, duplicate: true });
    }

    const validation = validateSchoolRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.message },
        { status: 400 }
      );
    }

    const input = validation.value;
    if (await getSchoolDirectoryContext(input.email)) {
      return NextResponse.json(
        { error: "That school email is already supported. Try creating your account." },
        { status: 409 }
      );
    }

    const db = getAdminDb();
    const requestId = stableHash(input.domain);
    const requesterId = stableHash(input.email);
    const requestRef = db.collection("schoolRequests").doc(requestId);
    const requesterRef = requestRef.collection("requesters").doc(requesterId);

    const result = await db.runTransaction(async (transaction) => {
      const [requestSnapshot, requesterSnapshot] = await Promise.all([
        transaction.get(requestRef),
        transaction.get(requesterRef),
      ]);

      if (requesterSnapshot.exists) {
        return { duplicate: true };
      }

      const current = requestSnapshot.data();
      const requestCount =
        typeof current?.requestCount === "number" ? current.requestCount : 0;

      transaction.set(
        requestRef,
        {
          domain: input.domain,
          schoolName: input.schoolName,
          city: input.city,
          state: input.state,
          districtName: input.districtName,
          officialWebsite: input.officialWebsite,
          calendarUrl: input.calendarUrl,
          status: "pending",
          requestCount: requestCount + 1,
          requestedAt:
            requestSnapshot.exists && current?.requestedAt
              ? current.requestedAt
              : FieldValue.serverTimestamp(),
          lastRequestedAt: FieldValue.serverTimestamp(),
          reviewedAt: null,
          reviewedBy: null,
          rejectionReason: null,
        },
        { merge: true }
      );
      transaction.set(requesterRef, {
        email: input.email,
        requestedAt: FieldValue.serverTimestamp(),
      });

      return { duplicate: false };
    });

    return NextResponse.json(
      {
        success: true,
        duplicate: result.duplicate,
        requestId,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("School request submission failed:", error);
    return NextResponse.json(
      { error: "We couldn't submit that school request. Please try again." },
      { status: 500 }
    );
  }
}
