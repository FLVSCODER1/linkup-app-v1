import { describe, expect, it } from "vitest";
import { usesAppChrome } from "./AppChrome";

describe("AppChrome route selection", () => {
  it.each([
    "/events",
    "/events/new",
    "/event/example",
    "/matches/example",
    "/people",
    "/profile",
  ])("shows authenticated navigation on %s", (pathname) => {
    expect(usesAppChrome(pathname)).toBe(true);
  });

  it.each([
    "/",
    "/signup",
    "/request-school",
    "/beta",
    "/profile/setup",
    "/verify-email",
    "/admin",
    "/robots.txt",
    "/missing-page",
    "/eventual",
  ])("does not show authenticated navigation on %s", (pathname) => {
    expect(usesAppChrome(pathname)).toBe(false);
  });
});
