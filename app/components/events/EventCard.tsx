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
      className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
    >
      {event.coverImagePath ? (
        <EventCoverImage
          path={event.coverImagePath}
          className="mb-5 aspect-[16/9] w-full rounded-xl"
        />
      ) : null}
      <p className="mb-2 text-xs uppercase tracking-wide text-white/40">
        {event.category || "event"}
      </p>

      <h2 className="text-2xl font-semibold text-white">
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
              : "bg-white text-black hover:scale-105"
          }`}
        >
          {isJoined ? "Joined" : "Join"}
        </button>
      </div>
    </article>
  );
}
