import { describe, expect, it } from "vitest";

import { validateEventInput } from "./management";

const validInput = {
  title: "Robotics meetup",
  startTime: "2030-01-10T16:00",
  endTime: "2030-01-10T17:00",
  location: "Room 201",
  category: "club",
  description: "Build something fun.",
  capacity: "24",
  rsvpDeadline: "2030-01-09T16:00",
};

describe("event management validation", () => {
  it("normalizes a complete event", () => {
    const result = validateEventInput(validInput);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value.capacity).toBe(24);
      expect(result.value.location).toBe("Room 201");
    }
  });

  it("allows optional end time, deadline, and capacity", () => {
    const result = validateEventInput({
      ...validInput,
      endTime: "",
      rsvpDeadline: "",
      capacity: "",
      location: "",
    });
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.value.location).toBe("TBD");
  });

  it("rejects an end time before the start", () => {
    const result = validateEventInput({
      ...validInput,
      endTime: "2030-01-10T15:00",
    });
    expect(result).toMatchObject({ valid: false });
  });

  it("rejects an RSVP deadline after the start", () => {
    const result = validateEventInput({
      ...validInput,
      rsvpDeadline: "2030-01-10T16:01",
    });
    expect(result).toMatchObject({ valid: false });
  });

  it("rejects invalid capacities", () => {
    expect(validateEventInput({ ...validInput, capacity: "1" }).valid).toBe(false);
    expect(validateEventInput({ ...validInput, capacity: "2.5" }).valid).toBe(false);
  });
});
