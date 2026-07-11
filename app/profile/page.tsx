"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import NavMenu from "../components/layout/NavMenu";
import { getErrorMessage } from "../lib/errors";

export default function ProfilePage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [grade, setGrade] = useState("");
  const [bio, setBio] = useState("");
  const [school, setSchool] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/");
        return;
      }

      if (!user.emailVerified) {
        router.replace("/verify-email");
        return;
      }

      const userSnap = await getDoc(doc(db, "users", user.uid));

      if (userSnap.exists()) {
        const data = userSnap.data();

        setDisplayName(data.displayName || "");
        setGrade(data.grade || "");
        setBio(data.bio || "");
        setSchool(data.school || "");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  async function saveProfile() {
    try {
      const user = auth.currentUser;

      if (!user) {
        setMessage("You must be logged in first.");
        return;
      }

      if (!displayName.trim()) {
        setMessage("Display name is required.");
        return;
      }

      if (!grade) {
        setMessage("Grade is required.");
        return;
      }

      await updateDoc(doc(db, "users", user.uid), {
        displayName: displayName.trim(),
        grade,
        bio: bio.trim(),
        profileComplete: true,
        updatedAt: serverTimestamp(),
      });

      setMessage("Profile saved.");
    } catch (error: unknown) {
      setMessage(getErrorMessage(error, "Failed to save profile."));
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-white/70">Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black p-6 pb-28 text-white">
      <NavMenu />

      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-3xl font-bold">Your Profile</h1>

        <p className="mb-6 text-sm text-white/70">
          This is what other students can see.
        </p>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
          <label className="mb-2 block text-sm text-white/70">
            Display name
          </label>
          <input
            className="mb-4 w-full rounded-lg bg-white/10 p-3 outline-none"
            placeholder="Display name"
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
            className="w-full rounded-lg bg-white p-3 font-semibold text-black"
          >
            Save profile
          </button>

          {message && (
            <p className="mt-4 text-sm text-white/70">{message}</p>
          )}
        </div>
      </div>
    </main>
  );
}
