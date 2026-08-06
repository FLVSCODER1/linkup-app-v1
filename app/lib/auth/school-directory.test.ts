import { describe, expect, it } from "vitest";

import {
  getEmailDomain,
  normalizeDistrictData,
  normalizeSchoolDomainData,
  normalizeSchoolData,
  validateSchoolSelection,
  type SchoolDirectoryContext,
} from "./school-directory";

describe("school directory validation", () => {
  it("normalizes valid school email domains", () => {
    expect(getEmailDomain(" Student@G.RISD.ORG ")).toBe("g.risd.org");
  });

  it("rejects malformed email addresses and domain tricks", () => {
    expect(getEmailDomain("student@g.risd.org.example.com")).toBe(
      "g.risd.org.example.com"
    );
    expect(getEmailDomain("student@@g.risd.org")).toBeNull();
    expect(getEmailDomain("student@gmail")).toBeNull();
    expect(getEmailDomain("not-an-email")).toBeNull();
  });

  it("accepts only active, complete district records", () => {
    expect(
      normalizeDistrictData({
        active: true,
        name: " Richardson ISD ",
      })
    ).toEqual({
      active: true,
      name: "Richardson ISD",
    });

    expect(
      normalizeDistrictData({
        active: false,
        name: "Disabled District",
      })
    ).toBeNull();
  });

  it("normalizes active domain mappings", () => {
    expect(
      normalizeSchoolDomainData({
        active: true,
        districtId: " risd ",
        schoolId: " rhs ",
      })
    ).toEqual({ active: true, districtId: "risd", schoolId: "rhs" });

    expect(
      normalizeSchoolDomainData({ active: false, districtId: "risd" })
    ).toBeNull();
  });

  it("keeps only active schools in the resolved district", () => {
    expect(
      normalizeSchoolData(
        "richardson-high",
        { active: true, districtId: "risd", name: "Richardson High School" },
        "risd"
      )
    ).toEqual({ id: "richardson-high", name: "Richardson High School" });

    expect(
      normalizeSchoolData(
        "other-school",
        { active: true, districtId: "other", name: "Other High School" },
        "risd"
      )
    ).toBeNull();
  });

  it("rejects a school selection outside the approved directory", () => {
    const context: SchoolDirectoryContext = {
      domain: "g.risd.org",
      districtId: "risd",
      districtName: "Richardson ISD",
      schools: [{ id: "rhs", name: "Richardson High School" }],
      fixedSchoolId: null,
    };

    expect(validateSchoolSelection(context, "rhs")?.name).toBe(
      "Richardson High School"
    );
    expect(validateSchoolSelection(context, "not-rhs")).toBeNull();
  });
});
