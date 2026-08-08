import type { ReactNode } from "react";

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
        <section className="mx-auto w-full max-w-xl lg:mx-0">
          <p className="mb-8 text-sm font-extrabold tracking-[0.34em] text-[#25306b]">
            LINKUP
          </p>

          <h1 className="max-w-[12ch] text-5xl font-black leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            What if finding{" "}
            <span className="text-[#ff6b4a]">school events</span> didn&apos;t
            suck?
          </h1>

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

        <section className="mx-auto w-full max-w-md">{children}</section>
      </div>
    </main>
  );
}
