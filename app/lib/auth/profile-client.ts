"use client";

import type { User } from "firebase/auth";

export interface CurrentUserProfile {
  firstName: string;
  lastName: string;
  displayName: string;
  bio: string;
  grade: string;
  interests: string[];
  schoolId: string;
  district: string | null;
  school: string | null;
  profileComplete: boolean;
}

export async function fetchCurrentUserProfile(
  user: User
): Promise<CurrentUserProfile | null> {
  const token = await user.getIdToken(true);
  const response = await fetch("/api/auth/profile", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = (await response.json()) as {
    profile?: CurrentUserProfile | null;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error || "We couldn't load your profile.");
  }

  return data.profile ?? null;
}
