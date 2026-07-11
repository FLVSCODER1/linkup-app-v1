import Link from "next/link";

interface BackButtonProps {
  href: string;
  label?: string;
}

export default function BackButton({ href, label = "Back" }: BackButtonProps) {
  return (
    <Link
      href={href}
      className="mb-6 inline-flex min-h-11 items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
    >
      <span aria-hidden="true">←</span>
      <span className="ml-2">{label}</span>
    </Link>
  );
}

