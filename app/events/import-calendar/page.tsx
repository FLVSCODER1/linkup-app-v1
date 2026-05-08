"use client";

import { useState } from "react";
import NavMenu from "../../components/NavMenu";

export default function ImportCalendarPage() {
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  async function importCalendar() {
    try {
      setMessage("Importing calendar...");

      const response = await fetch("/api/import-ics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Import failed.");
        return;
      }

      setEvents(data.events || []);
      setMessage(`Found ${data.events.length} events.`);
    } catch (error: any) {
      setMessage(error.message);
    }
  }

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <NavMenu />

      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-3xl font-bold">Import Calendar Feed</h1>

        <p className="mb-6 text-sm text-white/70">
          Paste an ICS calendar feed URL from a school calendar.
        </p>

        <input
          className="mb-4 w-full rounded-lg bg-white/10 p-3 outline-none"
          placeholder="https://school.edu/calendar.ics"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <button
          onClick={importCalendar}
          className="w-full rounded-lg bg-white p-3 font-semibold text-black"
        >
          Import calendar
        </button>

        {message && (
          <p className="mt-4 rounded-lg bg-white/10 p-3 text-sm text-white/80">
            {message}
          </p>
        )}

        <div className="mt-6 grid gap-4">
          {events.map((event, index) => (
            <div
              key={index}
              className="rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <h2 className="text-xl font-semibold">{event.title}</h2>
              <p className="text-sm text-white/70">{event.date}</p>
              <p className="text-sm text-white/50">{event.location}</p>

              {event.description && (
                <p className="mt-3 text-sm text-white/70">
                  {event.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}