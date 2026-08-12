import { describe, expect, it } from "vitest";

import { buildOwnedDraftEvents, buildOwnedEditableEvent } from "./drafts";

describe("buildOwnedDraftEvents", () => {
  it("returns only the current host's drafts in newest-first order", () => {
    const drafts = buildOwnedDraftEvents(
      [
        {
          id: "older-draft",
          data: {
            createdBy: "host",
            status: "draft",
            title: "Older",
            updatedAt: new Date("2026-08-10T12:00:00Z"),
          },
        },
        {
          id: "published",
          data: {
            createdBy: "host",
            status: "published",
            title: "Published",
          },
        },
        {
          id: "other-host",
          data: {
            createdBy: "someone-else",
            status: "draft",
            title: "Private",
          },
        },
        {
          id: "newer-draft",
          data: {
            createdBy: "host",
            status: "draft",
            title: "Newer",
            updatedAt: { toDate: () => new Date("2026-08-11T12:00:00Z") },
          },
        },
      ],
      "host"
    );

    expect(drafts.map((draft) => draft.id)).toEqual([
      "newer-draft",
      "older-draft",
    ]);
  });
});

describe("buildOwnedEditableEvent", () => {
  it("serializes the host's draft for the edit form", () => {
    const event = buildOwnedEditableEvent(
      {
        id: "draft-id",
        data: {
          createdBy: "host",
          status: "draft",
          title: "Robotics meetup",
          description: "Bring a laptop.",
          location: "Room 201",
          category: "club",
          visibility: "school",
          startTime: { toDate: () => new Date("2030-01-10T22:00:00Z") },
          endTime: new Date("2030-01-10T23:00:00Z"),
          capacity: 24,
          rsvpDeadline: null,
          publishedAt: null,
          coverImageUrl: "https://example.com/cover.jpg",
        },
      },
      "host"
    );

    expect(event).toMatchObject({
      id: "draft-id",
      title: "Robotics meetup",
      status: "draft",
      startTime: "2030-01-10T22:00:00.000Z",
      capacity: 24,
    });
  });

  it("does not expose another host's event", () => {
    expect(
      buildOwnedEditableEvent(
        {
          id: "private-draft",
          data: { createdBy: "someone-else", status: "draft" },
        },
        "host"
      )
    ).toBeNull();
  });
});
