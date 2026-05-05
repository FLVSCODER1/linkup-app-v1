"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "./lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

// ✅ Allowed domains
const allowedDomains = [
  "@students.ksd.org",
  "@ksd.org",
  "@pasco.k12.wa.us",
  "@richland.k12.wa.us",
  "@ufl.edu", // testing
];

// ✅ Email validation
function isValidSchoolEmail(email: string) {
  return allowedDomains.some((domain) =>
    email.toLowerCase().endsWith(domain)
  );
}

// ✅ Extract school name
function getSchoolFromEmail(email: string) {
  const lower = email.toLowerCase();

  if (lower.endsWith("@students.ksd.org") || lower.endsWith("@ksd.org")) {
    return "Kennewick School District";
  }
  if (lower.endsWith("@pasco.k12.wa.us")) {
    return "Pasco School District";
  }
  if (lower.endsWith("@richland.k12.wa.us")) {
    return "Richland School District";
  }
  if (lower.endsWith("@ufl.edu")) {
    return "University of Florida Test";  
  }
  if (lower.endsWith("@g.risd.org")) {
    return "University of Florida Test";
  } 

  return "Unknown School";
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  // 🔥 SIGN UP
  async function signUp() {
    try {
      if (!isValidSchoolEmail(email)) {
        setMessage("Use a valid school email.");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;
      const school = getSchoolFromEmail(email);

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        school,
        displayName: "",
        grade: "",
        profileComplete: false,
        createdAt: new Date(),
      });

      setMessage("Account created.");
      router.push("/profile");
    } catch (error: any) {
      setMessage(error.message);
    }
  }

  // 🔥 LOGIN
  async function logIn() {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const userRef = doc(db, "users", userCredential.user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      router.push("/profile");
      return;
    }

    const data = userSnap.data();

    if (!data.profileComplete) {
      router.push("/profile");
    } else if (!data.promStatus || !data.lookingFor) {
      router.push("/event");
    } else {
      router.push("/people");
    }

    setMessage("Logged in.");
  } catch (error: any) {
    setMessage(error.message);
  }
}

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white p-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
        <h1 className="mb-2 text-3xl font-bold">LinkUp</h1>
        <p className="mb-6 text-sm text-white/70">
          Sign in with your school email.
        </p>

        <input
          className="mb-3 w-full rounded-lg bg-white/10 p-3 outline-none"
          placeholder="School email"
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
            className="w-full rounded-lg bg-white p-3 font-semibold text-black"
          >
            Log in
          </button>

          <button
            onClick={signUp}
            className="w-full rounded-lg border border-white/20 p-3 font-semibold"
          >
            Sign up
          </button>
        </div>

        {message && (
          <p className="mt-4 text-sm text-white/70">{message}</p>
        )}
      </div>
    </main>
  );
}