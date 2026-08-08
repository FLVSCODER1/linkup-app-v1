"use client";

import { EVENT_CATEGORIES, type EventFormInput } from "../../lib/events/management";

interface EventFormProps {
  value: EventFormInput;
  onChange: (value: EventFormInput) => void;
  onSubmit: (status: "draft" | "published") => void;
  submitting: boolean;
  message: string;
  submitLabel?: string;
}

export default function EventForm({
  value,
  onChange,
  onSubmit,
  submitting,
  message,
  submitLabel = "Publish event",
}: EventFormProps) {
  function update(field: keyof EventFormInput, nextValue: string) {
    onChange({ ...value, [field]: nextValue });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <label className="mb-3 block text-sm text-white/70">
        Title
        <input className="mt-2 w-full rounded-lg bg-white/10 p-3 text-white outline-none" value={value.title} maxLength={100} onChange={(event) => update("title", event.target.value)} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-white/70">Starts
          <input className="mt-2 w-full rounded-lg bg-white/10 p-3 text-white outline-none" type="datetime-local" value={value.startTime} onChange={(event) => update("startTime", event.target.value)} />
        </label>
        <label className="text-sm text-white/70">Ends (optional)
          <input className="mt-2 w-full rounded-lg bg-white/10 p-3 text-white outline-none" type="datetime-local" value={value.endTime} onChange={(event) => update("endTime", event.target.value)} />
        </label>
      </div>
      <label className="mt-3 block text-sm text-white/70">Location
        <input className="mt-2 w-full rounded-lg bg-white/10 p-3 text-white outline-none" value={value.location} maxLength={120} onChange={(event) => update("location", event.target.value)} />
      </label>
      <label className="mt-3 block text-sm text-white/70">Category
        <select className="mt-2 w-full rounded-lg bg-black p-3 text-white outline-none" value={value.category} onChange={(event) => update("category", event.target.value)}>
          {EVENT_CATEGORIES.map((category) => <option key={category} value={category}>{category[0].toUpperCase() + category.slice(1)}</option>)}
        </select>
      </label>
      <label className="mt-3 block text-sm text-white/70">Description
        <textarea className="mt-2 min-h-32 w-full rounded-lg bg-white/10 p-3 text-white outline-none" value={value.description} maxLength={1000} onChange={(event) => update("description", event.target.value)} />
        <span className="mt-1 block text-right text-xs text-white/40">{value.description.length}/1000</span>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-white/70">Capacity (optional)
          <input className="mt-2 w-full rounded-lg bg-white/10 p-3 text-white outline-none" type="number" min={2} max={10000} value={value.capacity} onChange={(event) => update("capacity", event.target.value)} />
        </label>
        <label className="text-sm text-white/70">RSVP deadline (optional)
          <input className="mt-2 w-full rounded-lg bg-white/10 p-3 text-white outline-none" type="datetime-local" value={value.rsvpDeadline} onChange={(event) => update("rsvpDeadline", event.target.value)} />
        </label>
      </div>
      <p className="mt-4 text-xs text-white/50">Visible only to verified students at your school.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button type="button" disabled={submitting} onClick={() => onSubmit("draft")} className="rounded-lg border border-white/15 px-4 py-3 font-semibold text-white disabled:opacity-50">Save draft</button>
        <button type="button" disabled={submitting} onClick={() => onSubmit("published")} className="rounded-lg bg-white px-4 py-3 font-semibold text-black disabled:opacity-50">{submitting ? "Saving..." : submitLabel}</button>
      </div>
      {message && <p role="alert" className="mt-4 text-sm text-white/70">{message}</p>}
    </div>
  );
}
