export interface OwnedDraftEvent {
  id: string;
  title: string;
  location: string;
  coverImageUrl: string | null;
  startTime: string | null;
  endTime: string | null;
  updatedAt: string | null;
}

export interface OwnedEditableEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  visibility: "school" | "district";
  status: "draft" | "published" | "cancelled";
  startTime: string | null;
  endTime: string | null;
  capacity: number | null;
  rsvpDeadline: string | null;
  publishedAt: string | null;
  coverImageUrl: string | null;
}

interface DateLike {
  toDate(): Date;
}

export interface DraftRecord {
  id: string;
  data: Record<string, unknown>;
}

function toIsoString(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString();
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as DateLike).toDate === "function"
  ) {
    return (value as DateLike).toDate().toISOString();
  }
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  return null;
}

export function buildOwnedEditableEvent(
  record: DraftRecord,
  ownerId: string
): OwnedEditableEvent | null {
  const { id, data } = record;
  if (data.createdBy !== ownerId) return null;

  const status = data.status;
  if (status !== "draft" && status !== "published" && status !== "cancelled") {
    return null;
  }

  return {
    id,
    title: typeof data.title === "string" ? data.title : "",
    description: typeof data.description === "string" ? data.description : "",
    location: typeof data.location === "string" ? data.location : "",
    category: typeof data.category === "string" ? data.category : "other",
    visibility: data.visibility === "district" ? "district" : "school",
    status,
    startTime: toIsoString(data.startTime),
    endTime: toIsoString(data.endTime),
    capacity: typeof data.capacity === "number" ? data.capacity : null,
    rsvpDeadline: toIsoString(data.rsvpDeadline),
    publishedAt: toIsoString(data.publishedAt),
    coverImageUrl:
      typeof data.coverImageUrl === "string" ? data.coverImageUrl : null,
  };
}

export function buildOwnedDraftEvents(
  records: DraftRecord[],
  ownerId: string
): OwnedDraftEvent[] {
  return records
    .filter(
      ({ data }) =>
        data.createdBy === ownerId && data.status === "draft"
    )
    .map(({ id, data }) => ({
      id,
      title: typeof data.title === "string" ? data.title : "",
      location: typeof data.location === "string" ? data.location : "",
      coverImageUrl:
        typeof data.coverImageUrl === "string" ? data.coverImageUrl : null,
      startTime: toIsoString(data.startTime),
      endTime: toIsoString(data.endTime),
      updatedAt: toIsoString(data.updatedAt),
    }))
    .sort(
      (a, b) =>
        (b.updatedAt ? Date.parse(b.updatedAt) : 0) -
        (a.updatedAt ? Date.parse(a.updatedAt) : 0)
    );
}
