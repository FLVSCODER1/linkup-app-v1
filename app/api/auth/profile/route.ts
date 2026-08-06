import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import {
  buildStoredProfileIdentity,
  hasCompleteProfileIdentity,
  validateProfileSetupInput,
} from "@/app/lib/auth/profile-validation";
import { resolveAssignedAdminSchoolContext } from "@/app/lib/auth/admin-profile-school";
import { validateSchoolSelection } from "@/app/lib/auth/school-directory";
import { getSchoolDirectoryContext } from "@/app/lib/auth/school-directory.server";
import {
  isDecodedAccountVerified,
  verifyRequestToken,
} from "@/app/lib/auth/server-auth";
import { getAdminDb } from "@/app/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = await verifyRequestToken(request);

    if (!token || !isDecodedAccountVerified(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getAdminDb();
    const [snapshot, privateSnapshot] = await Promise.all([
      db.collection("users").doc(token.uid).get(),
      db.collection("privateUserProfiles").doc(token.uid).get(),
    ]);
    if (!snapshot.exists) {
      return NextResponse.json(
        { profile: null },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const data = snapshot.data();
    const privateData = privateSnapshot.data();
    const firstName =
      typeof data?.firstName === "string"
        ? data.firstName
        : typeof data?.displayName === "string"
          ? data.displayName
          : "";
    const lastName =
      typeof privateData?.lastName === "string" ? privateData.lastName : "";
    return NextResponse.json(
      {
        profile: {
          firstName,
          lastName,
          displayName:
            typeof data?.displayName === "string" ? data.displayName : "",
          bio: typeof data?.bio === "string" ? data.bio : "",
          grade: typeof data?.grade === "string" ? data.grade : "",
          interests: Array.isArray(data?.interests) ? data.interests : [],
          districtId:
            typeof data?.districtId === "string" ? data.districtId : "",
          schoolId: typeof data?.schoolId === "string" ? data.schoolId : "",
          district: typeof data?.district === "string" ? data.district : null,
          school: typeof data?.school === "string" ? data.school : null,
          profileComplete:
            data?.profileComplete === true &&
            hasCompleteProfileIdentity(firstName, lastName),
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Profile status lookup failed:", error);
    return NextResponse.json(
      { error: "We couldn't load the profile." },
      { status: 500 }
    );
  }
}

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

    const db = getAdminDb();
    const [directoryContext, adminSnapshot, existingUserSnapshot] =
      await Promise.all([
        getSchoolDirectoryContext(token.email),
        db.collection("admins").doc(token.uid).get(),
        db.collection("users").doc(token.uid).get(),
      ]);
    const context =
      directoryContext ??
      resolveAssignedAdminSchoolContext(
        adminSnapshot.data(),
        existingUserSnapshot.data(),
        token.email
      );
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
      const verification = await db
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

    const userRef = db.collection("users").doc(token.uid);
    const privateUserRef = db
      .collection("privateUserProfiles")
      .doc(token.uid);

    await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(userRef);
      const value = validation.value;
      const identity = buildStoredProfileIdentity(value);

      transaction.set(
        userRef,
        {
          uid: token.uid,
          email: token.email?.toLowerCase(),
          ...identity.publicIdentity,
          districtId: context.districtId,
          district: context.districtName,
          schoolId: school.id,
          school: school.name,
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

      transaction.set(
        privateUserRef,
        {
          uid: token.uid,
          ...identity.privateIdentity,
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
