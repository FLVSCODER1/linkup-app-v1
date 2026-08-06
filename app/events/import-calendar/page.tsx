"use client";

import { useState } from "react";
import NavMenu from "../../components/layout/NavMenu";
import BackButton from "../../components/ui/BackButton";
import { getErrorMessage } from "../../lib/errors";
import { auth } from "../../lib/firebase";

export default function ImportCalendarPage() {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function requestCalendar() {
    try {
      const user = auth.currentUser;
      if (!user) {
        setMessage("Sign in before suggesting a calendar.");
        return;
      }

      setSubmitting(true);
      setMessage("");
      const token = await user.getIdToken();

      const response = await fetch("/api/calendar-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sourceUrl: url }),
      });

      const data = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        setMessage(data.error || "Submission failed.");
        return;
      }

      setUrl("");
      setMessage(data.message || "Calendar submitted for admin review.");
    } catch (error: unknown) {
      setMessage(getErrorMessage(error, "Submission failed."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <NavMenu />

      <div className="mx-auto max-w-2xl">
        <BackButton href="/events" label="Events" />
        <h1 className="mb-2 text-3xl font-bold">Suggest a school calendar</h1>

        <p className="mb-6 text-sm text-white/70">
          Paste an official ICS calendar URL. A LinkUp admin will preview and
          approve it before any events appear.
        </p>

        <input
          className="mb-4 w-full rounded-lg bg-white/10 p-3 outline-none"
          placeholder="https://school.edu/calendar.ics"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <button
          onClick={requestCalendar}
          disabled={submitting || !url.trim()}
          className="w-full rounded-lg bg-white p-3 font-semibold text-black disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit for review"}
        </button>

        {message && (
          <p className="mt-4 rounded-lg bg-white/10 p-3 text-sm text-white/80">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
