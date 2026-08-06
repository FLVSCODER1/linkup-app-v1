"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import NavMenu from "../../components/NavMenu";
import { getErrorMessage } from "../../lib/errors";
import type { FeedEvent, UserProfile } from "../../lib/events/types";

export default function EventPreferencesPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<FeedEvent | null>(null);
  const [promStatus, setPromStatus] = useState("going");
  const [lookingFor, setLookingFor] = useState("either");
  const [currentUserData, setCurrentUserData] = useState<UserProfile | null>(null);
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          router.push("/");
          return;
        }

        if (!user.emailVerified) {
          router.push("/verify-email");
          return;
        }

        setCurrentUid(user.uid);

        const userSnap = await getDoc(doc(db, "users", user.uid));

        if (!userSnap.exists()) {
          router.push("/profile/setup");
          return;
        }

        const userData = userSnap.data();
        setCurrentUserData(userData);

        const eventSnap = await getDoc(doc(db, "events", eventId));

        if (!eventSnap.exists()) {
          setMessage("Event not found.");
          return;
        }

        const eventData = eventSnap.data();

        if (eventData.school !== userData.school) {
          setMessage("You do not have access to this event.");
          return;
        }

        setEvent({
          id: eventSnap.id,
          ...eventData,
        });

        const prefSnap = await getDoc(
          doc(db, "eventPreferences", `${user.uid}_${eventId}`)
        );

        if (prefSnap.exists()) {
          const pref = prefSnap.data();
          setPromStatus(pref.promStatus || "going");
          setLookingFor(pref.lookingFor || "either");
        }
      } catch (error: unknown) {
        setMessage(getErrorMessage(error, "Failed to load event preferences."));
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, eventId]);

  async function savePreferences() {
    if (!currentUid || !currentUserData || !event) return;

    setSaving(true);
    setMessage("");

    try {
      const prefId = `${currentUid}_${eventId}`;

      await setDoc(
        doc(db, "eventPreferences", prefId),
        {
          userId: currentUid,
          eventId,
          school: currentUserData.school,
          promStatus,
          lookingFor,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      const attendeeRef = doc(
        db,
        "events",
        eventId,
        "attendees",
        currentUid
      );

      if (promStatus === "not-going") {
        await deleteDoc(attendeeRef);
      } else {
        await setDoc(
          attendeeRef,
          {
            uid: currentUid,
            school: currentUserData.school,
            joinedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      router.push(`/people/${eventId}`);
    } catch (error: unknown) {
      setMessage(getErrorMessage(error, "Failed to save preferences."));
    } finally {
      setSaving(false);
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
    <main className="min-h-screen bg-black p-6 pb-28 text-white">
      <NavMenu />

      <div className="mx-auto max-w-md">
        <button
          onClick={() => router.back()}
          className="mb-6 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
        >
          ← Back
        </button>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
          {message ? (
            <p className="text-sm text-red-400">{message}</p>
          ) : (
            <>
              <h1 className="text-3xl font-bold">
                {event?.title || "Event"}
              </h1>

              <p className="mt-3 text-sm text-white/60">
                Tell us your plan for this event.
              </p>

              <div className="mt-8">
                <label htmlFor="promStatus" className="mb-2 block text-sm text-white/70">
                  Are you going?
                </label>

                <select
                  id="promStatus"
                  value={promStatus}
                  onChange={(e) => setPromStatus(e.target.value)}
                  className="w-full rounded-lg bg-white/10 p-3 text-white outline-none"
                >
                  <option value="going">Going</option>
                  <option value="maybe">Maybe</option>
                  <option value="not-going">Not going</option>
                </select>
              </div>

              <div className="mt-5">
                <label htmlFor="lookingFor" className="mb-2 block text-sm text-white/70">
                  What are you looking for?
                </label>

                <select
                  id="lookingFor"
                  value={lookingFor}
                  onChange={(e) => setLookingFor(e.target.value)}
                  className="w-full rounded-lg bg-white/10 p-3 text-white outline-none"
                >
                  <option value="either">Either</option>
                  <option value="friends">Friends</option>
                  <option value="date">Date</option>
                  <option value="browsing">Just browsing</option>
                </select>
              </div>

              <button
                onClick={savePreferences}
                disabled={saving}
                className="mt-6 w-full rounded-lg bg-white p-3 font-semibold text-black transition hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Continue"}
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
