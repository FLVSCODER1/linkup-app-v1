import { describe, expect, it } from "vitest";
import { canKeepSchoolAssignment } from "./school-assignment";

const school = { schoolId: "alpha", districtId: "district", school: "Alpha", district: "District" };

describe("school assignment", () => {
  it("allows initial setup and ordinary edits", () => {
    expect(canKeepSchoolAssignment(undefined, school)).toBe(true);
    expect(canKeepSchoolAssignment(school, school)).toBe(true);
  });
  it("rejects school and district changes including legacy assignments", () => {
    expect(canKeepSchoolAssignment({ schoolId: "beta" }, school)).toBe(false);
    expect(canKeepSchoolAssignment({ districtId: "other" }, school)).toBe(false);
    expect(canKeepSchoolAssignment({ school: "Beta" }, school)).toBe(false);
  });
});
