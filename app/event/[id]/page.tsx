"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import NavMenu from "../../components/NavMenu";

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();

  const eventId = params.id as string;

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

      const prefId = `${user.uid}_${eventId}`;
      const prefRef = doc(db, "eventPreferences", prefId);
      const prefSnap = await getDoc(prefRef);

      if (prefSnap.exists()) {
        const data = prefSnap.data();
        setPromStatus(data.promStatus || "");
        setLookingFor(data.lookingFor || "");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, eventId]);

  async function savePreferences() {
    try {
      const user = auth.currentUser;

      if (!user) {
        setMessage("You must be logged in.");
        return;
      }

      if (!promStatus || !lookingFor) {
        setMessage("Complete all fields.");
        return;
      }

      const prefId = `${user.uid}_${eventId}`;

      await setDoc(doc(db, "eventPreferences", prefId), {
        userId: user.uid,
        eventId,
        promStatus,
        lookingFor,
        createdAt: new Date(),
      });

      setMessage("Saved.");
      router.push(`/people/${eventId}`);
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
    <main className="min-h-screen bg-black p-6 text-white">
      <NavMenu />

      <div className="mx-auto max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
        <h1 className="mb-2 text-3xl font-bold capitalize">
          {eventId.replace("-", " ")}
        </h1>

        <p className="mb-6 text-sm text-white/70">
          Tell us your plan for this event.
        </p>

        <label className="mb-2 block text-sm text-white/70">
          Are you going?
        </label>

        <select
          className="mb-4 w-full rounded-lg bg-white/10 p-3"
          value={promStatus}
          onChange={(e) => setPromStatus(e.target.value)}
        >
          <option value="">Select</option>
          <option value="going">Going</option>
          <option value="maybe">Maybe</option>
          <option value="not-going">Not going</option>
        </select>

        <label className="mb-2 block text-sm text-white/70">
          What are you looking for?
        </label>

        <select
          className="mb-4 w-full rounded-lg bg-white/10 p-3"
          value={lookingFor}
          onChange={(e) => setLookingFor(e.target.value)}
        >
          <option value="">Select</option>
          <option value="date">A date</option>
          <option value="group">A group</option>
          <option value="either">Either</option>
          <option value="browsing">Just browsing</option>
        </select>

        <button
          onClick={savePreferences}
          className="w-full rounded-lg bg-white p-3 font-semibold text-black"
        >
          Continue
        </button>

        {message && (
          <p className="mt-4 text-sm text-white/70">{message}</p>
        )}
      </div>
    </main>
  );
}