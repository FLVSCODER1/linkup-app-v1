"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import NavMenu from "../../components/NavMenu";

export default function MatchesPage() {
  const router = useRouter();
  const params = useParams();

  const eventId = params.eventId as string;

  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/");
        return;
      }

      const interestsSnap = await getDocs(collection(db, "interests"));
      const usersSnap = await getDocs(collection(db, "users"));

      const sentToIds = new Set<string>();
      const receivedFromIds = new Set<string>();

      interestsSnap.forEach((docSnap) => {
        const data = docSnap.data();

        if (data.eventId !== eventId) return;

        if (data.fromUserId === user.uid) {
          sentToIds.add(data.toUserId);
        }

        if (data.toUserId === user.uid) {
          receivedFromIds.add(data.fromUserId);
        }
      });

      const mutualIds = [...sentToIds].filter((id) =>
        receivedFromIds.has(id)
      );

      const matchedUsers: any[] = [];

      usersSnap.forEach((docSnap) => {
        if (mutualIds.includes(docSnap.id)) {
          matchedUsers.push({
            id: docSnap.id,
            ...docSnap.data(),
          });
        }
      });

      setMatches(matchedUsers);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, eventId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-white/70">Loading matches...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <NavMenu />

      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-3xl font-bold">
          Matches for {eventId.replace("-", " ")}
        </h1>

        <p className="mb-6 text-sm text-white/70">
          These are people where interest was mutual.
        </p>

        {matches.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-white/70">No matches yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {matches.map((match) => (
              <div
                key={match.id}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <h2 className="text-xl font-semibold">
                  {match.displayName || "Unnamed"}
                </h2>

                <p className="text-sm text-white/70">
                  Grade: {match.grade || "Unknown"}
                </p>

                <p className="mt-3 text-sm text-white/50">
                  Mutual interest confirmed.
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
