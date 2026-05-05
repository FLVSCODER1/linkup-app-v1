"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import NavMenu from "../components/NavMenu";

export default function EventsPage() {
  const router = useRouter();

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/");
        return;
      }

      const userSnap = await getDoc(doc(db, "users", user.uid));

      if (!userSnap.exists()) {
        router.push("/profile");
        return;
      }

      const currentUser = userSnap.data();
      const eventsSnap = await getDocs(collection(db, "events"));

      const filteredEvents: any[] = [];

      eventsSnap.forEach((eventDoc) => {
        const data = eventDoc.data();

        if (data.school === currentUser.school) {
          filteredEvents.push({
            id: eventDoc.id,
            ...data,
          });
        }
      });

      setEvents(filteredEvents);
      setLoading(false);
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
    <main className="min-h-screen bg-black p-6 text-white">
      <NavMenu />

      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-3xl font-bold">Events</h1>

        <p className="mb-6 text-sm text-white/70">
          Find school events and choose how you want to attend.
        </p>

        {events.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-white/70">No events found yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {events.map((event) => (
              <div
                key={event.id}
                onClick={() => router.push(`/event/${event.id}`)}
                className="cursor-pointer rounded-xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
              >
                <p className="mb-2 text-xs uppercase tracking-wide text-white/40">
                  {event.category || "event"}
                </p>

                <h2 className="text-xl font-semibold">{event.title}</h2>

                <p className="mt-1 text-sm text-white/70">
                  {event.date || "Date TBD"}
                </p>

                <p className="text-sm text-white/50">
                  {event.location || "Location TBD"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}