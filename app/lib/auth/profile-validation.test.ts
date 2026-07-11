import { describe, expect, it } from "vitest";

import { validateProfileSetupInput } from "./profile-validation";

describe("profile setup validation", () => {
  const validInput = {
    displayName: "Taylor",
    bio: "Robotics and volleyball",
    grade: "10",
    interests: ["STEM", "Sports"],
    schoolId: "richardson-high",
  };

  it("normalizes valid profile details", () => {
    expect(
      validateProfileSetupInput({ ...validInput, displayName: " Taylor " })
    ).toMatchObject({ valid: true, value: { displayName: "Taylor" } });
  });

  it("rejects invalid schools, grades, and interests", () => {
    expect(
      validateProfileSetupInput({ ...validInput, schoolId: "" }).valid
    ).toBe(false);
    expect(
      validateProfileSetupInput({ ...validInput, grade: "13" }).valid
    ).toBe(false);
    expect(
      validateProfileSetupInput({ ...validInput, interests: ["Dating"] }).valid
    ).toBe(false);
  });
});
