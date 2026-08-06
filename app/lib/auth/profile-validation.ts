import type { GradeLevel } from "../firestore/types";

export const PROFILE_INTERESTS = [
  "Sports",
  "Music",
  "Gaming",
  "Art",
  "STEM",
  "Volunteering",
  "Clubs",
  "Theater",
  "Business",
  "Fitness",
] as const;

export interface ProfileSetupInput {
  firstName: string;
  lastName: string;
  displayName: string;
  bio: string;
  grade: GradeLevel;
  interests: string[];
  schoolId: string;
}

export function buildStoredProfileIdentity(profile: ProfileSetupInput) {
  return {
    publicIdentity: {
      firstName: profile.firstName,
      lastInitial: Array.from(profile.lastName)[0]?.toUpperCase() ?? "",
      displayName: profile.displayName,
    },
    privateIdentity: {
      lastName: profile.lastName,
    },
  };
}

const PERSON_NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}\p{Zs}'’.-]*$/u;

type ProfileValidationResult =
  | { valid: true; value: ProfileSetupInput }
  | { valid: false; error: string };

export function validateProfileSetupInput(
  input: unknown
): ProfileValidationResult {
  if (!input || typeof input !== "object") {
    return { valid: false, error: "Invalid profile details." };
  }

  const data = input as Record<string, unknown>;
  const firstName =
    typeof data.firstName === "string" ? data.firstName.trim() : "";
  const lastName =
    typeof data.lastName === "string" ? data.lastName.trim() : "";
  const requestedDisplayName =
    typeof data.displayName === "string" ? data.displayName.trim() : "";
  const displayName = requestedDisplayName || firstName;
  const bio = typeof data.bio === "string" ? data.bio.trim() : "";
  const grade = typeof data.grade === "string" ? data.grade : "";
  const schoolId =
    typeof data.schoolId === "string" ? data.schoolId.trim() : "";
  const interests = Array.isArray(data.interests)
    ? [...new Set(data.interests.filter((item): item is string => typeof item === "string"))]
    : [];

  if (
    firstName.length > 50 ||
    !PERSON_NAME_PATTERN.test(firstName)
  ) {
    return { valid: false, error: "Enter a valid first name." };
  }

  if (lastName.length > 50 || !PERSON_NAME_PATTERN.test(lastName)) {
    return { valid: false, error: "Enter a valid last name." };
  }

  if (displayName.length < 1 || displayName.length > 50) {
    return { valid: false, error: "Display name must be 1–50 characters." };
  }

  if (bio.length > 250) {
    return { valid: false, error: "Bio must be 250 characters or fewer." };
  }

  if (!(["9", "10", "11", "12"] as string[]).includes(grade)) {
    return { valid: false, error: "Select a valid grade." };
  }

  if (!schoolId) {
    return { valid: false, error: "Select your school." };
  }

  if (
    interests.length > PROFILE_INTERESTS.length ||
    interests.some(
      (interest) => !(PROFILE_INTERESTS as readonly string[]).includes(interest)
    )
  ) {
    return { valid: false, error: "Choose interests from the provided list." };
  }

  return {
    valid: true,
    value: {
      firstName,
      lastName,
      displayName,
      bio,
      grade: grade as GradeLevel,
      interests,
      schoolId,
    },
  };
}
