import { describe, expect, it } from "vitest";
import { validateSignupForm } from "./signup-validation";

describe("validateSignupForm", () => {
  it("requires an email address", () => {
    expect(validateSignupForm(" ", "password", "password")).toEqual({
      valid: false,
      message: "Enter your school email.",
    });
  });

  it("requires at least eight password characters", () => {
    expect(validateSignupForm("student@school.org", "short", "short")).toEqual(
      {
        valid: false,
        message: "Use a password with at least 8 characters.",
      }
    );
  });

  it("requires matching passwords", () => {
    expect(
      validateSignupForm("student@school.org", "password", "password2")
    ).toEqual({
      valid: false,
      message: "Those passwords don't match.",
    });
  });

  it("accepts a complete form", () => {
    expect(
      validateSignupForm("student@school.org", "password", "password")
    ).toEqual({ valid: true });
  });
});
