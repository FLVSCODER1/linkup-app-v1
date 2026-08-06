"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { auth } from "../../lib/firebase";

export default function NavMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canReviewAccounts, setCanReviewAccounts] = useState(false);
  const [canReviewCalendars, setCanReviewCalendars] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setCanReviewAccounts(false);
      setCanReviewCalendars(false);
      setIsAdmin(false);
      if (!user) return;

      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/auth/admin-context", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (!response.ok) return;
        const access = (await response.json()) as {
          isAdmin?: boolean;
          canReviewAccounts?: boolean;
          canReviewCalendars?: boolean;
        };
        setIsAdmin(access.isAdmin === true);
        setCanReviewAccounts(access.canReviewAccounts === true);
        setCanReviewCalendars(access.canReviewCalendars === true);
      } catch {
        // Admin navigation is optional; protected routes still check access.
      }
    });
  }, []);

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
          {(canReviewAccounts || canReviewCalendars) && (
            <div className="mb-2 border-b border-orange-400/20 pb-2">
              <p className="px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-orange-300">
                Admin
              </p>

              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-orange-200 hover:bg-orange-400/10"
              >
                Tool directory
              </Link>

              {canReviewAccounts && (
                <Link
                  href="/admin/account-verifications"
                  onClick={() => setOpen(false)}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-orange-200 hover:bg-orange-400/10"
                >
                  Join requests
                </Link>
              )}

              {canReviewCalendars && (
                <Link
                  href="/admin/calendar-requests"
                  onClick={() => setOpen(false)}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-orange-200 hover:bg-orange-400/10"
                >
                  ICS requests
                </Link>
              )}

              {isAdmin && (
                <Link
                  href="/admin/schools"
                  onClick={() => setOpen(false)}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-orange-200 hover:bg-orange-400/10"
                >
                  School directory
                </Link>
              )}
            </div>
          )}

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
