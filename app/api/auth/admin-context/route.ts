import { NextRequest, NextResponse } from "next/server";

import { getAdminAccess } from "@/app/lib/auth/admin.server";
import { verifyRequestToken } from "@/app/lib/auth/server-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = await verifyRequestToken(request);

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await getAdminAccess(token.uid);

  return NextResponse.json(access, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
