# LinkUp product identity

## Mission

LinkUp helps high-school students discover, organize, and attend real-world activities with people from trusted school communities.

## Audience

LinkUp is designed for students ages 14–18 who want a simpler way to find school events, study groups, clubs, sports, volunteer opportunities, and student-organized social activities.

The school community is the trust boundary. A verified school email establishes eligibility; school, district, and event visibility rules determine what a student can access.

## What LinkUp is not

- Not a general-purpose social media feed.
- Not a dating app. People recommendations are for friendship and activity partners around a real event.
- Not a general messaging app. Communication features must support an activity, event, club, or safety workflow.
- Not a popularity contest. Public follower counts, engagement bait, and vanity metrics do not serve the mission.

## Core journey

1. A student signs in with and verifies an approved school email.
2. The student completes the minimum profile needed for safe, relevant discovery.
3. LinkUp shows upcoming events the student is allowed to see.
4. The student opens an event, understands the essential details, and joins or saves it.
5. LinkUp helps the student prepare, optionally find friends attending, and add the event to a calendar.
6. The student attends the real-world activity and can safely leave, report, or update their RSVP.

## Feature acceptance rule

A feature is accepted only when it makes it meaningfully easier or safer for students to discover, organize, or connect around real-world activities.

Before implementation, every feature must answer yes to all applicable questions:

1. Does it directly support the mission and core journey?
2. Is it appropriate and safe for 14–18-year-old students?
3. Can it respect school visibility and least-privilege access?
4. Can it be mobile-first and understandable without instructions?
5. Can it include loading, empty, success, and error states?
6. Can it be tested before the next feature begins?

If the answer is no, unclear, or “only because other social apps have it,” the feature does not ship.

## UI/UX foundation

### Visual language

- Mobile-first, calm, and high-contrast.
- Neutral dark surfaces keep event information primary; blue communicates action and trust.
- Avoid engagement-bait patterns, excessive animation, and visual clutter.

### Initial tokens

| Purpose | Value |
| --- | --- |
| App background | `#08090B` |
| Raised surface | `#13161B` |
| Primary text | `#F7F8FA` |
| Secondary text | `#A7ADB7` |
| Accent/action | `#3B82F6` |
| Success | `#22C55E` |
| Warning | `#F59E0B` |
| Danger | `#EF4444` |
| Base spacing | `4px` |
| Control radius | `12px` |
| Card radius | `20px` |

### Interaction rules

- Primary actions are reachable with one thumb and have at least a 44×44px target.
- Navigation labels remain consistent across pages.
- Motion is short, purposeful, and respects reduced-motion preferences.
- Every data view provides loading, empty, and error states.
- Destructive and safety actions require clear confirmation and plain language.

