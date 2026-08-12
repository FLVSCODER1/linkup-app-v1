"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import BackButton from "../../../components/ui/BackButton";
import NavMenu from "../../../components/layout/NavMenu";
import { auth, db } from "../../../lib/firebase";
import { getErrorMessage } from "../../../lib/errors";
import { hasVerifiedAccount } from "../../../lib/auth/verification";
import { canUserAccessEvent } from "../../../lib/events/access";
import type { FeedEvent, UserProfile } from "../../../lib/events/types";
import type { EventPreferenceDocument } from "../../../lib/firestore/types";

type AttendanceStatus = EventPreferenceDocument["attendanceStatus"];
type ConnectionGoal = EventPreferenceDocument["connectionGoal"];

export default function EventPreferencesPage() {
  const router = useRouter();
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;

  const [event, setEvent] = useState<FeedEvent | null>(null);
  const [attendanceStatus, setAttendanceStatus] =
    useState<AttendanceStatus>("going");
  const [connectionGoal, setConnectionGoal] =
    useState<ConnectionGoal>("friends");
  const [currentUserData, setCurrentUserData] = useState<UserProfile | null>(null);
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          router.replace("/");
          return;
        }

        if (!(await hasVerifiedAccount(user, true))) {
          router.replace("/verify-email");
          return;
        }

        setCurrentUid(user.uid);

        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (!userSnap.exists()) {
          router.replace("/profile/setup");
          return;
        }

        const userData = userSnap.data() as UserProfile;
        setCurrentUserData(userData);

        const eventSnap = await getDoc(doc(db, "events", eventId));
        if (!eventSnap.exists()) {
          setMessage("Event not found.");
          return;
        }

        const eventData: FeedEvent = { id: eventSnap.id, ...eventSnap.data() };
        if (!canUserAccessEvent(eventData, userData)) {
          setMessage("You do not have access to this event.");
          return;
        }

        setEvent(eventData);

        const prefSnap = await getDoc(
          doc(db, "eventPreferences", `${user.uid}_${eventId}`)
        );

        if (prefSnap.exists()) {
          const preference = prefSnap.data() as Partial<EventPreferenceDocument>;
          const legacyAttendance = preference.promStatus;
          const legacyGoal = preference.lookingFor;

          if (
            preference.attendanceStatus === "going" ||
            preference.attendanceStatus === "maybe" ||
            preference.attendanceStatus === "not-going"
          ) {
            setAttendanceStatus(preference.attendanceStatus);
          } else if (
            legacyAttendance === "going" ||
            legacyAttendance === "maybe" ||
            legacyAttendance === "not-going"
          ) {
            setAttendanceStatus(legacyAttendance);
          }

          if (
            preference.connectionGoal === "friends" ||
            preference.connectionGoal === "group" ||
            preference.connectionGoal === "browsing"
          ) {
            setConnectionGoal(preference.connectionGoal);
          } else if (legacyGoal === "friends" || legacyGoal === "browsing") {
            setConnectionGoal(legacyGoal);
          }
        }
      } catch (error: unknown) {
        setMessage(getErrorMessage(error, "Failed to load event preferences."));
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [router, eventId]);

  async function savePreferences() {
    if (!currentUid || !currentUserData || !event) return;

    setSaving(true);
    setMessage("");

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("You must be logged in.");

      const token = await user.getIdToken(true);
      const response = await fetch(`/api/events/${eventId}/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ attendanceStatus, connectionGoal }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Failed to save RSVP.");
      }

      if (attendanceStatus === "not-going") {
        router.push(`/events/${eventId}`);
        return;
      }

      router.push(
        connectionGoal === "browsing"
          ? `/events/${eventId}`
          : `/people/${eventId}`
      );
    } catch (error: unknown) {
      setMessage(getErrorMessage(error, "Failed to save preferences."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-transparent text-white">
        <p className="text-white/70">Loading event...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent px-4 py-6 pb-28 text-white sm:px-6 lg:px-10 lg:py-9">
      <NavMenu />

      <div className="mx-auto max-w-md">
        <BackButton href={`/events/${eventId}`} label="Event details" />

        <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-2xl">
          {message && !event ? (
            <p className="text-sm text-red-400">{message}</p>
          ) : (
            <>
              <h1 className="text-3xl font-bold">{event?.title || "Event"}</h1>
              <p className="mt-3 text-sm text-white/60">
                Set your RSVP and optionally meet students attending the same
                activity.
              </p>

              <label
                htmlFor="attendanceStatus"
                className="mb-2 mt-8 block text-sm text-white/70"
              >
                Are you going?
              </label>
              <select
                id="attendanceStatus"
                value={attendanceStatus}
                onChange={(changeEvent) =>
                  setAttendanceStatus(changeEvent.target.value as AttendanceStatus)
                }
                className="w-full rounded-lg bg-white/10 p-3 text-white outline-none"
              >
                <option value="going">Going</option>
                <option value="maybe">Maybe</option>
                <option value="not-going">Not going</option>
              </select>

              <label
                htmlFor="connectionGoal"
                className="mb-2 mt-5 block text-sm text-white/70"
              >
                Want to connect with people attending?
              </label>
              <select
                id="connectionGoal"
                value={connectionGoal}
                onChange={(changeEvent) =>
                  setConnectionGoal(changeEvent.target.value as ConnectionGoal)
                }
                className="w-full rounded-lg bg-white/10 p-3 text-white outline-none"
              >
                <option value="friends">Find friends</option>
                <option value="group">Find a group</option>
                <option value="browsing">No, just RSVP</option>
              </select>

              {message && <p className="mt-4 text-sm text-red-400">{message}</p>}

              <button
                type="button"
                onClick={savePreferences}
                disabled={saving}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#335cff] to-[#746ff7] p-3 font-semibold text-white shadow-[0_10px_28px_rgba(51,92,255,0.25)] transition hover:brightness-110 active:scale-95 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save RSVP"}
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
