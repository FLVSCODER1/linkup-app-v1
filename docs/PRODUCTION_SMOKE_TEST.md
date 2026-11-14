# LinkUp Production Smoke Test

Use this checklist after a production deployment or before inviting a new pilot group. It deliberately avoids creating accounts, submitting forms, or changing production data.

## Automated public checks

Test the local production build:

```bash
npm run build
npm run test:smoke
```

Test the current production deployment without starting a local server:

```bash
SMOKE_BASE_URL=https://link-up-v1.vercel.app npm run test:smoke
```

The automated check verifies:

- Landing, signup, school-request, and beta pages return HTML successfully.
- Search metadata, the canonical tag, and the Open Graph image tag are present.
- `robots.txt`, `sitemap.xml`, and the generated social image are available with the expected content types.
- An unknown route returns the public 404 page without a `Sign out` control.

## Manual production checklist

Run these checks in a private browser window on both a phone-sized viewport and a desktop viewport.

### Public experience

- [ ] The landing page loads without horizontal scrolling or a visible error.
- [ ] Login, password reset, signup, and request-school controls are keyboard reachable and visibly focused.
- [ ] Signup explains that a school-issued email is required.
- [ ] An unsupported school offers the request-school path without creating an account.
- [ ] A nonsense URL shows the public 404 page and no authenticated navigation.
- [ ] The social preview image opens directly and contains no student information.

### Authenticated pilot account

Use a dedicated test account. Do not use another student's account or production credentials in screenshots.

- [ ] A verified test account reaches the event feed.
- [ ] An unverified test account is stopped at email verification.
- [ ] Event cards and details do not expose another school's private data.
- [ ] Drafts are visible only to their host and **Continue editing** opens the correct draft.
- [ ] Logout returns to the public landing page and protected routes require authentication again.

### Deployment evidence

- [ ] GitHub validation and the Vercel production deployment both succeeded for the same commit.
- [ ] The production URL serves the expected release, not a preview or stale branch.
- [ ] Browser console and Vercel logs show no new repeated error during the tested paths.
- [ ] Record the commit, date, device/browser, and any failed step in the pull request or release notes.

## Stop conditions

Do not continue a pilot rollout if any test reveals cross-school data, another user's draft, a secret in client output, a broken authentication boundary, or an unexplained production/preview mismatch. Preserve the failing route and timestamp, restrict access if necessary, and fix the boundary before testing more features.
