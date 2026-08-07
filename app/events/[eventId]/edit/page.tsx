"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { deleteDoc, doc, getDoc, serverTimestamp, Timestamp, updateDoc } from "firebase/firestore";

import EventForm from "../../../components/events/EventForm";
import NavMenu from "../../../components/layout/NavMenu";
import BackButton from "../../../components/ui/BackButton";
import { hasVerifiedAccount } from "../../../lib/auth/verification";
import { getErrorMessage } from "../../../lib/errors";
import { auth, db } from "../../../lib/firebase";
import { toDateTimeLocal, validateEventInput, type EventFormInput } from "../../../lib/events/management";
import type { FeedEvent } from "../../../lib/events/types";

export default function EditEventPage() {
  const router = useRouter();
  const { eventId } = useParams<{ eventId: string }>();
  const [form, setForm] = useState<EventFormInput | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => onAuthStateChanged(auth, async (user) => {
    if (!user) return router.replace("/");
    if (!(await hasVerifiedAccount(user, true))) return router.replace("/verify-email");
    try {
      const snapshot = await getDoc(doc(db, "events", eventId));
      if (!snapshot.exists() || snapshot.data().createdBy !== user.uid) {
        setMessage("Only the event host can edit this event.");
        return;
      }
      const event = { id: snapshot.id, ...snapshot.data() } as FeedEvent;
      setForm({
        title: event.title || "",
        startTime: toDateTimeLocal(event.startTime),
        endTime: toDateTimeLocal(event.endTime),
        location: event.location || "",
        category: event.category || "other",
        description: event.description || "",
        capacity: event.capacity ? String(event.capacity) : "",
        rsvpDeadline: toDateTimeLocal(event.rsvpDeadline),
      });
    } catch (error: unknown) {
      setMessage(getErrorMessage(error, "Failed to load event."));
    }
  }), [eventId, router]);

  async function save(status: "draft" | "published") {
    if (!form) return;
    const validation = validateEventInput(form);
    if (!validation.valid) return setMessage(validation.error);
    try {
      setSubmitting(true);
      const value = validation.value;
      await updateDoc(doc(db, "events", eventId), {
        title: value.title,
        description: value.description,
        location: value.location,
        category: value.category,
        startTime: Timestamp.fromDate(value.startTime),
        endTime: value.endTime ? Timestamp.fromDate(value.endTime) : null,
        capacity: value.capacity,
        rsvpDeadline: value.rsvpDeadline ? Timestamp.fromDate(value.rsvpDeadline) : null,
        status,
        publishedAt: status === "published" ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      });
      router.push(`/events/${eventId}`);
    } catch (error: unknown) {
      setMessage(getErrorMessage(error, "Failed to update event."));
    } finally {
      setSubmitting(false);
    }
  }

  async function remove() {
    if (!window.confirm("Delete this event permanently?")) return;
    try {
      setSubmitting(true);
      await deleteDoc(doc(db, "events", eventId));
      router.replace("/events");
    } catch (error: unknown) {
      setMessage(getErrorMessage(error, "Failed to delete event."));
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-black p-6 pb-28 text-white">
      <NavMenu />
      <div className="mx-auto max-w-2xl">
        <BackButton href={`/events/${eventId}`} label="Event" />
        <h1 className="mb-6 text-3xl font-bold">Edit event</h1>
        {form ? <EventForm value={form} onChange={setForm} onSubmit={save} submitting={submitting} message={message} submitLabel="Update event" /> : <p className="text-white/70">{message || "Loading event..."}</p>}
        {form && <button type="button" disabled={submitting} onClick={remove} className="mt-4 w-full rounded-lg border border-red-500/30 px-4 py-3 font-semibold text-red-300 disabled:opacity-50">Delete event</button>}
      </div>
    </main>
  );
}
