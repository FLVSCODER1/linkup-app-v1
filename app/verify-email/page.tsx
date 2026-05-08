"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase";
import { reload, sendEmailVerification } from "firebase/auth";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);

  async function checkVerification() {
    if (!auth.currentUser) {
      router.push("/");
      return;
    }

    setChecking(true);
    await reload(auth.currentUser);

    if (auth.currentUser.emailVerified) {
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

    await sendEmailVerification(auth.currentUser);
    setMessage("Verification email sent again.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black p-6 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-bold">Verify your email</h1>

        <p className="mt-3 text-sm text-white/70">
          Check your inbox, click the Firebase verification link, then come back.
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

        {message && <p className="mt-4 text-sm text-white/60">{message}</p>}
      </div>
    </main>
  );
}