"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import NavMenu from "../../components/layout/NavMenu";
import BackButton from "../../components/ui/BackButton";
import { getErrorMessage } from "../../lib/errors";
import { hasVerifiedAccount } from "../../lib/auth/verification";
import type { UserProfile } from "../../lib/events/types";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function NewEventPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("study");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/");
        return;
      }

      if (!(await hasVerifiedAccount(user, true))) {
        router.replace("/verify-email");
        return;
      }

      const snap = await getDoc(doc(db, "users", user.uid));

      if (!snap.exists()) {
        router.push("/profile/setup");
        return;
      }

      const profileData = snap.data() as UserProfile;
      if (!profileData.district) {
        router.replace("/profile/setup");
        return;
      }

      setProfile(profileData);
    });

    return () => unsubscribe();
  }, [router]);

  async function createEvent() {
    try {
      const user = auth.currentUser;

      if (!user) {
        setMessage("You must be logged in.");
        return;
      }

      if (!title.trim() || !date.trim() || !profile?.district) {
        setMessage("Title and date are required.");
        return;
      }

      const startTime = new Date(date);
      if (Number.isNaN(startTime.getTime())) {
        setMessage("Choose a valid date and time.");
        return;
      }

      const eventId = `${slugify(title)}-${Date.now()}`;

      await setDoc(doc(db, "events", eventId), {
        title: title.trim(),
        date: date.trim(),
        location: location.trim() || "TBD",
        category,
        description: description.trim(),
        district: profile.district,
        school: profile.school ?? null,
        visibility: profile.school ? "school" : "district",
        status: "published",
        createdBy: user.uid,
        source: "user-posted",
        imported: false,
        startTime: Timestamp.fromDate(startTime),
        endTime: null,
        attendeeCount: 0,
        moderationStatus: "pending",
        suppressionReason: null,
        relevanceScore: 0,
        aiCategory: null,
        reviewedAt: null,
        reviewedBy: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: serverTimestamp(),
      });

      router.push("/events");
    } catch (error: unknown) {
      setMessage(getErrorMessage(error, "Failed to create event."));
    }
  }

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <NavMenu />

      <div className="mx-auto max-w-2xl">
        <BackButton href="/events" label="Events" />
        <h1 className="mb-2 text-3xl font-bold">Post an Event</h1>
        <p className="mb-6 text-sm text-white/70">
          Create a study group, party, game meetup, or school event.
        </p>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <input
            className="mb-3 w-full rounded-lg bg-white/10 p-3 outline-none"
            placeholder="Event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            className="mb-3 w-full rounded-lg bg-white/10 p-3 outline-none"
            aria-label="Event date and time"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <input
            className="mb-3 w-full rounded-lg bg-white/10 p-3 outline-none"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <select
            className="mb-3 w-full rounded-lg bg-white/10 p-3 outline-none"
            title="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="study">Study group</option>
            <option value="party">Party</option>
            <option value="athletics">Athletics</option>
            <option value="club">Club</option>
            <option value="dance">Dance</option>
            <option value="other">Other</option>
          </select>

          <textarea
            className="mb-4 min-h-28 w-full rounded-lg bg-white/10 p-3 outline-none"
            placeholder="Description"
            value={description}
            maxLength={500}
            onChange={(e) => setDescription(e.target.value)}
          />

          <button
            onClick={createEvent}
            className="w-full rounded-lg bg-white p-3 font-semibold text-black"
          >
            Post event
          </button>

          {message && <p className="mt-4 text-sm text-white/70">{message}</p>}
        </div>
      </div>
    </main>
  );
}
