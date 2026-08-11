import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import {
  isDecodedAccountVerified,
  verifyRequestToken,
} from "@/app/lib/auth/server-auth";
import {
  deleteCloudinaryEventCover,
  uploadCloudinaryEventCover,
} from "@/app/lib/events/cloudinary.server";
import { MAX_EVENT_COVER_BYTES } from "@/app/lib/events/cover-images";
import { getAdminDb } from "@/app/lib/firebase-admin";

export const dynamic = "force-dynamic";

async function hostEvent(request: NextRequest, eventId: string) {
  const token = await verifyRequestToken(request);
  if (!token || !isDecodedAccountVerified(token)) {
    return { error: "Sign in with a verified account.", status: 401 } as const;
  }
  const ref = getAdminDb().collection("events").doc(eventId);
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    return { error: "Event not found.", status: 404 } as const;
  }
  if (snapshot.data()?.createdBy !== token.uid) {
    return { error: "Only the event host can change its image.", status: 403 } as const;
  }
  return { ref, event: snapshot.data() ?? {} } as const;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const access = await hostEvent(request, eventId);
    if ("error" in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.type !== "image/webp") {
      return NextResponse.json({ error: "Upload a WebP image." }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_EVENT_COVER_BYTES) {
      return NextResponse.json(
        { error: "The optimized image must be no larger than 2 MB." },
        { status: 413 }
      );
    }

    const uploaded = await uploadCloudinaryEventCover(eventId, file);
    await access.ref.update({
      coverImageUrl: uploaded.url,
      coverImagePublicId: uploaded.publicId,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ url: uploaded.url });
  } catch (error) {
    console.error("Event cover upload failed:", error);
    const message = error instanceof Error ? error.message : "We couldn't upload the image.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const access = await hostEvent(request, eventId);
    if ("error" in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }
    const publicId = access.event.coverImagePublicId;
    if (typeof publicId === "string" && publicId) {
      await deleteCloudinaryEventCover(publicId);
    }
    await access.ref.update({
      coverImageUrl: null,
      coverImagePublicId: null,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Event cover deletion failed:", error);
    const message = error instanceof Error ? error.message : "We couldn't remove the image.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
