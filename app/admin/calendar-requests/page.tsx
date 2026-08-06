"use client";

import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

import BackButton from "../../components/ui/BackButton";
import { auth } from "../../lib/firebase";

interface CalendarRequest {
  id: string;
  requesterEmail: string;
  district: string;
  school: string;
  sourceUrl: string;
  requestedAt: string | null;
}

export default function CalendarRequestsAdminPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<CalendarRequest[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [message, setMessage] = useState("");

  const loadRequests = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;

    const token = await user.getIdToken();
    const response = await fetch("/api/admin/calendar-requests", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = (await response.json()) as {
      requests?: CalendarRequest[];
      error?: string;
    };
    if (!response.ok) throw new Error(data.error || "Access denied.");
    setRequests(data.requests ?? []);
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/");
        return;
      }

      try {
        await loadRequests();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Access denied.");
      } finally {
        setLoading(false);
      }
    });
  }, [loadRequests, router]);

  async function preview(request: CalendarRequest) {
    const user = auth.currentUser;
    if (!user) return;

    setWorkingId(request.id);
    setMessage("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/import-ics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: request.sourceUrl }),
      });
      const data = (await response.json()) as {
        events?: Array<{ title: string }>;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || "Preview failed.");

      const events = data.events ?? [];
      const sample = events
        .slice(0, 3)
        .map((event) => event.title)
        .join(" · ");
      setPreviews((current) => ({
        ...current,
        [request.id]: `${events.length} events${sample ? `: ${sample}` : ""}`,
      }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Preview failed.");
    } finally {
      setWorkingId("");
    }
  }

  async function review(request: CalendarRequest, decision: "approve" | "reject") {
    const user = auth.currentUser;
    if (!user) return;

    setWorkingId(request.id);
    setMessage("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/calendar-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: request.id,
          decision,
          rejectionReason: reasons[request.id] ?? "",
        }),
      });
      const data = (await response.json()) as {
        eventCount?: number;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || "Review failed.");

      setMessage(
        decision === "approve"
          ? `Calendar approved (${data.eventCount ?? 0} events detected).`
          : "Calendar request rejected."
      );
      await loadRequests();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Review failed.");
    } finally {
      setWorkingId("");
    }
  }

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-4xl">
        <BackButton href="/events" label="Events" />
        <h1 className="text-3xl font-bold">ICS requests</h1>
        <p className="mt-2 text-sm text-white/60">
          Preview every source before approving it. Approved calendars begin
          syncing for the requester&apos;s school.
        </p>

        {message && (
          <p role="status" className="mt-5 rounded-xl bg-white/10 p-4 text-sm">
            {message}
          </p>
        )}

        {loading ? (
          <p className="mt-8 text-white/60">Loading requests...</p>
        ) : requests.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-semibold">No pending ICS requests</h2>
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
            {requests.map((request) => (
              <article
                key={request.id}
                className="rounded-2xl border border-orange-400/20 bg-orange-400/5 p-5"
              >
                <h2 className="font-semibold text-orange-100">{request.school}</h2>
                <p className="mt-1 text-sm text-white/60">
                  {request.district} · {request.requesterEmail}
                </p>
                <a
                  href={request.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 block break-all text-sm text-orange-300 underline"
                >
                  {request.sourceUrl}
                </a>
                {previews[request.id] && (
                  <p className="mt-3 text-sm text-white/70">{previews[request.id]}</p>
                )}

                <input
                  value={reasons[request.id] ?? ""}
                  onChange={(event) =>
                    setReasons((current) => ({
                      ...current,
                      [request.id]: event.target.value,
                    }))
                  }
                  placeholder="Optional rejection reason"
                  maxLength={250}
                  className="mt-4 w-full rounded-xl border border-white/10 bg-black p-3"
                />

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    disabled={workingId === request.id}
                    onClick={() => preview(request)}
                    className="rounded-xl border border-orange-400/30 p-3 font-semibold text-orange-200 disabled:opacity-50"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    disabled={workingId === request.id}
                    onClick={() => review(request, "approve")}
                    className="rounded-xl bg-orange-300 p-3 font-semibold text-black disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={workingId === request.id}
                    onClick={() => review(request, "reject")}
                    className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 font-semibold text-red-200 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
