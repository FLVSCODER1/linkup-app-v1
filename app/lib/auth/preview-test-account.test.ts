import { describe, expect, it } from "vitest";

import { resolvePreviewTestAccount } from "./preview-test-account";

const config = JSON.stringify({
  "tester@ufl.edu": {
    districtId: "wylie-isd",
    schoolId: "wylie-high-school",
  },
});

describe("preview test account mapping", () => {
  it("maps only the exact configured email in a preview deployment", () => {
    expect(resolvePreviewTestAccount(" TESTER@UFL.EDU ", "preview", config)).toEqual(
      {
        districtId: "wylie-isd",
        schoolId: "wylie-high-school",
      }
    );

    expect(resolvePreviewTestAccount("other@ufl.edu", "preview", config)).toBeNull();
  });

  it("is disabled outside Vercel Preview even when configured", () => {
    expect(resolvePreviewTestAccount("tester@ufl.edu", "production", config)).toBeNull();
    expect(resolvePreviewTestAccount("tester@ufl.edu", undefined, config)).toBeNull();
  });

  it("fails closed for malformed configuration and invalid directory IDs", () => {
    expect(resolvePreviewTestAccount("tester@ufl.edu", "preview", "not-json")).toBeNull();
    expect(
      resolvePreviewTestAccount(
        "tester@ufl.edu",
        "preview",
        JSON.stringify({
          "tester@ufl.edu": {
            districtId: "Wylie ISD",
            schoolId: "wylie-high-school",
          },
        })
      )
    ).toBeNull();
  });
});
