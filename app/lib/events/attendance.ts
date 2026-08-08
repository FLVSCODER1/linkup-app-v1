import type { EventStatus } from "../firestore/types";

export const ALLOW_HOST_RSVP_PREVIEW = true;

export type AttendanceStatus = "going" | "maybe" | "not-going";

export interface AttendancePolicyInput {
  status: EventStatus | undefined;
  attendeeCount: number | undefined;
  capacity: number | null | undefined;
  rsvpDeadline: unknown;
  alreadyAttending: boolean;
  isHost: boolean;
  now?: Date;
}

export type AttendancePolicyResult =
  | { allowed: true; nextAttendeeCount: number }
  | { allowed: false; error: string };

function dateFromUnknown(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;

  const candidate = value as {
    toDate?: () => Date;
    seconds?: number;
    _seconds?: number;
  };

  if (typeof candidate.toDate === "function") return candidate.toDate();

  const seconds = candidate.seconds ?? candidate._seconds;
  if (typeof seconds === "number") return new Date(seconds * 1_000);

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

export function evaluateJoinPolicy(
  input: AttendancePolicyInput
): AttendancePolicyResult {
  const attendeeCount = Math.max(0, input.attendeeCount ?? 0);

  if (input.status !== "published") {
    return { allowed: false, error: "This event is not accepting RSVPs." };
  }

  if (input.isHost && !ALLOW_HOST_RSVP_PREVIEW) {
    return { allowed: false, error: "Hosts cannot RSVP to their own events." };
  }

  if (input.alreadyAttending) {
    return { allowed: true, nextAttendeeCount: attendeeCount };
  }

  const deadline = dateFromUnknown(input.rsvpDeadline);
  if (deadline && deadline.getTime() < (input.now ?? new Date()).getTime()) {
    return { allowed: false, error: "The RSVP deadline has passed." };
  }

  if (input.capacity && attendeeCount >= input.capacity) {
    return { allowed: false, error: "This event has reached capacity." };
  }

  return { allowed: true, nextAttendeeCount: attendeeCount + 1 };
}

export function attendeeCountAfterLeaving(
  attendeeCount: number | undefined,
  wasAttending: boolean
): number {
  const currentCount = Math.max(0, attendeeCount ?? 0);
  return wasAttending ? Math.max(0, currentCount - 1) : currentCount;
}
