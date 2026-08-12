"use client";

import { usePathname } from "next/navigation";

import BottomNavigation from "./BottomNavigation";
import DesktopNavigation from "./DesktopNavigation";

const PUBLIC_PATHS = new Set([
  "/",
  "/signup",
  "/request-school",
  "/beta",
  "/profile/setup",
  "/verify-email",
]);

function usesAppChrome(pathname: string) {
  return !PUBLIC_PATHS.has(pathname) && !pathname.startsWith("/admin");
}

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (!usesAppChrome(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="app-shell min-h-svh bg-[#09090b] text-white lg:pl-[15.5rem]">
      <DesktopNavigation />
      <div className="min-h-svh">{children}</div>
      <BottomNavigation />
    </div>
  );
}
