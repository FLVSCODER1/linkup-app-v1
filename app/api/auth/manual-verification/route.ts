import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { validateSchoolSelection } from "@/app/lib/auth/school-directory";
import { getSchoolDirectoryContext } from "@/app/lib/auth/school-directory.server";
import { verifyRequestToken } from "@/app/lib/auth/server-auth";
import { getAdminDb } from "@/app/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const token = await verifyRequestToken(request);

    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (token.email_verified === true || token.linkup_verified === true) {
      return NextResponse.json(
        { error: "This account is already verified." },
        { status: 409 }
      );
    }

    const body = (await request.json()) as { schoolId?: unknown };
    const schoolId =
      typeof body.schoolId === "string" ? body.schoolId.trim() : "";
    const context = await getSchoolDirectoryContext(token.email);
    const school = context
      ? validateSchoolSelection(context, schoolId)
      : null;

    if (!context || !school) {
      return NextResponse.json(
        { error: "Select an approved school." },
        { status: 400 }
      );
    }

    const verificationRef = getAdminDb()
      .collection("accountVerifications")
      .doc(token.uid);
    const existing = await verificationRef.get();

    if (existing.data()?.status === "approved") {
      return NextResponse.json(
        { error: "This account is already approved." },
        { status: 409 }
      );
    }

    await verificationRef.set({
      uid: token.uid,
      email: token.email.toLowerCase(),
      emailDomain: context.domain,
      districtId: context.districtId,
      district: context.districtName,
      schoolId: school.id,
      school: school.name,
      status: "pending",
      requestedAt: FieldValue.serverTimestamp(),
      reviewedAt: null,
      reviewedBy: null,
      reviewMethod: null,
      rejectionReason: null,
    });

    return NextResponse.json({
      success: true,
      message: "Manual verification request submitted.",
    });
  } catch (error) {
    console.error("Manual verification request failed:", error);
    return NextResponse.json(
      { error: "We couldn't submit the verification request." },
      { status: 500 }
    );
  }
}
