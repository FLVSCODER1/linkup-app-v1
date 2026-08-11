import type { User } from "firebase/auth";

export const MAX_EVENT_COVER_SOURCE_BYTES = 8 * 1024 * 1024;
export const MAX_EVENT_COVER_BYTES = 2 * 1024 * 1024;
export const EVENT_COVER_ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";

const MAX_WIDTH = 1600;
const MAX_HEIGHT = 900;
const WEBP_QUALITY = 0.82;
const JPEG_QUALITY = 0.86;
const allowedSourceTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);
export const EVENT_COVER_UPLOAD_TYPES = new Set(["image/webp", "image/jpeg"]);

export function validateEventCoverSource(file: File) {
  if (!allowedSourceTypes.has(file.type)) {
    return "Choose a JPEG, PNG, WebP, HEIC, or HEIF image.";
  }
  if (file.size > MAX_EVENT_COVER_SOURCE_BYTES) {
    return "Choose an image smaller than 8 MB.";
  }
  return null;
}

function encodeCanvas(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, quality)
  );
}

async function loadImageSource(file: File) {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap as CanvasImageSource,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch {
      // Fall through to the native image decoder. This matters for HEIC on
      // Apple devices where <img> support can be broader than ImageBitmap.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Image decode failed."));
      element.src = url;
    });
    return {
      source: image as CanvasImageSource,
      width: image.naturalWidth,
      height: image.naturalHeight,
      cleanup: () => URL.revokeObjectURL(url),
    };
  } catch {
    URL.revokeObjectURL(url);
    throw new Error(
      "This browser could not read that image. Try choosing it from Photos again or use a JPEG."
    );
  }
}

export async function compressEventCover(file: File) {
  const validationError = validateEventCoverSource(file);
  if (validationError) throw new Error(validationError);

  const image = await loadImageSource(file);
  const scale = Math.min(1, MAX_WIDTH / image.width, MAX_HEIGHT / image.height);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    image.cleanup();
    throw new Error("This browser could not prepare the event image.");
  }

  context.drawImage(image.source, 0, 0, width, height);
  image.cleanup();
  let blob = await encodeCanvas(canvas, "image/webp", WEBP_QUALITY);

  // Some iOS browser shells can display WebP but cannot encode it through
  // Canvas. JPEG is universally encodable and Cloudinary accepts both.
  if (!blob || blob.type !== "image/webp") {
    blob = await encodeCanvas(canvas, "image/jpeg", JPEG_QUALITY);
  }

  if (!blob || !EVENT_COVER_UPLOAD_TYPES.has(blob.type)) {
    throw new Error("This browser could not prepare the event image.");
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
  data.set("file", blob, blob.type === "image/webp" ? "cover.webp" : "cover.jpg");
  await coverRequest(user, eventId, { method: "POST", body: data });
}

export async function deleteEventCover(user: User, eventId: string) {
  await coverRequest(user, eventId, { method: "DELETE" });
}
