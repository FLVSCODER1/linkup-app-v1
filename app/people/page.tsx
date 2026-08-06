import { permanentRedirect } from "next/navigation";

export default function PeopleRedirectPage() {
  permanentRedirect("/events");
}
