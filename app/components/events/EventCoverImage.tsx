"use client";

import { useEffect, useState } from "react";

import { loadEventCover } from "../../lib/events/cover-images";

interface EventCoverImageProps {
  path?: string | null;
  className?: string;
}

export default function EventCoverImage({
  path,
  className = "aspect-[16/9] w-full rounded-xl",
}: EventCoverImageProps) {
  const [loaded, setLoaded] = useState<{
    path: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    if (!path) return () => undefined;

    loadEventCover(path)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setLoaded({ path, url: objectUrl });
      })
      .catch(() => undefined);

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);

  const url = loaded && loaded.path === path ? loaded.url : null;

  if (!url) {
    return (
      <div
        aria-hidden="true"
        className={`${className} bg-gradient-to-br from-blue-600/35 via-violet-500/20 to-orange-400/25`}
      />
    );
  }

  return (
    // Blob URLs are authenticated, short-lived objects and cannot use the
    // Next.js image optimizer safely.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      loading="lazy"
      decoding="async"
      className={`${className} object-cover`}
    />
  );
}
