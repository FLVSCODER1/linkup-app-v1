import { describe, expect, it, vi } from "vitest";

import {
  createEventCoverPath,
  MAX_EVENT_COVER_SOURCE_BYTES,
  validateEventCoverSource,
} from "./cover-images";

function imageFile(type: string, size = 32) {
  return new File([new Uint8Array(size)], "cover", { type });
}

describe("event cover image validation", () => {
  it("accepts supported browser image formats", () => {
    expect(validateEventCoverSource(imageFile("image/jpeg"))).toBeNull();
    expect(validateEventCoverSource(imageFile("image/png"))).toBeNull();
    expect(validateEventCoverSource(imageFile("image/webp"))).toBeNull();
  });

  it("rejects SVG and oversized source files", () => {
    expect(validateEventCoverSource(imageFile("image/svg+xml"))).toMatch(/JPEG/);
    expect(
      validateEventCoverSource(
        imageFile("image/jpeg", MAX_EVENT_COVER_SOURCE_BYTES + 1)
      )
    ).toMatch(/smaller than 8 MB/);
  });

  it("creates unique event-scoped WebP paths", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "00000000-0000-4000-8000-000000000001"
    );
    vi.spyOn(Date, "now").mockReturnValue(1_800_000_000_000);

    expect(createEventCoverPath("spring-social-1")).toBe(
      "event-covers/spring-social-1/1800000000000-00000000-0000-4000-8000-000000000001.webp"
    );
  });
});
