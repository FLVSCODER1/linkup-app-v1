export function isAuthorizedBearer(
  authorizationHeader: string | null,
  expectedSecret: string | undefined
): boolean {
  const secret = expectedSecret?.trim();

  if (!secret) {
    return false;
  }

  return authorizationHeader === `Bearer ${secret}`;
}
