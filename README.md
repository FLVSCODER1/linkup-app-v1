# LinkUp

LinkUp helps high-school students discover, organize, and attend real-world activities with people from trusted school communities.

The app is a Next.js 16 application backed by Firebase Authentication and Firestore. It is currently in stabilization: product identity is locked, but the existing feature set must be verified against a dedicated Firebase test project before new features are considered complete.

## Product guardrails

- Audience: students ages 14–18.
- Purpose: school events, study groups, clubs, sports, volunteering, and student-organized social activities.
- Not a general social feed, dating app, or general messaging app.
- Every feature must improve discovery, organization, connection around a real activity, or student safety.

See [docs/PRODUCT.md](docs/PRODUCT.md) for the complete product identity and acceptance rule.

## Local development

Requirements:

- Node.js 20 or newer
- npm
- Access to a non-production Firebase project for integration tests

Install and run:

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

Copy `.env.example` to `.env.local` and fill values from the test environment. Never commit credentials.

Firebase Admin variables are loaded lazily at request time. Public pages and production compilation therefore work without Admin credentials; Admin-backed API routes still require valid runtime configuration.

## Verification

Run the full local gate:

```bash
npm run check
```

That command runs unit tests, strict lint, TypeScript, and a production build. It does not replace the Firebase/browser smoke tests in [docs/TESTING.md](docs/TESTING.md).

## Key commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run test` | Run unit tests once |
| `npm run lint` | Run ESLint with zero warnings allowed |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm run build` | Create a production build |
| `npm run check` | Run every local quality gate |

## Current constraints

- End-to-end authentication, Firestore, calendar-sync, and RSVP flows still require a dedicated Firebase test project.
- Firestore feed indexes are versioned in `firestore.indexes.json` and must be deployed to each Firebase environment. Firestore rules still need to be recovered, audited, tested, and committed before launch.
- `/api/dev/verify-user` is a preview/development-only test helper and must never be enabled in production.
