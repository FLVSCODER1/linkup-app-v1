import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#09090b] px-6 py-16 text-white">
      <div className="w-full max-w-xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-300">
          404 · Lost link
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">
          This page didn&apos;t make the guest list.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-7 text-zinc-300 sm:text-lg">
          The link may be outdated, or the event may no longer be available.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 py-3 font-semibold text-zinc-950 transition hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
          >
            Go to LinkUp
          </Link>
          <Link
            href="/signup"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-700 px-5 py-3 font-semibold text-white transition hover:border-zinc-500 hover:bg-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
          >
            Create an account
          </Link>
        </div>
      </div>
    </main>
  );
}
