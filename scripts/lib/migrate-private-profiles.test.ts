import { describe, expect, it } from "vitest";
import { migrationOptions, planPrivateProfile } from "./migrate-private-profiles.mjs";

describe("private profile migration planning", () => {
  it("moves only private fields and preserves their values", () => {
    expect(planPrivateProfile({ email: "student@example.edu", lastName: "Student", school: "Alpha" })).toEqual({
      fields: ["email", "lastName"], copy: { email: "student@example.edu", lastName: "Student" }, conflicts: [],
    });
  });
  it("never overwrites a conflicting private value", () => {
    expect(planPrivateProfile({ email: "a@example.edu" }, { email: "b@example.edu" }).conflicts).toEqual(["email"]);
  });
  it("handles clean records, equal copies, and malformed fields safely", () => {
    expect(planPrivateProfile({ school: "Alpha" }).fields).toEqual([]);
    expect(planPrivateProfile({ lastName: "Student" }, { lastName: "Student" }).copy).toEqual({});
    expect(planPrivateProfile({ email: null }).conflicts).toEqual(["email"]);
  });
  it("requires explicit project and live-write confirmation/backup", () => {
    expect(() => migrationOptions([], {})).toThrow();
    expect(migrationOptions(["--project=linkup-test"], {})).toEqual({ project: "linkup-test", apply: false });
    expect(() => migrationOptions(["--project=linkup-test", "--apply"], {})).toThrow();
    expect(() => migrationOptions(["--project=linkup-test", "--apply", "--confirm-project=linkup-test"], {})).toThrow();
    expect(migrationOptions(["--project=linkup-test", "--apply", "--confirm-project=linkup-test", "--backup-reference=approved-backup"], {}).apply).toBe(true);
  });
  it("rejects unsafe emulator targets and unknown options", () => {
    expect(() => migrationOptions(["--project=demo-linkup"], { FIRESTORE_EMULATOR_HOST: "remote:8080" })).toThrow();
    expect(() => migrationOptions(["--project=linkup-live"], { FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080" })).toThrow();
    expect(() => migrationOptions(["--project=demo-linkup", "--force"], {})).toThrow();
  });
});
