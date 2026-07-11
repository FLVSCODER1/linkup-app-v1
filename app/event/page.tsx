import { permanentRedirect } from "next/navigation";

export default function LegacyEventPage() {
  permanentRedirect("/events");
}
