"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function ProfilePage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [grade, setGrade] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/");
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();

        setDisplayName(data.displayName || "");
        setGrade(data.grade || "");
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
        profileComplete: true
      });

      setMessage("Profile saved.");
      router.push("/event");
    } catch (error: any) {
      setMessage(error.message);
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
    <main className="flex min-h-screen items-center justify-center bg-black text-white p-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
        <h1 className="mb-2 text-3xl font-bold">Set up profile</h1>

        <p className="mb-6 text-sm text-white/70">
          Add the basics so people know who you are.
        </p>

        <input
          className="mb-3 w-full rounded-lg bg-white/10 p-3 outline-none"
          placeholder="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />

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

        <button
          onClick={saveProfile}
          className="w-full rounded-lg bg-white p-3 font-semibold text-black"
        >
          Save profile
        </button>

        {message && <p className="mt-4 text-sm text-white/70">{message}</p>}
      </div>
    </main>
  );
}
