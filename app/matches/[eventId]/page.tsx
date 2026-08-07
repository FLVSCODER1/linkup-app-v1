import { permanentRedirect } from "next/navigation";

export default async function LegacyMatchesPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  permanentRedirect(`/people/${eventId}`);
}
