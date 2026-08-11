"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";

import EventForm from "../../components/events/EventForm";
import NavMenu from "../../components/layout/NavMenu";
import BackButton from "../../components/ui/BackButton";
import { hasVerifiedAccount } from "../../lib/auth/verification";
import { getErrorMessage } from "../../lib/errors";
import { auth, db } from "../../lib/firebase";
import { validateEventInput, type EventFormInput } from "../../lib/events/management";
import {
  compressEventCover,
  uploadEventCover,
} from "../../lib/events/cover-images";
import type { UserProfile } from "../../lib/events/types";

const emptyEvent: EventFormInput = {
  title: "",
  startTime: "",
  endTime: "",
  location: "",
  category: "study",
  description: "",
  capacity: "",
  rsvpDeadline: "",
  visibility: "school",
};

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function NewEventPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState(emptyEvent);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverRemoved, setCoverRemoved] = useState(false);

  useEffect(() => onAuthStateChanged(auth, async (user) => {
    if (!user) return router.replace("/");
    if (!(await hasVerifiedAccount(user, true))) return router.replace("/verify-email");
    const snapshot = await getDoc(doc(db, "users", user.uid));
    if (!snapshot.exists()) return router.replace("/profile/setup");
    const nextProfile = snapshot.data() as UserProfile;
    if (!nextProfile.district || !nextProfile.school) return router.replace("/profile/setup");
    setProfile(nextProfile);
  }), [router]);

  async function save(status: "draft" | "published") {
    const user = auth.currentUser;
    if (!user || !profile?.district || !profile.school) return setMessage("Your verified school profile is required.");
    const validation = validateEventInput(form);
    if (!validation.valid) return setMessage(validation.error);

    try {
      setSubmitting(true);
      setMessage("");
      const value = validation.value;
      const eventId = `${slugify(value.title)}-${Date.now()}`;
      const coverBlob = coverFile ? await compressEventCover(coverFile) : null;
      await setDoc(doc(db, "events", eventId), {
        title: value.title,
        description: value.description,
        location: value.location,
        category: value.category,
        district: profile.district,
        school: profile.school,
        visibility: value.visibility,
        status,
        createdBy: user.uid,
        hostName: profile.displayName || "Student host",
        source: "user-posted",
        imported: false,
        startTime: Timestamp.fromDate(value.startTime),
        endTime: value.endTime ? Timestamp.fromDate(value.endTime) : null,
        capacity: value.capacity,
        rsvpDeadline: value.rsvpDeadline ? Timestamp.fromDate(value.rsvpDeadline) : null,
        attendeeCount: 0,
        coverImageUrl: null,
        coverImagePublicId: null,
        moderationStatus: "pending",
        suppressionReason: null,
        relevanceScore: 0,
        aiCategory: null,
        reviewedAt: null,
        reviewedBy: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: status === "published" ? serverTimestamp() : null,
      });
      if (coverBlob) {
        try {
          await uploadEventCover(user, eventId, coverBlob);
        } catch (error) {
          await deleteDoc(doc(db, "events", eventId)).catch(() => undefined);
          throw error;
        }
      }
      router.push(`/events/${eventId}`);
    } catch (error: unknown) {
      setMessage(getErrorMessage(error, "Failed to save event."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-black p-6 pb-28 text-white">
      <NavMenu />
      <div className="mx-auto max-w-2xl">
        <BackButton href="/events" label="Events" />
        <h1 className="mb-2 text-3xl font-bold">Create an event</h1>
        <p className="mb-6 text-sm text-white/70">Organize something real for students at your school or district.</p>
        <EventForm
          value={form}
          onChange={setForm}
          onSubmit={save}
          submitting={submitting}
          message={message}
          coverFile={coverFile}
          coverRemoved={coverRemoved}
          onCoverFileChange={(file) => {
            setCoverFile(file);
            setCoverRemoved(false);
          }}
          onCoverRemove={() => {
            setCoverFile(null);
            setCoverRemoved(true);
          }}
        />
      </div>
    </main>
  );
}
