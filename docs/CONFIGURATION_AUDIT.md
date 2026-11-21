# Configuration audit

Audited: November 21, 2026

This is a repository-level baseline. It does not inspect or change production
secrets, Firebase console settings, Vercel project settings, or deployed data.

## Actionable findings resolved

| Area | Finding | Resolution |
| --- | --- | --- |
| Dependencies | The lockfile used Next.js 16.3.0, which `npm audit` reported with critical remote-code-execution advisories. | Upgraded Next.js to the patched 16.4.6 release. |
| Dependencies | Firebase Admin 13.9.0 pulled vulnerable Google Cloud transitive packages. | Upgraded Firebase Admin to 14.5.1, aligned the supported runtime with Node.js 22, and pinned Firebase's client app and compatibility modules to the versions required by the installed client SDK so the browser, rules-test, and Admin dependency trees remain isolated. |
| Dependencies | Firebase's Firestore client resolved an advisory-affected `@grpc/grpc-js`. | Pinned the patched compatible transitive version, 1.14.7, through `overrides`. |
| Environment | Event-cover code requires three Cloudinary values that `.env.example` did not list. | Documented all three server-only values and added a regression test that compares application usage with `.env.example`. |
| Vercel cron | With no `CRON_SECRET`, the calendar-sync route compared against the literal string `Bearer undefined`. | Centralized bearer validation and made an absent or blank secret fail closed. |

After the dependency updates and override, `npm audit --omit=dev` reports zero
known production vulnerabilities.

## Verified configuration

- `firebase.json` versions Firestore rules and indexes and gives rules tests a
  loopback-only emulator on a fixed port.
- Rules tests use the isolated `demo-linkup` project ID; they do not read or
  mutate production data.
- `vercel.json` contains one daily calendar-sync cron route. The route requires
  `CRON_SECRET` and now rejects requests when that secret is unconfigured.
- Firebase Admin credentials, Cloudinary credentials, preview verification,
  and cron authentication are server-only variables.
- `LINKUP_PREVIEW_TEST_ACCOUNTS` is read only in Vercel preview environments.
- `/api/dev/verify-user` is available only in development or Vercel preview and
  separately requires `DEV_VERIFY_SECRET`.

## Environment inventory

| Scope | Variables |
| --- | --- |
| Public Firebase client | `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` |
| Firebase Admin | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` |
| Event covers | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| Preview-only testing | `LINKUP_PREVIEW_TEST_ACCOUNTS`, `DEV_VERIFY_SECRET` |
| Scheduled sync | `CRON_SECRET` |

Do not commit values for any of these variables. Public Firebase client
identifiers are not Admin credentials, but environment-specific values should
still point previews and local testing at a non-production project.

## Repeat the audit

```bash
npm ci
npm audit --omit=dev
npm ls --all
npm run check
```

Review Vercel and Firebase console settings manually before a pilot because
repository code cannot prove that deployed secrets, runtime versions, auth
providers, domains, rules, or indexes match this baseline.
