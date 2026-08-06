"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

import BackButton from "../components/ui/BackButton";
import { auth } from "../lib/firebase";

interface AdminAccess {
  isAdmin: boolean;
  canReviewAccounts: boolean;
  canReviewCalendars: boolean;
}

interface AdminTool {
  href: string;
  title: string;
  description: string;
}

export default function AdminDirectoryPage() {
  const router = useRouter();
  const [access, setAccess] = useState<AdminAccess | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/");
        return;
      }

      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/auth/admin-context", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = (await response.json()) as AdminAccess & { error?: string };
        if (!response.ok) throw new Error(data.error || "Access denied.");

        if (
          !data.isAdmin &&
          !data.canReviewAccounts &&
          !data.canReviewCalendars
        ) {
          setMessage("This account does not have admin access.");
          return;
        }

        setAccess(data);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Access denied.");
      }
    });
  }, [router]);

  const tools: AdminTool[] = access
    ? [
        ...(access.canReviewAccounts
          ? [
              {
                href: "/admin/account-verifications",
                title: "Join requests",
                description: "Approve students whose school blocked verification email.",
              },
            ]
          : []),
        ...(access.canReviewCalendars
          ? [
              {
                href: "/admin/calendar-requests",
                title: "ICS requests",
                description: "Preview and approve submitted school calendars.",
              },
            ]
          : []),
        ...(access.isAdmin
          ? [
              {
                href: "/admin/schools",
                title: "School directory",
                description: "Manage districts, schools, and approved email domains.",
              },
            ]
          : []),
      ]
    : [];

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-3xl">
        <BackButton href="/events" label="Events" />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-bold">Tool directory</h1>
        <p className="mt-2 text-sm text-white/60">
          Available administrative pages and their direct URLs.
        </p>

        {!access && !message && (
          <p className="mt-8 text-white/60">Checking admin access...</p>
        )}

        {message && (
          <p role="alert" className="mt-8 rounded-xl bg-red-500/10 p-4 text-red-100">
            {message}
          </p>
        )}

        {access && (
          <div className="mt-8 grid gap-4">
            {tools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="rounded-2xl border border-orange-400/20 bg-orange-400/5 p-5 transition hover:border-orange-300/40 hover:bg-orange-400/10"
              >
                <h2 className="font-semibold text-orange-100">{tool.title}</h2>
                <code className="mt-2 block text-sm text-orange-300">
                  {tool.href}
                </code>
                <p className="mt-2 text-sm text-white/60">{tool.description}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
