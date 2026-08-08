import { describe, expect, it } from "vitest";

import { resolveAdminAccess } from "./admin";

describe("resolveAdminAccess", () => {
  it("grants every admin capability from the Firebase boolean", () => {
    expect(resolveAdminAccess({ isAdmin: true })).toEqual({
      isAdmin: true,
      canReviewAccounts: true,
      canReviewCalendars: true,
      canManageSchools: true,
    });
  });

  it("does not trust inactive or malformed records", () => {
    expect(resolveAdminAccess({ isAdmin: false, roles: ["account_reviewer"] })).toEqual({
      isAdmin: false,
      canReviewAccounts: false,
      canReviewCalendars: false,
      canManageSchools: false,
    });
  });

  it("keeps existing limited reviewer records working", () => {
    expect(
      resolveAdminAccess({ active: true, roles: ["account_reviewer"] })
    ).toEqual({
      isAdmin: false,
      canReviewAccounts: true,
      canReviewCalendars: false,
      canManageSchools: false,
    });
  });

  it("supports limited school-directory administrators", () => {
    expect(
      resolveAdminAccess({ active: true, roles: ["school_directory_admin"] })
    ).toEqual({
      isAdmin: false,
      canReviewAccounts: false,
      canReviewCalendars: false,
      canManageSchools: true,
    });
  });
});
