import { describe, expect, it } from "vitest";

import { signCloudinaryParameters } from "./cloudinary-signature";

describe("Cloudinary event-cover signing", () => {
  it("sorts parameters before signing", () => {
    expect(
      signCloudinaryParameters(
        { timestamp: 1_000, overwrite: true, public_id: "linkup/event-covers/test" },
        "secret"
      )
    ).toBe(
      signCloudinaryParameters(
        { public_id: "linkup/event-covers/test", timestamp: 1_000, overwrite: true },
        "secret"
      )
    );
  });

  it("changes when a signed value changes", () => {
    const first = signCloudinaryParameters({ public_id: "one", timestamp: 1 }, "secret");
    const second = signCloudinaryParameters({ public_id: "two", timestamp: 1 }, "secret");
    expect(first).not.toBe(second);
    expect(first).toMatch(/^[a-f0-9]{40}$/);
  });
});
