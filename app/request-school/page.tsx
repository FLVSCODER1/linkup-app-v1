import AuthLandingShell from "../components/auth/AuthLandingShell";
import SchoolRequestForm from "./SchoolRequestForm";

export default async function RequestSchoolPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string | string[] }>;
}) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email.slice(0, 254) : "";

  return (
    <AuthLandingShell>
      <SchoolRequestForm initialEmail={email} />
    </AuthLandingShell>
  );
}
