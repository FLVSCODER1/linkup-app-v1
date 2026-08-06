import { getEmailDomain } from "./school-directory";

export interface PreviewTestAccountMapping {
  districtId: string;
  schoolId: string;
}

const DIRECTORY_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_CONFIG_LENGTH = 20_000;
const MAX_TEST_ACCOUNTS = 50;

export function resolvePreviewTestAccount(
  email: string,
  deploymentEnvironment: string | undefined,
  rawConfig: string | undefined
): PreviewTestAccountMapping | null {
  if (
    deploymentEnvironment !== "preview" ||
    !rawConfig ||
    rawConfig.length > MAX_CONFIG_LENGTH ||
    !getEmailDomain(email)
  ) {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const parsed = JSON.parse(rawConfig) as unknown;

    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
      return null;
    }

    const entries = Object.entries(parsed);
    if (entries.length > MAX_TEST_ACCOUNTS) return null;

    const match = entries.find(
      ([configuredEmail]) => configuredEmail.trim().toLowerCase() === normalizedEmail
    );
    if (!match) return null;

    const mapping = match[1];
    if (!mapping || Array.isArray(mapping) || typeof mapping !== "object") {
      return null;
    }

    const districtId = Reflect.get(mapping, "districtId");
    const schoolId = Reflect.get(mapping, "schoolId");

    if (
      typeof districtId !== "string" ||
      typeof schoolId !== "string" ||
      !DIRECTORY_ID_PATTERN.test(districtId) ||
      !DIRECTORY_ID_PATTERN.test(schoolId)
    ) {
      return null;
    }

    return { districtId, schoolId };
  } catch {
    return null;
  }
}
