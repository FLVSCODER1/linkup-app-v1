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
  displayName: string;
  bio: string;
  grade: GradeLevel;
  interests: string[];
  schoolId: string;
}

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
  const displayName =
    typeof data.displayName === "string" ? data.displayName.trim() : "";
  const bio = typeof data.bio === "string" ? data.bio.trim() : "";
  const grade = typeof data.grade === "string" ? data.grade : "";
  const schoolId =
    typeof data.schoolId === "string" ? data.schoolId.trim() : "";
  const interests = Array.isArray(data.interests)
    ? [...new Set(data.interests.filter((item): item is string => typeof item === "string"))]
    : [];

  if (displayName.length < 2 || displayName.length > 50) {
    return { valid: false, error: "Display name must be 2–50 characters." };
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
      displayName,
      bio,
      grade: grade as GradeLevel,
      interests,
      schoolId,
    },
  };
}
