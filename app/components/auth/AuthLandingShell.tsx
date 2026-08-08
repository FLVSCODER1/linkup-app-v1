import type { ReactNode } from "react";
import RotatingHook from "./RotatingHook";

type AuthLandingShellProps = {
  children: ReactNode;
};

export default function AuthLandingShell({
  children,
}: AuthLandingShellProps) {
  return (
    <main className="relative min-h-svh overflow-hidden bg-[#f7f8fc] px-4 py-8 text-[#17203d] sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="absolute -left-24 -top-20 h-72 w-72 rounded-full border border-[#5b5fef]/10"
      />
      <div
        aria-hidden="true"
        className="absolute -right-28 top-12 h-96 w-96 rounded-full bg-[#e9ecff]/80 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-[-8rem] left-[18%] h-80 w-80 rounded-full bg-[#ff6b4a]/8 blur-3xl"
      />

      <div className="relative mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <section className="relative mx-auto w-full max-w-xl lg:mx-0">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <div className="auth-drift absolute -left-14 top-10 h-52 w-52 rounded-[38%_62%_55%_45%] bg-[#d9d4ff]/55 blur-3xl" />
            <div className="auth-float absolute -right-2 top-0 h-28 w-28 rotate-12 rounded-[2.25rem] border-2 border-[#5b5fef]/12" />
            <div className="auth-float-delayed absolute right-12 top-36 h-3 w-3 rounded-full bg-[#ff6b4a]/65 shadow-[24px_32px_0_rgba(91,95,239,0.22),-18px_54px_0_rgba(255,107,74,0.16)]" />
            <div className="auth-orbit absolute -left-7 bottom-6 h-20 w-20 -rotate-12 rounded-full border border-dashed border-[#5b5fef]/20" />
          </div>

          <p className="mb-8 text-sm font-extrabold tracking-[0.34em] text-[#25306b]">
            LINKUP
          </p>

          <RotatingHook />

          <p className="mt-7 max-w-lg text-base leading-7 text-[#52607a] sm:text-lg">
            Discover what&apos;s happening at your school, RSVP, and meet
            students who are into the same things you are.
          </p>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-[#25306b]">
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-[#5b5fef]"
              />
              School verified
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-[#ff6b4a]"
              />
              Built for real activities
            </span>
          </div>
        </section>

        <section className="relative isolate mx-auto w-full max-w-md">
          <div
            aria-hidden="true"
            className="auth-glow pointer-events-none absolute inset-x-4 -bottom-5 top-8 -z-10 rounded-[2.5rem] bg-[#b8a7ff]/40 blur-[48px]"
          />
          {children}
        </section>
      </div>
    </main>
  );
}
