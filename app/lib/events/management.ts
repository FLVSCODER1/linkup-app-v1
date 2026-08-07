export const EVENT_CATEGORIES = [
  "study",
  "party",
  "athletics",
  "club",
  "dance",
  "volunteer",
  "academic",
  "music",
  "other",
] as const;

export interface EventFormInput {
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  category: string;
  description: string;
  capacity: string;
  rsvpDeadline: string;
}

export interface ValidatedEventInput {
  title: string;
  startTime: Date;
  endTime: Date | null;
  location: string;
  category: string;
  description: string;
  capacity: number | null;
  rsvpDeadline: Date | null;
}

export type EventInputValidation =
  | { valid: true; value: ValidatedEventInput }
  | { valid: false; error: string };

export function validateEventInput(input: EventFormInput): EventInputValidation {
  const title = input.title.trim();
  const description = input.description.trim();
  const location = input.location.trim();
  const startTime = new Date(input.startTime);
  const endTime = input.endTime ? new Date(input.endTime) : null;
  const rsvpDeadline = input.rsvpDeadline
    ? new Date(input.rsvpDeadline)
    : null;

  if (title.length < 3 || title.length > 100) {
    return { valid: false, error: "Use an event title between 3 and 100 characters." };
  }
  if (!input.startTime || Number.isNaN(startTime.getTime())) {
    return { valid: false, error: "Choose a valid start date and time." };
  }
  if (endTime && (Number.isNaN(endTime.getTime()) || endTime <= startTime)) {
    return { valid: false, error: "The end time must be after the start time." };
  }
  if (
    rsvpDeadline &&
    (Number.isNaN(rsvpDeadline.getTime()) || rsvpDeadline > startTime)
  ) {
    return { valid: false, error: "The RSVP deadline cannot be after the event starts." };
  }
  if (description.length > 1000) {
    return { valid: false, error: "Keep the description under 1,000 characters." };
  }

  let capacity: number | null = null;
  if (input.capacity.trim()) {
    capacity = Number(input.capacity);
    if (!Number.isInteger(capacity) || capacity < 2 || capacity > 10_000) {
      return { valid: false, error: "Capacity must be a whole number from 2 to 10,000." };
    }
  }

  const category = EVENT_CATEGORIES.includes(
    input.category as (typeof EVENT_CATEGORIES)[number]
  )
    ? input.category
    : "other";

  return {
    valid: true,
    value: {
      title,
      startTime,
      endTime,
      location: location || "TBD",
      category,
      description,
      capacity,
      rsvpDeadline,
    },
  };
}

export function toDateTimeLocal(value: unknown): string {
  if (!value) return "";
  const candidate = value as { toDate?: () => Date };
  const date = typeof candidate.toDate === "function" ? candidate.toDate() : new Date(value as string);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
