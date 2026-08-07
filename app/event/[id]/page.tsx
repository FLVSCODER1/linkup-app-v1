import { permanentRedirect } from "next/navigation";

export default async function LegacyEventPreferencesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  permanentRedirect(`/events/${id}/preferences`);
}
