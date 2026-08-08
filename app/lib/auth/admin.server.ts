import "server-only";

import { getAdminDb } from "../firebase-admin";
import { resolveAdminAccess, type AdminAccess } from "./admin";

export async function getAdminAccess(uid: string): Promise<AdminAccess> {
  const admin = await getAdminDb().collection("admins").doc(uid).get();

  return resolveAdminAccess(admin.data());
}

export async function hasAdminRole(
  uid: string,
  role:
    | "account_reviewer"
    | "calendar_reviewer"
    | "school_directory_admin"
): Promise<boolean> {
  const access = await getAdminAccess(uid);

  if (access.isAdmin) return true;
  if (role === "account_reviewer") return access.canReviewAccounts;
  if (role === "calendar_reviewer") return access.canReviewCalendars;
  return access.canManageSchools;
}
