"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "./lib/firebase";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  setPersistence,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseAuthErrorMessage } from "./lib/auth/firebase-errors";
import { hasVerifiedAccount } from "./lib/auth/verification";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function schoolEmailIsSupported(): Promise<boolean> {
    const response = await fetch("/api/auth/school-context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setMessage(data.error || "That school email is not supported yet.");
      return false;
    }

    return true;
  }

  async function signUp() {
    try {
      setBusy(true);
      setMessage("");

      if (password.length < 8) {
        setMessage("Use a password with at least 8 characters.");
        return;
      }

      if (!(await schoolEmailIsSupported())) return;

      await setPersistence(auth, browserLocalPersistence);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await sendEmailVerification(userCredential.user);

      setMessage("Account created. Check your email to verify your account.");
      router.push("/verify-email");
    } catch (error: unknown) {
      setMessage(
        getFirebaseAuthErrorMessage(error, "We couldn't create the account.")
      );
    } finally {
      setBusy(false);
    }
  }

  async function logIn() {
    try {
      setBusy(true);
      setMessage("");

      await setPersistence(auth, browserLocalPersistence);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      await user.reload();

      if (!(await hasVerifiedAccount(user, true))) {
        router.push("/verify-email");
        return;
      }

      const userSnap = await getDoc(doc(db, "users", user.uid));

      if (!userSnap.exists()) {
        router.push("/profile/setup");
        return;
      }

      const data = userSnap.data();

      if (!data.profileComplete) {
        router.push("/profile/setup");
        return;
      }

      router.push("/events");
    } catch (error: unknown) {
      setMessage(
        getFirebaseAuthErrorMessage(error, "We couldn't log you in.")
      );
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    try {
      setBusy(true);
      setMessage("");

      if (!email.trim()) {
        setMessage("Enter your school email first.");
        return;
      }

      await sendPasswordResetEmail(auth, email.trim());
      setMessage(
        "If an account exists for that email, Firebase has sent reset instructions."
      );
    } catch (error: unknown) {
      setMessage(
        getFirebaseAuthErrorMessage(error, "We couldn't send reset instructions.")
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black p-6 text-white">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
        <h1 className="mb-2 text-4xl font-bold">LinkUp</h1>

        <p className="mb-6 text-sm text-white/70">
          Sign in with your school email.
        </p>

        <input
          className="mb-3 w-full rounded-lg bg-white/10 p-3 outline-none"
          placeholder="School email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="mb-4 w-full rounded-lg bg-white/10 p-3 outline-none"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex gap-3">
          <button
            onClick={logIn}
            disabled={busy}
            className="flex-1 rounded-lg bg-white p-3 font-semibold text-black"
          >
            Log in
          </button>

          <button
            onClick={signUp}
            disabled={busy}
            className="flex-1 rounded-lg border border-white/10 bg-white/10 p-3 font-semibold text-white"
          >
            Sign up
          </button>
        </div>

        <button
          type="button"
          onClick={resetPassword}
          disabled={busy}
          className="mt-4 w-full text-sm text-white/60 underline-offset-4 hover:text-white hover:underline disabled:opacity-50"
        >
          Forgot password?
        </button>

        {message && <p className="mt-4 text-sm text-white/70">{message}</p>}
      </div>
    </main>
  );
}
