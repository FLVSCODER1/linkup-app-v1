"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import NavMenu from "../../components/layout/NavMenu";
import BackButton from "../../components/ui/BackButton";
import { getErrorMessage } from "../../lib/errors";
import { hasVerifiedAccount } from "../../lib/auth/verification";
import { canUserAccessEvent } from "../../lib/events/access";
import { formatEventDateRange } from "../../lib/events/date";
import type { FeedEvent, UserProfile } from "../../lib/events/types";

export default function EventDetailsPage() {
  const router = useRouter();
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;

  const [event, setEvent] = useState<FeedEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [duplicating, setDuplicating] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          router.push("/");
          return;
        }

        if (!(await hasVerifiedAccount(user, true))) {
          router.push("/verify-email");
          return;
        }

        setCurrentUserId(user.uid);

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

  async function duplicateEvent() {
    const user = auth.currentUser;
    if (!user || !event || event.createdBy !== user.uid) return;
    try {
      setDuplicating(true);
      const duplicateId = `${event.id}-copy-${Date.now()}`;
      const { id: _id, ...eventData } = event;
      void _id;
      await setDoc(doc(db, "events", duplicateId), {
        ...eventData,
        title: `Copy of ${event.title || "Untitled Event"}`.slice(0, 100),
        status: "draft",
        attendeeCount: 0,
        createdBy: user.uid,
        source: "user-posted",
        imported: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: null,
      });
      router.push(`/events/${duplicateId}/edit`);
    } catch (error: unknown) {
      setMessage(getErrorMessage(error, "Failed to duplicate event."));
      setDuplicating(false);
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

      <div className="mx-auto max-w-2xl">
        <BackButton href="/events" label="Events" />

        {message ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-white/70">{message}</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
            <p className="mb-3 text-xs uppercase tracking-wide text-white/40">
              {event?.category || "event"}{event?.status === "draft" ? " · draft" : ""}
            </p>

            <h1 className="text-4xl font-bold">
              {event?.title || "Untitled Event"}
            </h1>

            <div className="mt-5 space-y-2 text-sm text-white/70">
              <p>📅 {event ? formatEventDateRange(event.startTime, event.endTime) : "Date TBD"}</p>
              <p>📍 {event?.location || "Location TBD"}</p>
              {event?.school && <p>🏫 {event.school}</p>}
              <p>Hosted by {event?.hostName || "a LinkUp student"}</p>
              {event?.capacity ? <p>Capacity: {event.capacity}</p> : null}
              {event?.rsvpDeadline ? <p>RSVP by {formatEventDateRange(event.rsvpDeadline, null)}</p> : null}
            </div>

            <div className="mt-6">
              <h2 className="mb-2 text-lg font-semibold">Description</h2>
              <p className="leading-relaxed text-white/70">
                {event?.description || "No description provided."}
              </p>
            </div>

            {event?.createdBy === currentUserId ? (
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <button onClick={() => router.push(`/events/${event.id}/edit`)} className="rounded-xl bg-white px-4 py-3 font-semibold text-black">Edit event</button>
                <button disabled={duplicating} onClick={duplicateEvent} className="rounded-xl border border-white/15 px-4 py-3 font-semibold text-white disabled:opacity-50">{duplicating ? "Duplicating..." : "Duplicate"}</button>
              </div>
            ) : (
              <button
                onClick={() => event && router.push(`/events/${event.id}/preferences`)}
                className="mt-8 w-full rounded-xl bg-white px-4 py-3 font-semibold text-black transition hover:scale-[1.02] active:scale-95"
              >
                Join / Set Preferences
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
