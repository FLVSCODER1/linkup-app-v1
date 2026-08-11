"use client";

import { useEffect, useState } from "react";

import EventCoverImage from "./EventCoverImage";
import {
  EVENT_CATEGORIES,
  EVENT_VISIBILITIES,
  type EventFormInput,
} from "../../lib/events/management";
import {
  EVENT_COVER_ACCEPT,
  validateEventCoverSource,
} from "../../lib/events/cover-images";

interface EventFormProps {
  value: EventFormInput;
  onChange: (value: EventFormInput) => void;
  onSubmit: (status: "draft" | "published") => void;
  submitting: boolean;
  message: string;
  submitLabel?: string;
  coverImagePath?: string | null;
  coverFile: File | null;
  coverRemoved: boolean;
  onCoverFileChange: (file: File | null) => void;
  onCoverRemove: () => void;
}

function LocalCoverPreview({ file }: { file: File }) {
  const [url] = useState(() => URL.createObjectURL(file));

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  return (
    // Local object URLs are previews and cannot use Next Image.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt="Selected event cover preview"
      className="aspect-[16/9] w-full object-cover"
    />
  );
}

export default function EventForm({
  value,
  onChange,
  onSubmit,
  submitting,
  message,
  submitLabel = "Publish event",
  coverImagePath,
  coverFile,
  coverRemoved,
  onCoverFileChange,
  onCoverRemove,
}: EventFormProps) {
  function update(field: keyof EventFormInput, nextValue: string) {
    onChange({ ...value, [field]: nextValue });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="mb-5">
        <p className="text-sm text-white/70">Event cover (optional)</p>
        <div className="mt-2 overflow-hidden rounded-xl border border-white/10">
          {coverFile ? (
            <LocalCoverPreview
              key={`${coverFile.name}-${coverFile.size}-${coverFile.lastModified}`}
              file={coverFile}
            />
          ) : (
            <EventCoverImage
              path={coverRemoved ? null : coverImagePath}
              className="aspect-[16/9] w-full"
            />
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          <label className="cursor-pointer rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black">
            {coverFile || (!coverRemoved && coverImagePath) ? "Replace image" : "Choose image"}
            <input
              type="file"
              accept={EVENT_COVER_ACCEPT}
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (!file) return;
                const error = validateEventCoverSource(file);
                if (error) {
                  event.target.value = "";
                  window.alert(error);
                  return;
                }
                onCoverFileChange(file);
              }}
            />
          </label>
          {(coverFile || (!coverRemoved && coverImagePath)) && (
            <button type="button" onClick={onCoverRemove} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/70">
              Remove image
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-white/45">JPEG, PNG, or WebP up to 8 MB. Important details should still be written below.</p>
      </div>
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
      <label className="mt-3 block text-sm text-white/70">Who can find this event?
        <select className="mt-2 w-full rounded-lg bg-black p-3 text-white outline-none" value={value.visibility} onChange={(event) => update("visibility", event.target.value)}>
          {EVENT_VISIBILITIES.map((visibility) => (
            <option key={visibility} value={visibility}>
              {visibility === "district" ? "Verified students in my district" : "Verified students at my school"}
            </option>
          ))}
        </select>
        <span className="mt-2 block text-xs text-white/50">
          {value.visibility === "district"
            ? "Students at other verified schools in your district can discover this event."
            : "Only verified students at your school can discover this event."}
        </span>
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
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button type="button" disabled={submitting} onClick={() => onSubmit("draft")} className="rounded-lg border border-white/15 px-4 py-3 font-semibold text-white disabled:opacity-50">Save draft</button>
        <button type="button" disabled={submitting} onClick={() => onSubmit("published")} className="rounded-lg bg-white px-4 py-3 font-semibold text-black disabled:opacity-50">{submitting ? "Saving..." : submitLabel}</button>
      </div>
      {message && <p role="alert" className="mt-4 text-sm text-white/70">{message}</p>}
    </div>
  );
}
