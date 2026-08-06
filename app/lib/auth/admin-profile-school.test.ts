import { describe, expect, it } from "vitest";

import { resolveAssignedAdminSchoolContext } from "./admin-profile-school";

const profile = {
  email: "niver.l@ufl.edu",
  districtId: "richardson-isd",
  district: "Richardson Independent School District",
  schoolId: "richardson-high",
  school: "Richardson High School",
};

describe("assigned admin school context", () => {
  it("uses the existing school assignment for an exact admin UID profile", () => {
    expect(
      resolveAssignedAdminSchoolContext(
        { isAdmin: true },
        profile,
        "NIVER.L@UFL.EDU"
      )
    ).toEqual({
      domain: "ufl.edu",
      districtId: "richardson-isd",
      districtName: "Richardson Independent School District",
      schools: [{ id: "richardson-high", name: "Richardson High School" }],
      fixedSchoolId: "richardson-high",
    });
  });

  it("rejects the same profile when the UID is not an admin", () => {
    expect(
      resolveAssignedAdminSchoolContext(
        { isAdmin: false },
        profile,
        "niver.l@ufl.edu"
      )
    ).toBeNull();
  });

  it("rejects an admin profile whose stored email does not match", () => {
    expect(
      resolveAssignedAdminSchoolContext(
        { isAdmin: true },
        profile,
        "someone-else@ufl.edu"
      )
    ).toBeNull();
  });

  it("rejects incomplete school assignments", () => {
    expect(
      resolveAssignedAdminSchoolContext(
        { isAdmin: true },
        { ...profile, schoolId: "" },
        "niver.l@ufl.edu"
      )
    ).toBeNull();
  });
});
