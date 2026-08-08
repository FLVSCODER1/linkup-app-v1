"use client";

import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

import BackButton from "../../components/ui/BackButton";
import { auth } from "../../lib/firebase";
import { slugifyDirectoryId } from "../../lib/auth/school-request";

interface SchoolRequest {
  id: string;
  domain: string;
  schoolName: string;
  city: string;
  state: string;
  districtName: string | null;
  officialWebsite: string;
  calendarUrl: string | null;
  requestCount: number;
  requestedAt: string | null;
  lastRequestedAt: string | null;
}

interface DirectoryDraft {
  districtId: string;
  districtName: string;
  schoolId: string;
  schoolName: string;
  domainScope: "school" | "district";
  rejectionReason: string;
}

function initialDraft(request: SchoolRequest): DirectoryDraft {
  const districtName = request.districtName ?? `${request.city} School District`;
  return {
    districtId: slugifyDirectoryId(districtName),
    districtName,
    schoolId: slugifyDirectoryId(request.schoolName),
    schoolName: request.schoolName,
    domainScope: "school",
    rejectionReason: "",
  };
}

export default function SchoolRequestsAdminPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<SchoolRequest[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DirectoryDraft>>({});
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [message, setMessage] = useState("");

  const loadRequests = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;

    const token = await user.getIdToken();
    const response = await fetch("/api/admin/school-requests", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = (await response.json()) as {
      requests?: SchoolRequest[];
      error?: string;
    };
    if (!response.ok) throw new Error(data.error || "Access denied.");

    const nextRequests = data.requests ?? [];
    setRequests(nextRequests);
    setDrafts((current) => {
      const next = { ...current };
      for (const request of nextRequests) {
        next[request.id] ??= initialDraft(request);
      }
      return next;
    });
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

  function updateDraft(
    id: string,
    field: keyof DirectoryDraft,
    value: DirectoryDraft[keyof DirectoryDraft]
  ) {
    setDrafts((current) => ({
      ...current,
      [id]: { ...current[id], [field]: value },
    }));
  }

  async function review(request: SchoolRequest, decision: "approve" | "reject") {
    const user = auth.currentUser;
    const draft = drafts[request.id];
    if (!user || !draft) return;

    setWorkingId(request.id);
    setMessage("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/school-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: request.id,
          decision,
          districtId: draft.districtId,
          districtName: draft.districtName,
          schoolId: draft.schoolId,
          schoolName: draft.schoolName,
          domainScope: draft.domainScope,
          rejectionReason: draft.rejectionReason,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Review failed.");

      setMessage(
        decision === "approve"
          ? `${request.schoolName} is now supported.`
          : "School request rejected."
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
      <div className="mx-auto max-w-5xl">
        <BackButton href="/admin" label="Admin tools" />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-bold">School requests</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
          Confirm the official website and email domain before approval. The
          suggested IDs can be edited; approval activates the district, school,
          and domain together.
        </p>

        {message && (
          <p role="status" className="mt-5 rounded-xl bg-white/10 p-4 text-sm">
            {message}
          </p>
        )}

        {loading ? (
          <p className="mt-8 text-white/60">Loading school requests...</p>
        ) : requests.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-semibold">No pending school requests</h2>
            <p className="mt-2 text-sm text-white/60">
              Unsupported signup domains will send nominations here.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5">
            {requests.map((request) => {
              const draft = drafts[request.id] ?? initialDraft(request);
              return (
                <article
                  key={request.id}
                  className="rounded-2xl border border-orange-400/20 bg-orange-400/5 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-orange-100">
                        {request.schoolName}
                      </h2>
                      <p className="mt-1 text-sm text-white/60">
                        {request.city}, {request.state} · {request.domain}
                      </p>
                    </div>
                    <span className="rounded-full bg-orange-300/10 px-3 py-1 text-xs font-bold text-orange-200">
                      {request.requestCount} request
                      {request.requestCount === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                    <a
                      href={request.officialWebsite}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-orange-300 underline"
                    >
                      Official website
                    </a>
                    {request.calendarUrl && (
                      <a
                        href={request.calendarUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all text-orange-300 underline"
                      >
                        Suggested calendar
                      </a>
                    )}
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-white/60">
                      District ID
                      <input
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black p-3 text-sm text-white"
                        value={draft.districtId}
                        onChange={(event) =>
                          updateDraft(request.id, "districtId", event.target.value)
                        }
                      />
                    </label>
                    <label className="text-xs font-semibold text-white/60">
                      District name
                      <input
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black p-3 text-sm text-white"
                        value={draft.districtName}
                        onChange={(event) =>
                          updateDraft(request.id, "districtName", event.target.value)
                        }
                      />
                    </label>
                    <label className="text-xs font-semibold text-white/60">
                      School ID
                      <input
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black p-3 text-sm text-white"
                        value={draft.schoolId}
                        onChange={(event) =>
                          updateDraft(request.id, "schoolId", event.target.value)
                        }
                      />
                    </label>
                    <label className="text-xs font-semibold text-white/60">
                      School name
                      <input
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black p-3 text-sm text-white"
                        value={draft.schoolName}
                        onChange={(event) =>
                          updateDraft(request.id, "schoolName", event.target.value)
                        }
                      />
                    </label>
                  </div>

                  <label className="mt-3 block text-xs font-semibold text-white/60">
                    Email-domain scope
                    <select
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black p-3 text-sm text-white"
                      value={draft.domainScope}
                      onChange={(event) =>
                        updateDraft(
                          request.id,
                          "domainScope",
                          event.target.value === "district" ? "district" : "school"
                        )
                      }
                    >
                      <option value="school">This school only</option>
                      <option value="district">Shared across the district</option>
                    </select>
                  </label>

                  <input
                    className="mt-3 w-full rounded-xl border border-white/10 bg-black p-3 text-sm text-white"
                    value={draft.rejectionReason}
                    maxLength={250}
                    onChange={(event) =>
                      updateDraft(
                        request.id,
                        "rejectionReason",
                        event.target.value
                      )
                    }
                    placeholder="Optional rejection reason"
                  />

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={workingId === request.id}
                      onClick={() => review(request, "approve")}
                      className="rounded-xl bg-orange-300 p-3 font-semibold text-black disabled:opacity-50"
                    >
                      Approve and activate
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
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
