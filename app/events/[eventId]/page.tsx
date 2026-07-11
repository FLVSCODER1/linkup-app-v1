"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import NavMenu from "../../components/layout/NavMenu";
import BackButton from "../../components/ui/BackButton";
import { getErrorMessage } from "../../lib/errors";
import { canUserAccessEvent } from "../../lib/events/access";
import type { FeedEvent, UserProfile } from "../../lib/events/types";

export default function EventDetailsPage() {
  const router = useRouter();
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;

  const [event, setEvent] = useState<FeedEvent | null>(null);
  const [loading, setLoading] = useState(true);
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

        const userSnap = await getDoc(doc(db, "users", user.uid));

        if (!userSnap.exists()) {
          router.push("/profile/setup");
          return;
        }

        const currentUser = userSnap.data() as UserProfile;

        const eventSnap = await getDoc(doc(db, "events", eventId));

        if (!eventSnap.exists()) {
          setMessage("Event not found.");
          return;
        }

        const eventData: FeedEvent = {
          id: eventSnap.id,
          ...eventSnap.data(),
        };

        if (!canUserAccessEvent(eventData, currentUser)) {
          setMessage("You do not have access to this event.");
          return;
        }

        setEvent(eventData);
      } catch (error: unknown) {
        setMessage(getErrorMessage(error, "Failed to load event."));
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, eventId]);

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

      <div className="mx-auto max-w-2xl">
        <BackButton href="/events" label="Events" />

        {message ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-white/70">{message}</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
            <p className="mb-3 text-xs uppercase tracking-wide text-white/40">
              {event?.category || "event"}
            </p>

            <h1 className="text-4xl font-bold">
              {event?.title || "Untitled Event"}
            </h1>

            <div className="mt-5 space-y-2 text-sm text-white/70">
              <p>📅 {event?.date || "Date TBD"}</p>
              <p>📍 {event?.location || "Location TBD"}</p>
              {event?.school && <p>🏫 {event.school}</p>}
            </div>

            <div className="mt-6">
              <h2 className="mb-2 text-lg font-semibold">Description</h2>
              <p className="leading-relaxed text-white/70">
                {event?.description || "No description provided."}
              </p>
            </div>

            <button
              onClick={() =>
                event && router.push(`/events/${event.id}/preferences`)
              }
              className="mt-8 w-full rounded-xl bg-white px-4 py-3 font-semibold text-black transition hover:scale-[1.02] active:scale-95"
            >
              Join / Set Preferences
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
