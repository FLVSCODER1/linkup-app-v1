"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import NavMenu from "../../components/layout/NavMenu";
import BackButton from "../../components/ui/BackButton";
import { getErrorMessage } from "../../lib/errors";
import { hasVerifiedAccount } from "../../lib/auth/verification";
import { canUserAccessEvent } from "../../lib/events/access";
import { ALLOW_HOST_RSVP_PREVIEW } from "../../lib/events/attendance";
import { formatEventDateRange } from "../../lib/events/date";
import type { FeedEvent, UserProfile } from "../../lib/events/types";

export default function EventDetailsPage() {
  const router = useRouter();
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;

  const [event, setEvent] = useState<FeedEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [duplicating, setDuplicating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);

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

        try {
          const savedSnapshot = await getDoc(
            doc(db, "users", user.uid, "savedEvents", eventId)
          );
          setSaved(savedSnapshot.exists());
        } catch {
          // Event details remain usable while updated saved-event rules deploy.
          setSaved(false);
        }
      } catch (error: unknown) {
        setMessage(getErrorMessage(error, "Failed to load event."));
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, eventId]);

  useEffect(() => {
    if (!currentUserId || event?.id !== eventId) return;

    return onSnapshot(doc(db, "events", eventId), (snapshot) => {
      if (!snapshot.exists()) return;
      setEvent({ id: snapshot.id, ...snapshot.data() });
    });
  }, [currentUserId, eventId, event?.id]);

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

  async function toggleSavedEvent() {
    if (!currentUserId || !event) return;

    try {
      setSavingEvent(true);
      setActionMessage("");
      const savedRef = doc(
        db,
        "users",
        currentUserId,
        "savedEvents",
        event.id
      );

      if (saved) {
        await deleteDoc(savedRef);
        setSaved(false);
        setActionMessage("Removed from saved events.");
      } else {
        await setDoc(savedRef, {
          uid: currentUserId,
          eventId: event.id,
          savedAt: serverTimestamp(),
        });
        setSaved(true);
        setActionMessage("Event saved.");
      }
    } catch (error: unknown) {
      setActionMessage(getErrorMessage(error, "Failed to update saved events."));
    } finally {
      setSavingEvent(false);
    }
  }

  async function shareEvent() {
    if (!event) return;

    try {
      const url = window.location.href;
      if (navigator.share) {
        await navigator.share({
          title: event.title || "LinkUp event",
          text: `Check out ${event.title || "this event"} on LinkUp.`,
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(url);
      setActionMessage("Event link copied.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setActionMessage("We couldn't share this event.");
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

            <button
              type="button"
              onClick={() => event && router.push(`/people/${event.id}`)}
              className="mt-6 text-sm font-semibold text-white/70 underline-offset-4 hover:text-white hover:underline"
            >
              {event?.attendeeCount ?? 0} attending
              {event?.capacity ? ` · ${event.capacity} spots total` : ""}
            </button>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={toggleSavedEvent}
                disabled={savingEvent}
                className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold disabled:opacity-50"
              >
                {savingEvent ? "Saving..." : saved ? "Saved ✓" : "Save event"}
              </button>
              <button
                type="button"
                onClick={shareEvent}
                className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold"
              >
                Share event
              </button>
            </div>

            {actionMessage ? (
              <p role="status" className="mt-3 text-sm text-white/60">
                {actionMessage}
              </p>
            ) : null}

            {event?.createdBy === currentUserId ? (
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <button onClick={() => router.push(`/events/${event.id}/edit`)} className="rounded-xl bg-white px-4 py-3 font-semibold text-black">Edit event</button>
                <button disabled={duplicating} onClick={duplicateEvent} className="rounded-xl border border-white/15 px-4 py-3 font-semibold text-white disabled:opacity-50">{duplicating ? "Duplicating..." : "Duplicate"}</button>
                {ALLOW_HOST_RSVP_PREVIEW && event.status === "published" ? (
                  <button
                    onClick={() => router.push(`/events/${event.id}/preferences`)}
                    className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 font-semibold text-amber-200 sm:col-span-2"
                  >
                    Preview RSVP flow (beta)
                  </button>
                ) : null}
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
