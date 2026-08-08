"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useState } from "react";

interface SchoolRequestFormProps {
  initialEmail: string;
}

export default function SchoolRequestForm({
  initialEmail,
}: SchoolRequestFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [schoolName, setSchoolName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [districtName, setDistrictName] = useState("");
  const [officialWebsite, setOfficialWebsite] = useState("");
  const [calendarUrl, setCalendarUrl] = useState("");
  const [company, setCompany] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/school-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          schoolName,
          city,
          state,
          districtName,
          officialWebsite,
          calendarUrl,
          company,
        }),
      });
      const data = (await response.json()) as {
        duplicate?: boolean;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "We couldn't submit that request.");
      }

      setSubmitted(true);
      setMessage(
        data.duplicate
          ? "You're already counted. We'll review this school once, not bury it under duplicate paperwork."
          : "Request received. We'll verify the school website and email domain before adding it."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "We couldn't submit that request."
      );
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-[2rem] border border-[#d9deec] bg-white/95 p-6 shadow-[0_28px_80px_rgba(37,48,107,0.14)] backdrop-blur sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#ff6b4a]">
          School requested
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.035em]">
          You put it on our radar.
        </h1>
        <p role="status" className="mt-4 leading-7 text-[#66718a]">
          {message}
        </p>
        <p className="mt-4 text-sm leading-6 text-[#66718a]">
          Your request does not create an account or automatically approve the
          school. That separation helps keep LinkUp limited to legitimate school
          communities.
        </p>
        <Link
          href="/signup"
          className="mt-7 block rounded-xl bg-[#5b5fef] px-4 py-3.5 text-center font-extrabold text-white shadow-[0_10px_28px_rgba(91,95,239,0.24)] transition hover:bg-[#4f5de4]"
        >
          Return to signup
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-[#d9deec] bg-white/95 p-6 shadow-[0_28px_80px_rgba(37,48,107,0.14)] backdrop-blur sm:p-8">
      <div className="mb-7">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-[#ff6b4a]">
          Expand LinkUp
        </p>
        <h1 className="text-3xl font-black tracking-[-0.035em]">
          Request your school
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#66718a]">
          Give us enough official information to confirm the school and its
          student email domain. Every request is reviewed before activation.
        </p>
      </div>

      <form className="space-y-4" onSubmit={submit}>
        <label className="block text-sm font-bold text-[#25306b]">
          School-issued email
          <input
            className="mt-2 w-full rounded-xl border border-[#cfd5e6] bg-[#f7f8fc] px-4 py-3 text-base outline-none focus:border-[#5b5fef] focus:ring-4 focus:ring-[#5b5fef]/15"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@school.edu"
          />
        </label>

        <label className="block text-sm font-bold text-[#25306b]">
          School name
          <input
            className="mt-2 w-full rounded-xl border border-[#cfd5e6] bg-[#f7f8fc] px-4 py-3 text-base outline-none focus:border-[#5b5fef] focus:ring-4 focus:ring-[#5b5fef]/15"
            required
            maxLength={120}
            value={schoolName}
            onChange={(event) => setSchoolName(event.target.value)}
            placeholder="Allen High School"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-[1fr_5rem]">
          <label className="block text-sm font-bold text-[#25306b]">
            City
            <input
              className="mt-2 w-full rounded-xl border border-[#cfd5e6] bg-[#f7f8fc] px-4 py-3 text-base outline-none focus:border-[#5b5fef] focus:ring-4 focus:ring-[#5b5fef]/15"
              required
              maxLength={80}
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Allen"
            />
          </label>
          <label className="block text-sm font-bold text-[#25306b]">
            State
            <input
              className="mt-2 w-full rounded-xl border border-[#cfd5e6] bg-[#f7f8fc] px-4 py-3 text-base uppercase outline-none focus:border-[#5b5fef] focus:ring-4 focus:ring-[#5b5fef]/15"
              required
              minLength={2}
              maxLength={2}
              value={state}
              onChange={(event) => setState(event.target.value.toUpperCase())}
              placeholder="TX"
            />
          </label>
        </div>

        <label className="block text-sm font-bold text-[#25306b]">
          District <span className="font-medium text-[#8b94a9]">(optional)</span>
          <input
            className="mt-2 w-full rounded-xl border border-[#cfd5e6] bg-[#f7f8fc] px-4 py-3 text-base outline-none focus:border-[#5b5fef] focus:ring-4 focus:ring-[#5b5fef]/15"
            maxLength={120}
            value={districtName}
            onChange={(event) => setDistrictName(event.target.value)}
            placeholder="Allen ISD"
          />
        </label>

        <label className="block text-sm font-bold text-[#25306b]">
          Official school website
          <input
            className="mt-2 w-full rounded-xl border border-[#cfd5e6] bg-[#f7f8fc] px-4 py-3 text-base outline-none focus:border-[#5b5fef] focus:ring-4 focus:ring-[#5b5fef]/15"
            inputMode="url"
            required
            maxLength={500}
            value={officialWebsite}
            onChange={(event) => setOfficialWebsite(event.target.value)}
            placeholder="www.allenisd.org/allenhs"
          />
        </label>

        <label className="block text-sm font-bold text-[#25306b]">
          Activities or calendar URL{" "}
          <span className="font-medium text-[#8b94a9]">(optional)</span>
          <input
            className="mt-2 w-full rounded-xl border border-[#cfd5e6] bg-[#f7f8fc] px-4 py-3 text-base outline-none focus:border-[#5b5fef] focus:ring-4 focus:ring-[#5b5fef]/15"
            inputMode="url"
            maxLength={500}
            value={calendarUrl}
            onChange={(event) => setCalendarUrl(event.target.value)}
            placeholder="www.allenisd.org/calendar"
          />
        </label>

        <label aria-hidden="true" className="absolute left-[-9999px]">
          Company
          <input
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-[#5b5fef] px-4 py-3.5 font-extrabold text-white shadow-[0_10px_28px_rgba(91,95,239,0.24)] transition hover:bg-[#4f5de4] disabled:cursor-wait disabled:opacity-60"
        >
          {busy ? "Sending request…" : "Request my school"}
        </button>
      </form>

      {message && (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-[#fff1f0] px-4 py-3 text-sm font-medium leading-6 text-[#b42318]"
        >
          {message}
        </p>
      )}

      <p className="mt-6 text-center text-sm text-[#66718a]">
        <Link
          href="/signup"
          className="font-extrabold text-[#25306b] underline decoration-[#ff6b4a] decoration-2 underline-offset-4"
        >
          Try another email
        </Link>
      </p>
    </div>
  );
}
