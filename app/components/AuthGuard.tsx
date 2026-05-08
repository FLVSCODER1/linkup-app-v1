"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase";

type AuthGuardProps = {
  children: React.ReactNode;
  requireVerifiedEmail?: boolean;
};

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
        router.push("/login");
        return;
      }

      if (requireVerifiedEmail && !firebaseUser.emailVerified) {
        router.push("/verify-email");
        return;
      }

      setUser(firebaseUser);
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router, requireVerifiedEmail]);

  if (checkingAuth || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-sm text-gray-400">Checking session...</p>
      </main>
    );
  }

  return <>{children}</>;
}