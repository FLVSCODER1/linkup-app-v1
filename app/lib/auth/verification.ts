import type { User } from "firebase/auth";

export type AccountVerificationMethod = "email" | "manual";

export async function getAccountVerificationMethod(
  user: User,
  forceRefresh = false
): Promise<AccountVerificationMethod | null> {
  const token = await user.getIdTokenResult(forceRefresh);

  if (user.emailVerified || token.claims.email_verified === true) return "email";

  return token.claims.linkup_verified === true ? "manual" : null;
}

export async function hasVerifiedAccount(
  user: User,
  forceRefresh = false
): Promise<boolean> {
  return (await getAccountVerificationMethod(user, forceRefresh)) !== null;
}
