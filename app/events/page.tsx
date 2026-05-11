"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";

import { auth } from "../lib/firebase";
import NavMenu from "../components/NavMenu";
import EventCard from "../components/EventCard";

import { getUserProfile, getVisibleFeedEvents } from "../lib/events/queries";
import type { FeedEvent, UserProfile } from "../lib/events/types";

export default function EventsPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [events, setEvents] = useState<FeedEvent[]>([]);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setProfile(null);
      setEvents([]);
      setError(null);

      if (!currentUser) {
        router.push("/");
        return;
      }

      if (!currentUser.emailVerified) {
        router.push("/verify-email");
        return;
      }

      try {
        setLoadingProfile(true);

        const loadedProfile = await getUserProfile(currentUser.uid);

        if (!loadedProfile?.school && !loadedProfile?.district) {
          router.push("/profile/setup");
          return;
        }

        setProfile(loadedProfile);
      } catch (err) {
        console.error("Error loading profile:", err);
        setError("Could not load your profile.");
      } finally {
        setLoadingProfile(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    async function loadEvents() {
      if (!user || loadingProfile || !profile) return;

      try {
        setLoadingEvents(true);
        setError(null);

        const visibleEvents = await getVisibleFeedEvents(profile);
        setEvents(visibleEvents);
      } catch (err) {
        console.error("Error loading events:", err);
        setError(
          "Could not load events. Firestore may need a composite index, because databases apparently require paperwork."
        );
      } finally {
        setLoadingEvents(false);
      }
    }

    loadEvents();
  }, [user, profile, loadingProfile]);

  const loading = loadingProfile || loadingEvents;

  const subtitle = useMemo(() => {
    if (!profile?.district) {
      return "Finish your profile to see events near your school.";
    }

    if (profile.school) {
      return `Showing school and district events for ${profile.school}.`;
    }

    return `Showing district events for ${profile.district}.`;
  }, [profile]);

  return (
    <main className="min-h-screen bg-black p-6 pb-28 text-white">
      <NavMenu />

      <section className="mx-auto max-w-2xl">
        <header className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
            LinkUp
          </p>

          <h1 className="text-3xl font-bold">Events</h1>

          <p className="mt-2 text-sm text-white/70">{subtitle}</p>
        </header>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/5"
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">No upcoming events found</h2>

            <p className="mt-2 text-sm text-white/70">
              Imported calendars may be synced, but nothing relevant is ready for
              the feed yet. The temporary filter is also suppressing low-value
              calendar junk like practices, buses, lockers, and other thrilling
              achievements of institutional scheduling.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {events.map((event) => (
              <div key={event.id} className="relative">
                {event.imported || event.source === "ics" ? (
                  <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-semibold text-blue-200">
                    Imported
                  </div>
                ) : null}

                <EventCard
                  event={event}
                  isJoined={false}
                  attendeeCount={event.attendeeCount ?? 0}
                  onClick={() => router.push(`/events/${event.id}`)}
                  onJoinClick={() => router.push(`/event/${event.id}`)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <button
        type="button"
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
        type="button"
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