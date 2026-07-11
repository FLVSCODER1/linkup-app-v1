import "server-only";

import { getAdminDb } from "../firebase-admin";

export async function hasAdminRole(
  uid: string,
  role: "account_reviewer" | "school_directory_admin"
): Promise<boolean> {
  const admin = await getAdminDb().collection("admins").doc(uid).get();
  const data = admin.data();

  return (
    data?.active === true &&
    Array.isArray(data.roles) &&
    data.roles.includes(role)
  );
}
