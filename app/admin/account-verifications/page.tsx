"use client";

import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

import BackButton from "../../components/ui/BackButton";
import { auth } from "../../lib/firebase";
import type { ManualReviewMethod } from "../../lib/firestore/types";

interface VerificationRequest {
  uid: string;
  email: string;
  district: string;
  school: string;
  requestedAt: string | null;
}

const reviewMethods: Array<{ value: ManualReviewMethod; label: string }> = [
  { value: "official_roster", label: "Official roster" },
  { value: "in_person", label: "Confirmed in person" },
  { value: "school_staff_confirmation", label: "School staff confirmation" },
];

export default function AccountVerificationsAdminPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [methods, setMethods] = useState<Record<string, string>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadRequests = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;

    const token = await user.getIdToken();
    const response = await fetch("/api/admin/account-verifications", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = (await response.json()) as {
      requests?: VerificationRequest[];
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

  async function review(
    request: VerificationRequest,
    decision: "approve" | "reject"
  ) {
    const user = auth.currentUser;
    if (!user) return;

    const reviewMethod = methods[request.uid];
    if (decision === "approve" && !reviewMethod) {
      setMessage("Select how the student's eligibility was confirmed.");
      return;
    }

    setMessage("");
    const token = await user.getIdToken();
    const response = await fetch("/api/admin/account-verifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        uid: request.uid,
        decision,
        reviewMethod,
        rejectionReason: reasons[request.uid] ?? "",
      }),
    });
    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setMessage(data.error || "Review failed.");
      return;
    }

    setMessage(decision === "approve" ? "Account approved." : "Request rejected.");
    await loadRequests();
  }

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-4xl">
        <BackButton href="/events" label="Events" />
        <h1 className="text-3xl font-bold">Account verification</h1>
        <p className="mt-2 text-sm text-white/60">
          Approve only after confirming the exact student and school through an
          official source. Never approve from the email address alone.
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
            <h2 className="font-semibold">No pending requests</h2>
            <p className="mt-2 text-sm text-white/60">
              New manual-verification requests will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
            {requests.map((request) => (
              <article
                key={request.uid}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <h2 className="font-semibold">{request.email}</h2>
                <p className="mt-1 text-sm text-white/60">
                  {request.school} · {request.district}
                </p>
                <p className="mt-1 text-xs text-white/40">
                  Requested {request.requestedAt ?? "recently"}
                </p>

                <select
                  value={methods[request.uid] ?? ""}
                  onChange={(event) =>
                    setMethods((current) => ({
                      ...current,
                      [request.uid]: event.target.value,
                    }))
                  }
                  className="mt-4 w-full rounded-xl border border-white/10 bg-black p-3"
                  aria-label={`Verification method for ${request.email}`}
                >
                  <option value="">How was eligibility confirmed?</option>
                  {reviewMethods.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>

                <input
                  value={reasons[request.uid] ?? ""}
                  onChange={(event) =>
                    setReasons((current) => ({
                      ...current,
                      [request.uid]: event.target.value,
                    }))
                  }
                  placeholder="Optional rejection reason"
                  maxLength={250}
                  className="mt-3 w-full rounded-xl border border-white/10 bg-black p-3"
                />

                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => review(request, "approve")}
                    className="flex-1 rounded-xl bg-white p-3 font-semibold text-black"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => review(request, "reject")}
                    className="flex-1 rounded-xl border border-red-400/20 bg-red-400/10 p-3 font-semibold text-red-200"
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
