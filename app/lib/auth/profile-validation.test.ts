import { describe, expect, it } from "vitest";

import {
  buildStoredProfileIdentity,
  hasCompleteProfileIdentity,
  validateProfileSetupInput,
} from "./profile-validation";

describe("profile setup validation", () => {
  const validInput = {
    firstName: "Taylor",
    lastName: "Morgan",
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

  it("uses the first name when no display name is provided", () => {
    expect(
      validateProfileSetupInput({ ...validInput, displayName: "" })
    ).toMatchObject({ valid: true, value: { displayName: "Taylor" } });
  });

  it("requires plausible first and last names", () => {
    expect(
      validateProfileSetupInput({ ...validInput, firstName: "" }).valid
    ).toBe(false);
    expect(
      validateProfileSetupInput({ ...validInput, lastName: "123" }).valid
    ).toBe(false);
  });

  it("keeps the full last name out of the public profile identity", () => {
    const validation = validateProfileSetupInput(validInput);
    expect(validation.valid).toBe(true);
    if (!validation.valid) return;

    expect(buildStoredProfileIdentity(validation.value)).toEqual({
      publicIdentity: {
        firstName: "Taylor",
        lastInitial: "M",
        displayName: "Taylor",
      },
      privateIdentity: { lastName: "Morgan" },
    });
  });

  it("requires both private identity fields before onboarding is complete", () => {
    expect(hasCompleteProfileIdentity("Taylor", "Morgan")).toBe(true);
    expect(hasCompleteProfileIdentity("Taylor", "")).toBe(false);
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
