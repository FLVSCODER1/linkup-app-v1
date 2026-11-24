# Privacy-boundary remediation

Profile setup now stores email only in `privateUserProfiles` and atomically
removes the public email field when a user saves their profile. Existing school
assignments cannot be changed through profile setup, including legacy name-only
assignments. Transfers and directory renames require administrator review.

Firestore denies schoolmate reads of legacy profiles containing `email` or
`lastName`. Owners retain access. This intentionally fails closed: some existing
people/profile screens may show a permission error until those profiles are
cleaned. Do not weaken the rule to restore access.

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
