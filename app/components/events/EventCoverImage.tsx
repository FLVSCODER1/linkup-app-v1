interface EventCoverImageProps {
  url?: string | null;
  className?: string;
}

export default function EventCoverImage({
  url,
  className = "aspect-[16/9] w-full rounded-xl",
}: EventCoverImageProps) {
  if (!url) {
    return (
      <div
        aria-hidden="true"
        className={`${className} bg-gradient-to-br from-blue-600/35 via-violet-500/20 to-orange-400/25`}
      />
    );
  }

  return (
    // Cloudinary performs delivery optimization; using the URL directly also
    // avoids coupling Next's image allowlist to a specific Cloudinary tenant.
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
