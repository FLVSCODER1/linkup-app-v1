"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { auth } from "../../lib/firebase";

type IconName = "events" | "create" | "drafts" | "profile" | "guide";

const primaryItems: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/events", label: "Events", icon: "events" },
  { href: "/events/new", label: "Create", icon: "create" },
  { href: "/events/drafts", label: "Drafts", icon: "drafts" },
  { href: "/profile", label: "Profile", icon: "profile" },
];

function NavigationIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    events: <><path d="M4 6.5h16M7 3v4M17 3v4" /><rect x="4" y="5" width="16" height="16" rx="3" /><path d="M8 11h3v3H8zM14 11h3v3h-3zM8 16h3v3H8z" /></>,
    create: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>,
    drafts: <><path d="M6 3h9l3 3v15H6z" /><path d="M14 3v4h4M9 12h6M9 16h5" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></>,
    guide: <><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H12v18H7.5A3.5 3.5 0 0 0 4 23.5zM20 5.5A3.5 3.5 0 0 0 16.5 2H12v18h4.5a3.5 3.5 0 0 1 3.5 3.5z" /></>,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

function isItemActive(pathname: string, href: string) {
  if (href === "/events") {
    return (
      (pathname.startsWith("/events") &&
        !pathname.startsWith("/events/new") &&
        !pathname.startsWith("/events/drafts")) ||
      pathname.startsWith("/people/")
    );
  }
  return pathname.startsWith(href);
}

export default function DesktopNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [adminAccess, setAdminAccess] = useState(false);

  useEffect(() => onAuthStateChanged(auth, async (user) => {
    setAdminAccess(false);
    if (!user) return;

    try {
      const response = await fetch("/api/auth/admin-context", {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
        cache: "no-store",
      });
      if (!response.ok) return;
      const access = (await response.json()) as {
        canReviewAccounts?: boolean;
        canReviewCalendars?: boolean;
        canManageSchools?: boolean;
      };
      setAdminAccess(Boolean(
        access.canReviewAccounts ||
        access.canReviewCalendars ||
        access.canManageSchools
      ));
    } catch {
      // Protected admin pages remain the source of truth for authorization.
    }
  }), []);

  async function handleSignOut() {
    await signOut(auth);
    router.replace("/");
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[15.5rem] flex-col border-r border-white/10 bg-[#09090b]/95 px-4 py-7 backdrop-blur-xl lg:flex">
      <Link href="/events" className="group mb-10 flex items-center gap-3 rounded-2xl px-3 py-2">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-[#335cff] via-[#5b55f7] to-[#ff624d] text-lg font-black shadow-[0_8px_28px_rgba(91,85,247,0.32)] transition-transform group-hover:-rotate-3 group-hover:scale-105">
          L
        </span>
        <span>
          <strong className="block text-xl tracking-tight">LinkUp</strong>
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/40">Find what fits</span>
        </span>
      </Link>

      <nav aria-label="Desktop navigation" className="space-y-2">
        {primaryItems.map((item) => {
          const active = isItemActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`group flex min-h-13 items-center gap-4 rounded-2xl px-4 text-[0.95rem] transition-all active:scale-[0.98] ${
                active
                  ? "bg-white text-black shadow-[0_8px_24px_rgba(255,255,255,0.08)]"
                  : "text-white/72 hover:bg-white/[0.07] hover:text-white"
              }`}
            >
              <NavigationIcon name={item.icon} />
              <span className={active ? "font-bold" : "font-medium"}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2 border-t border-white/10 pt-5">
        {adminAccess ? (
          <Link href="/admin" className="flex min-h-12 items-center gap-4 rounded-2xl px-4 font-semibold text-orange-300 transition hover:bg-orange-400/10 active:scale-[0.98]">
            <span aria-hidden="true" className="grid h-6 w-6 place-items-center rounded-lg border border-orange-300/50 text-xs">A</span>
            Admin tools
          </Link>
        ) : null}
        <Link href="/beta" className="flex min-h-12 items-center gap-4 rounded-2xl px-4 text-sm font-medium text-white/65 transition hover:bg-white/[0.07] hover:text-white active:scale-[0.98]">
          <NavigationIcon name="guide" />
          Beta guide
        </Link>
        <button type="button" onClick={handleSignOut} className="flex min-h-12 w-full items-center rounded-2xl px-4 text-left text-sm font-medium text-[#ff8d82] transition hover:bg-[#ff624d]/10 active:scale-[0.98]">
          Sign out
        </button>
      </div>
    </aside>
  );
}
