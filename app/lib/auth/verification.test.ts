import { describe, expect, it, vi } from "vitest";
import type { User } from "firebase/auth";

import { getAccountVerificationMethod } from "./verification";

function testUser(
  emailVerified: boolean,
  claims: Record<string, unknown> = {}
): User {
  return {
    emailVerified,
    getIdTokenResult: vi.fn().mockResolvedValue({ claims }),
  } as unknown as User;
}

describe("account verification", () => {
  it("refreshes a verified user's token before Firestore reads", async () => {
    const user = testUser(true);

    await expect(getAccountVerificationMethod(user, true)).resolves.toBe("email");
    expect(user.getIdTokenResult).toHaveBeenCalledWith(true);
  });

  it("recognizes a manually verified account from its refreshed claim", async () => {
    const user = testUser(false, { linkup_verified: true });

    await expect(getAccountVerificationMethod(user, true)).resolves.toBe("manual");
    expect(user.getIdTokenResult).toHaveBeenCalledWith(true);
  });
});
