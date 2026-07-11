import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { validateProfileSetupInput } from "@/app/lib/auth/profile-validation";
import { validateSchoolSelection } from "@/app/lib/auth/school-directory";
import { getSchoolDirectoryContext } from "@/app/lib/auth/school-directory.server";
import {
  isDecodedAccountVerified,
  verifyRequestToken,
} from "@/app/lib/auth/server-auth";
import { getAdminDb } from "@/app/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const token = await verifyRequestToken(request);

    if (!token?.email || !isDecodedAccountVerified(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validation = validateProfileSetupInput(await request.json());
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const context = await getSchoolDirectoryContext(token.email);
    const school = context
      ? validateSchoolSelection(context, validation.value.schoolId)
      : null;

    if (!context || !school) {
      return NextResponse.json(
        { error: "Your school is not approved for this email domain." },
        { status: 403 }
      );
    }

    if (token.email_verified !== true) {
      const verification = await getAdminDb()
        .collection("accountVerifications")
        .doc(token.uid)
        .get();
      const verificationData = verification.data();

      if (
        verificationData?.status !== "approved" ||
        verificationData.schoolId !== school.id ||
        verificationData.districtId !== context.districtId
      ) {
        return NextResponse.json(
          { error: "Manual verification does not match this school." },
          { status: 403 }
        );
      }
    }

    const db = getAdminDb();
    const userRef = db.collection("users").doc(token.uid);

    await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(userRef);
      const value = validation.value;

      transaction.set(
        userRef,
        {
          uid: token.uid,
          email: token.email?.toLowerCase(),
          districtId: context.districtId,
          district: context.districtName,
          schoolId: school.id,
          school: school.name,
          displayName: value.displayName,
          bio: value.bio,
          grade: value.grade,
          interests: value.interests,
          profileComplete: true,
          verificationMethod:
            token.email_verified === true ? "email" : "manual",
          updatedAt: FieldValue.serverTimestamp(),
          ...(existing.exists
            ? {}
            : { createdAt: FieldValue.serverTimestamp() }),
        },
        { merge: true }
      );
    });

    return NextResponse.json({
      success: true,
      profile: {
        districtId: context.districtId,
        district: context.districtName,
        schoolId: school.id,
        school: school.name,
      },
    });
  } catch (error) {
    console.error("Profile bootstrap failed:", error);
    return NextResponse.json(
      { error: "We couldn't save the profile." },
      { status: 500 }
    );
  }
}
