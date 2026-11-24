import { FieldPath, FieldValue } from "firebase-admin/firestore";

const FIELDS = ["email", "lastName"];

export function planPrivateProfile(publicData, privateData = {}) {
  const fields = FIELDS.filter((field) => Object.hasOwn(publicData, field));
  const copy = {};
  const conflicts = [];
  for (const field of fields) {
    const value = publicData[field];
    if (typeof value !== "string" || !value.trim()) {
      conflicts.push(field);
    } else if (Object.hasOwn(privateData, field) && privateData[field] !== value) {
      conflicts.push(field);
    } else if (!Object.hasOwn(privateData, field)) {
      copy[field] = value;
    }
  }
  return { fields, copy, conflicts };
}

// Read both documents again in each transaction so retries never use stale data.
export async function migrateProfile(db, uid, apply = false) {
  const publicRef = db.collection("users").doc(uid);
  const privateRef = db.collection("privateUserProfiles").doc(uid);
  return db.runTransaction(async (transaction) => {
    const [publicSnapshot, privateSnapshot] = await transaction.getAll(publicRef, privateRef);
    const plan = planPrivateProfile(publicSnapshot.data() ?? {}, privateSnapshot.data() ?? {});
    if (!plan.fields.length) return { uid, status: "clean", fields: [] };
    if (plan.conflicts.length) return { uid, status: "conflict", fields: plan.conflicts };
    if (apply) {
      transaction.set(privateRef, {
        ...plan.copy,
        ...(!privateSnapshot.exists ? { uid, createdAt: FieldValue.serverTimestamp() } : {}),
        privacyMigratedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      transaction.update(publicRef, Object.fromEntries(plan.fields.map((field) => [field, FieldValue.delete()])));
    }
    return { uid, status: apply ? "migrated" : "pending", fields: plan.fields };
  });
}

export async function migratePrivateProfiles(db, { apply = false, report = () => {} } = {}) {
  const counts = { clean: 0, pending: 0, conflict: 0, migrated: 0 };
  let cursor;
  while (true) {
    let query = db.collection("users").orderBy(FieldPath.documentId()).limit(100);
    if (cursor) query = query.startAfter(cursor);
    const page = await query.get();
    if (page.empty) break;
    for (const document of page.docs) {
      const result = await migrateProfile(db, document.id, apply);
      counts[result.status]++;
      report(result); // IDs, status and field names only; never field values.
    }
    cursor = page.docs.at(-1).id;
  }
  return counts;
}

export function migrationOptions(args, env) {
  const values = new Map();
  for (const argument of args) {
    const [name, ...parts] = argument.split("=");
    if (!["--project", "--apply", "--confirm-project", "--backup-reference"].includes(name) || values.has(name)) {
      throw new Error("Unknown or duplicate migration option.");
    }
    values.set(name, parts.join("=") || true);
  }
  const project = values.get("--project");
  if (typeof project !== "string" || !/^[a-z][a-z0-9-]{4,62}$/.test(project)) {
    throw new Error("An explicit --project=PROJECT_ID is required.");
  }
  const apply = values.has("--apply");
  if (apply && values.get("--apply") !== true) throw new Error("Use --apply without a value.");
  if (apply && values.get("--confirm-project") !== project) {
    throw new Error("Writes require --confirm-project matching --project.");
  }
  const emulator = env.FIRESTORE_EMULATOR_HOST;
  if (emulator && !/^(127\.0\.0\.1|localhost):\d+$/.test(emulator)) {
    throw new Error("Only a loopback Firestore emulator is allowed.");
  }
  if (emulator && !project.startsWith("demo-")) {
    throw new Error("Emulator runs must use a demo- project ID.");
  }
  if (!emulator && apply && typeof values.get("--backup-reference") !== "string") {
    throw new Error("Live writes require an approved --backup-reference=REFERENCE.");
  }
  return { project, apply };
}
