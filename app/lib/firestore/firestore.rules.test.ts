import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

const projectId = "demo-linkup";
let testEnvironment: RulesTestEnvironment;

function firestoreFor(
  uid: string,
  claims: Record<string, unknown> = { email_verified: true }
) {
  return testEnvironment
    .authenticatedContext(uid, {
      email: `${uid}@students.example.org`,
      ...claims,
    })
    .firestore();
}

function hostEventData(overrides: Record<string, unknown> = {}) {
  return {
    title: "Robotics meetup",
    description: "Build something fun.",
    location: "Room 201",
    category: "club",
    createdBy: "alpha-student",
    status: "published",
    visibility: "school",
    district: "Test District",
    school: "Alpha High",
    capacity: 24,
    startTime: Timestamp.fromDate(new Date("2030-01-10T16:00:00Z")),
    endTime: null,
    rsvpDeadline: null,
    hostName: "Alpha Student",
    source: "user-posted",
    imported: false,
    attendeeCount: 0,
    moderationStatus: "pending",
    suppressionReason: null,
    relevanceScore: 0,
    aiCategory: null,
    reviewedAt: null,
    reviewedBy: null,
    createdAt: Timestamp.fromDate(new Date("2029-12-01T16:00:00Z")),
    updatedAt: Timestamp.fromDate(new Date("2029-12-01T16:00:00Z")),
    publishedAt: Timestamp.fromDate(new Date("2029-12-01T16:00:00Z")),
    ...overrides,
  };
}

async function seedData() {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await Promise.all([
      setDoc(doc(db, "users", "alpha-student"), {
        uid: "alpha-student",
        email: "alpha-student@students.example.org",
        displayName: "Alpha Student",
        grade: "10",
        bio: "",
        interests: [],
        profileComplete: true,
        district: "Test District",
        school: "Alpha High",
      }),
      setDoc(doc(db, "users", "beta-student"), {
        uid: "beta-student",
        email: "beta-student@students.example.org",
        displayName: "Beta Student",
        grade: "10",
        bio: "",
        interests: [],
        profileComplete: true,
        district: "Test District",
        school: "Beta High",
      }),
      setDoc(doc(db, "users", "other-district"), {
        uid: "other-district",
        email: "other-district@students.example.org",
        displayName: "Other Student",
        grade: "10",
        bio: "",
        interests: [],
        profileComplete: true,
        district: "Other District",
        school: "Other High",
      }),
      setDoc(doc(db, "privateUserProfiles", "alpha-student"), {
        uid: "alpha-student",
        lastName: "Student",
      }),
      setDoc(doc(db, "admins", "alpha-student"), {
        isAdmin: true,
      }),
      setDoc(doc(db, "calendarImportRequests", "calendar-request"), {
        requestedBy: "alpha-student",
        status: "pending",
      }),
      setDoc(doc(db, "calendarSources", "calendar-source"), {
        active: true,
        sourceType: "ics",
      }),
      setDoc(doc(db, "events", "alpha-school-event"), {
        createdBy: "system",
        status: "published",
        visibility: "school",
        district: "Test District",
        school: "Alpha High",
        startTime: Timestamp.fromDate(new Date("2030-01-01T12:00:00Z")),
      }),
      setDoc(doc(db, "events", "beta-school-event"), {
        createdBy: "system",
        status: "published",
        visibility: "school",
        district: "Test District",
        school: "Beta High",
        startTime: Timestamp.fromDate(new Date("2030-01-02T12:00:00Z")),
      }),
      setDoc(doc(db, "events", "district-event"), {
        createdBy: "system",
        status: "published",
        visibility: "district",
        district: "Test District",
        school: null,
        startTime: Timestamp.fromDate(new Date("2030-01-03T12:00:00Z")),
      }),
      setDoc(doc(db, "events", "other-district-event"), {
        createdBy: "system",
        status: "published",
        visibility: "district",
        district: "Other District",
        school: null,
        startTime: Timestamp.fromDate(new Date("2030-01-04T12:00:00Z")),
      }),
      setDoc(doc(db, "events", "alpha-draft"), {
        createdBy: "alpha-student",
        status: "draft",
        visibility: "school",
        district: "Test District",
        school: "Alpha High",
        startTime: Timestamp.fromDate(new Date("2030-01-05T12:00:00Z")),
      }),
      setDoc(doc(db, "eventPreferences", "alpha-student_alpha-school-event"), {
        userId: "alpha-student",
        eventId: "alpha-school-event",
        school: "Alpha High",
        attendanceStatus: "going",
        connectionGoal: "friends",
      }),
      setDoc(doc(db, "eventPreferences", "beta-student_beta-school-event"), {
        userId: "beta-student",
        eventId: "beta-school-event",
        school: "Beta High",
        attendanceStatus: "going",
        connectionGoal: "friends",
      }),
    ]);
  });
}

