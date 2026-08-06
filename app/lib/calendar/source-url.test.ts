import { describe, expect, it } from "vitest";

import { validateCalendarSourceUrl } from "./source-url";

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
  ])("rejects unsafe calendar URL %s", (url) => {
    expect(validateCalendarSourceUrl(url).valid).toBe(false);
  });
});
