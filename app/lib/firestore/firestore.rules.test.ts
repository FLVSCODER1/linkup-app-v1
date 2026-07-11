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

  it("allows school and district events but denies other schools and districts", async () => {
    const db = firestoreFor("alpha-student");

    await assertSucceeds(getDoc(doc(db, "events", "alpha-school-event")));
    await assertSucceeds(getDoc(doc(db, "events", "district-event")));
    await assertFails(getDoc(doc(db, "events", "beta-school-event")));
    await assertFails(getDoc(doc(db, "events", "other-district-event")));
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
});
