"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";

import { auth } from "../../lib/firebase";

export default function NavMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await signOut(auth);
    router.replace("/");
  }

  return (
    <div className="fixed right-4 top-4 z-50">
      <button
        type="button"
        aria-expanded={open}
        aria-label="Toggle navigation menu"
        onClick={() => setOpen((current) => !current)}
        className="rounded-lg border border-white/10 bg-black/80 px-4 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/10"
      >
        Menu
      </button>

      {open && (
        <div className="mt-2 w-44 rounded-xl border border-white/10 bg-black p-2 shadow-xl">
          <Link
            href="/events"
            onClick={() => setOpen(false)}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-white/10"
          >
            Events
          </Link>

          <Link
            href="/beta"
            onClick={() => setOpen(false)}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-white/10"
          >
            Beta guide
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-white/10"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

