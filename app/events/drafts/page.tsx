"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

import NavMenu from "../../components/layout/NavMenu";
import BackButton from "../../components/ui/BackButton";
import EventCoverImage from "../../components/events/EventCoverImage";
import { hasVerifiedAccount } from "../../lib/auth/verification";
import { getErrorMessage } from "../../lib/errors";
import { auth } from "../../lib/firebase";
import { getOwnedDraftEvents } from "../../lib/events/queries";
import type { FeedEvent } from "../../lib/events/types";

export default function EventDraftsPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setSaved(new URLSearchParams(window.location.search).has("saved"));

    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/");
        return;
      }

      if (!(await hasVerifiedAccount(user, true))) {
        router.replace("/verify-email");
        return;
      }

      try {
        setLoading(true);
        setError("");
        setDrafts(await getOwnedDraftEvents(user.uid));
      } catch (loadError: unknown) {
        setError(getErrorMessage(loadError, "We couldn't load your drafts."));
      } finally {
        setLoading(false);
      }
    });
  }, [reloadKey, router]);

  return (
    <main className="min-h-screen bg-black p-6 pb-28 text-white">
      <NavMenu />
      <section className="mx-auto max-w-2xl">
        <BackButton href="/events" label="Events" />
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
              Host workspace
            </p>
            <h1 className="text-3xl font-bold">Your drafts</h1>
            <p className="mt-2 text-sm text-white/65">
              Only you can view unpublished events here.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/events/new")}
            className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90 active:scale-95"
          >
            New event
          </button>
        </div>

        {saved ? (
          <p role="status" className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            Draft saved. It remains private until you publish it.
          </p>
        ) : null}

        {loading ? (
          <div className="grid gap-4">
            {[1, 2].map((item) => (
              <div key={item} className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-100">
            <h2 className="text-lg font-semibold">Drafts are unavailable</h2>
            <p className="mt-2 text-sm text-red-100/80">{error}</p>
            <button
              type="button"
              onClick={() => setReloadKey((current) => current + 1)}
              className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black active:scale-95"
            >
              Try again
            </button>
          </div>
        ) : drafts.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">No drafts yet</h2>
            <p className="mt-2 text-sm text-white/65">
              Save an unfinished event here and return to it when you&apos;re ready.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {drafts.map((draft) => (
              <article key={draft.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                {draft.coverImageUrl ? (
                  <EventCoverImage url={draft.coverImageUrl} className="mb-5 aspect-[16/9] w-full rounded-xl" />
                ) : null}
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">Private draft</p>
                <h2 className="mt-2 text-2xl font-semibold">{draft.title || "Untitled event"}</h2>
                <p className="mt-2 text-sm text-white/65">{draft.date || "Date TBD"}</p>
                <p className="text-sm text-white/50">{draft.location || "Location TBD"}</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => router.push(`/events/${draft.id}/edit`)}
                    className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black active:scale-95"
                  >
                    Continue editing
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(`/events/${draft.id}`)}
                    className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold active:scale-95"
                  >
                    Preview
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
