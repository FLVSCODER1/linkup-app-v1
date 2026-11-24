# Privacy-boundary remediation

Profile setup now stores email only in `privateUserProfiles` and atomically
removes the public email field when a user saves their profile. Existing school
assignments cannot be changed through profile setup, including legacy name-only
assignments. Transfers and directory renames require administrator review.

Schoolmate profile reads retain school/district query constraints. A field-based
legacy-document guard is NOT used: Firestore rules are not filters, and that
guard would reject profile-list queries even after migration. This means legacy
emails remain exposed until migration, so this PR must not roll out without the
coordinated process below.

Before pilot rollout, an authorized maintainer must approve and execute a
backed-up, dry-run-first migration moving existing public emails/legal surnames
to private profiles and removing the public fields. No production migration or
data deletion is performed by this PR. Client queries must be tested against
migrated test data; Firestore rules do not filter unsafe documents out of queries.

Interest signals require a verified sender, a different same-school/district
recipient, an accessible published event, canonical document identity, and a
server timestamp. Updates cannot take over another sender's record or change
its recipient/event. Blocking and moderation remain required before expanding
social discovery.

## Coordinated rollout (authorized maintainer only)

1. Rehearse with a non-production project and synthetic legacy profiles. Run
   `npm run test:rules` for atomic migration, retry, conflict and peer-query tests.
2. Approve a maintenance window and verified recoverable backup of both `users`
   and `privateUserProfiles`. Pause profile writes using the platform's approved
   maintenance process, not a client-only banner. If writes cannot be paused,
   stop: old deployments could reintroduce public fields during cleanup.
3. Use configured Application Default Credentials with least-privilege access.
   The tool does not read `.env.local` or accept pasted service-account keys.
   Confirm the project ID with the maintainer; never infer it from a fallback.
4. Dry-run, saving the ID-only report in an access-controlled location:

   ```bash
   npm run migrate:private-profiles -- --project=YOUR_PROJECT_ID
   ```

   Exit 2 means pending records or conflicts, 1 means an operational failure,
   and 0 means no remaining public fields. Reports contain document IDs, field
   names and counts, never private values. Resolve conflicts manually through
   an approved process; the script never overwrites differing private values or
   deletes malformed public fields. A dry-run performs no writes.
5. Only after backup verification and explicit approval, apply:

   ```bash
   npm run migrate:private-profiles -- --project=YOUR_PROJECT_ID --apply --confirm-project=YOUR_PROJECT_ID --backup-reference=APPROVED_BACKUP_REFERENCE
   ```

   The reference is an operator acknowledgement, not automatic backup creation
   or verification. Each profile is handled in one transaction, preserving all
   unrelated fields. Existing equal private values are preserved. Process 100
   records per page, sequentially, to bound memory and write load.
6. Repeat the dry-run until exit 0. If interrupted, fix the operational issue
   and rerun: completed profiles are no-ops. Conflicts leave the entire student's
   pair of documents untouched. Do not log or paste private values for review.
7. While writes remain paused, deploy the privacy-safe profile writer and rules
   together through the normal approved release process. Verify peer listing,
   owner setup/edit, cross-school denial, and private-document denial with test
   accounts. Repeat the dry-run, then reopen writes and monitor for recurrence.

The script itself never deploys, backs up, restores or modifies credentials.
Rollback must never restore emails into public documents. If app rollback is
needed, keep profile writes paused until a privacy-safe writer is available.
