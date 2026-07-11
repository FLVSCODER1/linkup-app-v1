export interface SchoolDirectoryOption {
  id: string;
  name: string;
}

export interface SchoolDirectoryContext {
  domain: string;
  districtId: string;
  districtName: string;
  schools: SchoolDirectoryOption[];
  fixedSchoolId: string | null;
}

export interface DistrictDirectoryData {
  active: boolean;
  name: string;
}

export interface SchoolDomainDirectoryData {
  active: boolean;
  districtId: string;
  schoolId?: string | null;
}

export interface SchoolDirectoryData {
  active: boolean;
  districtId: string;
  name: string;
}

export function getEmailDomain(email: string): string | null {
  const normalized = email.trim().toLowerCase();
  const firstAt = normalized.indexOf("@");
  const lastAt = normalized.lastIndexOf("@");

  if (firstAt <= 0 || firstAt !== lastAt || lastAt === normalized.length - 1) {
    return null;
  }

  const domain = normalized.slice(lastAt + 1);

  if (
    domain.length > 253 ||
    !domain.includes(".") ||
    !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(domain) ||
    domain.split(".").some((label) => !label || label.length > 63)
  ) {
    return null;
  }

  return domain;
}

export function normalizeDistrictData(
  data: Partial<DistrictDirectoryData>
): DistrictDirectoryData | null {
  const name = typeof data.name === "string" ? data.name.trim() : "";

  if (data.active !== true || !name) {
    return null;
  }

  return { active: true, name };
}

export function normalizeSchoolDomainData(
  data: Partial<SchoolDomainDirectoryData>
): SchoolDomainDirectoryData | null {
  const districtId =
    typeof data.districtId === "string" ? data.districtId.trim() : "";
  const schoolId =
    typeof data.schoolId === "string" && data.schoolId.trim()
      ? data.schoolId.trim()
      : null;

  if (data.active !== true || !districtId) return null;

  return { active: true, districtId, schoolId };
}

export function normalizeSchoolData(
  id: string,
  data: Partial<SchoolDirectoryData>,
  districtId: string
): SchoolDirectoryOption | null {
  const name = typeof data.name === "string" ? data.name.trim() : "";

  if (
    !id ||
    data.active !== true ||
    data.districtId !== districtId ||
    !name
  ) {
    return null;
  }

  return { id, name };
}

export function validateSchoolSelection(
  context: SchoolDirectoryContext,
  schoolId: string
): SchoolDirectoryOption | null {
  if (context.fixedSchoolId && schoolId !== context.fixedSchoolId) return null;

  return context.schools.find((school) => school.id === schoolId) ?? null;
}
