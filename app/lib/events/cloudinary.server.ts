import "server-only";

import { signCloudinaryParameters } from "./cloudinary-signature";

const CLOUDINARY_API_BASE = "https://api.cloudinary.com/v1_1";
const EVENT_COVER_FOLDER = "linkup/event-covers";

interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

interface CloudinaryUploadResult {
  public_id?: unknown;
  secure_url?: unknown;
  error?: { message?: unknown };
}

function getConfig(): CloudinaryConfig {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Event image uploads are not configured yet.");
  }
  return { cloudName, apiKey, apiSecret };
}

function coverPublicId(eventId: string): string {
  if (!/^[A-Za-z0-9_-]{1,180}$/.test(eventId)) {
    throw new Error("This event cannot accept an image.");
  }
  return `${EVENT_COVER_FOLDER}/${eventId}`;
}

async function readCloudinaryResponse(response: Response) {
  const body = (await response.json().catch(() => ({}))) as CloudinaryUploadResult;
  if (!response.ok) {
    const message =
      typeof body.error?.message === "string"
        ? body.error.message
        : "The image service rejected this request.";
    throw new Error(message);
  }
  return body;
}

export async function uploadCloudinaryEventCover(eventId: string, file: File) {
  const config = getConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = coverPublicId(eventId);
  const parameters = {
    invalidate: true,
    overwrite: true,
    public_id: publicId,
    timestamp,
  };
  const data = new FormData();
  data.set("file", file, "cover.webp");
  data.set("api_key", config.apiKey);
  data.set("public_id", publicId);
  data.set("timestamp", String(timestamp));
  data.set("overwrite", "true");
  data.set("invalidate", "true");
  data.set("signature", signCloudinaryParameters(parameters, config.apiSecret));

  const response = await fetch(
    `${CLOUDINARY_API_BASE}/${encodeURIComponent(config.cloudName)}/image/upload`,
    { method: "POST", body: data }
  );
  const body = await readCloudinaryResponse(response);
  if (body.public_id !== publicId || typeof body.secure_url !== "string") {
    throw new Error("The image service returned an invalid response.");
  }
  const url = new URL(body.secure_url);
  if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") {
    throw new Error("The image service returned an invalid URL.");
  }
  return { publicId, url: url.toString() };
}

export async function deleteCloudinaryEventCover(publicId: string) {
  const config = getConfig();
  if (!publicId.startsWith(`${EVENT_COVER_FOLDER}/`)) {
    throw new Error("This image cannot be deleted.");
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const parameters = { invalidate: true, public_id: publicId, timestamp };
  const data = new FormData();
  data.set("api_key", config.apiKey);
  data.set("public_id", publicId);
  data.set("timestamp", String(timestamp));
  data.set("invalidate", "true");
  data.set("signature", signCloudinaryParameters(parameters, config.apiSecret));

  const response = await fetch(
    `${CLOUDINARY_API_BASE}/${encodeURIComponent(config.cloudName)}/image/destroy`,
    { method: "POST", body: data }
  );
  await readCloudinaryResponse(response);
}
