import { NextRequest, NextResponse } from "next/server";

import { getSchoolDirectoryContext } from "@/app/lib/auth/school-directory.server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: unknown };
    const email = typeof body.email === "string" ? body.email : "";
    const context = await getSchoolDirectoryContext(email);

    if (!context) {
      return NextResponse.json(
        {
          supported: false,
          error: "That school email is not supported yet.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { supported: true, context },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("School directory lookup failed:", error);
    return NextResponse.json(
      { supported: false, error: "School validation is temporarily unavailable." },
      { status: 503 }
    );
  }
}
