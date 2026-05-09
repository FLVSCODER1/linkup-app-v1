"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import NavMenu from "../../components/NavMenu";
import EventCard from "../../components/EventCard";

export default function EventsPage() {
  const router = useRouter();

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinedEventIds, setJoinedEventIds] = useState<string[]>([]);
  const [attendeeCounts, setAttendeeCounts] = useState<Record<string, number>>(
    {}
  );

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

        const currentUser = userSnap.data();

        if (!currentUser.school) {
          router.push("/profile/setup");
          return;
        }

        const eventsQuery = query(
          collection(db, "events"),
          where("school", "==", currentUser.school)
        );

        const eventsSnap = await getDocs(eventsQuery);

        const schoolEvents = eventsSnap.docs.map((eventDoc) => ({
          id: eventDoc.id,
          ...eventDoc.data(),
        }));

        const joinedIds: string[] = [];
        const counts: Record<string, number> = {};

        for (const event of schoolEvents) {
          const attendeesSnap = await getDocs(
            collection(db, "events", event.id, "attendees")
          );

          counts[event.id] = attendeesSnap.size;

          const userIsAttending = attendeesSnap.docs.some(
            (attendee) => attendee.id === user.uid
          );

          if (userIsAttending) {
            joinedIds.push(event.id);
          }
        }

        setEvents(schoolEvents);
        setJoinedEventIds(joinedIds);
        setAttendeeCounts(counts);
      } catch (error) {
        console.error("Error loading events:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-white/70">Loading events...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black p-6 pb-28 text-white">
      <NavMenu />

      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold">Events</h1>

          <p className="text-sm text-white/70">
            Find school events and choose how you want to attend.
          </p>
        </div>

        {events.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-white/70">No events found yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isJoined={joinedEventIds.includes(event.id)}
                attendeeCount={attendeeCounts[event.id] || 0}
                onClick={() => router.push(`/events/${event.id}`)}
                onJoinClick={() => router.push(`/event/${event.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => router.push("/events/new")}
        className="
          fixed bottom-6 left-1/2 z-50 -translate-x-1/2
          rounded-full bg-white px-6 py-3 text-sm font-semibold
          text-black shadow-2xl transition hover:scale-105 active:scale-95
        "
      >
        + Post Event
      </button>

      <button
        onClick={() => router.push("/events/import-calendar")}
        className="
          fixed bottom-6 right-6 z-50 rounded-full border border-white/10
          bg-black/80 px-3 py-2 text-xs font-semibold text-white shadow-xl
          backdrop-blur transition hover:scale-105 hover:bg-white/10 active:scale-95
        "
      >
        Import
      </button>
    </main>
  );
}