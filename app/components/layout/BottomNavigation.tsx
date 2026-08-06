"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PUBLIC_PATHS = new Set(["/", "/beta", "/profile/setup", "/verify-email"]);

const items = [
  { href: "/events", label: "Events", icon: "◉" },
  { href: "/events/new", label: "Create", icon: "+" },
  { href: "/profile", label: "Profile", icon: "○" },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  if (PUBLIC_PATHS.has(pathname) || pathname.startsWith("/admin")) return null;

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur"
    >
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
        {items.map((item) => {
          const active =
            item.href === "/events"
              ? pathname === "/events"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-12 flex-col items-center justify-center rounded-xl text-xs font-medium transition ${
                active
                  ? "bg-white text-black"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span aria-hidden="true" className="text-base leading-none">
                {item.icon}
              </span>
              <span className="mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
