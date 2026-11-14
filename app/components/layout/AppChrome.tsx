"use client";

import { usePathname } from "next/navigation";

import BottomNavigation from "./BottomNavigation";
import DesktopNavigation from "./DesktopNavigation";

const APP_CHROME_PATHS = ["/event", "/events", "/matches", "/people", "/profile"];

const PUBLIC_PATHS = new Set(["/profile/setup"]);

export function usesAppChrome(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) {
    return false;
  }

  return APP_CHROME_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
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
