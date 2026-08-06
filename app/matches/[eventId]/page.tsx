import { permanentRedirect } from "next/navigation";

export default async function LegacyMatchesPage({
  params,
}: PageProps<"/matches/[eventId]">) {
  const { eventId } = await params;
  permanentRedirect(`/people/${eventId}`);
}
