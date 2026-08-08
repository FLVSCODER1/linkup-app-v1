import { FieldValue, type DocumentData } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import {
  isDecodedAccountVerified,
  verifyRequestToken,
} from "@/app/lib/auth/server-auth";
import {
  attendeeCountAfterLeaving,
  evaluateJoinPolicy,
  type AttendanceStatus,
} from "@/app/lib/events/attendance";
import { getAdminDb } from "@/app/lib/firebase-admin";

export const dynamic = "force-dynamic";

type ConnectionGoal = "friends" | "group" | "browsing";

function isAttendanceStatus(value: unknown): value is AttendanceStatus {
  return value === "going" || value === "maybe" || value === "not-going";
}

function isConnectionGoal(value: unknown): value is ConnectionGoal {
  return value === "friends" || value === "group" || value === "browsing";
}

function eventIsVisibleToProfile(
  event: DocumentData,
  profile: DocumentData
): boolean {
  if (event.visibility === "school") {
    return (
      typeof profile.school === "string" &&
      typeof profile.district === "string" &&
      event.school === profile.school &&
      event.district === profile.district
    );
  }

  if (event.visibility === "district") {
    return (
      typeof profile.district === "string" &&
      event.district === profile.district
    );
  }

  // Imported legacy events did not always include an explicit visibility.
  if (typeof event.school === "string") {
    return (
      event.school === profile.school && event.district === profile.district
    );
  }
  if (typeof event.district === "string") {
    return event.district === profile.district;
  }

  return false;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const token = await verifyRequestToken(request);
    if (!token || !isDecodedAccountVerified(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      attendanceStatus?: unknown;
      connectionGoal?: unknown;
    };
    if (
      !isAttendanceStatus(body.attendanceStatus) ||
      !isConnectionGoal(body.connectionGoal)
    ) {
      return NextResponse.json(
        { error: "Choose a valid RSVP and connection preference." },
        { status: 400 }
      );
    }

    const { eventId } = await params;
    const db = getAdminDb();
    const eventRef = db.collection("events").doc(eventId);
    const profileRef = db.collection("users").doc(token.uid);
    const attendeeRef = eventRef.collection("attendees").doc(token.uid);
    const preferenceRef = db
      .collection("eventPreferences")
      .doc(`${token.uid}_${eventId}`);

    const result = await db.runTransaction(async (transaction) => {
      const [eventSnapshot, profileSnapshot, attendeeSnapshot] =
        await Promise.all([
          transaction.get(eventRef),
          transaction.get(profileRef),
          transaction.get(attendeeRef),
        ]);

      if (!eventSnapshot.exists) {
        return { error: "Event not found.", status: 404 } as const;
      }
      if (!profileSnapshot.exists || profileSnapshot.data()?.profileComplete !== true) {
        return { error: "Complete your profile before joining.", status: 403 } as const;
      }

      const event = eventSnapshot.data() ?? {};
      const profile = profileSnapshot.data() ?? {};
      if (!eventIsVisibleToProfile(event, profile)) {
        return { error: "You do not have access to this event.", status: 403 } as const;
      }

      const currentCount =
        typeof event.attendeeCount === "number" ? event.attendeeCount : 0;

      if (body.attendanceStatus === "not-going") {
        const nextCount = attendeeCountAfterLeaving(
          currentCount,
          attendeeSnapshot.exists
        );

        if (attendeeSnapshot.exists) transaction.delete(attendeeRef);
        transaction.set(
          preferenceRef,
          {
            userId: token.uid,
            eventId,
            school: profile.school ?? null,
            attendanceStatus: body.attendanceStatus,
            connectionGoal: body.connectionGoal,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        transaction.update(eventRef, {
          attendeeCount: nextCount,
          updatedAt: FieldValue.serverTimestamp(),
        });

        return { attendeeCount: nextCount, joined: false } as const;
      }

      const policy = evaluateJoinPolicy({
        status: event.status,
        attendeeCount: currentCount,
        capacity:
          typeof event.capacity === "number" ? event.capacity : null,
        rsvpDeadline: event.rsvpDeadline,
        alreadyAttending: attendeeSnapshot.exists,
        isHost: event.createdBy === token.uid,
      });

      if (!policy.allowed) {
        return { error: policy.error, status: 409 } as const;
      }

      if (!attendeeSnapshot.exists) {
        transaction.create(attendeeRef, {
          uid: token.uid,
          school: profile.school ?? null,
          joinedAt: FieldValue.serverTimestamp(),
        });
      }

      transaction.set(
        preferenceRef,
        {
          userId: token.uid,
          eventId,
          school: profile.school ?? null,
          attendanceStatus: body.attendanceStatus,
          connectionGoal: body.connectionGoal,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      transaction.update(eventRef, {
        attendeeCount: policy.nextAttendeeCount,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        attendeeCount: policy.nextAttendeeCount,
        joined: true,
      } as const;
    });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Attendance update failed:", error);
    return NextResponse.json(
      { error: "We couldn't update your RSVP." },
      { status: 500 }
    );
  }
}
