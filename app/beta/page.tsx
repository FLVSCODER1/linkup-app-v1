"use client";

import { useRouter } from "next/navigation";

export default function BetaPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 py-6 pb-28">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        {/* Header */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-4 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-300 transition hover:bg-white/10"
          >
            ← Back
          </button>

          <p className="mb-2 text-sm font-medium text-blue-300">
            LinkUp closed beta
          </p>

          <h1 className="text-3xl font-bold tracking-tight">
            Help test LinkUp before launch
          </h1>

          <p className="mt-3 text-sm leading-6 text-neutral-300">
            This beta is for checking whether event discovery, joining events,
            matching with classmates, and school-based filtering actually work
            in real life instead of only surviving on localhost, where apps go
            to lie.
          </p>
        </section>

        {/* Tester instructions */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">What testers should do</h2>

          <div className="mt-4 space-y-3 text-sm text-neutral-300">
            <ChecklistItem text="Sign in using a verified school email." />
            <ChecklistItem text="Complete onboarding and profile setup." />
            <ChecklistItem text="Browse the event feed and open event detail pages." />
            <ChecklistItem text="Join at least one event and set preferences." />
            <ChecklistItem text="Check whether the people page only shows relevant classmates." />
            <ChecklistItem text="Try importing a calendar file if you have one." />
            <ChecklistItem text="Report anything confusing, broken, slow, ugly, or suspicious." />
          </div>
        </section>

        {/* Known issues */}
        <section className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5">
          <h2 className="text-xl font-semibold text-yellow-100">
            Known beta issues
          </h2>

          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-yellow-50/90">
            <li>Some matching results may feel basic while the algorithm improves.</li>
            <li>Attendee previews may change as event activity updates.</li>
            <li>Calendar importing may not support every ICS format perfectly yet.</li>
            <li>Moderation tools are planned but not fully built out yet.</li>
            <li>The mobile UI is still being polished across every page.</li>
          </ul>
        </section>

        {/* Safety */}
        <section className="rounded-3xl border border-red-400/20 bg-red-400/10 p-5">
          <h2 className="text-xl font-semibold text-red-100">
            Safety reminder
          </h2>

          <p className="mt-3 text-sm leading-6 text-red-50/90">
            LinkUp is designed for school-based event discovery, not random
            public social networking. During beta, only interact with people you
            recognize from your school community, avoid sharing private
            information, and report anything that feels unsafe or inappropriate.
          </p>
        </section>

        {/* Feedback */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">Beta feedback</h2>

          <p className="mt-3 text-sm leading-6 text-neutral-300">
            Use this section to collect feedback from testers. Replace the
            placeholder link later with a Google Form, Airtable form, or in-app
            feedback route when you are ready.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => alert("Feedback form coming soon.")}
              className="rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400"
            >
              Give feedback
            </button>

            <button
              type="button"
              onClick={() => alert("Issue reporting coming soon.")}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Report an issue
            </button>
          </div>
        </section>

        {/* Beta checklist */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">Founder checklist</h2>

          <div className="mt-4 space-y-3 text-sm text-neutral-300">
            <ChecklistItem text="Test account creation with a school email." />
            <ChecklistItem text="Confirm unverified users cannot access protected pages." />
            <ChecklistItem text="Confirm users only see same-school events and people." />
            <ChecklistItem text="Create 5 to 10 realistic test events." />
            <ChecklistItem text="Invite a small trusted tester group first." />
            <ChecklistItem text="Collect screenshots when bugs happen." />
            <ChecklistItem text="Track bugs by route, device, browser, and user action." />
          </div>
        </section>
      </div>
    </main>
  );
}

function ChecklistItem({ text }: { text: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs text-blue-200">
        ✓
      </div>
      <p className="leading-6">{text}</p>
    </div>
  );
}