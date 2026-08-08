"use client";

import { useEffect, useState } from "react";

const phrases = [
  ["school", "events"],
  ["study", "groups"],
  ["student", "clubs"],
] as const;

export default function RotatingHook() {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    if (reducedMotion.matches) return;

    const interval = window.setInterval(() => {
      setPhraseIndex((current) => (current + 1) % phrases.length);
    }, 1500);

    return () => window.clearInterval(interval);
  }, []);

  const [firstLine, secondLine] = phrases[phraseIndex];

  return (
    <h1
      aria-label="What if finding school events, study groups, or student clubs didn't suck?"
      className="max-w-[12ch] text-5xl font-black leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl"
    >
      <span aria-hidden="true">
        <span className="flex flex-nowrap items-baseline gap-[0.16em]">
          <span>What</span>
          <span>if</span>
          <span>finding</span>
        </span>
        <span
          key={`${phraseIndex}-first`}
          className="auth-word-swap block text-[#ff6b4a]"
        >
          {firstLine}
        </span>
        <span
          key={`${phraseIndex}-second`}
          className="auth-word-swap block text-[#ff6b4a]"
        >
          {secondLine}
        </span>
        <span className="flex flex-nowrap items-baseline gap-[0.16em]">
          <span>didn&apos;t</span>
          <span>suck?</span>
        </span>
      </span>
    </h1>
  );
}
