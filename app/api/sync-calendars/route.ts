import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/app/lib/firebase-admin";

export const dynamic = "force-dynamic";

type CalendarVisibility = "district" | "school";

type CalendarSource = {
  id: string;
  active: boolean;
  district: string;
  school: string | null;
  sourceType: "ics";
  sourceUrl: string;
  visibility: CalendarVisibility;
};

type ParsedIcsEvent = {
  uid: string;
  title: string;
  description: string;
  location: string;
  startTime: Date;
  endTime: Date | null;
};

function cleanText(value: string): string {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

function unfoldIcs(text: string): string {
  return text.replace(/\r?\n[ \t]/g, "");
}

function getIcsValue(block: string, field: string): string {
  const regex = new RegExp(`^${field}(?:;[^:]*)?:(.*)$`, "im");
  const match = block.match(regex);

  return match?.[1]?.trim() || "";
}

function parseIcsDate(value: string): Date | null {
  const cleaned = value.trim();

  if (!cleaned) return null;

  let match = cleaned.match(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/
  );

  if (match) {
    const [, year, month, day, hour, minute, second] = match;

    return new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second)
      )
    );
  }

  match = cleaned.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/);

  if (match) {
    const [, year, month, day, hour, minute, second] = match;

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    );
  }

  match = cleaned.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})$/);

  if (match) {
    const [, year, month, day, hour, minute] = match;

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      0
    );
  }

  match = cleaned.match(/^(\d{4})(\d{2})(\d{2})$/);

  if (match) {
    const [, year, month, day] = match;

    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return null;
}

function parseIcsEvents(icsText: string): ParsedIcsEvent[] {
  const unfolded = unfoldIcs(icsText);
  const blocks = unfolded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];

  return blocks
    .map((block) => {
      const uid = cleanText(getIcsValue(block, "UID"));
      const title = cleanText(getIcsValue(block, "SUMMARY"));
      const description = cleanText(getIcsValue(block, "DESCRIPTION"));
      const location = cleanText(getIcsValue(block, "LOCATION"));
      const startValue = getIcsValue(block, "DTSTART");
      const endValue = getIcsValue(block, "DTEND");

      const startTime = parseIcsDate(startValue);
      const endTime = parseIcsDate(endValue);

      if (!startTime) return null;

      return {
        uid,
        title: title || "Untitled event",
        description,
        location,
        startTime,
        endTime,
      };
    })
    .filter((event): event is ParsedIcsEvent => event !== null);
}

function buildSourceId(sourceUrl: string, event: ParsedIcsEvent): string {
  if (event.uid) {
    return `${sourceUrl}::${event.uid}`;
  }

  return `${sourceUrl}::${event.title}::${event.startTime.toISOString()}`;
}

function normalizeCalendarSource(
  id: string,
  data: FirebaseFirestore.DocumentData
): CalendarSource | null {
  const active = data.active === true;
  const district = typeof data.district === "string" ? data.district.trim() : "";
  const school = typeof data.school === "string" ? data.school.trim() : null;
  const sourceType = data.sourceType;
  const sourceUrl =
    typeof data.sourceUrl === "string" ? data.sourceUrl.trim() : "";
  const visibility: CalendarVisibility =
    data.visibility === "school" ? "school" : "district";

  if (!active) return null;
  if (sourceType !== "ics") return null;
  if (!district) return null;
  if (!sourceUrl) return null;

  return {
    id,
    active,
    district,
    school,
    sourceType: "ics",
    sourceUrl,
    visibility,
  };
}

async function fetchIcsText(sourceUrl: string): Promise<string> {
  const response = await fetch(sourceUrl, {
    headers: {
      "User-Agent": "LinkUp Calendar Sync",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`ICS fetch failed with status ${response.status}`);
  }

  return response.text();
}

async function eventAlreadyExists(sourceId: string): Promise<boolean> {
  const existingSnap = await adminDb
    .collection("events")
    .where("sourceId", "==", sourceId)
    .limit(1)
    .get();

  return !existingSnap.empty;
}

async function createImportedEvent(
  source: CalendarSource,
  event: ParsedIcsEvent,
  sourceId: string
): Promise<void> {
  await adminDb.collection("events").add({
    title: event.title,
    description: event.description,
    location: event.location,

    district: source.district,
    school: source.school,
    visibility: source.visibility,

    source: "ics",
    sourceType: "ics",
    sourceUrl: source.sourceUrl,
    sourceId,
    imported: true,

    status: "published",
    needsReview: false,

    startTime: Timestamp.fromDate(event.startTime),
    endTime: event.endTime ? Timestamp.fromDate(event.endTime) : null,

    attendeeCount: 0,

    createdBy: "system",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    publishedAt: FieldValue.serverTimestamp(),
  });
}

async function syncSource(source: CalendarSource) {
  const icsText = await fetchIcsText(source.sourceUrl);
  const parsedEvents = parseIcsEvents(icsText);

  let created = 0;
  let skipped = 0;

  for (const event of parsedEvents) {
    const sourceId = buildSourceId(source.sourceUrl, event);
    const exists = await eventAlreadyExists(sourceId);

    if (exists) {
      skipped++;
      continue;
    }

    await createImportedEvent(source, event, sourceId);
    created++;
  }

  await adminDb.collection("calendarSources").doc(source.id).update({
    lastSyncedAt: FieldValue.serverTimestamp(),
    lastSyncStatus: "success",
    lastSyncParsedCount: parsedEvents.length,
    lastSyncCreatedCount: created,
    lastSyncSkippedCount: skipped,
    lastSyncError: null,
  });

  return {
    sourceId: source.id,
    parsed: parsedEvents.length,
    created,
    skipped,
  };
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sourcesSnap = await adminDb.collection("calendarSources").get();

    const sources = sourcesSnap.docs
      .map((sourceDoc) =>
        normalizeCalendarSource(sourceDoc.id, sourceDoc.data())
      )
      .filter((source): source is CalendarSource => source !== null);

    let totalCreated = 0;
    let totalSkipped = 0;
    let totalParsed = 0;

    const sourceResults = [];
    const errors = [];

    for (const source of sources) {
      try {
        const result = await syncSource(source);

        totalCreated += result.created;
        totalSkipped += result.skipped;
        totalParsed += result.parsed;

        sourceResults.push(result);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown sync error";

        errors.push({
          sourceId: source.id,
          error: message,
        });

        await adminDb.collection("calendarSources").doc(source.id).update({
          lastSyncedAt: FieldValue.serverTimestamp(),
          lastSyncStatus: "error",
          lastSyncError: message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      sourcesTotal: sourcesSnap.size,
      sourcesSynced: sources.length,
      parsed: totalParsed,
      created: totalCreated,
      skipped: totalSkipped,
      errors,
      sourceResults,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Calendar sync failed.";

    console.error("Calendar sync failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}