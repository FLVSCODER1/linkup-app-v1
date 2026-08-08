import { describe, expect, it } from "vitest";

import { slugifyDirectoryId, validateSchoolRequest } from "./school-request";

describe("school request validation", () => {
  it("normalizes a complete school request", () => {
    expect(
      validateSchoolRequest({
        email: " Student@Eagles.ISD.org ",
        schoolName: "  Eagle High School ",
        city: " Allen ",
        state: "tx",
        districtName: " Eagle ISD ",
        officialWebsite: "www.eaglesisd.org/high-school",
        calendarUrl: "https://www.eaglesisd.org/calendar#activities",
      })
    ).toEqual({
      valid: true,
      value: {
        email: "student@eagles.isd.org",
        schoolName: "Eagle High School",
        city: "Allen",
        state: "TX",
        districtName: "Eagle ISD",
        officialWebsite: "https://www.eaglesisd.org/high-school",
        calendarUrl: "https://www.eaglesisd.org/calendar",
        domain: "eagles.isd.org",
      },
    });
  });

  it("rejects personal email domains", () => {
    expect(
      validateSchoolRequest({
        email: "student@gmail.com",
        schoolName: "Eagle High School",
        city: "Allen",
        state: "TX",
        officialWebsite: "https://www.eaglesisd.org",
      })
    ).toEqual({
      valid: false,
      message: "Use an official school-issued email, not a personal inbox.",
    });
  });

  it("rejects unsafe or incomplete websites", () => {
    expect(
      validateSchoolRequest({
        email: "student@eaglesisd.org",
        schoolName: "Eagle High School",
        city: "Allen",
        state: "TX",
        officialWebsite: "http://localhost:3000",
      })
    ).toEqual({
      valid: false,
      message: "Enter a valid official school website.",
    });
  });

  it("creates stable directory IDs", () => {
    expect(slugifyDirectoryId("  Richardson Independent School District ")).toBe(
      "richardson-independent-school-district"
    );
  });
});
