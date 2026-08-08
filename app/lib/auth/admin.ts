export interface AdminAccess {
  isAdmin: boolean;
  canReviewAccounts: boolean;
  canReviewCalendars: boolean;
  canManageSchools: boolean;
}

interface AdminRecord {
  isAdmin?: unknown;
  active?: unknown;
  roles?: unknown;
}

export function resolveAdminAccess(data: AdminRecord | undefined): AdminAccess {
  const isAdmin = data?.isAdmin === true;
  const legacyRoles =
    data?.active === true && Array.isArray(data.roles)
      ? new Set(data.roles.filter((role): role is string => typeof role === "string"))
      : new Set<string>();

  return {
    isAdmin,
    canReviewAccounts: isAdmin || legacyRoles.has("account_reviewer"),
    canReviewCalendars: isAdmin || legacyRoles.has("calendar_reviewer"),
    canManageSchools: isAdmin || legacyRoles.has("school_directory_admin"),
  };
}
