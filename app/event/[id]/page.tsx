import { permanentRedirect } from "next/navigation";

export default async function LegacyEventPreferencesPage({
  params,
}: PageProps<"/event/[id]">) {
  const { id } = await params;
  permanentRedirect(`/events/${id}/preferences`);
}
