import { describe, expect, it } from "vitest";

import { isAuthorizedBearer } from "./bearer-secret";

describe("isAuthorizedBearer", () => {
  it("accepts the configured bearer secret", () => {
    expect(isAuthorizedBearer("Bearer cron-secret", "cron-secret")).toBe(true);
  });

  it("rejects missing configuration even when the header says undefined", () => {
    expect(isAuthorizedBearer("Bearer undefined", undefined)).toBe(false);
    expect(isAuthorizedBearer("Bearer ", "   ")).toBe(false);
  });

  it("rejects missing and mismatched authorization headers", () => {
    expect(isAuthorizedBearer(null, "cron-secret")).toBe(false);
    expect(isAuthorizedBearer("Bearer wrong-secret", "cron-secret")).toBe(
      false
    );
  });
});