beforeAll(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

beforeEach(async () => {
  await testEnvironment.clearFirestore();
  await seedData();
});

afterAll(async () => {
  await testEnvironment.cleanup();
});

describe("LinkUp Firestore trust boundaries", () => {
  it("denies an account without email or manual verification", async () => {
    const db = firestoreFor("alpha-student", { email_verified: false });
    await assertFails(getDoc(doc(db, "users", "alpha-student")));
  });

  it("accepts an audited manual-verification claim", async () => {
    const db = firestoreFor("alpha-student", {
      email_verified: false,
      linkup_verified: true,
    });
    await assertSucceeds(getDoc(doc(db, "users", "alpha-student")));
  });

  it("keeps legal surnames unavailable to Firestore clients", async () => {
    const ownerDb = firestoreFor("alpha-student");
    const peerDb = firestoreFor("beta-student");

    await assertFails(
      getDoc(doc(ownerDb, "privateUserProfiles", "alpha-student"))
    );
    await assertFails(
      getDoc(doc(peerDb, "privateUserProfiles", "alpha-student"))
    );
  });

  it("keeps admin and calendar moderation records server-only", async () => {
    const db = firestoreFor("alpha-student");

    await assertFails(getDoc(doc(db, "admins", "alpha-student")));
    await assertFails(
      getDoc(doc(db, "calendarImportRequests", "calendar-request"))
    );
    await assertFails(getDoc(doc(db, "calendarSources", "calendar-source")));
  });

  it("allows school and district events but denies other schools and districts", async () => {
    const db = firestoreFor("alpha-student");

    await assertSucceeds(getDoc(doc(db, "events", "alpha-school-event")));
    await assertSucceeds(getDoc(doc(db, "events", "district-event")));
    await assertFails(getDoc(doc(db, "events", "beta-school-event")));
    await assertFails(getDoc(doc(db, "events", "other-district-event")));
  });

  it("allows only the host to read an unpublished draft", async () => {
    const hostDb = firestoreFor("alpha-student");
    const peerDb = firestoreFor("beta-student");

    await assertSucceeds(getDoc(doc(hostDb, "events", "alpha-draft")));
    await assertFails(getDoc(doc(peerDb, "events", "alpha-draft")));
  });

  it("authorizes the district feed query used by the app", async () => {
    const db = firestoreFor("alpha-student");
    const districtFeed = query(
      collection(db, "events"),
      where("district", "==", "Test District"),
      where("visibility", "==", "district"),
      where("status", "==", "published"),
      where("startTime", ">=", Timestamp.fromDate(new Date("2029-01-01"))),
      orderBy("startTime", "asc")
    );

    await assertSucceeds(getDocs(districtFeed));
  });

  it("allows verified hosts to create school or district events", async () => {
    const db = firestoreFor("alpha-student");

    await assertSucceeds(
      setDoc(doc(db, "events", "host-school-event"), hostEventData())
    );
    await assertSucceeds(
      setDoc(
        doc(db, "events", "host-district-event"),
        hostEventData({ visibility: "district" })
      )
    );
  });

  it("rejects unsupported or forged event visibility identity", async () => {
    const db = firestoreFor("alpha-student");

    await assertFails(
      setDoc(
        doc(db, "events", "host-public-event"),
        hostEventData({ visibility: "public" })
      )
    );
    await assertFails(
      setDoc(
        doc(db, "events", "host-wrong-school-event"),
        hostEventData({ visibility: "district", school: "Beta High" })
      )
    );
    await assertFails(
      setDoc(
        doc(db, "events", "host-wrong-district-event"),
        hostEventData({ visibility: "district", district: "Other District" })
      )
    );
  });

  it("rejects forged host moderation state and unexpected fields", async () => {
    const db = firestoreFor("alpha-student");

    await assertFails(
      setDoc(
        doc(db, "events", "host-forged-approval"),
        hostEventData({ moderationStatus: "approved" })
      )
    );
    await assertFails(
      setDoc(
        doc(db, "events", "host-forged-reviewer"),
        hostEventData({ reviewedBy: "alpha-student" })
      )
    );
    await assertFails(
      setDoc(
        doc(db, "events", "host-unexpected-field"),
        hostEventData({ adminApproved: true })
      )
    );
  });

  it("rejects malformed host event dates and categories", async () => {
    const db = firestoreFor("alpha-student");

    await assertFails(
      setDoc(
        doc(db, "events", "host-invalid-category"),
        hostEventData({ category: "announcement" })
      )
    );
    await assertFails(
      setDoc(
        doc(db, "events", "host-invalid-end"),
        hostEventData({
          endTime: Timestamp.fromDate(new Date("2030-01-10T15:00:00Z")),
        })
      )
    );
    await assertFails(
      setDoc(
        doc(db, "events", "host-invalid-deadline"),
        hostEventData({
          rsvpDeadline: Timestamp.fromDate(new Date("2030-01-10T17:00:00Z")),
        })
      )
    );
  });

  it("lets hosts switch visibility without changing school identity", async () => {
    const db = firestoreFor("alpha-student");
    const eventRef = doc(db, "events", "host-visibility-event");

    await assertSucceeds(setDoc(eventRef, hostEventData()));
    await assertSucceeds(updateDoc(eventRef, { visibility: "district" }));
    await assertSucceeds(updateDoc(eventRef, { visibility: "school" }));
    await assertFails(updateDoc(eventRef, { visibility: "public" }));
    await assertFails(updateDoc(eventRef, { school: "Beta High" }));
    await assertFails(updateDoc(eventRef, { district: "Other District" }));
  });

  it("keeps identity assignment server-only and school fields immutable", async () => {
    const db = firestoreFor("alpha-student");

    await assertFails(
      setDoc(doc(db, "users", "new-student"), {
        uid: "new-student",
        email: "new-student@students.example.org",
        district: "Test District",
        school: "Alpha High",
      })
    );

    await assertSucceeds(
      updateDoc(doc(db, "users", "alpha-student"), {
        displayName: "Updated Student",
      })
    );

    await assertFails(
      updateDoc(doc(db, "users", "alpha-student"), {
        school: "Beta High",
      })
    );
  });

  it("keeps attendance and preference writes behind the server transaction", async () => {
    const db = firestoreFor("alpha-student");

    await assertFails(
      setDoc(
        doc(db, "events", "alpha-school-event", "attendees", "alpha-student"),
        { uid: "alpha-student", school: "Alpha High" }
      )
    );
    await assertFails(
      setDoc(doc(db, "eventPreferences", "new-preference"), {
        userId: "alpha-student",
        eventId: "alpha-school-event",
        school: "Alpha High",
        attendanceStatus: "going",
        connectionGoal: "friends",
      })
    );
  });

  it("limits RSVP preference discovery to the viewer's school", async () => {
    const db = firestoreFor("alpha-student");

    await assertSucceeds(
      getDocs(
        query(
          collection(db, "eventPreferences"),
          where("eventId", "==", "alpha-school-event"),
          where("school", "==", "Alpha High")
        )
      )
    );
    await assertFails(
      getDoc(doc(db, "eventPreferences", "beta-student_beta-school-event"))
    );
  });

  it("lets users save events only inside their own profile", async () => {
    const alphaDb = firestoreFor("alpha-student");

    await assertSucceeds(
      setDoc(
        doc(alphaDb, "users", "alpha-student", "savedEvents", "alpha-school-event"),
        {
          uid: "alpha-student",
          eventId: "alpha-school-event",
          savedAt: Timestamp.now(),
        }
      )
    );
    await assertFails(
      setDoc(
        doc(alphaDb, "users", "beta-student", "savedEvents", "beta-school-event"),
        {
          uid: "alpha-student",
          eventId: "beta-school-event",
          savedAt: Timestamp.now(),
        }
      )
    );
  });
});
