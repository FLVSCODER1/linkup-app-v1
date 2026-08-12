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
  query,
  setDoc,
  where,
} from "firebase/firestore";
import NavMenu from "../../components/layout/NavMenu";
import BackButton from "../../components/ui/BackButton";
import { getErrorMessage } from "../../lib/errors";
import { hasVerifiedAccount } from "../../lib/auth/verification";
import type {
  EventPreferenceDocument,
  UserProfileDocument,
} from "../../lib/firestore/types";

type AppUser = {
  id: string;
  bio?: string;
  displayName?: string;
  grade?: string;
  school?: string | null;
  profileComplete?: boolean;
  attendanceStatus?: string;
  connectionGoal?: string;
};

export default function PeoplePage() {
  const router = useRouter();
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;

  const [users, setUsers] = useState<AppUser[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          router.push("/");
          return;
        }

        if (!(await hasVerifiedAccount(firebaseUser, true))) {
          router.push("/verify-email");
          return;
        }

        const currentUserSnap = await getDoc(
          doc(db, "users", firebaseUser.uid)
        );

        if (!currentUserSnap.exists()) {
          router.push("/profile/setup");
          return;
        }

        const currentUser = currentUserSnap.data() as UserProfileDocument;

        const currentPrefSnap = await getDoc(
          doc(db, "eventPreferences", `${firebaseUser.uid}_${eventId}`)
        );

        if (!currentPrefSnap.exists()) {
          router.push(`/events/${eventId}/preferences`);
          return;
        }

        const currentPref =
          currentPrefSnap.data() as Partial<EventPreferenceDocument>;
        const currentAttendance =
          currentPref.attendanceStatus ?? currentPref.promStatus;
        const currentGoal = currentPref.connectionGoal ?? currentPref.lookingFor;

        if (
          currentAttendance === "not-going" ||
          currentGoal === "browsing"
        ) {
          setUsers([]);
          setMessage("You are not currently looking for people at this event.");
          setLoading(false);
          return;
        }

        const prefsSnap = await getDocs(
          query(
            collection(db, "eventPreferences"),
            where("eventId", "==", eventId),
            where("school", "==", currentUser.school)
          )
        );

        const usersQuery = currentUser.school
          ? query(
              collection(db, "users"),
              where("school", "==", currentUser.school)
            )
          : query(
              collection(db, "users"),
              where("district", "==", currentUser.district)
            );

        const usersSnap = await getDocs(usersQuery);

        const eligiblePrefs = new Map<
          string,
          { attendanceStatus: string; connectionGoal: string }
        >();

        prefsSnap.forEach((prefDoc) => {
          const pref = prefDoc.data() as Partial<EventPreferenceDocument>;
          const attendanceStatus = pref.attendanceStatus ?? pref.promStatus;
          const connectionGoal = pref.connectionGoal ?? pref.lookingFor;

          if (
            pref.userId !== firebaseUser.uid &&
            (attendanceStatus === "going" || attendanceStatus === "maybe") &&
            connectionGoal !== "browsing"
          ) {
            if (pref.userId) {
              eligiblePrefs.set(pref.userId, {
                attendanceStatus,
                connectionGoal: connectionGoal ?? "friends",
              });
            }
          }
        });

        const filteredUsers: AppUser[] = [];

        usersSnap.forEach((userDoc) => {
          const userData = userDoc.data() as Partial<UserProfileDocument>;
          const pref = eligiblePrefs.get(userDoc.id);

          if (pref && userData.profileComplete) {
            filteredUsers.push({
              id: userDoc.id,
              displayName: userData.displayName,
              grade: userData.grade,
              school: userData.school,
              bio: userData.bio,
              profileComplete: userData.profileComplete,
              attendanceStatus: pref.attendanceStatus,
              connectionGoal: pref.connectionGoal,
            });
          }
        });

        setUsers(filteredUsers);
      } catch (error: unknown) {
        setMessage(getErrorMessage(error, "Failed to load people."));
      } finally {
        setLoading(false);
      }
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
    } catch (error: unknown) {
      setMessage(getErrorMessage(error, "Failed to save interest."));
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-transparent text-white">
        <p className="text-white/70">Loading people...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent px-4 py-6 pb-28 text-white sm:px-6 lg:px-10 lg:py-9">
      <NavMenu />

      <div className="mx-auto max-w-2xl">
        <BackButton href={`/events/${eventId}`} label="Event details" />

        <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">
          People for {eventId.replaceAll("-", " ")}
        </h1>

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
                className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-xl transition hover:border-white/20"
              >
                <h2 className="text-xl font-semibold">
                  {user.displayName || "Unnamed"}
                </h2>

                <p className="text-sm text-white/70">
                  Grade: {user.grade || "Unknown"}
                </p>

                <p className="text-sm text-white/50">
                  RSVP: {user.attendanceStatus} • Connect: {user.connectionGoal}
                </p>

                <p className="mt-3 text-sm text-white/70">
                  {user.bio || "No bio yet."}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      router.push(`/people/${eventId}/profile/${user.id}`)
                    }
                    className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white"
                  >
                    View profile
                  </button>
                  <button
                    onClick={() => sendInterest(user.id)}
                    className="rounded-lg bg-gradient-to-r from-[#335cff] to-[#746ff7] px-4 py-2 text-sm font-semibold text-white shadow-lg"
                  >
                    Interested
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
