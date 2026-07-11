import "server-only";

import { getAdminDb } from "../firebase-admin";
import {
  getEmailDomain,
  normalizeDistrictData,
  normalizeSchoolDomainData,
  normalizeSchoolData,
  type DistrictDirectoryData,
  type SchoolDirectoryContext,
  type SchoolDomainDirectoryData,
  type SchoolDirectoryData,
} from "./school-directory";

export async function getSchoolDirectoryContext(
  email: string
): Promise<SchoolDirectoryContext | null> {
  const domain = getEmailDomain(email);

  if (!domain) return null;

  const db = getAdminDb();
  const domainSnapshot = await db.collection("schoolDomains").doc(domain).get();
  if (!domainSnapshot.exists) return null;

  const domainMapping = normalizeSchoolDomainData(
    domainSnapshot.data() as Partial<SchoolDomainDirectoryData>
  );
  if (!domainMapping) return null;

  const districtSnapshot = await db
    .collection("districts")
    .doc(domainMapping.districtId)
    .get();
  if (!districtSnapshot.exists) return null;

  const districtData = normalizeDistrictData(
    districtSnapshot.data() as Partial<DistrictDirectoryData>
  );
  if (!districtData) return null;

  const district = { id: districtSnapshot.id, ...districtData };
  const schoolsSnapshot = await db
    .collection("schools")
    .where("districtId", "==", district.id)
    .get();

  let schools = schoolsSnapshot.docs
    .map((schoolDoc) =>
      normalizeSchoolData(
        schoolDoc.id,
        schoolDoc.data() as Partial<SchoolDirectoryData>,
        district.id
      )
    )
    .filter((school) => school !== null)
    .sort((left, right) => left.name.localeCompare(right.name));

  if (domainMapping.schoolId) {
    schools = schools.filter((school) => school.id === domainMapping.schoolId);
  }

  if (schools.length === 0) return null;

  return {
    domain,
    districtId: district.id,
    districtName: district.name,
    schools,
    fixedSchoolId: domainMapping.schoolId ?? null,
  };
}
