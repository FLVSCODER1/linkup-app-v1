"use client";
import NavMenu from "../components/NavMenu";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";

export default function PeoplePage() {
  const router = useRouter();

  const [users, setUsers] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const eventId = "prom-2026";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/");
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        router.push("/profile");
        return;
      }

      const currentUserData = userSnap.data();
      const querySnapshot = await getDocs(collection(db, "users"));

      const filteredUsers: any[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();

        if (
          docSnap.id !== user.uid &&
          data.school === currentUserData.school &&
          data.profileComplete
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
  }, [router]);

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
        <h1 className="mb-2 text-3xl font-bold">People</h1>

        <p className="mb-6 text-sm text-white/70">
          People from your school who have completed their profile.
        </p>

        {message && (
          <p className="mb-4 rounded-lg bg-white/10 p-3 text-sm text-white/80">
            {message}
          </p>
        )}

        {users.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-white/70">No one found yet.</p>
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

                <p className="mt-1 text-sm text-white/70">
                  Grade: {user.grade || "Unknown"}
                </p>

                <p className="text-sm text-white/70">
                  Looking for: {user.lookingFor || "Not set"}
                </p>

                <p className="text-xs text-white/50">
                  Prom status: {user.promStatus || "Not set"}
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