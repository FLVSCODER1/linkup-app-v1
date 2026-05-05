"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import NavMenu from "../../components/NavMenu";

<button
  onClick={() => router.push(`/matches/${eventId}`)}
  className="mb-6 rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
>
  View matches
</button>

export default function PeoplePage() {
  const router = useRouter();
  const params = useParams();

  const eventId = params.eventId as string;

  const [users, setUsers] = useState<any[]>([]);
  const [message, setMessage] = useState("");
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

      const prefsSnap = await getDocs(collection(db, "eventPreferences"));
      const usersSnap = await getDocs(collection(db, "users"));

      const validUserIds: string[] = [];

      prefsSnap.forEach((docSnap) => {
        const data = docSnap.data();

        if (data.eventId === eventId) {
          validUserIds.push(data.userId);
        }
      });

      const filteredUsers: any[] = [];

      usersSnap.forEach((docSnap) => {
        const data = docSnap.data();

        if (
          docSnap.id !== user.uid &&
          data.school === currentUser.school &&
          validUserIds.includes(docSnap.id)
        ) {
          filteredUsers.push({
            id: docSnap.id,
            ...data,
          });
        }
      });

      setUsers(filteredUsers);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, eventId]);

  async function sendInterest(toUserId: string) {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setMessage("You must be logged in.");
        return;
      }

      const interestId = `${eventId}_${currentUser.uid}_${toUserId}`;

      await setDoc(doc(db, "interests", interestId), {
        fromUserId: currentUser.uid,
        toUserId,
        eventId,
        createdAt: new Date(),
      });

      setMessage("Interest saved privately.");
    } catch (error: any) {
      setMessage(error.message);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-white/70">Loading people...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <NavMenu />

      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-3xl font-bold">
          People for {eventId.replace("-", " ")}
        </h1>

        {message && (
          <p className="mb-4 rounded-lg bg-white/10 p-3 text-sm text-white/80">
            {message}
          </p>
        )}

        {users.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-white/70">No one here yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <h2 className="text-xl font-semibold">
                  {user.displayName || "Unnamed"}
                </h2>

                <p className="text-sm text-white/70">
                  Grade: {user.grade || "Unknown"}
                </p>

                <button
                  onClick={() => sendInterest(user.id)}
                  className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black"
                >
                  Interested
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
