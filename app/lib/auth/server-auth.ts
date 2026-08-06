import "server-only";

import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import type { NextRequest } from "next/server";

import { getFirebaseAdminApp } from "../firebase-admin";

export function isDecodedAccountVerified(token: DecodedIdToken): boolean {
  return token.email_verified === true || token.linkup_verified === true;
}

export async function verifyRequestToken(
  request: NextRequest
): Promise<DecodedIdToken | null> {
  const header = request.headers.get("authorization");

  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice("Bearer ".length).trim();
  if (!token) return null;

  try {
    return await getAuth(getFirebaseAdminApp()).verifyIdToken(token, true);
  } catch {
    return null;
  }
}
