# LinkUp verification policy

No new product feature begins until the existing feature it depends on has passed the relevant checks below. “The page loaded once” is not a test plan.

## Required gates

Every pull request must pass:

1. Unit tests for changed pure logic.
2. TypeScript (`npm run typecheck`).
3. ESLint (`npm run lint`).
4. Production compilation (`npm run build`).
5. Manual smoke tests for changed user journeys against a non-production Firebase project.

Security-sensitive changes also require Firestore Rules Emulator tests before release.

## Existing feature baseline

| Area | Feature | Automated/static coverage | Firebase/browser verification | Current status |
| --- | --- | --- | --- | --- |
| Authentication | Dynamic school-domain signup | Unit covered | Required | Partially verified |
| Authentication | Login and persisted session | Pending | Required | Not verified |
| Authentication | Email verification and resend | Pending | Required | Not verified |
| Authentication | Manual admin verification | Rules covered | Required | Partially verified |
| Authentication | Password reset | Typechecked | Required | Not verified |
| Profiles | Initial setup | Typechecked | Required | Not verified |
| Profiles | Profile editing | Typechecked | Required | Not verified |
| Events | School/district feed visibility | Unit covered | Required | Partially verified |
| Events | Event details | Typechecked | Required | Not verified |
| Events | Create event | Typechecked | Required | Not verified |
| Attendance | Join/leave event | Typechecked | Required | Not verified |
| Discovery | Feed filtering and ranking | Filter unit coverage | Required | Partially verified |
| Calendar | ICS preview import | Unit coverage pending | Required | Not verified |
| Calendar | Scheduled calendar sync | Typechecked | Required | Not verified |
| Social | Event attendee discovery | Typechecked | Required | Not verified |
| Social | Private interest signal | Typechecked | Required | Not verified |

“Not verified” is deliberate: production data is not a test fixture. These flows need a dedicated Firebase test project and test accounts before they can be marked complete.

## Test access needed

To run end-to-end verification safely, a maintainer must provide access through platform roles—not pasted credentials—to:

- A Firebase test project with Authentication and Firestore enabled.
- Firebase CLI access to deploy/test rules and use the Emulator Suite.
- A Vercel preview project or project-member invitation for deployment checks.
- Test school-domain accounts, including verified and unverified users.

Never send private keys, service-account JSON, passwords, or long-lived tokens in chat or commit them to the repository.
