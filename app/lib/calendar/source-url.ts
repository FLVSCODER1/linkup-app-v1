import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_CALENDAR_BYTES = 2_000_000;
const MAX_REDIRECTS = 3;

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
    return false;
  }

  const [first, second] = parts;
  return (
    first === 10 ||
    first === 127 ||
    first === 0 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 198 && (second === 18 || second === 19)) ||
    first >= 224
  );
}

function isPrivateIpv6(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
}

async function assertPublicHostname(sourceUrl: string): Promise<void> {
  const hostname = new URL(sourceUrl).hostname.replace(/^\[|\]$/g, "");
  const literalVersion = isIP(hostname);
  const addresses = literalVersion
    ? [{ address: hostname, family: literalVersion }]
    : await lookup(hostname, { all: true, verbatim: true });

  if (
    addresses.length === 0 ||
    addresses.some(
      ({ address, family }) =>
        (family === 4 && isPrivateIpv4(address)) ||
        (family === 6 && isPrivateIpv6(address))
    )
  ) {
    throw new Error("That calendar host is not allowed.");
  }
}

export function validateCalendarSourceUrl(input: unknown):
  | { valid: true; url: string }
  | { valid: false; error: string } {
  if (typeof input !== "string" || !input.trim()) {
    return { valid: false, error: "Enter a calendar URL." };
  }

  if (input.length > 2_048) {
    return { valid: false, error: "The calendar URL is too long." };
  }

  let parsed: URL;
  try {
    parsed = new URL(input.trim());
  } catch {
    return { valid: false, error: "Enter a valid calendar URL." };
  }

  if (parsed.protocol !== "https:") {
    return { valid: false, error: "Calendar URLs must use HTTPS." };
  }

  if (parsed.username || parsed.password) {
    return { valid: false, error: "Calendar URLs cannot contain credentials." };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const ipVersion = isIP(hostname);
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    (ipVersion === 4 && isPrivateIpv4(hostname)) ||
    (ipVersion === 6 && isPrivateIpv6(hostname))
  ) {
    return { valid: false, error: "That calendar host is not allowed." };
  }

  return { valid: true, url: parsed.toString() };
}

export async function fetchPublicCalendarText(input: unknown): Promise<string> {
  const initial = validateCalendarSourceUrl(input);
  if (!initial.valid) throw new Error(initial.error);

  let currentUrl = initial.url;

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect++) {
    await assertPublicHostname(currentUrl);
    const response = await fetch(currentUrl, {
      cache: "no-store",
      headers: { "User-Agent": "LinkUp Calendar Import" },
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirect === MAX_REDIRECTS) {
        throw new Error("The calendar redirected too many times.");
      }

      const redirected = validateCalendarSourceUrl(
        new URL(location, currentUrl).toString()
      );
      if (!redirected.valid) throw new Error(redirected.error);
      currentUrl = redirected.url;
      continue;
    }

    if (!response.ok) {
      throw new Error(`Calendar fetch failed with status ${response.status}.`);
    }

    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_CALENDAR_BYTES) {
      throw new Error("The calendar file is too large.");
    }

    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > MAX_CALENDAR_BYTES) {
      throw new Error("The calendar file is too large.");
    }

    if (!text.includes("BEGIN:VCALENDAR")) {
      throw new Error("That URL did not return an ICS calendar.");
    }

    return text;
  }

  throw new Error("The calendar could not be fetched.");
}
