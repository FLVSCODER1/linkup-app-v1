"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function EventPage() {
  const router = useRouter();

  const [promStatus, setPromStatus] = useState("");
  const [lookingFor, setLookingFor] = useState("");
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

        setPromStatus(data.promStatus || "");
        setLookingFor(data.lookingFor || "");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  async function saveEventPrefs() {
    try {
      const user = auth.currentUser;

      if (!user) {
        setMessage("You must be logged in first.");
        return;
      }

      if (!promStatus) {
        setMessage("Choose your prom status.");
        return;
      }

      if (!lookingFor) {
        setMessage("Choose what you're looking for.");
        return;
      }

      await updateDoc(doc(db, "users", user.uid), {
        promStatus,
        lookingFor,
      });

      setMessage("Event preferences saved.");
      router.push("/people");
    } catch (error: any) {
      setMessage(error.message);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-white/70">Loading event...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white p-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
        <h1 className="mb-2 text-3xl font-bold">Prom setup</h1>

        <p className="mb-6 text-sm text-white/70">
          Tell us your plan so we can help you find the right people.
        </p>

        <label className="mb-2 block text-sm text-white/70">
          Are you going to prom?
        </label>
        <select
          className="mb-4 w-full rounded-lg bg-white/10 p-3 outline-none"
          value={promStatus}
          onChange={(e) => setPromStatus(e.target.value)}
        >
          <option value="">Select status</option>
          <option value="going">Going</option>
          <option value="maybe">Maybe</option>
          <option value="not-going">Not going</option>
        </select>

        <label className="mb-2 block text-sm text-white/70">
          What are you looking for?
        </label>
        <select
          className="mb-4 w-full rounded-lg bg-white/10 p-3 outline-none"
          value={lookingFor}
          onChange={(e) => setLookingFor(e.target.value)}
        >
          <option value="">Select one</option>
          <option value="date">A date</option>
          <option value="group">A group</option>
          <option value="either">Either</option>
          <option value="just-browsing">Just browsing</option>
        </select>

        <button
          onClick={saveEventPrefs}
          className="w-full rounded-lg bg-white p-3 font-semibold text-black"
        >
          Continue
        </button>

        {message && <p className="mt-4 text-sm text-white/70">{message}</p>}
      </div>
    </main>
  );
}
