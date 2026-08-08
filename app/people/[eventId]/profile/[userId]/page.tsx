"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";

import BackButton from "../../../../components/ui/BackButton";
import NavMenu from "../../../../components/layout/NavMenu";
import { hasVerifiedAccount } from "../../../../lib/auth/verification";
import { getErrorMessage } from "../../../../lib/errors";
import { auth, db } from "../../../../lib/firebase";
import type { UserProfileDocument } from "../../../../lib/firestore/types";

export default function AttendeeProfilePage() {
  const router = useRouter();
  const params = useParams<{ eventId: string; userId: string }>();
  const [profile, setProfile] = useState<UserProfileDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) return router.replace("/");
        if (!(await hasVerifiedAccount(user, true))) {
          return router.replace("/verify-email");
        }

        const snapshot = await getDoc(doc(db, "users", params.userId));
        if (!snapshot.exists()) {
          setMessage("This profile is unavailable.");
          return;
        }

        setProfile(snapshot.data() as UserProfileDocument);
      } catch (error: unknown) {
        setMessage(getErrorMessage(error, "We couldn't load this profile."));
      } finally {
        setLoading(false);
      }
    });
  }, [params.userId, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-white/70">Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black p-6 pb-28 text-white">
      <NavMenu />
      <section className="mx-auto max-w-lg">
        <BackButton href={`/people/${params.eventId}`} label="People attending" />

        {message || !profile ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/70">
            {message || "This profile is unavailable."}
          </div>
        ) : (
          <article className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
              {profile.school || "LinkUp student"}
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              {profile.displayName || profile.firstName || "Student"}
            </h1>
            <p className="mt-1 text-sm text-white/60">Grade {profile.grade}</p>

            <h2 className="mt-7 text-sm font-semibold uppercase tracking-wide text-white/40">
              Bio
            </h2>
            <p className="mt-2 leading-relaxed text-white/80">
              {profile.bio || "No bio yet."}
            </p>

            <h2 className="mt-7 text-sm font-semibold uppercase tracking-wide text-white/40">
              Interests
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(profile.interests ?? []).length > 0 ? (
                (profile.interests ?? []).map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm"
                  >
                    {interest}
                  </span>
                ))
              ) : (
                <p className="text-sm text-white/60">No interests listed.</p>
              )}
            </div>
          </article>
        )}
      </section>
    </main>
  );
}
