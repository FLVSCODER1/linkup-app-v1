import { resolveAdminAccess } from "./admin";
import { getEmailDomain, type SchoolDirectoryContext } from "./school-directory";

interface AssignedProfileData {
  email?: unknown;
  districtId?: unknown;
  district?: unknown;
  schoolId?: unknown;
  school?: unknown;
}

function normalizedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Lets a console-provisioned admin keep its assigned school even when its
 * verified email is not part of the student domain directory. The assignment
 * is intentionally read from the admin's existing UID-scoped profile so this
 * cannot be used to choose an arbitrary school.
 */
export function resolveAssignedAdminSchoolContext(
  adminData: Parameters<typeof resolveAdminAccess>[0],
  profileData: AssignedProfileData | undefined,
  authenticatedEmail: string
): SchoolDirectoryContext | null {
  if (!resolveAdminAccess(adminData).isAdmin || !profileData) return null;

  const email = authenticatedEmail.trim().toLowerCase();
  const storedEmail = normalizedString(profileData.email).toLowerCase();
  const districtId = normalizedString(profileData.districtId);
  const districtName = normalizedString(profileData.district);
  const schoolId = normalizedString(profileData.schoolId);
  const schoolName = normalizedString(profileData.school);

  if (
    !email ||
    storedEmail !== email ||
    !districtId ||
    !districtName ||
    !schoolId ||
    !schoolName
  ) {
    return null;
  }

  return {
    domain: getEmailDomain(email) ?? "admin-assigned",
    districtId,
    districtName,
    schools: [{ id: schoolId, name: schoolName }],
    fixedSchoolId: schoolId,
  };
}
