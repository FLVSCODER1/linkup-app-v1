"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useRouter } from "next/navigation";

import { auth } from "../../lib/firebase";

interface AuthGuardProps {
  children: ReactNode;
  requireVerifiedEmail?: boolean;
}

export default function AuthGuard({
  children,
  requireVerifiedEmail = true,
}: AuthGuardProps) {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        router.replace("/");
        return;
      }

      if (requireVerifiedEmail && !firebaseUser.emailVerified) {
        router.replace("/verify-email");
        return;
      }

      setUser(firebaseUser);
      setCheckingAuth(false);
    });

    return unsubscribe;
  }, [router, requireVerifiedEmail]);

  if (checkingAuth || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-sm text-gray-400">Checking session...</p>
      </main>
    );
  }

  return <>{children}</>;
}

