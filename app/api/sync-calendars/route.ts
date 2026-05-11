import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/app/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CalendarVisibility = "district" | "school";

type CalendarSource = {
  id: string;
  active: boolean;
  district: string;
  school: string | null;
  sourceType: string;
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
  if (!value) return null;

  const cleaned = value.trim();

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

  match = cleaned.match(/^(\d{4})(\d{2})(\d{2})$/);

  if (match) {
    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  console.warn("Unsupported ICS date:", value);
  return null;
}

function parseIcsEvents(icsText: string): ParsedIcsEvent[] {
  const unfolded = unfoldIcs(icsText);
  const blocks = unfolded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];

  return blocks
    .map((block) => {
      const startTime = parseIcsDate(getIcsValue(block, "DTSTART"));
      const endTime = parseIcsDate(getIcsValue(block, "DTEND"));

      if (!startTime) return null;

      return {
        uid: getIcsValue(block, "UID"),
        title: cleanText(getIcsValue(block, "SUMMARY")) || "Untitled event",
        description: cleanText(getIcsValue(block, "DESCRIPTION")),
        location: cleanText(getIcsValue(block, "LOCATION")),
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

async function getCalendarSources(): Promise<CalendarSource[]> {
  const snap = await adminDb.collection("calendarSources").get();

  console.log("calendarSources total:", snap.size);

  return snap.docs
    .map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        active: data.active === true,
        district: String(data.district || ""),
        school: data.school ? String(data.school) : null,
        sourceType: String(data.sourceType || ""),
        sourceUrl: String(data.sourceUrl || ""),
        visibility: (data.visibility === "school" ? "school" : "district") as CalendarVisibility,
      };
    })
    .filter((source) => source.active && source.sourceType === "ics");
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sources = await getCalendarSources();

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const source of sources) {
      if (!source.district || !source.sourceUrl) {
        errors.push(`Invalid source config: ${source.id}`);
        continue;
      }

      try {
        const response = await fetch(source.sourceUrl, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`ICS fetch failed with status ${response.status}`);
        }

        const icsText = await response.text();
        const parsedEvents = parseIcsEvents(icsText);

        console.log("ICS parsed:", {
          sourceId: source.id,
          hasVevent: icsText.includes("BEGIN:VEVENT"),
          parsedCount: parsedEvents.length,
        });

        for (const event of parsedEvents) {
          const sourceId = buildSourceId(source.sourceUrl, event);

          const existingSnap = await adminDb
            .collection("events")
            .where("sourceId", "==", sourceId)
            .limit(1)
            .get();

          if (!existingSnap.empty) {
            skipped++;
            continue;
          }

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
          });

          created++;
        }

        await adminDb.collection("calendarSources").doc(source.id).update({
          lastSyncedAt: FieldValue.serverTimestamp(),
          lastSyncStatus: "success",
          lastSyncCreatedCount: created,
          lastSyncSkippedCount: skipped,
        });
      } catch (error) {
        console.error("Source sync failed:", source.id, error);

        errors.push(`Failed source: ${source.id}`);

        await adminDb.collection("calendarSources").doc(source.id).update({
          lastSyncedAt: FieldValue.serverTimestamp(),
          lastSyncStatus: "error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      sourcesChecked: sources.length,
      created,
      skipped,
      errors,
    });
  } catch (error) {
    console.error("Calendar sync failed:", error);

    return NextResponse.json(
      { error: "Calendar sync failed." },
      { status: 500 }
    );
  }
}