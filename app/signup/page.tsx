"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  setPersistence,
} from "firebase/auth";
import AuthLandingShell from "../components/auth/AuthLandingShell";
import { getFirebaseAuthErrorMessage } from "../lib/auth/firebase-errors";
import { validateSignupForm } from "../lib/auth/signup-validation";
import { auth } from "../lib/firebase";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [unsupportedSchool, setUnsupportedSchool] = useState(false);
  const [busy, setBusy] = useState(false);

  async function schoolEmailIsSupported(): Promise<boolean> {
    const response = await fetch("/api/auth/school-context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setMessage(data.error || "That school email is not supported yet.");
      setUnsupportedSchool(response.status === 404);
      return false;
    }

    setUnsupportedSchool(false);
    return true;
  }

  async function signUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setUnsupportedSchool(false);

    const validation = validateSignupForm(email, password, confirmPassword);
    if (!validation.valid) {
      setMessage(validation.message);
      return;
    }

    try {
      setBusy(true);

      if (!(await schoolEmailIsSupported())) return;

      await setPersistence(auth, browserLocalPersistence);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      await sendEmailVerification(userCredential.user);
      router.push("/verify-email");
    } catch (error: unknown) {
      setMessage(
        getFirebaseAuthErrorMessage(error, "We couldn't create the account.")
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLandingShell>
      <div className="rounded-[2rem] border border-[#d9deec] bg-white/95 p-6 shadow-[0_28px_80px_rgba(37,48,107,0.14)] backdrop-blur sm:p-8">
        <div className="mb-7">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-[#ff6b4a]">
            Join your school
          </p>
          <h2 className="text-3xl font-black tracking-[-0.035em] text-[#17203d]">
            Create your account
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#66718a]">
            Use your school-issued email. We&apos;ll verify it before you can
            enter LinkUp.
          </p>
        </div>

        <form className="space-y-5" onSubmit={signUp}>
          <label className="block text-sm font-bold text-[#25306b]">
            School email
            <input
              className="mt-2 w-full rounded-xl border border-[#cfd5e6] bg-[#f7f8fc] px-4 py-3.5 text-base text-[#17203d] outline-none transition placeholder:text-[#8b94a9] focus:border-[#5b5fef] focus:ring-4 focus:ring-[#5b5fef]/15"
              placeholder="you@school.edu"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setUnsupportedSchool(false);
              }}
            />
          </label>

          <label className="block text-sm font-bold text-[#25306b]">
            Password
            <input
              className="mt-2 w-full rounded-xl border border-[#cfd5e6] bg-[#f7f8fc] px-4 py-3.5 text-base text-[#17203d] outline-none transition placeholder:text-[#8b94a9] focus:border-[#5b5fef] focus:ring-4 focus:ring-[#5b5fef]/15"
              placeholder="At least 8 characters"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <label className="block text-sm font-bold text-[#25306b]">
            Confirm password
            <input
              className="mt-2 w-full rounded-xl border border-[#cfd5e6] bg-[#f7f8fc] px-4 py-3.5 text-base text-[#17203d] outline-none transition placeholder:text-[#8b94a9] focus:border-[#5b5fef] focus:ring-4 focus:ring-[#5b5fef]/15"
              placeholder="Enter it again"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-[#5b5fef] px-4 py-3.5 font-extrabold text-white shadow-[0_10px_28px_rgba(91,95,239,0.24)] transition hover:bg-[#4f5de4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25306b] disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div className="my-6 h-px bg-[#e4e7f0]" />

        <p className="text-center text-sm text-[#66718a]">
          Already have an account?{" "}
          <Link
            href="/"
            className="font-extrabold text-[#25306b] underline decoration-[#ff6b4a] decoration-2 underline-offset-4 hover:text-[#5b5fef] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#5b5fef]"
          >
            Log in
          </Link>
        </p>

        {message && (
          <div
            aria-live="polite"
            className="mt-5 rounded-xl bg-[#fff1f0] px-4 py-3 text-sm font-medium leading-6 text-[#b42318]"
          >
            <p>{message}</p>
            {unsupportedSchool && (
              <Link
                href={`/request-school?email=${encodeURIComponent(email.trim())}`}
                className="mt-3 inline-flex rounded-lg bg-[#ff6b4a] px-4 py-2 font-extrabold text-white shadow-sm transition hover:bg-[#e95c3e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25306b]"
              >
                Request my school
              </Link>
            )}
          </div>
        )}
      </div>
    </AuthLandingShell>
  );
}
