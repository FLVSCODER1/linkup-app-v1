import { describe, expect, it, vi } from "vitest";

import { TimeoutError, withTimeout } from "./with-timeout";

describe("withTimeout", () => {
  it("returns a result that finishes before the deadline", async () => {
    await expect(withTimeout(Promise.resolve("done"), 100, "late")).resolves.toBe(
      "done"
    );
  });

  it("rejects a request that exceeds the deadline", async () => {
    vi.useFakeTimers();
    const result = withTimeout(new Promise<string>(() => undefined), 100, "late");
    const expectation = expect(result).rejects.toEqual(
      new TimeoutError("late")
    );

    await vi.advanceTimersByTimeAsync(100);
    await expectation;
    vi.useRealTimers();
  });
});
