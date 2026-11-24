import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { migratePrivateProfiles, migrationOptions } from "./lib/migrate-private-profiles.mjs";

async function main() {
  const options = migrationOptions(process.argv.slice(2), process.env);
  const app = initializeApp({
    projectId: options.project,
    ...(!process.env.FIRESTORE_EMULATOR_HOST ? { credential: applicationDefault() } : {}),
  });
  const db = getFirestore(app);
  try {
    console.log(JSON.stringify({ project: options.project, mode: options.apply ? "apply" : "dry-run" }));
    const counts = await migratePrivateProfiles(db, {
      apply: options.apply,
      report: (result) => console.log(JSON.stringify(result)),
    });
    console.log(JSON.stringify({ counts }));
    if (counts.conflict || counts.pending) process.exitCode = 2;
  } finally {
    await db.terminate();
  }
}

main().catch(() => {
  // SDK errors can include document contents/credentials; do not dump them.
  console.error("Migration stopped. Check options, authorized project access and connectivity; rerun the dry-run. No private values are logged.");
  process.exitCode = 1;
});
