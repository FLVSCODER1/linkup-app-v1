"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "./lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const allowedDomains = [
  "@students.ksd.org",
  "@ksd.org",
  "@pasco.k12.wa.us",
  "@richland.k12.wa.us",
  "@ufl.edu",
  "@g.risd.org",
];

function isValidSchoolEmail(email: string) {
  const clean = email.trim().toLowerCase();
  return allowedDomains.some((domain) => clean.endsWith(domain));
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function signUp() {
    try {
      setMessage("");

      if (!isValidSchoolEmail(email)) {
        setMessage("Use a valid school email.");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await sendEmailVerification(userCredential.user);

      setMessage("Account created. Check your email to verify your account.");
      router.push("/verify-email");
    } catch (error: any) {
      setMessage(error.message || "Failed to create account.");
    }
  }

  async function logIn() {
    try {
      setMessage("");

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      await user.reload();

      if (!user.emailVerified) {
        await sendEmailVerification(user);
        setMessage("Verification email sent. Check your inbox.");
        router.push("/verify-email");
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

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
    } catch (error: any) {
      setMessage(error.message || "Failed to log in.");
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
            className="flex-1 rounded-lg bg-white p-3 font-semibold text-black"
          >
            Log in
          </button>

          <button
            onClick={signUp}
            className="flex-1 rounded-lg border border-white/10 bg-white/10 p-3 font-semibold text-white"
          >
            Sign up
          </button>
        </div>

        {message && <p className="mt-4 text-sm text-white/70">{message}</p>}
      </div>
    </main>
  );
}