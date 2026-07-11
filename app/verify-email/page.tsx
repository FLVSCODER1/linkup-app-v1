"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase";
import { reload, sendEmailVerification } from "firebase/auth";
import type { SchoolDirectoryContext } from "../lib/auth/school-directory";
import { getFirebaseAuthErrorMessage } from "../lib/auth/firebase-errors";
import { hasVerifiedAccount } from "../lib/auth/verification";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);
  const [context, setContext] = useState<SchoolDirectoryContext | null>(null);
  const [schoolId, setSchoolId] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user?.email) return;

    fetch("/api/auth/school-context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email }),
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as {
          context: SchoolDirectoryContext;
        };
      })
      .then((data) => {
        if (!data) return;
        setContext(data.context);
        if (data.context.schools.length === 1) {
          setSchoolId(data.context.schools[0].id);
        }
      })
      .catch(() => undefined);
  }, []);

  async function checkVerification() {
    if (!auth.currentUser) {
      router.push("/");
      return;
    }

    setChecking(true);
    await reload(auth.currentUser);

    if (await hasVerifiedAccount(auth.currentUser, true)) {
      router.push("/profile/setup");
    } else {
      setMessage("Still not verified. Check your inbox or spam folder.");
    }

    setChecking(false);
  }

  async function resendEmail() {
    if (!auth.currentUser) {
      router.push("/");
      return;
    }

    try {
      await sendEmailVerification(auth.currentUser);
      setMessage("Verification email sent again.");
    } catch (error: unknown) {
      setMessage(
        getFirebaseAuthErrorMessage(error, "We couldn't resend the email.")
      );
    }
  }

  async function requestManualReview() {
    const user = auth.currentUser;

    if (!user || !schoolId) {
      setMessage("Select your school before requesting manual review.");
      return;
    }

    try {
      setSubmittingReview(true);
      setMessage("");
      const token = await user.getIdToken();
      const response = await fetch("/api/auth/manual-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ schoolId }),
      });
      const data = (await response.json()) as { error?: string; message?: string };

      setMessage(
        response.ok
          ? data.message || "Manual review requested."
          : data.error || "We couldn't request manual review."
      );
    } catch {
      setMessage("We couldn't request manual review.");
    } finally {
      setSubmittingReview(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black p-6 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-bold">Verify your email</h1>

        <p className="mt-3 text-sm text-white/70">
          Check your inbox, click the Firebase verification link, then come back.
          If your school blocks the message, request a manual review below.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={checkVerification}
            disabled={checking}
            className="rounded-xl bg-white px-4 py-3 font-semibold text-black"
          >
            {checking ? "Checking..." : "I verified my email"}
          </button>

          <button
            onClick={resendEmail}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white"
          >
            Resend email
          </button>
        </div>

        {context && (
          <div className="mt-8 border-t border-white/10 pt-6">
            <h2 className="text-lg font-semibold">School blocked the email?</h2>
            <p className="mt-2 text-sm text-white/60">
              Select your school. A LinkUp reviewer must confirm you through an
              official roster, school staff member, or in person.
            </p>

            <select
              value={schoolId}
              onChange={(event) => setSchoolId(event.target.value)}
              className="mt-4 w-full rounded-xl border border-white/10 bg-black px-4 py-3"
              aria-label="School for manual verification"
            >
              <option value="">Select your school</option>
              {context.schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={requestManualReview}
              disabled={submittingReview || !schoolId}
              className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-semibold disabled:opacity-50"
            >
              {submittingReview ? "Submitting..." : "Request manual review"}
            </button>
          </div>
        )}

        {message && <p className="mt-4 text-sm text-white/60">{message}</p>}
      </div>
    </main>
  );
}
