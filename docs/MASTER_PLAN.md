# LinkUp Master Plan

Last reviewed: November 10, 2026

## Mission

LinkUp helps students discover the people, clubs, and events they were not already connected to.

It is the discovery layer for a school community, not a replacement for SportsYou, GroupMe, Instagram, or the tools clubs already use after students join.

## Competitive reality

Minga already offers a schoolwide event feed, search, calendars, attendance counts, RSVP choices, a browsable group directory, open and approval-based joining, notifications, and participation points. LinkUp cannot win by merely adding a prettier list of clubs and events.

SportsYou already owns communication and coordination inside many teams and clubs. LinkUp should not ask organizers to replace it.

LinkUp's defensible direction is:

- **More relevant:** interest-aware discovery and a clear explanation of why an event fits.
- **Less work:** calendar import, reusable organizer data, and links into tools clubs already maintain.
- **More shareable:** useful event previews and direct invitations without exposing private student data.
- **More student-first:** voluntary discovery rather than IDs, hall passes, discipline, or administrative workflows.
- **More outcome-driven:** optimize for discovery, joining, and attendance instead of points or time in the app.

## North-star outcome

Increase the number of students who discover and attend a relevant real-world activity.

Primary pilot funnel:

1. A student reaches LinkUp.
2. They find at least one relevant event or club.
3. They save, share, RSVP, or follow an external club link.
4. They attend or join.

Avoid optimizing for feed time, streaks, follower counts, or empty engagement.

## Weekly operating loop

Each weekly work session should:

1. Read this plan and inspect open pull requests before choosing work.
2. Select the highest-priority unchecked item that fits in one focused pull request.
3. Implement it on a fresh branch with tests and documentation.
4. Run the relevant unit tests, lint, typecheck, and production build.
5. Open a **draft** pull request; never merge or deploy automatically.
6. Check off the item only in the same pull request that completes it.
7. Report the pull request, validation results, and any blocker.

If an item needs a product decision, account permission, production secret, or school approval, stop and report the exact decision required. Do not guess.

## Definition of done

An item is complete only when:

- The user-visible path works on mobile and desktop.
- Loading, empty, success, permission, and network states are handled where relevant.
- Authorization is enforced on the server for private data or writes.
- Keyboard access, visible focus, reduced motion, and reasonable contrast are preserved.
- Relevant regression tests pass.
- The draft pull request explains the change and manual test steps.

## Work queue

Items are ordered. Skip an item only when it is blocked or too large for one weekly pull request; record why in the new pull request.

### P0 — Restore momentum and make growth measurable

- [x] Add search metadata, canonical URL, `robots.txt`, `sitemap.xml`, social preview, and a public 404 page. (`v0.8.0-beta.3`)
- [ ] Add privacy-respecting analytics for landing-page visits, signup starts, completed profiles, event views, saves, RSVPs, shares, and external club-link clicks.
- [ ] Add a lightweight production smoke-test checklist and automated public-route checks.
- [ ] Audit dependency, Firebase, Vercel, and environment configuration; document only actionable problems.
- [ ] Add a public status/version surface so preview and production builds are easy to identify.

### P1 — Make the core event lifecycle dependable

- [ ] Move event create, update, publish, and delete operations behind verified server endpoints.
- [ ] Finish draft UX: explicit save state, timestamps, delete confirmation, and reliable navigation.
- [ ] Prevent a new draft from accidentally overwriting a published event.
- [ ] Add event cancellation with attendee-facing status and organizer guidance.
- [ ] Add host preview and duplicate-event flows.
- [ ] Harden image uploads: HEIC support, progress, retry, replacement, and orphan cleanup.
- [ ] Run the complete create → draft → edit → publish → RSVP → cancel flow in a clean test account.

### P2 — Build the discovery wedge

- [ ] Add organizer links for SportsYou, GroupMe, Instagram, websites, and signup forms.
- [ ] Add discoverable club profiles with interests, public events, and a clear external join action.
- [ ] Let organizers reuse their club details when creating events.
- [ ] Support `.ics` import with duplicate detection and a preview before publishing.
- [ ] Add schoolwide search across event titles, clubs, categories, dates, and locations.
- [ ] Add useful filters without hiding the default discovery feed behind setup work.
- [ ] Explain recommendation reasons in plain language, such as shared interest, friend RSVP, or related club.
- [ ] Add shareable public event previews that reveal no private student data.
- [ ] Add calendar export and reminders after a student saves or RSVPs.
- [ ] Add side-by-side product checks against Minga and SportsYou before shipping discovery features; do not build parity for parity's sake.

### P3 — Improve activation and retention without addiction tricks

- [ ] Shorten onboarding to school verification, display identity, and three to five interests.
- [ ] Explain why interests are requested and allow students to skip nonessential fields.
- [ ] Add a first-session path that produces a relevant event view within two minutes.
- [ ] Add healthy reminders for saved events and meaningful organizer updates.
- [ ] Add post-event feedback focused on usefulness and attendance, not popularity.
- [ ] Add empty states that help students request a club, suggest a calendar, or create a missing event.
- [ ] Add a small referral/share loop tied to a specific event or club, not generic invites.
- [ ] Avoid participation points, streaks, and reward mechanics unless pilot evidence shows they improve real attendance without unhealthy pressure.

### P4 — Trust, safety, and privacy for a school community

- [ ] Distinguish school-email verification, verified organizer, and official school endorsement.
- [ ] Add reporting for events, profiles, and unsafe behavior with a documented review path.
- [ ] Add attendee-list visibility controls and explain them before RSVP.
- [ ] Delay precise location details when an event requires it.
- [ ] Review every profile field for necessity; keep school-scoped privacy defaults.
- [ ] Add block and moderation controls before expanding social discovery.
- [ ] Create a basic incident-response and content-removal checklist for pilot administrators.

### P5 — Complete the LinkUp design system

- [ ] Centralize semantic color, typography, spacing, radius, shadow, and motion tokens.
- [ ] Finish shared Button, Input, Select, Card, Badge, Modal, Toast, Skeleton, and Empty State components.
- [ ] Normalize navigation and content widths across authenticated routes.
- [ ] Restyle feed, event detail, RSVP, creation, drafts, and profile flows with the shared system.
- [ ] Test at 320px, 375px, 768px, and 1440px; keyboard-only; 200% zoom; and reduced motion.
- [ ] Audit accessible names, focus order, contrast, error announcements, and touch targets.
- [ ] Defer dark mode until the light theme and core flows are consistent.

### P6 — Prepare and learn from a real pilot

- [ ] Define a small pilot cohort and one responsible school contact.
- [ ] Create organizer onboarding that takes less than ten minutes.
- [ ] Seed enough real events and clubs that a new student does not see an empty product.
- [ ] Publish a concise privacy explanation, community rules, and reporting path.
- [ ] Track weekly activation: relevant event views, saves, RSVPs, external joins, and reported attendance.
- [ ] Interview students who activated, students who bounced, and organizers who stopped posting.
- [ ] Turn pilot findings into ranked fixes before expanding to another school.

## Later, only after the pilot proves demand

- Event galleries and richer post-event media
- Cross-school or district discovery
- Advanced recommendations
- Native mobile apps
- Club operations, chat, documents, or polls

Those features are deliberately later. LinkUp wins by making discovery easy, not by rebuilding every tool a club already has.

