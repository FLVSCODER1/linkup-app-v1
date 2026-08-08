import { getEmailDomain } from "./school-directory";

const CONSUMER_EMAIL_DOMAINS = new Set([
  "aol.com",
  "gmail.com",
  "hotmail.com",
  "icloud.com",
  "live.com",
  "outlook.com",
  "proton.me",
  "protonmail.com",
  "yahoo.com",
]);

export interface SchoolRequestInput {
  email: string;
  schoolName: string;
  city: string;
  state: string;
  districtName: string | null;
  officialWebsite: string;
  calendarUrl: string | null;
  domain: string;
}

export type SchoolRequestValidation =
  | { valid: true; value: SchoolRequestInput }
  | { valid: false; message: string };

function normalizeText(value: unknown, maxLength: number): string {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").slice(0, maxLength)
    : "";
}

function normalizePublicUrl(value: unknown): string | null {
  const raw = normalizeText(value, 500);
  if (!raw) return null;

  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    const hostname = url.hostname.toLowerCase();
    const isIpv4 = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname);

    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      hostname === "localhost" ||
      !hostname.includes(".") ||
      isIpv4
    ) {
      return null;
    }

    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export function validateSchoolRequest(
  body: Record<string, unknown>
): SchoolRequestValidation {
  const email = normalizeText(body.email, 254).toLowerCase();
  const domain = getEmailDomain(email);
  const schoolName = normalizeText(body.schoolName, 120);
  const city = normalizeText(body.city, 80);
  const state = normalizeText(body.state, 2).toUpperCase();
  const districtName = normalizeText(body.districtName, 120) || null;
  const officialWebsite = normalizePublicUrl(body.officialWebsite);
  const rawCalendarUrl = normalizeText(body.calendarUrl, 500);
  const calendarUrl = rawCalendarUrl
    ? normalizePublicUrl(rawCalendarUrl)
    : null;

  if (!domain) {
    return { valid: false, message: "Enter a valid school-issued email." };
  }

  if (CONSUMER_EMAIL_DOMAINS.has(domain)) {
    return {
      valid: false,
      message: "Use an official school-issued email, not a personal inbox.",
    };
  }

  if (schoolName.length < 3 || city.length < 2 || !/^[A-Z]{2}$/.test(state)) {
    return {
      valid: false,
      message: "Enter the school's name, city, and two-letter state code.",
    };
  }

  if (!officialWebsite) {
    return {
      valid: false,
      message: "Enter a valid official school website.",
    };
  }

  if (rawCalendarUrl && !calendarUrl) {
    return {
      valid: false,
      message: "Enter a valid activities or calendar URL, or leave it blank.",
    };
  }

  return {
    valid: true,
    value: {
      email,
      schoolName,
      city,
      state,
      districtName,
      officialWebsite,
      calendarUrl,
      domain,
    },
  };
}

export function slugifyDirectoryId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
