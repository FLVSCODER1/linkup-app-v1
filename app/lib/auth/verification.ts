import type { User } from "firebase/auth";

export type AccountVerificationMethod = "email" | "manual";

export async function getAccountVerificationMethod(
  user: User,
  forceRefresh = false
): Promise<AccountVerificationMethod | null> {
  if (user.emailVerified) return "email";

  const token = await user.getIdTokenResult(forceRefresh);
  return token.claims.linkup_verified === true ? "manual" : null;
}

export async function hasVerifiedAccount(
  user: User,
  forceRefresh = false
): Promise<boolean> {
  return (await getAccountVerificationMethod(user, forceRefresh)) !== null;
}
