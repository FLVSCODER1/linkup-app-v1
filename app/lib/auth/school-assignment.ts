export function canKeepSchoolAssignment(
  existing: Record<string, unknown> | undefined,
  next: { schoolId: string; districtId: string; school: string; district: string }
): boolean {
  if (!existing) return true;
  return (["schoolId", "districtId", "school", "district"] as const).every(
    (key) => existing[key] == null || existing[key] === next[key]
  );
}
