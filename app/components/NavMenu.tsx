"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";

export default function NavMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await signOut(auth);
    router.push("/");
  }

  function goTo(path: string) {
    setOpen(false);
    router.push(path);
  }

  return (
    <div className="fixed right-4 top-4 z-50">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
      >
        Menu
      </button>

      {open && (
        <div className="mt-2 w-44 rounded-xl border border-white/10 bg-black p-2 shadow-xl">
          <button
            onClick={() => goTo("/events")}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-white/10"
          >
            Events
          </button>

          <button
            onClick={() => goTo("/people")}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-white/10"
          >
            People
          </button>

          <button
            onClick={() => goTo("/profile")}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-white/10"
          >
            Profile
          </button>

          <button
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