import { describe, expect, it } from "vitest";

import { getSchoolContext, isAllowedSchoolEmail } from "./schools";

describe("school email lookup", () => {
  it("accepts an approved domain case-insensitively", () => {
    expect(isAllowedSchoolEmail(" Student@G.RISD.ORG ")).toBe(true);
    expect(getSchoolContext("student@g.risd.org")).toEqual({
      district: "Richardson Independent School District",
      school: null,
    });
  });

  it("rejects suffix tricks and unsupported domains", () => {
    expect(isAllowedSchoolEmail("student@g.risd.org.example.com")).toBe(false);
    expect(isAllowedSchoolEmail("student@gmail.com")).toBe(false);
    expect(isAllowedSchoolEmail("not-an-email")).toBe(false);
  });
});
