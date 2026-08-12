"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { auth } from "../lib/firebase";
import NavMenu from "../components/layout/NavMenu";
import { withTimeout } from "../lib/async/with-timeout";
import { fetchCurrentUserProfile } from "../lib/auth/profile-client";
import { validateProfileSetupInput } from "../lib/auth/profile-validation";
import { hasVerifiedAccount } from "../lib/auth/verification";

export default function ProfilePage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [grade, setGrade] = useState("");
  const [bio, setBio] = useState("");
  const [school, setSchool] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setLoading(true);
        setLoadError("");

        if (!user) {
          router.replace("/");
          return;
        }

        if (!(await hasVerifiedAccount(user, true))) {
          router.replace("/verify-email");
          return;
        }

        const profile = await withTimeout(
          fetchCurrentUserProfile(user),
          10_000,
          "Profile loading timed out."
        );

        if (!profile) {
          router.replace("/profile/setup");
          return;
        }

        setFirstName(profile.firstName);
        setLastName(profile.lastName);
        setDisplayName(profile.displayName);
        setGrade(profile.grade);
        setBio(profile.bio);
        setSchool(profile.school || "");
        setSchoolId(profile.schoolId);
        setInterests(profile.interests);
      } catch (error) {
        console.error("Profile failed to load:", error);
        setLoadError("We couldn't load your profile. Please try again.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [reloadKey, router]);

  async function saveProfile() {
    try {
      const user = auth.currentUser;

      if (!user) {
        setMessage("You must be logged in first.");
        return;
      }

      setSaving(true);
      setMessage("");
      const validation = validateProfileSetupInput({
        firstName,
        lastName,
        displayName,
        grade,
        bio,
        interests,
        schoolId,
      });

      if (!validation.valid) {
        setMessage(validation.error);
        return;
      }

      const token = await user.getIdToken(true);
      const response = await fetch("/api/auth/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(validation.value),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessage(data.error || "Failed to save profile.");
        return;
      }

      setMessage("Profile saved.");
    } catch (error: unknown) {
      console.error("Profile failed to save:", error);
      setMessage("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-white/70">Loading profile...</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black p-6 text-white">
        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
          <h1 className="text-xl font-semibold">Profile unavailable</h1>
          <p className="mt-2 text-sm text-red-100/80">{loadError}</p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => setReloadKey((current) => current + 1)}
              className="flex-1 rounded-xl bg-white px-4 py-3 font-semibold text-black"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={async () => {
                await signOut(auth);
                router.replace("/");
              }}
              className="flex-1 rounded-xl border border-white/10 px-4 py-3 font-semibold"
            >
              Sign out
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent px-4 py-6 pb-28 text-white sm:px-6 lg:px-10 lg:py-9">
      <NavMenu />

      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">Your profile</h1>

        <p className="mb-6 text-sm text-white/70">
          This is what other students can see.
        </p>

        <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-2xl sm:p-7">
          <label className="mb-2 block text-sm text-white/70">First name</label>
          <input
            className="mb-4 w-full rounded-lg bg-white/10 p-3 outline-none"
            value={firstName}
            autoComplete="given-name"
            onChange={(e) => setFirstName(e.target.value)}
          />

          <label className="mb-2 block text-sm text-white/70">Last name</label>
          <input
            className="w-full rounded-lg bg-white/10 p-3 outline-none"
            value={lastName}
            autoComplete="family-name"
            onChange={(e) => setLastName(e.target.value)}
          />
          <p className="mb-4 mt-2 text-xs text-white/40">
            Kept private and used for account verification.
          </p>

          <label className="mb-2 block text-sm text-white/70">
            Display name <span className="text-white/40">(optional)</span>
          </label>
          <input
            className="mb-4 w-full rounded-lg bg-white/10 p-3 outline-none"
            placeholder={firstName || "Display name"}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />

          <label className="mb-2 block text-sm text-white/70">Grade</label>
          <select
            className="mb-4 w-full rounded-lg bg-white/10 p-3 outline-none"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          >
            <option value="">Select grade</option>
            <option value="9">Freshman</option>
            <option value="10">Sophomore</option>
            <option value="11">Junior</option>
            <option value="12">Senior</option>
          </select>

          <label className="mb-2 block text-sm text-white/70">Bio</label>
          <textarea
            className="mb-4 min-h-28 w-full rounded-lg bg-white/10 p-3 outline-none"
            placeholder="Write a short bio..."
            value={bio}
            maxLength={250}
            onChange={(e) => setBio(e.target.value)}
          />

          <p className="mb-4 text-xs text-white/40">
            {bio.length}/250 characters
          </p>

          <div className="mb-6 rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="mb-1 text-xs uppercase tracking-wide text-white/40">
              Preview
            </p>

            <h2 className="text-xl font-semibold">
              {displayName || "Unnamed"}
            </h2>

            <p className="text-sm text-white/70">
              Grade: {grade || "Unknown"}
            </p>

            <p className="text-sm text-white/50">
              {school || "School unknown"}
            </p>

            <p className="mt-3 text-sm text-white/80">
              {bio || "No bio yet."}
            </p>
          </div>

          <button
            onClick={saveProfile}
            disabled={saving}
            className="w-full rounded-xl bg-gradient-to-r from-[#335cff] to-[#746ff7] p-3 font-semibold text-white shadow-[0_10px_28px_rgba(51,92,255,0.25)] transition hover:brightness-110 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save profile"}
          </button>

          {message && (
            <p className="mt-4 text-sm text-white/70">{message}</p>
          )}
        </div>
      </div>
    </main>
  );
}
