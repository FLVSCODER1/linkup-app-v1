"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PeopleRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/events");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <p className="text-white/70">Redirecting to events...</p>
    </main>
  );
}