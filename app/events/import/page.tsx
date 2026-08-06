import { permanentRedirect } from "next/navigation";

export default function LegacyJsonImportPage() {
  permanentRedirect("/events/import-calendar");
}
