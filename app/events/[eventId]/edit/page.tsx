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
import {
  compressEventCover,
  deleteEventCover,
  uploadEventCover,
} from "../../../lib/events/cover-images";

export default function EditEventPage() {
  const router = useRouter();
  const { eventId } = useParams<{ eventId: string }>();
  const [form, setForm] = useState<EventFormInput | null>(null);
  const [publication, setPublication] = useState<{
    status: FeedEvent["status"];
    publishedAt: FeedEvent["publishedAt"];
  }>({ status: "draft", publishedAt: null });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverRemoved, setCoverRemoved] = useState(false);

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
      setPublication({
        status: event.status,
        publishedAt: event.publishedAt,
      });
      setCoverImageUrl(event.coverImageUrl || null);
      setForm({
        title: event.title || "",
        startTime: toDateTimeLocal(event.startTime),
        endTime: toDateTimeLocal(event.endTime),
        location: event.location || "",
        category: event.category || "other",
        description: event.description || "",
        capacity: event.capacity ? String(event.capacity) : "",
        rsvpDeadline: toDateTimeLocal(event.rsvpDeadline),
        visibility: event.visibility === "district" ? "district" : "school",
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
      const user = auth.currentUser;
      if (!user) throw new Error("Sign in again to update this event.");
      await updateDoc(doc(db, "events", eventId), {
          title: value.title,
          description: value.description,
          location: value.location,
          category: value.category,
          startTime: Timestamp.fromDate(value.startTime),
          endTime: value.endTime ? Timestamp.fromDate(value.endTime) : null,
          capacity: value.capacity,
          rsvpDeadline: value.rsvpDeadline
            ? Timestamp.fromDate(value.rsvpDeadline)
            : null,
          visibility: value.visibility,
          status,
          publishedAt:
            status === "published"
              ? publication.status === "published" && publication.publishedAt
                ? publication.publishedAt
                : serverTimestamp()
              : null,
          updatedAt: serverTimestamp(),
      });
      if (coverFile) {
        await uploadEventCover(user, eventId, await compressEventCover(coverFile));
      } else if (coverRemoved && coverImageUrl) {
        await deleteEventCover(user, eventId);
      }
      if (status === "draft") {
        router.replace(`/events/drafts?saved=${encodeURIComponent(eventId)}`);
      } else {
        router.push(`/events/${eventId}`);
      }
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
      const user = auth.currentUser;
      if (!user) throw new Error("Sign in again to delete this event.");
      if (coverImageUrl) {
        // The event must remain deletable during an external image-service
        // outage. A failed cleanup can leave one orphaned image, but it must
        // not trap the host's event in Firestore.
        await deleteEventCover(user, eventId).catch((error: unknown) => {
          console.warn("Event image cleanup failed:", error);
        });
      }
      await deleteDoc(doc(db, "events", eventId));
      router.replace("/events");
    } catch (error: unknown) {
      setMessage(getErrorMessage(error, "Failed to delete event."));
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-transparent px-4 py-6 pb-28 text-white sm:px-6 lg:px-10 lg:py-9">
      <NavMenu />
      <div className="mx-auto max-w-2xl">
        <BackButton href={`/events/${eventId}`} label="Event" />
        <h1 className="mb-6 text-3xl font-bold">Edit event</h1>
        {form && publication.status === "published" ? (
          <p className="mb-4 rounded-xl border border-blue-400/20 bg-blue-400/10 px-4 py-3 text-sm text-blue-100">
            This event is live. Updating it keeps it published in the feed.
          </p>
        ) : null}
        {form ? <EventForm
          value={form}
          onChange={setForm}
          onSubmit={save}
          submitting={submitting}
          message={message}
          submitLabel="Update event"
          showDraftAction={publication.status !== "published"}
          coverImageUrl={coverImageUrl}
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
        /> : <p className="text-white/70">{message || "Loading event..."}</p>}
        {form && <button type="button" disabled={submitting} onClick={remove} className="mt-4 w-full rounded-lg border border-red-500/30 px-4 py-3 font-semibold text-red-300 disabled:opacity-50">Delete event</button>}
      </div>
    </main>
  );
}
