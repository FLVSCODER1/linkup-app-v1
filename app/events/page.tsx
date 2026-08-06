"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../lib/firebase";
import { fetchCurrentUserProfile } from "../lib/auth/profile-client";
import { hasVerifiedAccount } from "../lib/auth/verification";
import { TimeoutError, withTimeout } from "../lib/async/with-timeout";
import NavMenu from "../components/layout/NavMenu";
import EventCard from "../components/events/EventCard";

import { getVisibleFeedEvents } from "../lib/events/queries";
import type { FeedEvent, UserProfile } from "../lib/events/types";

export default function EventsPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [events, setEvents] = useState<FeedEvent[]>([]);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setProfile(null);
      setEvents([]);
      setError(null);
      setLoadingProfile(true);
      setLoadingEvents(false);

      try {
        if (!currentUser) {
          router.push("/");
          return;
        }

        if (!(await hasVerifiedAccount(currentUser, true))) {
          router.push("/verify-email");
          return;
        }

        const loadedProfile = await withTimeout(
          fetchCurrentUserProfile(currentUser),
          10_000,
          "Profile loading timed out."
        );

        if (!loadedProfile?.profileComplete || !loadedProfile.district) {
          router.push("/profile/setup");
          return;
        }

        setProfile({
          displayName: loadedProfile.displayName,
          bio: loadedProfile.bio,
          interests: loadedProfile.interests,
          district: loadedProfile.district,
          school: loadedProfile.school,
          schoolId: loadedProfile.schoolId,
          profileComplete: loadedProfile.profileComplete,
        });
      } catch (err) {
        console.error("Error loading profile:", err);
        setError("We couldn't load your profile. Please try again.");
      } finally {
        setLoadingProfile(false);
      }
    });

    return () => unsubscribe();
  }, [reloadKey, router]);

  useEffect(() => {
    async function loadEvents() {
      if (loadingProfile || !profile) return;

      try {
        setLoadingEvents(true);
        setError(null);

        const visibleEvents = await withTimeout(
          getVisibleFeedEvents(profile),
          10_000,
          "Events are taking longer than expected."
        );
        setEvents(visibleEvents);
      } catch (err) {
        console.error("Error loading events:", err);
        setError(
          err instanceof TimeoutError
            ? err.message
            : "We couldn't load events right now. Please try again."
        );
      } finally {
        setLoadingEvents(false);
      }
    }

    loadEvents();
  }, [profile, loadingProfile]);

  const loading = loadingProfile || loadingEvents;

  const subtitle = useMemo(() => {
    if (!profile?.district) {
      return loadingProfile
        ? "Loading events for your school..."
        : "Your school determines which events you can see.";
    }

    if (profile.school) {
      return `Showing school and district events for ${profile.school}.`;
    }

    return `Showing district events for ${profile.district}.`;
  }, [profile, loadingProfile]);

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

        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/5"
              />
            ))}
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-100"
          >
            <h2 className="text-lg font-semibold">Events are unavailable</h2>
            <p className="mt-2 text-sm text-red-100/80">{error}</p>
            <button
              type="button"
              onClick={() => setReloadKey((current) => current + 1)}
              className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90 active:scale-95"
            >
              Try again
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">
              No upcoming events at {profile?.school || profile?.district}
            </h2>

            <p className="mt-2 text-sm text-white/70">
              Nothing relevant is scheduled right now. Check back later or create
              an event for your school community.
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
                  onJoinClick={() =>
                    router.push(`/events/${event.id}/preferences`)
                  }
                />
              </div>
            ))}
          </div>
        )}
      </section>

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
