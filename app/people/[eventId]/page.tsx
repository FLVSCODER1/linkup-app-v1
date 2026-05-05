"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";

export default function PeoplePage() {
  const router = useRouter();
  const params = useParams();

  const eventId = params.eventId as string;

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/");
        return;
      }

      const querySnapshot = await getDocs(collection(db, "users"));
      const userList: any[] = [];

      querySnapshot.forEach((doc) => {
        userList.push({ id: doc.id, ...doc.data() });
      });

      setUsers(userList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div>
      <h1>People</h1>

      {/* ✅ BUTTON IS NOW LEGAL */}
      <button
        onClick={() => router.push(`/matches/${eventId}`)}
        className="mb-6 rounded-lg border border-white/10 px-4 py-2"
      >
        View matches
      </button>

      {loading ? (
        <p>Loading...</p>
      ) : (
        users.map((user) => <div key={user.id}>{user.email}</div>)
      )}
    </div>
  );
}