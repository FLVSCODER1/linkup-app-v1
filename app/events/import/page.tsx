"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import NavMenu from "../../components/NavMenu";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type ImportedEvent = {
  title: string;
  date: string;
  location?: string;
  category?: string;
  description?: string;
};

export default function ImportEventsPage() {
  const router = useRouter();

  const [school, setSchool] = useState("");
  const [rawText, setRawText] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/");
        return;
      }

      const userSnap = await getDoc(doc(db, "users", user.uid));

      if (!userSnap.exists()) {
        router.push("/profile/setup");
        return;
      }

      setSchool(userSnap.data().school || "");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  async function importEvents() {
    try {
      const user = auth.currentUser;

      if (!user) {
        setMessage("You must be logged in.");
        return;
      }

      const parsed: ImportedEvent[] = JSON.parse(rawText);

      if (!Array.isArray(parsed)) {
        setMessage("Paste a JSON array of events.");
        return;
      }

      let importedCount = 0;

      for (const event of parsed) {
        if (!event.title || !event.date) continue;

        const eventId = `${slugify(event.title)}-${Date.now()}-${importedCount}`;

        await setDoc(doc(db, "events", eventId), {
          title: event.title.trim(),
          date: event.date.trim(),
          location: event.location?.trim() || "TBD",
          category: event.category?.trim() || "other",
          description: event.description?.trim() || "",
          school,
          createdBy: user.uid,
          source: "bulk-import",
          createdAt: new Date(),
        });

        importedCount++;
      }

      setMessage(`Imported ${importedCount} events.`);
    } catch (error: unknown) {
      setMessage("Invalid JSON. Your brackets have betrayed you.");
      console.error(error);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-white/70">Loading importer...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <NavMenu />

      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-3xl font-bold">Import Events</h1>

        <p className="mb-6 text-sm text-white/70">
          Paste a JSON list of school events. This is the first version of event aggregation.
        </p>

        <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="mb-2 text-sm font-semibold">Example format:</p>

          <pre className="overflow-x-auto rounded-lg bg-black/40 p-3 text-xs text-white/70">
{`[
  {
    "title": "Calculus Study Group",
    "date": "Friday at 4 PM",
    "location": "Library",
    "category": "study",
    "description": "Review for the unit test."
  },
  {
    "title": "Football Game",
    "date": "Friday Night",
    "location": "Stadium",
    "category": "athletics",
    "description": "Home game."
  }
]`}
          </pre>
        </div>

        <textarea
          className="mb-4 min-h-72 w-full rounded-xl bg-white/10 p-4 font-mono text-sm outline-none"
          placeholder="Paste events JSON here..."
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
        />

        <button
          onClick={importEvents}
          className="w-full rounded-lg bg-white p-3 font-semibold text-black"
        >
          Import Events
        </button>

        {message && (
          <p className="mt-4 rounded-lg bg-white/10 p-3 text-sm text-white/80">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
