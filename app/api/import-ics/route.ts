import { NextRequest, NextResponse } from "next/server";

import { hasAdminRole } from "@/app/lib/auth/admin.server";
import { verifyRequestToken } from "@/app/lib/auth/server-auth";
import { fetchPublicCalendarText } from "@/app/lib/calendar/source-url";

function parseICSDate(value: string) {
  if (!value) return "";

  const clean = value.replace("T", " ").replace("Z", "");

  if (clean.length >= 15) {
    const year = clean.slice(0, 4);
    const month = clean.slice(4, 6);
    const day = clean.slice(6, 8);
    const hour = clean.slice(9, 11);
    const minute = clean.slice(11, 13);

    return `${month}/${day}/${year} ${hour}:${minute}`;
  }

  if (clean.length === 8) {
    const year = clean.slice(0, 4);
    const month = clean.slice(4, 6);
    const day = clean.slice(6, 8);

    return `${month}/${day}/${year}`;
  }

  return value;
}

function getField(block: string, field: string) {
  const regex = new RegExp(`${field}(?:;[^:]*)?:(.*)`);
  const match = block.match(regex);
  return match ? match[1].trim() : "";
}

export async function POST(request: NextRequest) {
  try {
    const token = await verifyRequestToken(request);
    if (!token || !(await hasAdminRole(token.uid, "calendar_reviewer"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { url } = await request.json();
    const text = await fetchPublicCalendarText(url);
    const eventBlocks = text.split("BEGIN:VEVENT").slice(1);

    const events = eventBlocks.map((block) => {
      const title = getField(block, "SUMMARY");
      const location = getField(block, "LOCATION");
      const description = getField(block, "DESCRIPTION");
      const startRaw = getField(block, "DTSTART");

      return {
        title: title || "Untitled Event",
        date: parseICSDate(startRaw),
        location: location || "TBD",
        category: "school",
        description: description || "",
      };
    });

    return NextResponse.json({ events });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Calendar preview failed.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
