"use client";

import type { FeedEvent } from "../../lib/events/types";
import EventCoverImage from "./EventCoverImage";

interface EventCardProps {
  event: FeedEvent;
  isJoined?: boolean;
  attendeeCount?: number;
  onClick: () => void;
  onJoinClick: () => void;
}

export default function EventCard({
  event,
  isJoined = false,
  attendeeCount = 0,
  onClick,
  onJoinClick,
}: EventCardProps) {
  return (
    <article
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] p-4 shadow-[0_16px_60px_rgba(0,0,0,0.18)] transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07] sm:p-5"
    >
      {event.coverImageUrl ? (
        <EventCoverImage
          url={event.coverImageUrl}
          className="mb-5 aspect-[16/9] w-full rounded-2xl transition duration-500 group-hover:scale-[1.01]"
        />
      ) : null}
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-[#8f8aff]">
        {event.category || "event"}
      </p>

      <h2 className="text-2xl font-bold tracking-tight text-white">
        {event.title || "Untitled Event"}
      </h2>

      <p className="mt-2 text-sm text-white/70">{event.date || "Date TBD"}</p>
      <p className="text-sm text-white/50">
        {event.location || "Location TBD"}
      </p>

      {event.description && (
        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-white/70">
          {event.description}
        </p>
      )}

      <div className="mt-5 flex items-center justify-between">
        <p className="text-xs text-white/50">{attendeeCount} attending</p>

        <button
          type="button"
          onClick={(clickEvent) => {
            clickEvent.stopPropagation();
            onJoinClick();
          }}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition active:scale-95 ${
            isJoined
              ? "bg-white/10 text-white hover:bg-white/20"
              : "bg-gradient-to-r from-[#335cff] to-[#746ff7] text-white shadow-[0_8px_22px_rgba(51,92,255,0.25)] hover:brightness-110"
          }`}
        >
          {isJoined ? "Joined" : "Join"}
        </button>
      </div>
    </article>
  );
}
