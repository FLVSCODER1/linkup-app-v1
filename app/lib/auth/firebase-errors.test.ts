import { describe, expect, it } from "vitest";

import { getFirebaseAuthErrorMessage } from "./firebase-errors";

describe("Firebase authentication errors", () => {
  it("uses clear messages for common account failures", () => {
    expect(
      getFirebaseAuthErrorMessage({ code: "auth/email-already-in-use" })
    ).toContain("already exists");
    expect(
      getFirebaseAuthErrorMessage({ code: "auth/invalid-credential" })
    ).toBe("The email or password is incorrect.");
    expect(
      getFirebaseAuthErrorMessage({ code: "auth/invalid-login-credentials" })
    ).toBe("The email or password is incorrect.");
  });

  it("does not expose unknown provider errors", () => {
    expect(
      getFirebaseAuthErrorMessage(
        { code: "auth/internal-error", message: "sensitive provider detail" },
        "Safe fallback"
      )
    ).toBe("Safe fallback");
  });
});
