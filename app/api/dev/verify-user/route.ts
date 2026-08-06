import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";

import { getFirebaseAdminApp } from "@/app/lib/firebase-admin";

export const dynamic = "force-dynamic";

function isSafeEnvironment(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.VERCEL_ENV === "preview"
  );
}

function isAuthorized(request: NextRequest): boolean {
  const expectedSecret = process.env.DEV_VERIFY_SECRET;

  if (!expectedSecret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");

  return authHeader === `Bearer ${expectedSecret}`;
}

export async function POST(request: NextRequest) {
  try {
    if (!isSafeEnvironment()) {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 }
      );
    }

    if (!isAuthorized(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const uid = body?.uid;

    if (!uid || typeof uid !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid uid" },
        { status: 400 }
      );
    }

    await getAuth(getFirebaseAdminApp()).updateUser(uid, {
      emailVerified: true,
    });

    return NextResponse.json({
      success: true,
      uid,
      emailVerified: true,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to verify user.";

    console.error("Dev verify user failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
