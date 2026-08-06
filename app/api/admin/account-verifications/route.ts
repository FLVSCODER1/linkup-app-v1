import { getAuth } from "firebase-admin/auth";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { hasAdminRole } from "@/app/lib/auth/admin.server";
import { verifyRequestToken } from "@/app/lib/auth/server-auth";
import { getAdminDb, getFirebaseAdminApp } from "@/app/lib/firebase-admin";
import type { ManualReviewMethod } from "@/app/lib/firestore/types";

export const dynamic = "force-dynamic";

const REVIEW_METHODS = new Set<ManualReviewMethod>([
  "official_roster",
  "in_person",
  "school_staff_confirmation",
]);

function serializeDate(value: unknown): string | null {
  return value instanceof Timestamp ? value.toDate().toISOString() : null;
}

export async function GET(request: NextRequest) {
  try {
    const token = await verifyRequestToken(request);

    if (!token || !(await hasAdminRole(token.uid, "account_reviewer"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const snapshot = await getAdminDb()
      .collection("accountVerifications")
      .where("status", "==", "pending")
      .limit(100)
      .get();

    const requests = snapshot.docs
      .map((document) => {
        const data = document.data();
        return {
          uid: document.id,
          email: data.email,
          district: data.district,
          school: data.school,
          requestedAt: serializeDate(data.requestedAt),
        };
      })
      .sort((left, right) =>
        (left.requestedAt ?? "").localeCompare(right.requestedAt ?? "")
      );

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Account verification list failed:", error);
    return NextResponse.json(
      { error: "We couldn't load verification requests." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const reviewer = await verifyRequestToken(request);

    if (!reviewer || !(await hasAdminRole(reviewer.uid, "account_reviewer"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const uid = typeof body.uid === "string" ? body.uid.trim() : "";
    const decision = body.decision;
    const reviewMethod = body.reviewMethod;
    const rejectionReason =
      typeof body.rejectionReason === "string"
        ? body.rejectionReason.trim().slice(0, 250)
        : "";

    if (!uid || (decision !== "approve" && decision !== "reject")) {
      return NextResponse.json({ error: "Invalid decision." }, { status: 400 });
    }

    if (
      decision === "approve" &&
      (typeof reviewMethod !== "string" ||
        !REVIEW_METHODS.has(reviewMethod as ManualReviewMethod))
    ) {
      return NextResponse.json(
        { error: "Select how eligibility was confirmed." },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const verificationRef = db.collection("accountVerifications").doc(uid);
    const verification = await verificationRef.get();
    const data = verification.data();

    if (!verification.exists || data?.status !== "pending") {
      return NextResponse.json(
        { error: "Verification request is no longer pending." },
        { status: 409 }
      );
    }

    if (decision === "approve") {
      const auth = getAuth(getFirebaseAdminApp());
      const user = await auth.getUser(uid);

      await auth.setCustomUserClaims(uid, {
        ...(user.customClaims ?? {}),
        linkup_verified: true,
        linkup_verification_method: "manual",
        linkup_district_id: data.districtId,
        linkup_school_id: data.schoolId,
      });
    }

    await verificationRef.update({
      status: decision === "approve" ? "approved" : "rejected",
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: reviewer.uid,
      reviewMethod: decision === "approve" ? reviewMethod : null,
      rejectionReason: decision === "reject" ? rejectionReason || null : null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account verification review failed:", error);
    return NextResponse.json(
      { error: "We couldn't review that account." },
      { status: 500 }
    );
  }
}
