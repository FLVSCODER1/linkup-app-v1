import { lookup } from "node:dns/promises";
import { request } from "node:https";
import { BlockList, isIP } from "node:net";
import type { IncomingMessage } from "node:http";

const MAX_CALENDAR_BYTES = 2_000_000;
const MAX_REDIRECTS = 3;
const denied = new BlockList();
for (const [address, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10],
  ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12],
  ["192.168.0.0", 16], ["192.0.0.0", 24], ["192.0.2.0", 24],
  ["192.88.99.0", 24], ["198.18.0.0", 15], ["198.51.100.0", 24],
  ["203.0.113.0", 24], ["224.0.0.0", 3],
] as const) denied.addSubnet(address, prefix, "ipv4");
const globalIpv6 = new BlockList();
globalIpv6.addSubnet("2000::", 3, "ipv6");
denied.addSubnet("2001::", 23, "ipv6");
denied.addSubnet("2001:db8::", 32, "ipv6");
denied.addSubnet("2002::", 16, "ipv6");
denied.addSubnet("3fff::", 20, "ipv6");

export function isPublicCalendarAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return !denied.check(address, "ipv4");
  // Reject mapped IPv4, NAT64, local, multicast and transition ranges.
  return family === 6 && globalIpv6.check(address, "ipv6") && !denied.check(address, "ipv6");
}

export function validateCalendarSourceUrl(input: unknown):
  | { valid: true; url: string }
  | { valid: false; error: string } {
  if (typeof input !== "string" || !input.trim()) return { valid: false, error: "Enter a calendar URL." };
  if (input.length > 2_048) return { valid: false, error: "The calendar URL is too long." };
  let parsed: URL;
  try { parsed = new URL(input.trim()); }
  catch { return { valid: false, error: "Enter a valid calendar URL." }; }
  if (parsed.protocol !== "https:") return { valid: false, error: "Calendar URLs must use HTTPS." };
  if (parsed.username || parsed.password) return { valid: false, error: "Calendar URLs cannot contain credentials." };
  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") ||
      (isIP(hostname) && !isPublicCalendarAddress(hostname))) {
    return { valid: false, error: "That calendar host is not allowed." };
  }
  return { valid: true, url: parsed.toString() };
}

async function resolvePublicAddress(url: URL, signal: AbortSignal) {
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const version = isIP(hostname);
  const resolution = version ? Promise.resolve([{ address: hostname, family: version }]) : lookup(hostname, { all: true, verbatim: true });
  const addresses = await new Promise<Awaited<typeof resolution>>((resolve, reject) => {
    const aborted = () => reject(new Error("Calendar request timed out."));
    if (signal.aborted) return aborted();
    signal.addEventListener("abort", aborted, { once: true });
    resolution.then(resolve, reject).finally(() => signal.removeEventListener("abort", aborted));
  });
  if (!addresses.length || addresses.some(({ address }) => !isPublicCalendarAddress(address))) {
    throw new Error("That calendar host is not allowed.");
  }
  return addresses[0];
}

async function openCalendarResponse(url: URL, signal: AbortSignal): Promise<IncomingMessage> {
  const address = await resolvePublicAddress(url, signal);
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const outgoing = request(url, {
      // Preserve Host/TLS identity, but pin the connection to validated DNS.
      agent: false,
      family: address.family,
      lookup: (_hostname, options, callback) => {
        if (options.all) callback(null, [address]);
        else callback(null, address.address, address.family);
      },
      signal,
      headers: { "User-Agent": "LinkUp Calendar Import", "Accept-Encoding": "identity" },
    }, resolve);
    outgoing.on("error", reject);
    outgoing.end();
  });
}

export async function readBoundedCalendar(response: IncomingMessage): Promise<string> {
  try {
    const encoding = response.headers["content-encoding"];
    if (encoding && encoding !== "identity") throw new Error("Calendar compression is not supported.");
    const length = Number(response.headers["content-length"]);
    if (Number.isFinite(length) && length > MAX_CALENDAR_BYTES) throw new Error("The calendar file is too large.");
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of response) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += bytes.length;
      if (size > MAX_CALENDAR_BYTES) throw new Error("The calendar file is too large.");
      chunks.push(bytes);
    }
    const text = Buffer.concat(chunks, size).toString("utf8");
    if (!text.includes("BEGIN:VCALENDAR")) throw new Error("That URL did not return an ICS calendar.");
    return text;
  } finally {
    response.destroy();
  }
}

export async function fetchPublicCalendarText(input: unknown): Promise<string> {
  const initial = validateCalendarSourceUrl(input);
  if (!initial.valid) throw new Error(initial.error);
  let url = new URL(initial.url);
  // One deadline covers DNS, redirects, headers and the complete body.
  const signal = AbortSignal.timeout(10_000);
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect++) {
    const response = await openCalendarResponse(url, signal);
    const status = response.statusCode ?? 0;
    if (status >= 300 && status < 400) {
      const location = response.headers.location;
      response.destroy();
      if (!location || redirect === MAX_REDIRECTS) throw new Error("The calendar redirected too many times.");
      const next = validateCalendarSourceUrl(new URL(location, url).toString());
      if (!next.valid) throw new Error(next.error);
      url = new URL(next.url);
      continue;
    }
    if (status < 200 || status >= 300) {
      response.destroy();
      throw new Error(`Calendar fetch failed with status ${status}.`);
    }
    return readBoundedCalendar(response);
  }
  throw new Error("The calendar could not be fetched.");
}
