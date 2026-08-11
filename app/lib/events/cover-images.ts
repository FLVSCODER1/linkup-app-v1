import type { User } from "firebase/auth";

export const MAX_EVENT_COVER_SOURCE_BYTES = 8 * 1024 * 1024;
export const MAX_EVENT_COVER_BYTES = 2 * 1024 * 1024;
export const EVENT_COVER_ACCEPT = "image/jpeg,image/png,image/webp";

const MAX_WIDTH = 1600;
const MAX_HEIGHT = 900;
const WEBP_QUALITY = 0.82;
const allowedSourceTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validateEventCoverSource(file: File) {
  if (!allowedSourceTypes.has(file.type)) {
    return "Choose a JPEG, PNG, or WebP image.";
  }
  if (file.size > MAX_EVENT_COVER_SOURCE_BYTES) {
    return "Choose an image smaller than 8 MB.";
  }
  return null;
}

export async function compressEventCover(file: File) {
  const validationError = validateEventCoverSource(file);
  if (validationError) throw new Error(validationError);

  const image = await createImageBitmap(file);
  const scale = Math.min(1, MAX_WIDTH / image.width, MAX_HEIGHT / image.height);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    image.close();
    throw new Error("This browser could not prepare the event image.");
  }

  context.drawImage(image, 0, 0, width, height);
  image.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", WEBP_QUALITY)
  );

  if (!blob || blob.type !== "image/webp") {
    throw new Error("This browser could not convert the event image to WebP.");
  }
  if (blob.size > MAX_EVENT_COVER_BYTES) {
    throw new Error("The optimized image is still too large. Try a simpler image.");
  }
  return blob;
}

async function coverRequest(
  user: User,
  eventId: string,
  init: RequestInit
) {
  const token = await user.getIdToken();
  const response = await fetch(`/api/events/${encodeURIComponent(eventId)}/cover`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${token}`,
    },
  });
  const body = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new Error(body.error || "We couldn't update the event image.");
  }
}

export async function uploadEventCover(user: User, eventId: string, blob: Blob) {
  const data = new FormData();
  data.set("file", blob, "cover.webp");
  await coverRequest(user, eventId, { method: "POST", body: data });
}

export async function deleteEventCover(user: User, eventId: string) {
  await coverRequest(user, eventId, { method: "DELETE" });
}
