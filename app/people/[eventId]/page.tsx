"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
} from "firebase/firestore";
import NavMenu from "../../components/NavMenu";

type AppUser = {
  id: string;
  bio?: string;
  displayName?: string;
  grade?: string;
  school?: string;
  profileComplete?: boolean;
  eventPromStatus?: string;
  eventLookingFor?: string;
};

export default function PeoplePage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [users, setUsers] = useState<AppUser[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/");
        return;
      }

      const currentUserSnap = await getDoc(
        doc(db, "users", firebaseUser.uid)
      );

      if (!currentUserSnap.exists()) {
        router.push("/profile");
        return;
      }

      const currentUser = currentUserSnap.data();

      const currentPrefSnap = await getDoc(
        doc(db, "eventPreferences", `${firebaseUser.uid}_${eventId}`)
      );

      if (!currentPrefSnap.exists()) {
        router.push(`/event/${eventId}`);
        return;
      }

      const currentPref = currentPrefSnap.data();

      if (
        currentPref.promStatus === "not-going" ||
        currentPref.lookingFor === "browsing"
      ) {
        setUsers([]);
        setMessage("You are not currently matching for this event.");
        setLoading(false);
        return;
      }

      const prefsSnap = await getDocs(collection(db, "eventPreferences"));
      const usersSnap = await getDocs(
       query(
         collection(db, "users"),
         where("school", "==", currentUser.school)
        )
     );

      const eligiblePrefs = new Map<
        string,
        { promStatus: string; lookingFor: string }
      >();

      prefsSnap.forEach((prefDoc) => {
        const pref = prefDoc.data();

        if (
          pref.eventId === eventId &&
          pref.userId !== firebaseUser.uid &&
          (pref.promStatus === "going" || pref.promStatus === "maybe") &&
          pref.lookingFor !== "browsing"
        ) {
          eligiblePrefs.set(pref.userId, {
            promStatus: pref.promStatus,
            lookingFor: pref.lookingFor,
          });
        }
      });

      const filteredUsers: AppUser[] = [];

      usersSnap.forEach((userDoc) => {
        const userData = userDoc.data();
        const pref = eligiblePrefs.get(userDoc.id);

        if (
          pref &&
          userData.profileComplete
        ) {
          filteredUsers.push({
            id: userDoc.id,
            displayName: userData.displayName,
            grade: userData.grade,
            school: userData.school,
            profileComplete: userData.profileComplete,
            eventPromStatus: pref.promStatus,
            eventLookingFor: pref.lookingFor,
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
          People for {eventId.replaceAll("-", " ")}
        </h1>

        <button
          onClick={() => router.push(`/matches/${eventId}`)}
          className="mb-6 rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
        >
          View matches
        </button>

        {message && (
          <p className="mb-4 rounded-lg bg-white/10 p-3 text-sm text-white/80">
            {message}
          </p>
        )}

        {users.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-white/70">No eligible people here yet.</p>
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

                <p className="text-sm text-white/50">
                  Status: {user.eventPromStatus} • Looking for:{" "}
                  {user.eventLookingFor}
                </p>

                <button
                  onClick={() => sendInterest(user.id)}
                  className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black"
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