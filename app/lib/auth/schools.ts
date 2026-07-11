export interface SchoolContext {
  district: string;
  school: string | null;
}

const SCHOOL_DOMAINS: ReadonlyArray<{
  domain: string;
  context: SchoolContext;
}> = [
  {
    domain: "students.ksd.org",
    context: { district: "Kennewick School District", school: null },
  },
  {
    domain: "ksd.org",
    context: { district: "Kennewick School District", school: null },
  },
  {
    domain: "pasco.k12.wa.us",
    context: { district: "Pasco School District", school: null },
  },
  {
    domain: "richland.k12.wa.us",
    context: { district: "Richland School District", school: null },
  },
  {
    domain: "g.risd.org",
    context: {
      district: "Richardson Independent School District",
      school: null,
    },
  },
  // Temporary development domain. Remove when dedicated test accounts exist.
  {
    domain: "ufl.edu",
    context: { district: "LinkUp Test District", school: null },
  },
];

function getEmailDomain(email: string): string {
  return email.trim().toLowerCase().split("@").at(-1) ?? "";
}

export function getSchoolContext(email: string): SchoolContext | null {
  const domain = getEmailDomain(email);
  return SCHOOL_DOMAINS.find((entry) => entry.domain === domain)?.context ?? null;
}

export function isAllowedSchoolEmail(email: string): boolean {
  return getSchoolContext(email) !== null;
}
