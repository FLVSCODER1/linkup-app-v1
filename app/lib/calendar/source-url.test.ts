import { EventEmitter } from "node:events";
import { Readable } from "node:stream";
import type { IncomingMessage } from "node:http";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import { fetchPublicCalendarText, isPublicCalendarAddress, readBoundedCalendar, validateCalendarSourceUrl } from "./source-url";

const mocks = vi.hoisted(() => ({ lookup: vi.fn(), request: vi.fn() }));
vi.mock("node:dns/promises", () => ({ lookup: mocks.lookup }));
vi.mock("node:https", () => ({ request: mocks.request }));

const calendar = "BEGIN:VCALENDAR\r\nEND:VCALENDAR";
function response(chunks: (string | Buffer)[] = [calendar], headers = {}, statusCode = 200) {
  return Object.assign(Readable.from(chunks), { headers, statusCode }) as unknown as IncomingMessage;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.lookup.mockResolvedValue([{ address: "8.8.8.8", family: 4 }]);
});
afterEach(() => vi.restoreAllMocks());

describe("validateCalendarSourceUrl", () => {
  it("accepts a public HTTPS calendar", () => {
    expect(validateCalendarSourceUrl("https://calendar.school.edu/feed.ics")).toEqual({
      valid: true,
      url: "https://calendar.school.edu/feed.ics",
    });
  });

  it.each([
    "http://calendar.school.edu/feed.ics",
    "https://localhost/feed.ics",
    "https://127.0.0.1/feed.ics",
    "https://192.168.1.4/feed.ics",
    "https://[::1]/feed.ics",
    "https://[::ffff:127.0.0.1]/feed.ics",
    "https://[fe90::1]/feed.ics",
    "https://[64:ff9b::7f00:1]/feed.ics",
    "https://2130706433/feed.ics",
  ])("rejects unsafe calendar URL %s", (url) => {
    expect(validateCalendarSourceUrl(url).valid).toBe(false);
  });
});

describe("bounded calendar streams", () => {
  it("reads split UTF-8 data and accepts exactly two million bytes", async () => {
    const content = Buffer.from(calendar + "é" + "x".repeat(2_000_000 - Buffer.byteLength(calendar) - 2));
    expect(await readBoundedCalendar(response([content.subarray(0, calendar.length + 1), content.subarray(calendar.length + 1)]))).toBe(content.toString());
  });
  it.each([{}, { "content-length": "10" }])("stops chunked/lying-length downloads as soon as the byte limit is crossed", async (headers) => {
    const stream = response([Buffer.alloc(1_000_000), Buffer.alloc(1_000_001), "unused"], headers);
    await expect(readBoundedCalendar(stream)).rejects.toThrow("too large");
    expect(stream.destroyed).toBe(true);
  });
  it("rejects declared oversize and compressed bodies before reading", async () => {
    for (const headers of [{ "content-length": "2000001" }, { "content-encoding": "gzip" }]) {
      const stream = response([calendar], headers);
      await expect(readBoundedCalendar(stream)).rejects.toThrow();
      expect(stream.destroyed).toBe(true);
    }
  });
  it("rejects non-calendar bodies and truncated streams", async () => {
    await expect(readBoundedCalendar(response(["<html>error</html>"]))).rejects.toThrow("ICS");
    const stream = response();
    stream.destroy(new Error("connection lost"));
    await expect(readBoundedCalendar(stream)).rejects.toThrow("connection lost");
  });
});

describe("calendar address policy", () => {
  it.each(["::ffff:7f00:1", "::ffff:192.168.1.1", "::", "fc00::1", "febf::1", "ff02::1", "2001:db8::1", "2002:7f00:1::", "192.0.2.1", "100.64.0.1", "198.18.0.1", "240.0.0.1"])("rejects non-public address %s", (address) => {
    expect(isPublicCalendarAddress(address)).toBe(false);
  });
  it.each(["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111", "2001:4860:4860::8888"])("allows global address %s", (address) => {
    expect(isPublicCalendarAddress(address)).toBe(true);
  });
});

describe("calendar transport", () => {
  function serve(...responses: IncomingMessage[]) {
    mocks.request.mockImplementation((_url, _options, callback) => Object.assign(new EventEmitter(), {
      end: () => callback(responses.shift()),
    }));
  }
  it("pins validated DNS without changing the HTTPS hostname", async () => {
    serve(response());
    expect(await fetchPublicCalendarText("https://calendar.school.edu/feed.ics")).toBe(calendar);
    const [url, options] = mocks.request.mock.calls[0];
    expect(url.hostname).toBe("calendar.school.edu");
    expect(options.agent).toBe(false);
    expect(options.family).toBe(4);
    expect(options.rejectUnauthorized).not.toBe(false);
    const callback = vi.fn();
    options.lookup("calendar.school.edu", {}, callback);
    expect(callback).toHaveBeenCalledWith(null, "8.8.8.8", 4);
    options.lookup("calendar.school.edu", { all: true }, callback);
    expect(callback).toHaveBeenLastCalledWith(null, [{ address: "8.8.8.8", family: 4 }]);
    expect(mocks.lookup).toHaveBeenCalledTimes(1);
  });
  it("rejects mixed public/private DNS answers without opening a connection", async () => {
    mocks.lookup.mockResolvedValue([{ address: "8.8.8.8", family: 4 }, { address: "127.0.0.1", family: 4 }]);
    await expect(fetchPublicCalendarText("https://calendar.school.edu/feed.ics")).rejects.toThrow("not allowed");
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it("revalidates redirects and destroys discarded responses", async () => {
    const redirected = response([], { location: "https://other.school.edu/feed.ics" }, 302);
    serve(redirected, response());
    expect(await fetchPublicCalendarText("https://calendar.school.edu/feed.ics")).toBe(calendar);
    expect(mocks.lookup).toHaveBeenCalledTimes(2);
    expect(redirected.destroyed).toBe(true);
  });
  it("rejects a redirected private host, including changed DNS", async () => {
    serve(response([], { location: "https://other.school.edu/feed.ics" }, 302));
    mocks.lookup.mockResolvedValueOnce([{ address: "8.8.8.8", family: 4 }]).mockResolvedValueOnce([{ address: "10.0.0.1", family: 4 }]);
    await expect(fetchPublicCalendarText("https://calendar.school.edu/feed.ics")).rejects.toThrow("not allowed");
    expect(mocks.request).toHaveBeenCalledTimes(1);
  });
  it("bounds redirects and rejects HTTP errors", async () => {
    const redirects = Array.from({ length: 4 }, () => response([], { location: "/again" }, 302));
    serve(...redirects);
    await expect(fetchPublicCalendarText("https://calendar.school.edu/feed.ics")).rejects.toThrow("too many");
    expect(redirects.every((stream) => stream.destroyed)).toBe(true);
    serve(response([], {}, 503));
    await expect(fetchPublicCalendarText("https://calendar.school.edu/feed.ics")).rejects.toThrow("503");
  });
  it("bounds stalled DNS with the overall request deadline", async () => {
    const controller = new AbortController();
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(controller.signal);
    mocks.lookup.mockReturnValue(new Promise(() => {}));
    const pending = fetchPublicCalendarText("https://calendar.school.edu/feed.ics");
    controller.abort();
    await expect(pending).rejects.toThrow("timed out");
    expect(mocks.request).not.toHaveBeenCalled();
  });
});
